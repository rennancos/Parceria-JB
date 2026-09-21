/* Adapter OpenAI. Traduz o formato interno do portal para a API oficial da
   OpenAI e de volta. Ninguém fora daqui sabe a URL ou o formato da OpenAI.

   Endpoints oficiais usados:
     GET  /v1/models            valida a credencial E lista modelos (grátis)
     POST /v1/chat/completions  geração de texto (paga, na conta do usuário)

   Auth: Authorization: Bearer <chave>. A chave NUNCA é logada nem devolvida. */
'use strict';

const { ErroDeUso } = require('../erros');
const { chamar } = require('./rede');
const { falhaDoProvedor, validarPor, idsDe } = require('./comum');

const BASE = 'https://api.openai.com/v1';

function autorizacao(chave){
  return { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' };
}

async function listarModelos(chave){
  const res = await chamar(`${BASE}/models`, { headers: autorizacao(chave) });
  if (!res.ok) throw falhaDoProvedor(res);
  const dados = await res.json();
  return idsDe(dados && dados.data);
}

async function gerarTexto({ chave, modelo, mensagens, sinal }){
  const corpo = {
    model: modelo,
    messages: mensagens.map((m) => ({ role: m.papel, content: m.texto }))
  };
  const res = await chamar(`${BASE}/chat/completions`, {
    method: 'POST', headers: autorizacao(chave), body: JSON.stringify(corpo)
  }, sinal);
  if (!res.ok) throw falhaDoProvedor(res);
  const dados = await res.json();
  const texto = dados && dados.choices && dados.choices[0]
    && dados.choices[0].message && dados.choices[0].message.content;
  if (!texto) throw new ErroDeUso('O provedor respondeu sem conteúdo.', 502);
  return { texto: String(texto), modelo };
}

module.exports = { validarCredencial: validarPor(listarModelos), listarModelos, gerarTexto };
