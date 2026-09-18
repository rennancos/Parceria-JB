/* Adapter Anthropic (Claude). Traduz o formato interno para a API oficial.

   Endpoints oficiais:
     GET  /v1/models    valida a credencial E lista modelos (grátis)
     POST /v1/messages  geração de texto (paga, na conta do usuário)

   Auth: header x-api-key + anthropic-version (a API exige a versão). A chave
   nunca é logada nem devolvida. O papel 'system' do portal vira o campo
   top-level `system` (Claude não aceita 'system' dentro de messages). */
'use strict';

const { ErroDeUso } = require('../erros');
const { chamar } = require('./rede');

const BASE = 'https://api.anthropic.com/v1';
const VERSAO = '2023-06-01';
const MAX_TOKENS = 1024;

function cabecalhos(chave){
  return { 'x-api-key': chave, 'anthropic-version': VERSAO, 'Content-Type': 'application/json' };
}

function traduzirFalha(res){
  if (res.status === 401 || res.status === 403) return new ErroDeUso('Credencial recusada pelo provedor.', 401);
  return new ErroDeUso('O provedor de IA não conseguiu responder agora.', 502);
}

async function listarModelos(chave){
  const res = await chamar(`${BASE}/models`, { headers: cabecalhos(chave) });
  if (!res.ok) throw traduzirFalha(res);
  const dados = await res.json();
  const lista = Array.isArray(dados && dados.data) ? dados.data : [];
  return lista.map((m) => ({ id: String(m && m.id || '') })).filter((m) => m.id);
}

async function validarCredencial(chave){
  try {
    await listarModelos(chave);
    return { status: 'valida' };
  } catch (erro) {
    if (erro instanceof ErroDeUso && erro.status === 401) return { status: 'invalida', mensagem: erro.message };
    return { status: 'indisponivel', mensagem: 'Não foi possível validar agora.' };
  }
}

async function gerarTexto({ chave, modelo, mensagens, sinal }){
  const sistema = mensagens.filter((m) => m.papel === 'system').map((m) => m.texto).join('\n\n');
  const conversa = mensagens.filter((m) => m.papel !== 'system')
    .map((m) => ({ role: m.papel, content: m.texto }));

  const corpo = Object.assign(
    { model: modelo, max_tokens: MAX_TOKENS, messages: conversa },
    sistema ? { system: sistema } : {}
  );
  const res = await chamar(`${BASE}/messages`, {
    method: 'POST', headers: cabecalhos(chave), body: JSON.stringify(corpo)
  }, sinal);
  if (!res.ok) throw traduzirFalha(res);
  const dados = await res.json();
  const bloco = dados && Array.isArray(dados.content) ? dados.content.find((b) => b.type === 'text') : null;
  if (!bloco || !bloco.text) throw new ErroDeUso('O provedor respondeu sem conteúdo.', 502);
  return { texto: String(bloco.text), modelo };
}

module.exports = { validarCredencial, listarModelos, gerarTexto };
