/* Usuários, senhas, sessões e papéis.

   DOIS PAPÉIS, e a diferença entre eles é a razão deste arquivo existir:

     equipe  — inclui e edita documentos e manuais
     dev     — inclui, edita e EXCLUI

   A regra vale aqui, no servidor. O front esconde o botão de excluir de quem é
   `equipe`, mas isso é conforto visual: qualquer pessoa consegue montar a
   requisição na mão pelo DevTools. Quem recusa é o servidor — foi por isso que
   o portal deixou de ser só arquivo estático.

   Senha: scrypt com salt por usuário (crypto do próprio Node, sem dependência).
   Comparação em tempo constante, para o tempo de resposta não entregar quantos
   caracteres bateram.

   Sessões vivem em memória: reiniciar o serviço desloga todo mundo, e é só
   entrar de novo. Trocar a senha ou remover o usuário também desloga, mesmo
   partindo da CLI em outro processo — ver sessaoDe. Persistir sessão em disco traria mais problema (token válido
   depois de o serviço voltar dias depois) do que benefício num portal interno. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { ErroDeUso } = require('./erros');
const { ORIGEM_PUBLICA } = require('./seguranca');

const ARQUIVO = path.join(__dirname, 'dados', 'usuarios.json');

const PAPEIS = ['equipe', 'dev'];
// DEPENDÊNCIA: revisar as listas de tratarApi em servidor.js, validarSessao
// em js/documentos/api.js e as ações de js/documentos.js ao criar um papel.
const COOKIE = 'pajb_sessao';
const DURACAO_SESSAO = 12 * 60 * 60 * 1000;   // 12 h: um dia de trabalho

// Freio para tentativa de senha em sequência. Números baixos de propósito:
// isto é rede interna, o objetivo é atrapalhar script, não bloquear pessoa.
const MAX_TENTATIVAS = 5;
const CASTIGO = 5 * 60 * 1000;

/* ---------- Arquivo de usuários ---------- */

function lerUsuarios(){
  try {
    const bruto = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
    return Array.isArray(bruto.usuarios) ? bruto.usuarios : [];
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

function gravarUsuarios(usuarios){
  fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
  const temporario = `${ARQUIVO}.tmp`;
  fs.writeFileSync(temporario, JSON.stringify({ usuarios }, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporario, ARQUIVO);
}

function normalizarLogin(valor){
  return String(valor ?? '').trim().toLowerCase();
}

/* ---------- Senha ---------- */

function derivar(senha, salt){
  // 16384/8/1 é o padrão do scrypt e roda em ~50 ms — rápido para quem entra,
  // caro para quem tenta adivinhar em série.
  return crypto.scryptSync(String(senha), Buffer.from(salt, 'hex'), 64).toString('hex');
}

function senhaConfere(usuario, senha){
  const esperado = Buffer.from(usuario.hash, 'hex');
  const recebido = Buffer.from(derivar(senha, usuario.salt), 'hex');
  if (esperado.length !== recebido.length) return false;
  return crypto.timingSafeEqual(esperado, recebido);
}

/* ---------- Cadastro (usado pela CLI servidor/usuarios.js) ---------- */

function criarUsuario({ login, nome, papel, senha }){
  const usuarios = lerUsuarios();
  const chave = normalizarLogin(login);

  if (!/^[a-z0-9._-]{3,32}$/.test(chave)){
    throw new ErroDeUso('Login: 3 a 32 caracteres, só letras, números, ponto, hífen ou sublinhado.');
  }
  if (usuarios.some((u) => u.login === chave)) throw new ErroDeUso('Já existe um usuário com esse login.');
  if (!PAPEIS.includes(papel)) throw new ErroDeUso(`Papel deve ser ${PAPEIS.join(' ou ')}.`);
  if (String(senha ?? '').length < 8) throw new ErroDeUso('A senha precisa de pelo menos 8 caracteres.');

  const salt = crypto.randomBytes(16).toString('hex');
  const usuario = {
    login: chave,
    nome: String(nome ?? '').trim() || chave,
    papel,
    salt,
    hash: derivar(senha, salt),
    criadoEm: new Date().toISOString()
  };

  usuarios.push(usuario);
  gravarUsuarios(usuarios);
  return { login: usuario.login, nome: usuario.nome, papel: usuario.papel };
}

// Regravar o salt é o que revoga as sessões abertas, inclusive as de outro
// processo: sessaoDe compara o salt do disco com o guardado no login.
function trocarSenha(login, senha){
  const usuarios = lerUsuarios();
  const usuario = usuarios.find((u) => u.login === normalizarLogin(login));
  if (!usuario) throw new ErroDeUso('Usuário não encontrado.', 404);
  if (String(senha ?? '').length < 8) throw new ErroDeUso('A senha precisa de pelo menos 8 caracteres.');

  usuario.salt = crypto.randomBytes(16).toString('hex');
  usuario.hash = derivar(senha, usuario.salt);
  gravarUsuarios(usuarios);
}

function removerUsuario(login){
  // encerrarSessoesDe limpa o Map deste processo; o servidor HTTP, que roda
  // separado da CLI, derruba a sessão na requisição seguinte porque o usuário
  // deixou de existir no arquivo (ver sessaoDe).
  const usuarios = lerUsuarios();
  const restantes = usuarios.filter((u) => u.login !== normalizarLogin(login));
  if (restantes.length === usuarios.length) throw new ErroDeUso('Usuário não encontrado.', 404);
  gravarUsuarios(restantes);
  encerrarSessoesDe(normalizarLogin(login));
}

function listarUsuarios(){
  return lerUsuarios().map((u) => ({ login: u.login, nome: u.nome, papel: u.papel, criadoEm: u.criadoEm }));
}

/* ---------- Sessões ---------- */

const sessoes = new Map();      // token -> { login, nome, papel, credencial, expiraEm }
const tentativas = new Map();   // login -> { erros, bloqueadoAte }

function limparVencidas(){
  const agora = Date.now();
  for (const [token, sessao] of sessoes){
    if (sessao.expiraEm <= agora) sessoes.delete(token);
  }
}

function encerrarSessoesDe(login){
  for (const [token, sessao] of sessoes){
    if (sessao.login === login) sessoes.delete(token);
  }
}

function entrar(login, senha){
  if (typeof login !== 'string' || !/^[a-z0-9._-]{3,32}$/i.test(login.trim())
    || typeof senha !== 'string' || senha.length > 1024)
    throw new ErroDeUso('Login ou senha inválidos.', 400);
  const chave = normalizarLogin(login);

  const agora = Date.now();

  /* A varredura acontece em TODA tentativa, não só na que dá certo: a chave do
     Map é o login que veio na requisição, então quem só erra nunca chegaria ao
     caminho de sucesso e o Map cresceria para sempre.

     O critério é INATIVIDADE, não `bloqueadoAte`: quem tem 3 erros e ainda não
     foi bloqueado carrega `bloqueadoAte: 0`, e apagar por aí zeraria a
     contagem de um login sempre que outro tentasse — bastaria alternar dois
     logins para nunca chegar aos 5. Parado por CASTIGO, a contagem some; é a
     mesma janela do bloqueio. */
  for (const [quem, freio] of tentativas){
    if (freio.visto <= agora - CASTIGO) tentativas.delete(quem);
  }

  const freio = tentativas.get(chave);
  if (!freio && tentativas.size >= 10000) throw new ErroDeUso('Muitas tentativas. Tente mais tarde.', 429);

  if (freio && freio.bloqueadoAte > agora){
    const minutos = Math.ceil((freio.bloqueadoAte - agora) / 60000);
    throw new ErroDeUso(`Muitas tentativas. Tente de novo em ${minutos} min.`, 429);
  }

  const usuario = lerUsuarios().find((u) => u.login === chave);

  // Mesma mensagem para login inexistente e senha errada: não confirma para
  // quem está tentando que aquele login existe.
  // Faz a derivação também para login inexistente para reduzir a diferença
  // de tempo; o limite HTTP por IP contém o custo de alternar nomes.
  const confere = senhaConfere(usuario || { salt: '0'.repeat(32), hash: '0'.repeat(128) }, senha);
  if (!usuario || !confere){
    const erros = (freio?.erros ?? 0) + 1;
    tentativas.set(chave, {
      erros,
      visto: agora,
      bloqueadoAte: erros >= MAX_TENTATIVAS ? agora + CASTIGO : 0
    });
    throw new ErroDeUso('Usuário ou senha incorretos.', 401);
  }

  tentativas.delete(chave);
  limparVencidas();

  const token = crypto.randomBytes(32).toString('hex');
  sessoes.set(token, {
    login: usuario.login,
    nome: usuario.nome,
    papel: usuario.papel,
    // Marca da credencial no momento do login (ver sessaoDe). Fica só em
    // memória: servidor.js escolhe campo a campo o que vai para o cliente.
    credencial: usuario.salt,
    expiraEm: Date.now() + DURACAO_SESSAO
  });

  return { token, sessao: { login: usuario.login, nome: usuario.nome, papel: usuario.papel } };
}

function sair(token){
  if (token) sessoes.delete(token);
}

/* Devolve a sessão do cookie, ou null. O papel vem daqui, nunca do que o
   navegador manda no corpo da requisição. */
function sessaoDe(token){
  if (!token) return null;
  const sessao = sessoes.get(token);
  if (!sessao) return null;

  if (sessao.expiraEm <= Date.now()){
    sessoes.delete(token);
    return null;
  }

  /* A CLI usuarios.js roda em outro processo, então trocar a senha ou remover
     o usuário por lá não alcança o Map deste servidor. O salt é regravado nas
     duas operações: comparar com o disco revoga a sessão na requisição
     seguinte, sem reiniciar o serviço e sem persistir sessão nenhuma. Custa
     uma leitura de poucos KB por requisição autenticada — a mesma ordem de
     grandeza do listar() do acervo. */
  const usuario = lerUsuarios().find((u) => u.login === sessao.login);
  if (!usuario || usuario.salt !== sessao.credencial || usuario.papel !== sessao.papel){
    sessoes.delete(token);
    return null;
  }

  return sessao;
}

function exigir(sessao, papeis){
  if (!sessao) throw new ErroDeUso('Entre com seu usuário para fazer isso.', 401);
  if (!papeis.includes(sessao.papel)) throw new ErroDeUso('Seu perfil não permite esta ação.', 403);
  return sessao;
}

/* ---------- Cookie ---------- */

function lerCookie(cabecalho){
  const bruto = String(cabecalho ?? '');
  for (const parte of bruto.split(';')){
    const [nome, ...resto] = parte.trim().split('=');
    if (nome === COOKIE){
      try { return decodeURIComponent(resto.join('=')); }
      catch { throw new ErroDeUso('Cookie malformado.', 400); }
    }
  }
  return '';
}

/* SEGURANÇA: HttpOnly impede leitura do cookie por JavaScript, mas não impede
   um script injetado de fazer requisições autenticadas. SameSite=Strict limita
   o envio cross-site. seguranca.js exige header próprio e valida Origin nas
   escritas; não liberar CORS sem revisar essa proteção. PAJB_ORIGEM_PUBLICA
   com HTTPS adiciona Secure; HTTP local continua compatível. */
function cookieDeSessao(token){
  const base = `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict${ORIGEM_PUBLICA.startsWith('https:') ? '; Secure' : ''}`;
  return `${base}; Max-Age=${token ? DURACAO_SESSAO / 1000 : 0}`;
}

module.exports = {
  ErroDeUso,
  criarUsuario, trocarSenha, removerUsuario, listarUsuarios,
  entrar, sair, sessaoDe, exigir,
  lerCookie, cookieDeSessao
};
