/* Servidor do portal: entrega os arquivos estáticos E a API de edição.

   Um processo só, de propósito. Poderia ser IIS/nginx para o estático e Node
   para a API, mas aí seriam duas coisas para configurar, dois lugares para
   errar caminho e um proxy no meio. Aqui é `node servidor/servidor.js` e o
   portal inteiro responde na porta escolhida.

   O que ele NÃO faz: build, cache elaborado, HTTPS. É um portal interno, na
   rede da Parceria JB, com dezenas de acessos por dia — o simples resolve.

     node servidor/servidor.js                # porta 8000
     node servidor/servidor.js --porta 80     # produção na VM

   ---------------------------------------------------------------------------
   API (tudo em /api, o resto é arquivo)

     GET    /api/sessao            quem sou eu
     POST   /api/sessao            entrar   { login, senha }
     DELETE /api/sessao            sair

     GET    /api/documentos        acervo (aberto: quem acessa o portal, lê)
     POST   /api/documentos        incluir           equipe, dev
     PUT    /api/documentos/:id    editar            equipe, dev
     DELETE /api/documentos/:id    excluir           SÓ dev
     POST   /api/arquivos?nome=…   subir DOC/PDF     equipe, dev

     POST   /api/ia/consulta      perguntar ao assistente     equipe, dev

   A regra de papel é aplicada aqui, não no navegador — ver servidor/auth.js.

   A rota da IA existe e responde 503 enquanto PAJB_IA_URL estiver vazia — que
   é hoje. Ela não segura nenhuma outra rota: um assistente fora do ar não tira
   o portal do ar. Ver servidor/ia.js e md/12-arquitetura-integracao-ia.md. */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const dados = require('./dados');
const auth = require('./auth');
const ia = require('./ia');
const { ErroDeUso } = require('./erros');
const seguranca = require('./seguranca');

const RAIZ = path.join(__dirname, '..');
const PASTA_DOCS = path.join(RAIZ, 'docs');
const LIMITE_JSON = 64 * 1024;          // corpo de formulário é texto curto
const LIMITE_ARQUIVO = 25 * 1024 * 1024;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.pdf':  'application/pdf',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls':  'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt':  'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

/* ---------- Utilidades de resposta ---------- */

function responderJson(res, status, corpo, cabecalhos = {}){
  const texto = JSON.stringify(corpo);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(texto),
    'Cache-Control': 'no-store',
    ...cabecalhos
  });
  res.end(texto);
}

function responderErro(res, erro){
  if (res.destroyed || res.writableEnded) return;
  const conhecido = erro instanceof ErroDeUso;
  if (!conhecido) console.error('[erro]', erro);

  responderJson(res, conhecido ? erro.status : 500, {
    erro: conhecido ? erro.message : 'Algo deu errado no servidor. Avise quem cuida do portal.'
  });
}

// Pausa o body excedente sem destruir o socket antes de enviar o 413.
// O handler fecha a conexão após a resposta; não acumula o restante em memória.
function lerCorpo(req, limite){
  return new Promise((resolve, reject) => {
    const pedacos = [];
    let tamanho = 0;
    const limpar = () => { req.removeListener('data', receber); req.removeListener('end', fim); req.removeListener('error', falha); req.removeListener('aborted', abortado); };
    const falha = erro => { limpar(); reject(erro); };
    const abortado = () => falha(new ErroDeUso('Requisição interrompida.', 400));
    const fim = () => { limpar(); resolve(Buffer.concat(pedacos)); };
    const receber = pedaco => {
      tamanho += pedaco.length;
      if (tamanho > limite){ req.pause(); return falha(new ErroDeUso('Conteúdo grande demais.', 413)); }
      pedacos.push(pedaco);
    };
    req.on('data', receber); req.on('end', fim); req.on('error', falha); req.on('aborted', abortado);
  });
}

async function lerJson(req){
  if ((req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/json')
    throw new ErroDeUso('Envie application/json.', 415);
  const corpo = await lerCorpo(req, LIMITE_JSON);
  if (!corpo.length) return {};
  try {
    const valor = JSON.parse(corpo.toString('utf8'));
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new Error('Objeto esperado');
    return valor;
  } catch (e) {
    throw new ErroDeUso('Requisição malformada.');
  }
}

/* ---------- API ---------- */

async function tratarApi(req, res, url){
  seguranca.exigirOrigem(req);
  // ORDEM IMPORTANTE: operações de escrita exigem sessão antes de ler o corpo
  // e persistir. dados.js valida mesmo com formulário validado: a API também
  // recebe chamadas diretas. ErroDeUso mantém o contrato {erro} com status 4xx.
  const sessao = auth.sessaoDe(auth.lerCookie(req.headers.cookie));
  const rota = url.pathname;
  const metodo = req.method;

  /* Sessão */

  if (rota === '/api/sessao'){
    if (metodo === 'GET'){
      return responderJson(res, 200, sessao
        ? { autenticado: true, nome: sessao.nome, login: sessao.login, papel: sessao.papel }
        : { autenticado: false });
    }

    if (metodo === 'POST'){
      seguranca.limitarLogin(req);
      const corpo = await lerJson(req);
      const { token, sessao: nova } = auth.entrar(corpo.login, corpo.senha);
      return responderJson(res, 200,
        { autenticado: true, ...nova },
        { 'Set-Cookie': auth.cookieDeSessao(token) });
    }

    if (metodo === 'DELETE'){
      auth.sair(auth.lerCookie(req.headers.cookie));
      return responderJson(res, 200, { autenticado: false }, { 'Set-Cookie': auth.cookieDeSessao('') });
    }
  }

  /* Documentos */

  if (rota === '/api/documentos'){
    if (metodo === 'GET'){
      // Leitura é aberta: quem já está na rede e abriu o portal enxerga a
      // página inteira de qualquer jeito. O que exige login é escrever.
      return responderJson(res, 200, { itens: dados.listar(), blocos: dados.BLOCOS });
    }

    if (metodo === 'POST'){
      auth.exigir(sessao, ['equipe', 'dev']);
      const item = dados.incluir(await lerJson(req), sessao.login);
      return responderJson(res, 201, { item });
    }
  }

  const comId = rota.match(/^\/api\/documentos\/([A-Za-z0-9-]{1,64})$/);
  if (comId){
    const id = comId[1];

    if (metodo === 'PUT'){
      auth.exigir(sessao, ['equipe', 'dev']);
      const item = dados.editar(id, await lerJson(req), sessao.login);
      return responderJson(res, 200, { item });
    }

    // A regra que o pedido definiu: excluir é só de quem desenvolveu.
    if (metodo === 'DELETE'){
      auth.exigir(sessao, ['dev']);
      dados.excluir(id);
      return responderJson(res, 200, { ok: true });
    }
  }

  /* Arquivos (DOC/PDF) — o corpo é o arquivo cru, e o nome vem na query.
     Sem multipart de propósito: `fetch(url, { body: arquivo })` manda os bytes
     direto, e evita um parser de multipart escrito à mão (ou uma dependência)
     só para receber um campo. */
  if (rota === '/api/arquivos' && metodo === 'POST'){
    auth.exigir(sessao, ['equipe', 'dev']);

    const nome = dados.nomeSeguro(url.searchParams.get('nome'));
    const conteudo = await lerCorpo(req, LIMITE_ARQUIVO);
    if (!conteudo.length) throw new ErroDeUso('O arquivo chegou vazio.');

    fs.mkdirSync(PASTA_DOCS, { recursive: true });
    if (!seguranca.semLinks(RAIZ, PASTA_DOCS)) throw new ErroDeUso('Destino de arquivo não permitido.', 403);

    // Só sobrescreve quando quem edita pediu (é a troca de versão do mesmo
    // documento). Senão, acrescenta sufixo para não apagar arquivo de outro.
    const substituir = url.searchParams.get('substituir') === '1';
    let final = nome;
    if (!substituir){
      const extensao = path.extname(nome);
      const base = nome.slice(0, -extensao.length);
      let n = 2;
      while (fs.existsSync(path.join(PASTA_DOCS, final))) final = `${base}-${n++}${extensao}`;
    }

    const destino = path.join(PASTA_DOCS, final);
    if (!seguranca.semLinks(RAIZ, destino)) throw new ErroDeUso('Destino de arquivo não permitido.', 403);
    fs.writeFileSync(destino, conteudo, { flag: substituir ? 'w' : 'wx' });
    return responderJson(res, 201, { href: `docs/${final}`, nome: final });
  }

  /* Assistente. Exige sessão porque a IA precisa saber EM NOME DE QUEM está
     respondendo — o que a pessoa pode ver depende do papel dela. O papel sai da
     sessão, nunca do corpo: quem manda a pergunta não escolhe quem é.
     ia.js decide o resto, inclusive o 503 de quando não há serviço configurado. */
  if (rota === '/api/ia/consulta' && metodo === 'POST'){
    auth.exigir(sessao, ['equipe', 'dev']);
    const corpo = await lerJson(req);
    return responderJson(res, 200, await ia.consultar({
      pergunta: corpo.pergunta,
      contexto: corpo.contexto,
      usuario: sessao
    }));
  }

  responderJson(res, 404, { erro: 'Rota não encontrada.' });
}

/* ---------- Estático ---------- */

/* Lista de PERMITIDOS, não de bloqueados. O portal é o `index.html` mais
   quatro pastas; nada além disso precisa sair pela porta 80.

     css, js, Fotos   o portal
     docs             os DOC/PDF que a equipe envia pela própria página
     download         na VM, o instalador e o versao.json do app Windows

   A lista de bloqueio anterior errava para o lado perigoso: pasta nova nascia
   servida, e sem ninguém decidir isso o servidor já entregava `md/` (com as
   auditorias e o que elas descrevem), `app/`, `tests/`, `ferramentas/`,
   `publicacao/` e `dist/` — o instalador de 90 MB. Aqui pasta nova nasce
   FECHADA, e servir passa a ser uma decisão de uma linha.

   `.gitignore` não restringe HTTP: estar fora do git não protege nada. */
const PERMITIDOS = ['css', 'js', 'Fotos', 'docs', 'download'];

function caminhoSeguro(pathname){
  let relativo;
  try { relativo = decodeURIComponent(pathname).replace(/^\/+/, ''); }
  catch { throw new ErroDeUso('Endereço malformado.', 400); }
  if (/[\x00-\x1f:]/.test(relativo)) return null;
  const alvo = path.resolve(RAIZ, relativo || 'index.html');
  if (!alvo.startsWith(RAIZ + path.sep)) return null;

  // A lista vale sobre o caminho JÁ RESOLVIDO: o primeiro segmento da URL
  // mente quando ela traz %2F (ou qualquer outra forma de ../ codificada).
  const dentro = alvo.slice(RAIZ.length + 1);
  const [primeiro] = dentro.split(path.sep);

  // Na raiz, só o index.html. O resto tem que estar numa pasta permitida.
  if (dentro === primeiro) return primeiro === 'index.html' ? alvo : null;
  if (!PERMITIDOS.includes(primeiro) || !seguranca.semLinks(RAIZ, alvo)) return null;
  const partes = dentro.split(path.sep);
  if (partes.some(p => p.startsWith('.') || p.toLowerCase() === 'originais')) return null;
  const extensao = path.extname(alvo).slice(1).toLowerCase();
  const extensoes = { css: ['css'], js: ['js'], Fotos: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'ico'], docs: dados.EXTENSOES, download: ['exe', 'json'] };
  return extensoes[primeiro].includes(extensao) ? alvo : null;
}

function tratarEstatico(req, res, url){
  if (req.method !== 'GET' && req.method !== 'HEAD'){
    return responderJson(res, 405, { erro: 'Método não permitido.' });
  }

  const alvo = caminhoSeguro(url.pathname);
  if (!alvo) return responderJson(res, 403, { erro: 'Acesso negado.' });

  let info = null;
  try { info = fs.statSync(alvo); } catch (e) { info = null; }

  if (!info || !info.isFile()){
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Não encontrado');
  }

  const tipo = TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream';
  if (path.relative(RAIZ, alvo).split(path.sep)[0] === 'docs')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(alvo))}`);

  // O portal é editado com frequência e não tem hash no nome dos arquivos:
  // `no-cache` faz o navegador revalidar sempre, e o ETag evita o download
  // quando nada mudou. Sem isso, "corrigi e não mudou nada" vira rotina.
  const etag = `"${info.size}-${info.mtimeMs}"`;
  if (req.headers['if-none-match'] === etag){
    res.writeHead(304, { ETag: etag, 'Cache-Control': 'no-cache' });
    return res.end();
  }

  res.writeHead(200, {
    'Content-Type': tipo,
    'Content-Length': info.size,
    'Cache-Control': 'no-cache',
    ETag: etag
  });

  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(alvo).on('error', () => res.destroy()).pipe(res);
}

/* ---------- Servidor ---------- */

const servidor = http.createServer((req, res) => {
  seguranca.protegerResposta(res);
  const falha = erro => {
    if (!req.complete){ res.setHeader('Connection', 'close'); res.once('finish', () => req.destroy()); }
    responderErro(res, erro);
  };
  try {
    let url;
    try { url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); }
    catch { throw new ErroDeUso('Endereço malformado.', 400); }
    if (url.pathname.startsWith('/api/')){
      tratarApi(req, res, url).catch(falha);
      return;
    }
    tratarEstatico(req, res, url);
  } catch (erro) {
    falha(erro);
  }
});

function porta(){
  const i = process.argv.indexOf('--porta');
  const escolhida = Number(i > -1 ? process.argv[i + 1] : process.env.PORTA || 8000);
  return Number.isInteger(escolhida) && escolhida > 0 ? escolhida : 8000;
}

if (require.main === module){
  const p = porta();
  servidor.listen(p, () => {
    console.log(`Portal Parceria JB em http://localhost:${p}`);
    console.log('Para cadastrar quem edita:  node servidor/usuarios.js incluir');
  });
}

module.exports = { servidor };
