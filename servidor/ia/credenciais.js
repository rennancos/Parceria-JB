/* Credencial de IA por usuário (BYOK), cifrada em disco.

   Cada pessoa cadastra a PRÓPRIA chave do provedor, e o custo do uso cai na
   conta dela. O portal só guarda e usa — nunca mostra de volta.

   Onde fica: servidor/dados/credenciais-ia.json, uma linha por usuário. A
   pasta inteira já está fora do git (ver .gitignore), e o arquivo nasce 0600.

   Como é guardada: AES-256-GCM com a chave mestra de PAJB_IA_MASTER_KEY. GCM
   é cifra AUTENTICADA: se o arquivo for adulterado ou a chave mestra for
   outra, a abertura falha em vez de devolver lixo silenciosamente.

   O QUE NUNCA SAI DAQUI: a chave em texto puro e o material de cifra
   (ciphertext/iv/authTag). `obter` devolve só provider, selectedModel e
   enabled — é o que a tela precisa. A chave em claro só existe dentro de
   `chaveDe`, chamada por servidor.js no instante de falar com o provedor.

   SEM CHAVE MESTRA o módulo fica indisponível e as rotas /api/ai respondem
   503, sem derrubar o resto do portal. Gerar uma são 32 bytes em hex, pelo
   crypto do próprio Node — ver .env.example.

   TROCAR a chave mestra invalida o que já está salvo: as credenciais viram
   indecifráveis e cada pessoa cadastra a sua de novo (chaveDe devolve 409, e
   não 500). Não há re-cifra automática de propósito — ela exigiria manter as
   duas chaves em memória ao mesmo tempo. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { ErroDeUso } = require('../erros');

const ARQUIVO = path.join(__dirname, '..', 'dados', 'credenciais-ia.json');

const ALGORITMO = 'aes-256-gcm';
const TAM_IV = 12;                 // 96 bits: o tamanho recomendado para GCM
const TAM_CHAVE = 32;              // AES-256

const HEX = /^[0-9a-fA-F]{64}$/;                    // 32 bytes em hexadecimal
const BASE64 = /^[A-Za-z0-9+/]{43}=$|^[A-Za-z0-9+/]{44}$/;   // 32 bytes em base64

/* ---------- Chave mestra ---------- */

/* Aceita hex e base64 porque é o que .env.example promete a quem configura.
   Uma chave em formato inesperado vira `null` — e o portal responde 503 em
   /api/ai, em vez de subir com cifra fraca.

   Lida a CADA operação, e não uma vez no boot: assim trocar a variável vale na
   hora, e o processo não segue com a chave antiga em memória depois de uma
   rotação. Custa validar 64 caracteres por chamada. */
function chaveMestra(){
  const bruto = (process.env.PAJB_IA_MASTER_KEY || '').trim();
  const chave = HEX.test(bruto) ? Buffer.from(bruto, 'hex')
    : BASE64.test(bruto) ? Buffer.from(bruto, 'base64')
    : null;
  // O tamanho é conferido no material já decodificado: base64 mal formado pode
  // passar no formato e render menos de 32 bytes.
  return chave && chave.length === TAM_CHAVE ? chave : null;
}

// servidor.js chama antes de qualquer rota /api/ai: sem chave mestra, 503.
function disponivel(){
  return chaveMestra() !== null;
}

function exigirChaveMestra(){
  const chave = chaveMestra();
  if (!chave) throw new ErroDeUso('Integração de IA não configurada neste servidor.', 503);
  return chave;
}

/* ---------- Cifra ---------- */

/* IV novo a cada gravação: reusar IV com a mesma chave quebra o GCM. */
function cifrar(texto){
  const iv = crypto.randomBytes(TAM_IV);
  const cifra = crypto.createCipheriv(ALGORITMO, exigirChaveMestra(), iv);
  const conteudo = Buffer.concat([cifra.update(String(texto), 'utf8'), cifra.final()]);
  return {
    ciphertext: conteudo.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cifra.getAuthTag().toString('hex')
  };
}

/* Lança se o authTag não bater — chave mestra trocada ou arquivo adulterado.
   Quem chama decide o que fazer com isso; ver chaveDe. */
function decifrar({ ciphertext, iv, authTag }){
  const decifra = crypto.createDecipheriv(ALGORITMO, exigirChaveMestra(), Buffer.from(iv, 'hex'));
  decifra.setAuthTag(Buffer.from(authTag, 'hex'));
  return Buffer.concat([decifra.update(Buffer.from(ciphertext, 'hex')), decifra.final()]).toString('utf8');
}

/* ---------- Arquivo ---------- */

function ler(){
  try {
    const bruto = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
    return Array.isArray(bruto.credenciais) ? bruto.credenciais : [];
  } catch (erro) {
    if (erro.code === 'ENOENT') return [];
    throw erro;
  }
}

/* Grava em .tmp e renomeia: rename é atômico no mesmo volume, então um
   desligamento no meio da escrita não deixa o arquivo pela metade. Mesmo
   padrão de servidor/auth.js. */
function gravar(credenciais){
  fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
  const temporario = ARQUIVO + '.tmp';
  fs.writeFileSync(temporario, JSON.stringify({ credenciais }, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporario, ARQUIVO);
}

function normalizarLogin(valor){
  return String(valor ?? '').trim().toLowerCase();
}

function registroDe(login){
  return ler().find((c) => c.login === login) || null;
}

/* A vista pública do registro. Tudo que responde a uma requisição passa por
   aqui: é o que garante que ciphertext/iv/authTag nunca cheguem à rede. */
function publico(registro){
  if (!registro) return null;
  return {
    provider: registro.provider,
    selectedModel: registro.selectedModel,
    enabled: registro.enabled !== false
  };
}

/* ---------- Operações ---------- */

function obter(login){
  return publico(registroDe(normalizarLogin(login)));
}

/* O dono é sempre quem está na sessão — servidor.js passa sessao.login, nunca
   um id vindo do corpo. Salvar SUBSTITUI: a credencial anterior sai do arquivo
   no mesmo gravar, sem passar por um estado com as duas. */
function salvar(login, { provider, chave, selectedModel }){
  const dono = normalizarLogin(login);
  if (!dono) throw new ErroDeUso('Sessão sem login.', 400);

  const registro = Object.assign(
    { login: dono, provider, selectedModel, enabled: true },
    cifrar(chave),
    { atualizadoEm: new Date().toISOString() }
  );
  gravar(ler().filter((c) => c.login !== dono).concat(registro));
  return publico(registro);
}

/* Troca modelo e/ou enabled sem pedir a credencial de novo. Não toca no
   material de cifra: a chave salva continua a mesma. */
function atualizar(login, mudancas = {}){
  const dono = normalizarLogin(login);
  const credenciais = ler();
  const registro = credenciais.find((c) => c.login === dono);
  if (!registro) throw new ErroDeUso('Configure a credencial deste provedor primeiro.', 400);

  if (mudancas.selectedModel) registro.selectedModel = mudancas.selectedModel;
  if ('enabled' in mudancas) registro.enabled = mudancas.enabled !== false;
  registro.atualizadoEm = new Date().toISOString();

  gravar(credenciais);
  return publico(registro);
}

function remover(login){
  const dono = normalizarLogin(login);
  const credenciais = ler();
  const restantes = credenciais.filter((c) => c.login !== dono);
  if (restantes.length !== credenciais.length) gravar(restantes);
}

/* A chave em claro, só para servidor.js entregar ao adapter na hora da
   chamada. Não fica em memória, não é logada, não volta em resposta. */
function chaveDe(login){
  const registro = registroDe(normalizarLogin(login));
  if (!registro) return null;
  try {
    return decifrar(registro);
  } catch (erro) {
    if (erro instanceof ErroDeUso) throw erro;          // 503: sem chave mestra
    // O registro está lá e íntegro em forma, mas não abre com a chave que este
    // processo tem agora. 409 e não 500: é estado a resolver (cadastrar de
    // novo), não defeito. A mensagem não cita nada do conteúdo.
    throw new ErroDeUso(
      'A credencial salva não abre com a chave atual do servidor. Cadastre a credencial de novo.', 409);
  }
}

module.exports = {
  disponivel, obter, salvar, atualizar, remover, chaveDe,
  cifrar, decifrar        // exportados para os testes de cifra
};
