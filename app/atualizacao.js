/* Verificação, download e instalação da nova versão do aplicativo Windows.

   Roda no processo principal do Electron — é o único lado que tem acesso a
   disco, rede e processo. A página nunca fala com a internet: ela pede por IPC
   (ver app/barra-atualizacao.js) e recebe de volta um objeto já validado.

   POR QUE ESCRITO À MÃO E NÃO `electron-updater`

   O mesmo motivo de servidor/ não ter dependência nenhuma: o que precisamos
   aqui cabe em um arquivo legível — baixar um JSON, comparar dois números,
   baixar um .exe, conferir o SHA-256 e executá-lo. O electron-updater traz
   feed em YAML, atualização diferencial e um formato de release próprio; nada
   disso é usado num portal interno que publica uma versão de vez em quando.
   Se um dia o instalador ficar grande a ponto de valer download diferencial,
   ele entra — e este arquivo sai inteiro.

   O QUE PROTEGE ESTE CAMINHO

   1. O `arquivo` do manifesto precisa ser da MESMA ORIGEM do manifesto. Um
      manifesto adulterado não consegue apontar o download para outro host.
   2. O SHA-256 é conferido antes de o instalador ser executado. Download
      truncado, proxy que devolveu uma página de erro em vez do .exe, disco
      cheio no meio — tudo isso morre aqui, não na máquina de quem usa.
   3. O arquivo só recebe o nome final depois de conferido: enquanto baixa,
      ele é `.parcial`. Nunca existe um .exe pela metade com nome de bom.

   SEGURANÇA: atualizações exigem HTTPS e recusam redirects. HTTP é aceito
   somente em loopback no desenvolvimento para os testes locais. O hash não
   substitui proteção do servidor de publicação nem assinatura do instalador. */
'use strict';

const { app, net } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

/* =========================================================================
   O ÚNICO LUGAR PARA CONFIGURAR

   ORIGEM é o endereço da PASTA onde ficam publicados o `versao.json` e os
   instaladores. Precisa terminar em barra.

     const ORIGEM_PADRAO = 'https://portal-pajb/download/';

   `download/` e NÃO `app/`: `app/` é esta pasta do repositório, chega à VM
   pelo `git pull` e nem sequer é servida (ver PERMITIDOS em servidor.js).

   Vazio (como está) DESLIGA a verificação: o aplicativo nunca vai à rede e a
   barra de atualização nunca aparece. É o padrão de propósito — o nome da VM
   ainda não existe (ver md/08-futuros-passos.md, item 2.2), e apontar para um
   endereço que não responde só renderia erro para quem usa.
   ========================================================================= */
const ORIGEM_PADRAO = '';

// Em desenvolvimento (`npm run app`) dá para apontar para outro lugar sem
// recompilar — é assim que se testa o fluxo inteiro. No aplicativo empacotado
// a variável é ignorada: o endereço de atualização não é coisa que uma
// variável de ambiente da máquina de alguém deva poder trocar.
const ORIGEM = (!app.isPackaged && process.env.PAJB_ORIGEM) || ORIGEM_PADRAO;

const ESPERA_MANIFESTO = 10 * 1000;          // JSON de poucos bytes
const ESPERA_DOWNLOAD = 15 * 60 * 1000;      // instalador de ~90 MB em rede ruim
const TAMANHO_MAXIMO = 500 * 1024 * 1024;    // trava contra download infinito
const MAX_NOTAS = 6;
const MAX_NOTA = 200;

const PASTA_TEMP = path.join(app.getPath('temp'), 'parceria-jb-atualizacao');

/* Erro com mensagem pronta para a tela. Qualquer outro erro que apareça aqui
   é bug nosso e vira uma mensagem genérica — a pessoa que usa o portal não
   tem o que fazer com um ECONNRESET. */
class ErroDeAtualizacao extends Error {
  constructor(mensagem, { pagina = true } = {}){
    super(mensagem);
    this.name = 'ErroDeAtualizacao';
    // pagina: se vale oferecer "Baixar pelo navegador" como saída.
    this.pagina = pagina;
  }
}

/* ---------- Versões ---------- */

/* Comparação numérica campo a campo, sem semver completo: as versões deste
   projeto são `1.2.3`, e é o que o package.json aceita. Sufixo (`1.2.3-beta`)
   não é usado aqui e seria ignorado — se um dia for, este é o lugar. */
function comparar(a, b){
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(pa.length, pb.length); i++){
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

function versaoAtual(){
  return app.getVersion();
}

/* ---------- Rede ---------- */

/* `net` do Electron, não o `https` do Node: ele passa pela pilha do Chromium e
   com isso herda o proxy configurado no Windows. Numa rede corporativa é a
   diferença entre funcionar e dar timeout sem explicação. */
function exigirTransporte(url){
  const destino = new URL(url);
  const local = !app.isPackaged && ['127.0.0.1', '[::1]', 'localhost'].includes(destino.hostname);
  if (destino.username || destino.password || (destino.protocol !== 'https:' && !(local && destino.protocol === 'http:')))
    throw new ErroDeAtualizacao('Atualizações exigem HTTPS; HTTP é permitido apenas em testes locais.');
  return destino;
}

// O consumidor fica dentro do prazo, incluindo todos os bytes do corpo.
async function buscar(url, limiteMs, consumir){
  exigirTransporte(url);
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), limiteMs);

  try {
    const res = await net.fetch(url, { signal: controle.signal, cache: 'no-store', redirect: 'error' });
    try { return await consumir(res); }
    finally { if (res.body && !res.body.locked) await res.body.cancel().catch(() => {}); }
  } catch (erro) {
    if (controle.signal.aborted){
      throw new ErroDeAtualizacao('O servidor de atualizações demorou demais para responder.');
    }
    if (erro instanceof ErroDeAtualizacao) throw erro;
    // net.fetch joga TypeError para DNS que não resolve, conexão recusada,
    // cabo fora — tudo o que, para quem usa, é "sem internet".
    throw new ErroDeAtualizacao('Não foi possível falar com o servidor de atualizações. Verifique sua conexão e tente de novo.');
  } finally {
    clearTimeout(relogio);
  }
}

/* ---------- Manifesto ---------- */

function texto(valor, limite){
  return String(valor ?? '').trim().replace(/\s+/g, ' ').slice(0, limite);
}

/* Tudo que chega do `versao.json` é dado de fora e é tratado como tal: campo
   que não passa aqui derruba a verificação inteira em vez de virar um valor
   meio certo lá na frente. */
function validarManifesto(bruto, urlManifesto){
  if (!bruto || typeof bruto !== 'object'){
    throw new ErroDeAtualizacao('O arquivo de atualização veio em formato inválido.');
  }

  const versao = texto(bruto.versao, 32);
  if (!/^\d+(\.\d+){0,3}$/.test(versao)){
    throw new ErroDeAtualizacao('O arquivo de atualização veio com uma versão inválida.');
  }

  const sha256 = String(bruto.sha256 || '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha256)){
    throw new ErroDeAtualizacao('O arquivo de atualização veio sem uma soma de verificação válida.');
  }

  // Relativo é aceito e resolvido contra o próprio manifesto — assim o
  // versao.json não precisa saber o nome do servidor onde está publicado.
  let arquivo;
  try {
    arquivo = new URL(bruto.arquivo, urlManifesto);
  } catch (e) {
    throw new ErroDeAtualizacao('O arquivo de atualização veio com um endereço inválido.');
  }

  if (arquivo.origin !== urlManifesto.origin){
    throw new ErroDeAtualizacao('O instalador apontado não está no mesmo servidor da atualização.');
  }
  exigirTransporte(arquivo.href);
  if (!/\.exe$/i.test(arquivo.pathname)){
    throw new ErroDeAtualizacao('O arquivo de atualização não aponta para um instalador.');
  }

  const tamanho = bruto.tamanho == null ? 0 : Number(bruto.tamanho);
  if (!Number.isSafeInteger(tamanho) || tamanho < 0 || tamanho > TAMANHO_MAXIMO){
    throw new ErroDeAtualizacao('O instalador anunciado tem um tamanho fora do esperado.');
  }

  // A página oficial é a saída quando o download automático não dá certo.
  let pagina = '';
  try {
    const p = new URL(texto(bruto.pagina, 500));
    if (p.protocol === 'http:' || p.protocol === 'https:') pagina = p.href;
  } catch (e) { /* sem página: o botão de fallback simplesmente não aparece */ }

  const notas = (Array.isArray(bruto.notas) ? bruto.notas : [])
    .map((n) => texto(n, MAX_NOTA))
    .filter(Boolean)
    .slice(0, MAX_NOTAS);

  return {
    versao,
    arquivo: arquivo.href,
    sha256,
    tamanho,
    pagina,
    notas,
    publicadoEm: texto(bruto.publicadoEm, 32)
  };
}

/* Devolve sempre um objeto com `ha`, nunca lança por "não tem atualização":
   não ter é o caso normal. Lança quando a verificação em si falhou — e quem
   chamou decide se mostra (verificação manual) ou engole (a do início). */
async function verificar(){
  const atual = versaoAtual();

  if (!ORIGEM){
    return { ha: false, atual, configurado: false };
  }

  const urlManifesto = new URL('versao.json', ORIGEM);
  const bruto = await buscar(urlManifesto.href, ESPERA_MANIFESTO, async res => {
    if (!res.ok) throw new ErroDeAtualizacao(`O servidor de atualizações respondeu ${res.status}.`);
    if (!res.body) throw new ErroDeAtualizacao('O arquivo de atualização veio ilegível.');
    const leitor = res.body.getReader();
    const partes = [];
    let tamanho = 0;
    try {
      for (;;){
        const { done, value } = await leitor.read();
        if (done) break;
        tamanho += value.byteLength;
        if (tamanho > 64 * 1024) throw new ErroDeAtualizacao('Manifesto maior que o limite de 64 KiB.');
        partes.push(Buffer.from(value));
      }
    } finally { await leitor.cancel().catch(() => {}); leitor.releaseLock(); }
    try { return JSON.parse(Buffer.concat(partes).toString('utf8')); }
    catch { throw new ErroDeAtualizacao('O arquivo de atualização veio ilegível — avise quem cuida do portal.'); }
  });

  const manifesto = validarManifesto(bruto, urlManifesto);

  return {
    ha: comparar(manifesto.versao, atual) > 0,
    atual,
    configurado: true,
    ...manifesto
  };
}

/* ---------- Download ---------- */

function limparTemporarios(){
  // Melhor esforço: sobra de download interrompido não pode impedir o próximo.
  try {
    fs.rmSync(PASTA_TEMP, { recursive: true, force: true });
  } catch (e) { /* pasta em uso ou sem permissão: o download reaproveita */ }
}

function escrever(saida, pedaco){
  // Sem isto, um servidor rápido enche a memória enquanto o disco não
  // acompanha: `write` devolve false quando o buffer encheu, e aí se espera.
  if (saida.write(pedaco)) return Promise.resolve();

  /* Os dois ouvintes saem juntos, sempre. Registrar `once('error')` e deixá-lo
     lá quando o `drain` chega parece inofensivo, mas isto roda uma vez por
     bloco: num instalador de 100 MB são centenas de ouvintes acumulados no
     mesmo stream, e o Node avisa (MaxListenersExceededWarning) porque é assim
     que vazamento de memória começa. */
  return new Promise((resolve, reject) => {
    const limpar = () => {
      saida.removeListener('drain', aoDrenar);
      saida.removeListener('error', aoErrar);
    };
    const aoDrenar = () => { limpar(); resolve(); };
    const aoErrar = (erro) => { limpar(); reject(erro); };

    saida.once('drain', aoDrenar);
    saida.once('error', aoErrar);
  });
}

/* Confere um instalador que já está no disco contra o manifesto. Vale para o
   cache: tamanho primeiro, porque é barato e pega o caso comum. */
function confereNoDisco(caminho, info){
  try {
    const bytes = fs.readFileSync(caminho);
    if (info.tamanho && bytes.length !== info.tamanho) return false;
    return crypto.createHash('sha256').update(bytes).digest('hex') === info.sha256;
  } catch (e) {
    return false;
  }
}

/* Baixa, confere o SHA-256 e devolve o caminho do instalador pronto.
   `aoProgresso` recebe 0..100, ou -1 quando o servidor não informou o
   tamanho (aí a barra fica indeterminada em vez de mentir uma porcentagem). */
async function baixar(info, aoProgresso){
  // Antes de qualquer coisa, inclusive do cache: um endereço que não passa
  // aqui é recusado mesmo que já exista um arquivo com o nome da versão.
  exigirTransporte(info.arquivo);

  fs.mkdirSync(PASTA_TEMP, { recursive: true });

  const destino = path.join(PASTA_TEMP, `Parceria-JB-${info.versao}.exe`);
  const parcial = `${destino}.parcial`;

  /* O cache mora numa pasta gravável pelo usuário (e por qualquer processo que
     rode como ele). Reaproveitar pelo nome do arquivo entregaria a execução a
     quem trocasse os bytes ali — o hash é conferido de novo antes de o
     instalador ser reusado, e o que não bate é apagado e baixado outra vez. */
  if (fs.existsSync(destino)){
    if (confereNoDisco(destino, info)) return destino;
    try { fs.rmSync(destino, { force: true }); } catch (e) { /* segue */ }
  }

  try { fs.rmSync(parcial, { force: true }); } catch (e) { /* segue */ }

  /* O corpo é consumido DENTRO do `buscar`, e não depois dele: o prazo de
     `buscar` cobre todos os bytes, e é ele quem cancela um corpo que ninguém
     leu. Chamar `buscar` sem este callback quebrava o download inteiro — o
     `consumir(res)` virava `undefined(res)`, e o TypeError saía disfarçado de
     "não foi possível falar com o servidor". */
  const hash = crypto.createHash('sha256');
  let recebido = 0;

  await buscar(info.arquivo, ESPERA_DOWNLOAD, async (res) => {
    if (!res.ok || !res.body){
      throw new ErroDeAtualizacao(`Não foi possível baixar o instalador (o servidor respondeu ${res.status}).`);
    }

    const total = info.tamanho || Number(res.headers.get('content-length')) || 0;
    const saida = fs.createWriteStream(parcial);
    const leitor = res.body.getReader();

    try {
      for (;;){
        const { done, value } = await leitor.read();
        if (done) break;

        recebido += value.byteLength;
        if (recebido > TAMANHO_MAXIMO){
          throw new ErroDeAtualizacao('O instalador é maior do que o esperado — download interrompido por segurança.');
        }

        const pedaco = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
        hash.update(pedaco);
        await escrever(saida, pedaco);

        if (aoProgresso) aoProgresso(total ? Math.min(99, Math.floor((recebido / total) * 100)) : -1);
      }

      await new Promise((resolve, reject) => {
        saida.once('finish', resolve);
        saida.once('error', reject);
        saida.end();
      });
    } catch (erro) {
      saida.destroy();
      try { fs.rmSync(parcial, { force: true }); } catch (e) { /* segue */ }

      if (erro instanceof ErroDeAtualizacao) throw erro;
      throw new ErroDeAtualizacao('O download foi interrompido antes do fim. Tente de novo.');
    }
  });

  // As duas conferências, nesta ordem: tamanho é barato e pega o caso comum
  // (proxy devolveu uma página de erro HTML no lugar do .exe).
  if (info.tamanho && recebido !== info.tamanho){
    try { fs.rmSync(parcial, { force: true }); } catch (e) { /* segue */ }
    throw new ErroDeAtualizacao('O instalador baixado está incompleto. Tente de novo.');
  }

  if (hash.digest('hex') !== info.sha256){
    try { fs.rmSync(parcial, { force: true }); } catch (e) { /* segue */ }
    throw new ErroDeAtualizacao('O instalador baixado não confere com o publicado e foi descartado. Baixe pela página oficial.');
  }

  fs.renameSync(parcial, destino);   // só agora ele tem nome de arquivo bom
  if (aoProgresso) aoProgresso(100);
  return destino;
}

/* ---------- Instalação ---------- */

/* O instalador do electron-builder é `oneClick`: executado, ele fecha o que
   estiver aberto, substitui os arquivos em %LOCALAPPDATA% e reabre o portal.
   Nada em %APPDATA% (tema, preferências) é tocado — ver md/10.

   `detached`, porque o processo filho precisa sobreviver ao `app.quit()` que
   vem logo depois; é justamente o aplicativo antigo que ele vai substituir. */
async function instalar(caminho){
  const recusado = () => new ErroDeAtualizacao(
    'O Windows não deixou o instalador abrir. Pode ser o antivírus — baixe pela página oficial.'
  );

  /* O `spawn` do Windows falha de DUAS maneiras, e as duas acontecem de
     verdade: pelo evento `error` (o caminho normal do Node) e jogando na hora,
     de forma síncrona, quando o Windows recusa o executável — `spawn UNKNOWN`,
     que é o que um antivírus em quarentena produz. Só o `try` cobre as duas. */
  let filho;
  try {
    filho = spawn(caminho, [], { detached: true, stdio: 'ignore' });

    await new Promise((resolve, reject) => {
      filho.once('spawn', resolve);
      filho.once('error', reject);
    });
  } catch (erro) {
    throw recusado();
  }

  filho.unref();

  // Uma folga curta para o instalador subir antes de o aplicativo sair; ele
  // sabe encerrar o que restar, mas sair primeiro deixa o caminho limpo.
  setTimeout(() => app.quit(), 1200);
}

module.exports = {
  ErroDeAtualizacao,
  ORIGEM,
  PASTA_TEMP,
  comparar,
  versaoAtual,
  verificar,
  baixar,
  instalar,
  limparTemporarios
};
