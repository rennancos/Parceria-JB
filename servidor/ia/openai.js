/* Adapter OpenAI. Traduz o formato interno do portal para a API oficial da
   OpenAI e de volta. Ninguém fora daqui sabe a URL ou o formato da OpenAI.

   Endpoints oficiais usados:
     GET  /v1/models            valida a credencial E lista modelos (grátis)
     POST /v1/chat/completions  geração de texto (paga, na conta do usuário)

   Auth: Authorization: Bearer <chave>. A chave NUNCA é logada nem devolvida. */
'use strict';

const { ErroDeUso } = require('../erros');
const { chamar } = require('./rede');

const BASE = 'https://api.openai.com/v1';

function autorizacao(chave){
  return { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' };
}

// Erro do provedor -> ErroDeUso sanitizado. 401/403 = credencial; resto = 502.
function traduzirFalha(res){
  if (res.status === 401 || res.status === 403) return new ErroDeUso('Credencial recusada pelo provedor.', 401);
  return new ErroDeUso('O provedor de IA não conseguiu responder agora.', 502);
}

async function listarModelos(chave){
  const res = await chamar(`${BASE}/models`, { headers: autorizacao(chave) });
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
  const corpo = {
    model: modelo,
    messages: mensagens.map((m) => ({ role: m.papel, content: m.texto }))
  };
  const res = await chamar(`${BASE}/chat/completions`, {
    method: 'POST', headers: autorizacao(chave), body: JSON.stringify(corpo)
  }, sinal);
  if (!res.ok) throw traduzirFalha(res);
  const dados = await res.json();
  const texto = dados && dados.choices && dados.choices[0]
    && dados.choices[0].message && dados.choices[0].message.content;
  if (!texto) throw new ErroDeUso('O provedor respondeu sem conteúdo.', 502);
  return { texto: String(texto), modelo };
}

module.exports = { validarCredencial, listarModelos, gerarTexto };
