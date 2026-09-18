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
const iaCred = require('./ia/credenciais');
const iaReg = require('./ia/registro');
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
      const itens = dados.listar();
      // Visitantes leem o acervo sem receber logins ou metadados de autoria.
      const publicos = itens.map(({ criadoPor, atualizadoPor, criadoEm, atualizadoEm, ...item }) => item);
      return responderJson(res, 200, { itens: sessao ? itens : publicos, blocos: dados.BLOCOS });
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

  /* IA BYOK (multi-provedor, credencial por usuário). Prefixo /api/ai/ para não
     colidir com o assistente antigo /api/ia/. Tudo exige sessão; o dono da
     credencial é SEMPRE sessao.login, nunca um id vindo do corpo/URL. A chave
     mestra ausente derruba só estas rotas (503), não o portal. Ver
     servidor/ia/registro.js e docs/ai/AI-ARCHITECTURE.md. */
  if (rota.startsWith('/api/ai/')){
    auth.exigir(sessao, ['equipe', 'dev']);
    if (!iaCred.disponivel()) throw new ErroDeUso('Integração de IA não configurada neste servidor.', 503);

    if (rota === '/api/ai/providers' && metodo === 'GET')
      return responderJson(res, 200, { provedores: iaReg.publico() });

    if (rota === '/api/ai/settings'){
      if (metodo === 'GET')
        return responderJson(res, 200, { configuracao: iaCred.obter(sessao.login), provedores: iaReg.publico() });
      if (metodo === 'PUT'){
        // Salvar com credencial nova dispara chamada externa (validação): mesmo
        // freio de /test e /chat, senão vira caminho paralelo sem limite.
        seguranca.limitarIa(sessao.login);
        return responderJson(res, 200, { configuracao: await salvarConfigIa(sessao.login, await lerJson(req)) });
      }
    }

    if (rota === '/api/ai/settings/test' && metodo === 'POST'){
      seguranca.limitarIa(sessao.login);
      return responderJson(res, 200, await testarCredencialIa(await lerJson(req)));
    }

    if (rota === '/api/ai/settings/credential' && metodo === 'DELETE'){
      iaCred.remover(sessao.login);
      return responderJson(res, 200, { ok: true });
    }

    const comProvedor = rota.match(/^\/api\/ai\/providers\/([a-z0-9-]{1,32})\/models$/);
    if (comProvedor && metodo === 'GET'){
      seguranca.limitarIa(sessao.login);   // também faz chamada externa (listar modelos)
      return responderJson(res, 200, await modelosDoProvedorIa(sessao.login, comProvedor[1]));
    }

    if (rota === '/api/ai/chat' && metodo === 'POST'){
      seguranca.limitarIa(sessao.login);
      return tratarChatIa(req, res, sessao);
    }
  }

  responderJson(res, 404, { erro: 'Rota não encontrada.' });
}

/* ---------- IA BYOK: regras das rotas /api/ai ---------- */

// Testar conexão: chama a operação oficial barata (listar modelos, que também
// valida) e devolve só o resultado sanitizado + os modelos permitidos que a
// chave realmente tem. NÃO salva nada — nem credencial inválida (requisito 4).
async function testarCredencialIa({ provider, chave }){
  if (!iaReg.ehProvedor(provider)) throw new ErroDeUso('Provedor não suportado.', 400);
  if (typeof chave !== 'string' || !chave.trim() || chave.length > 512)
    throw new ErroDeUso('Informe uma credencial válida.', 400);
  try {
    const vivos = await iaReg.adapter(provider).listarModelos(chave.trim());
    const permitidos = iaReg.meta(provider).modelos;
    return { status: 'valida', modelos: vivos.map((m) => m.id).filter((id) => permitidos.includes(id)) };
  } catch (erro) {
    if (erro instanceof ErroDeUso && erro.status === 401)
      return { status: 'invalida', mensagem: 'Credencial recusada pelo provedor.' };
    return { status: 'indisponivel', mensagem: 'Não foi possível validar agora. Tente de novo.' };
  }
}

// Salvar configuração. Com chave nova: valida ANTES de gravar (nunca grava
// inválida). Sem chave nova: só troca modelo/enabled da credencial existente.
async function salvarConfigIa(login, corpo){
  const provider = corpo && corpo.provider;
  if (!iaReg.ehProvedor(provider)) throw new ErroDeUso('Provedor não suportado.', 400);
  const modelo = String(corpo.selectedModel || '').trim();
  if (!iaReg.modeloPermitido(provider, modelo)) throw new ErroDeUso('Modelo não permitido para este provedor.', 400);

  const temChaveNova = typeof corpo.chave === 'string' && corpo.chave.trim();
  if (temChaveNova){
    const chave = corpo.chave.trim();
    if (chave.length > 512) throw new ErroDeUso('Credencial longa demais.', 400);
    try {
      await iaReg.adapter(provider).listarModelos(chave);
    } catch (erro) {
      if (erro instanceof ErroDeUso && erro.status === 401) throw new ErroDeUso('Credencial recusada pelo provedor.', 400);
      throw new ErroDeUso('Não foi possível validar a credencial agora. Tente de novo.', 502);
    }
    const salvo = iaCred.salvar(login, { provider, chave, selectedModel: modelo });
    return 'enabled' in corpo ? iaCred.atualizar(login, { enabled: corpo.enabled }) : salvo;
  }

  const atual = iaCred.obter(login);
  if (!atual || atual.provider !== provider)
    throw new ErroDeUso('Informe a credencial para este provedor.', 400);
  return iaCred.atualizar(login, Object.assign({ selectedModel: modelo }, 'enabled' in corpo ? { enabled: corpo.enabled } : {}));
}

// Modelos permitidos que a credencial JÁ SALVA do usuário tem — para trocar de
// modelo sem reenviar a chave.
async function modelosDoProvedorIa(login, provider){
  if (!iaReg.ehProvedor(provider)) throw new ErroDeUso('Provedor não suportado.', 400);
  const atual = iaCred.obter(login);
  const chave = iaCred.chaveDe(login);
  if (!chave || !atual || atual.provider !== provider)
    throw new ErroDeUso('Configure a credencial deste provedor primeiro.', 400);
  const vivos = await iaReg.adapter(provider).listarModelos(chave);
  const permitidos = iaReg.meta(provider).modelos;
  return { modelos: vivos.map((m) => m.id).filter((id) => permitidos.includes(id)) };
}

function validarMensagensIa(bruto){
  if (!Array.isArray(bruto) || !bruto.length) throw new ErroDeUso('Envie ao menos uma mensagem.', 400);
  if (bruto.length > 40) throw new ErroDeUso('Conversa longa demais.', 400);
  const papeis = ['user', 'assistant', 'system'];
  return bruto.map((m) => {
    const papel = papeis.includes(m && m.papel) ? m.papel : 'user';
    const texto = String(m && m.texto || '').slice(0, 8000);
    if (!texto) throw new ErroDeUso('Mensagem vazia.', 400);
    return { papel, texto };
  });
}

// Auditoria: SÓ metadados. Nunca a chave, nunca o conteúdo do prompt, nunca a
// resposta (mesma postura de servidor/ia.js).
function auditarIa({ login, provider, modelo, ms, status, erro }){
  console.log('[ai]', new Date().toISOString(), login, provider, modelo, `${ms}ms`,
    erro ? `erro=${erro}` : status);
}

async function tratarChatIa(req, res, sessao){
  const corpo = await lerJson(req);
  const cfg = iaCred.obter(sessao.login);
  if (!cfg) throw new ErroDeUso('Configure um provedor de IA primeiro.', 400);
  if (!cfg.enabled) throw new ErroDeUso('Sua integração de IA está desabilitada.', 409);

  const mensagens = validarMensagensIa(corpo.mensagens);
  const modelo = String(corpo.modelo || cfg.selectedModel || '').trim();
  if (!iaReg.modeloPermitido(cfg.provider, modelo)) throw new ErroDeUso('Modelo não permitido.', 400);

  const chave = iaCred.chaveDe(sessao.login);
  const adapter = iaReg.adapter(cfg.provider);
  const inicio = Date.now();
  const querStream = corpo.stream === true && typeof adapter.streamTexto === 'function';

  try {
    if (querStream){
      const controle = new AbortController();
      // Cliente desistiu no meio: aborta a chamada ao provedor (requisito 15).
      req.on('close', () => { if (!res.writableEnded) controle.abort(); });
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
      for await (const pedaco of adapter.streamTexto({ chave, modelo, mensagens, sinal: controle.signal }))
        res.write(pedaco);
      res.end();
      auditarIa({ login: sessao.login, provider: cfg.provider, modelo, ms: Date.now() - inicio, status: 'ok' });
      return;
    }
    const r = await adapter.gerarTexto({ chave, modelo, mensagens });
    auditarIa({ login: sessao.login, provider: cfg.provider, modelo, ms: Date.now() - inicio, status: 'ok' });
    return responderJson(res, 200, { resposta: r.texto, modelo });
  } catch (erro) {
    auditarIa({ login: sessao.login, provider: cfg.provider, modelo, ms: Date.now() - inicio, status: 'erro', erro: erro.name });
    if (erro && erro.name === 'AbortError'){ if (!res.writableEnded) res.end(); return; }
    throw erro instanceof ErroDeUso ? erro : new ErroDeUso('O provedor não conseguiu responder agora.', 502);
  }
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
  const host = process.env.PAJB_HOST || '127.0.0.1';
  if (!require('node:net').isIP(host)) throw new Error('PAJB_HOST deve ser um endereço IP.');
  if (process.env.NODE_ENV === 'production'){
    if (!seguranca.ORIGEM_PUBLICA.startsWith('https:'))
      throw new Error('Produção exige proxy HTTPS e PAJB_ORIGEM_PUBLICA=https://seu-host.');
    if (!['127.0.0.1', '::1'].includes(host))
      throw new Error('Em produção, PAJB_HOST deve ser loopback; publique o portal pelo proxy HTTPS local.');
  }
  servidor.listen(p, host, () => {
    if (!seguranca.ORIGEM_PUBLICA.startsWith('https:')){
      console.warn('[WARN] Sessões podem trafegar sem TLS. Em produção, use proxy HTTPS e configure PAJB_ORIGEM_PUBLICA=https://seu-host.');
    }
    console.log(`Portal Parceria JB em http://${host.includes(':') ? `[${host}]` : host}:${p}`);
    console.log('Para cadastrar quem edita:  node servidor/usuarios.js incluir');
  });
}

module.exports = { servidor };
