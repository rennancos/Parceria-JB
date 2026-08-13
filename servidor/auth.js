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
   entrar de novo. Persistir sessão em disco traria mais problema (token válido
   depois de o serviço voltar dias depois) do que benefício num portal interno. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ARQUIVO = path.join(__dirname, 'dados', 'usuarios.json');

const PAPEIS = ['equipe', 'dev'];
const COOKIE = 'pajb_sessao';
const DURACAO_SESSAO = 12 * 60 * 60 * 1000;   // 12 h: um dia de trabalho

// Freio para tentativa de senha em sequência. Números baixos de propósito:
// isto é rede interna, o objetivo é atrapalhar script, não bloquear pessoa.
const MAX_TENTATIVAS = 5;
const CASTIGO = 5 * 60 * 1000;

class ErroDeUso extends Error {
  constructor(mensagem, status = 400){
    super(mensagem);
    this.name = 'ErroDeUso';
    this.status = status;
  }
}

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

const sessoes = new Map();      // token -> { login, nome, papel, expiraEm }
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
  const chave = normalizarLogin(login);
  const freio = tentativas.get(chave);

  if (freio && freio.bloqueadoAte > Date.now()){
    const minutos = Math.ceil((freio.bloqueadoAte - Date.now()) / 60000);
    throw new ErroDeUso(`Muitas tentativas. Tente de novo em ${minutos} min.`, 429);
  }

  const usuario = lerUsuarios().find((u) => u.login === chave);

  // Mesma mensagem para login inexistente e senha errada: não confirma para
  // quem está tentando que aquele login existe.
  if (!usuario || !senhaConfere(usuario, senha)){
    const erros = (freio?.erros ?? 0) + 1;
    tentativas.set(chave, {
      erros,
      bloqueadoAte: erros >= MAX_TENTATIVAS ? Date.now() + CASTIGO : 0
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
    if (nome === COOKIE) return decodeURIComponent(resto.join('='));
  }
  return '';
}

/* HttpOnly: o token não é legível por JavaScript, então um script injetado numa
   página não consegue roubá-lo. SameSite=Strict: o navegador não manda o cookie
   em requisição vinda de outro site, o que já cobre CSRF aqui — a API não
   aceita formulário cross-site nem tem CORS liberado.
   Sem `Secure` de propósito: a VM serve em HTTP na rede interna, e `Secure`
   faria o navegador descartar o cookie. Se um dia entrar HTTPS, acrescente. */
function cookieDeSessao(token){
  const base = `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict`;
  return token ? `${base}; Max-Age=${DURACAO_SESSAO / 1000}` : `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

module.exports = {
  PAPEIS, ErroDeUso,
  criarUsuario, trocarSenha, removerUsuario, listarUsuarios,
  entrar, sair, sessaoDe, exigir,
  lerCookie, cookieDeSessao
};
