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

   A regra de papel é aplicada aqui, não no navegador — ver servidor/auth.js. */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const dados = require('./dados');
const auth = require('./auth');

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
  const conhecido = erro instanceof dados.ErroDeUso || erro instanceof auth.ErroDeUso;
  if (!conhecido) console.error('[erro]', erro);

  responderJson(res, conhecido ? erro.status : 500, {
    erro: conhecido ? erro.message : 'Algo deu errado no servidor. Avise quem cuida do portal.'
  });
}

function lerCorpo(req, limite){
  return new Promise((resolve, reject) => {
    const pedacos = [];
    let tamanho = 0;

    req.on('data', (pedaco) => {
      tamanho += pedaco.length;
      if (tamanho > limite){
        reject(new dados.ErroDeUso('Conteúdo grande demais.', 413));
        req.destroy();
        return;
      }
      pedacos.push(pedaco);
    });

    req.on('end', () => resolve(Buffer.concat(pedacos)));
    req.on('error', reject);
  });
}

async function lerJson(req){
  const corpo = await lerCorpo(req, LIMITE_JSON);
  if (!corpo.length) return {};
  try {
    return JSON.parse(corpo.toString('utf8'));
  } catch (e) {
    throw new dados.ErroDeUso('Requisição malformada.');
  }
}

/* ---------- API ---------- */

async function tratarApi(req, res, url){
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
    if (!conteudo.length) throw new dados.ErroDeUso('O arquivo chegou vazio.');

    fs.mkdirSync(PASTA_DOCS, { recursive: true });

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

    fs.writeFileSync(path.join(PASTA_DOCS, final), conteudo);
    return responderJson(res, 201, { href: `docs/${final}`, nome: final });
  }

  responderJson(res, 404, { erro: 'Rota não encontrada.' });
}

/* ---------- Estático ---------- */

// Só entrega o que está dentro da pasta do projeto. `path.resolve` + prefixo é
// o que barra `GET /../../.env` e amigos.
// Nada aqui é secreto para quem acessa o portal, mas também não precisa ser
// servido: dados do servidor, configuração e o histórico do git ficam de fora.
const BLOQUEADOS = ['servidor', 'node_modules', '.git', '.env', '.claude'];

function caminhoSeguro(pathname){
  const relativo = decodeURIComponent(pathname).replace(/^\/+/, '');
  const alvo = path.resolve(RAIZ, relativo || 'index.html');
  if (alvo !== RAIZ && !alvo.startsWith(RAIZ + path.sep)) return null;

  // A lista vale sobre o caminho JÁ RESOLVIDO: o primeiro segmento da URL
  // mente quando ela traz %2F (ou qualquer outra forma de ../ codificada).
  const [primeiro = ''] = alvo.slice(RAIZ.length + 1).split(path.sep);
  if (BLOQUEADOS.includes(primeiro) || primeiro.startsWith('.env')) return null;

  return alvo;
}

function tratarEstatico(req, res, url){
  if (req.method !== 'GET' && req.method !== 'HEAD'){
    return responderJson(res, 405, { erro: 'Método não permitido.' });
  }

  let alvo = caminhoSeguro(url.pathname);
  if (!alvo) return responderJson(res, 403, { erro: 'Acesso negado.' });

  let info = null;
  try { info = fs.statSync(alvo); } catch (e) { info = null; }
  if (info && info.isDirectory()){
    alvo = path.join(alvo, 'index.html');
    try { info = fs.statSync(alvo); } catch (e) { info = null; }
  }

  if (!info || !info.isFile()){
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Não encontrado');
  }

  const tipo = TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream';

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
  fs.createReadStream(alvo).pipe(res);
}

/* ---------- Servidor ---------- */

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname.startsWith('/api/')){
    tratarApi(req, res, url).catch((erro) => responderErro(res, erro));
    return;
  }

  try {
    tratarEstatico(req, res, url);
  } catch (erro) {
    responderErro(res, erro);
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
