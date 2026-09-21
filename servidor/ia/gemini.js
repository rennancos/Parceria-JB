/* Adapter Google Gemini. Traduz o formato interno para a API oficial.

   Endpoints oficiais (Generative Language API):
     GET  /v1beta/models                    valida a credencial E lista (grátis)
     POST /v1beta/models/<modelo>:generateContent   geração de texto (paga)

   Auth: API key em query param ?key=<chave> (padrão oficial do Gemini). A chave
   nunca é logada nem devolvida, e nunca aparece em erro. Papel 'assistant' vira
   'model'; 'system' vira systemInstruction. Os nomes vêm como 'models/gemini-…',
   normalizados para o id curto. */
'use strict';

const { ErroDeUso } = require('../erros');
const { chamar } = require('./rede');
const { falhaDoProvedor, validarPor, idsDe } = require('./comum');

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/* 400 entra na lista: o Gemini responde 400 (e não 401) para chave inválida. */
const STATUS_DE_CREDENCIAL = [400, 401, 403];

function idCurto(nome){
  return String(nome || '').replace(/^models\//, '');
}

async function listarModelos(chave){
  const res = await chamar(`${BASE}/models?key=${encodeURIComponent(chave)}`);
  if (!res.ok) throw falhaDoProvedor(res, STATUS_DE_CREDENCIAL);
  const dados = await res.json();
  const lista = Array.isArray(dados && dados.models) ? dados.models : [];
  return idsDe(
    lista.filter((m) => !Array.isArray(m.supportedGenerationMethods)
      || m.supportedGenerationMethods.includes('generateContent')),
    (m) => idCurto(m && m.name)
  );
}

async function gerarTexto({ chave, modelo, mensagens, sinal }){
  const sistema = mensagens.filter((m) => m.papel === 'system').map((m) => m.texto).join('\n\n');
  const contents = mensagens.filter((m) => m.papel !== 'system').map((m) => ({
    role: m.papel === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.texto }]
  }));

  const corpo = Object.assign(
    { contents },
    sistema ? { systemInstruction: { parts: [{ text: sistema }] } } : {}
  );
  const url = `${BASE}/models/${encodeURIComponent(modelo)}:generateContent?key=${encodeURIComponent(chave)}`;
  const res = await chamar(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo)
  }, sinal);
  if (!res.ok) throw falhaDoProvedor(res, STATUS_DE_CREDENCIAL);
  const dados = await res.json();
  const cand = dados && Array.isArray(dados.candidates) ? dados.candidates[0] : null;
  const partes = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts : [];
  const texto = partes.map((p) => p && p.text ? p.text : '').join('').trim();
  if (!texto) throw new ErroDeUso('O provedor respondeu sem conteúdo.', 502);
  return { texto, modelo };
}

module.exports = { validarCredencial: validarPor(listarModelos), listarModelos, gerarTexto };
