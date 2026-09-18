/* Comportamento em runtime dos adapters REAIS (OpenAI, Anthropic, Gemini).

   Prova o que a revisão apontou como não comprovado: construção do request
   (URL, método, headers, corpo), parsing da resposta oficial, e o mapeamento de
   erro — SEM API paga e SEM chave real. O `globalThis.fetch` é stubado; os
   módulos são os de PRODUÇÃO (require direto de servidor/ia/, não cópia de
   fixture), então é o código que roda no servidor que está sendo exercitado.

   Inclui o teste negativo de vazamento: se o provedor devolver um corpo de erro
   com algo parecido com segredo, ele NÃO pode aparecer no erro que sobe. */
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const openai = require('../../servidor/ia/openai.js');
const anthropic = require('../../servidor/ia/anthropic.js');
const gemini = require('../../servidor/ia/gemini.js');
const registro = require('../../servidor/ia/registro.js');

let chamadas;
let fetchOriginal;

beforeEach(() => { fetchOriginal = globalThis.fetch; chamadas = []; });
afterEach(() => { globalThis.fetch = fetchOriginal; });

// Response falsa mínima: os adapters usam só res.ok / res.status / res.json().
function resp(status, corpo){
  return { ok: status >= 200 && status < 300, status, json: async () => corpo };
}
function stub(resposta){
  globalThis.fetch = async (url, opcoes) => {
    chamadas.push({ url, opcoes: opcoes || {} });
    return typeof resposta === 'function' ? resposta(url, opcoes) : resposta;
  };
}
function corpoEnviado(){ return JSON.parse(chamadas[0].opcoes.body); }

const UM_USER = [{ papel: 'user', texto: 'oi' }];

/* ===================== OpenAI ===================== */

test('OpenAI · listarModelos usa GET /v1/models com Bearer e faz parse', async () => {
  stub(resp(200, { data: [{ id: 'gpt-4o' }, { id: 'text-embedding-3' }] }));
  const modelos = await openai.listarModelos('sk-abc');
  assert.equal(chamadas[0].url, 'https://api.openai.com/v1/models');
  assert.equal(chamadas[0].opcoes.headers.Authorization, 'Bearer sk-abc');
  assert.deepEqual(modelos, [{ id: 'gpt-4o' }, { id: 'text-embedding-3' }]);
});

test('OpenAI · gerarTexto POST /chat/completions, mapeia papel→role e lê choices', async () => {
  stub(resp(200, { choices: [{ message: { content: 'resposta' } }] }));
  const r = await openai.gerarTexto({ chave: 'sk-abc', modelo: 'gpt-4o', mensagens: [{ papel: 'user', texto: 'x' }] });
  assert.equal(chamadas[0].url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(chamadas[0].opcoes.method, 'POST');
  assert.deepEqual(corpoEnviado(), { model: 'gpt-4o', messages: [{ role: 'user', content: 'x' }] });
  assert.deepEqual(r, { texto: 'resposta', modelo: 'gpt-4o' });
});

test('OpenAI · 401 → ErroDeUso 401; 500 → 502; sem conteúdo → 502', async () => {
  stub(resp(401, {}));
  await assert.rejects(() => openai.listarModelos('sk-x'), (e) => e.status === 401);
  stub(resp(500, {}));
  await assert.rejects(() => openai.listarModelos('sk-x'), (e) => e.status === 502);
  stub(resp(200, { choices: [{ message: { content: '' } }] }));
  await assert.rejects(() => openai.gerarTexto({ chave: 'sk-x', modelo: 'gpt-4o', mensagens: UM_USER }), (e) => e.status === 502);
});

test('OpenAI · validarCredencial classifica valida/invalida/indisponivel', async () => {
  stub(resp(200, { data: [] }));
  assert.equal((await openai.validarCredencial('sk')).status, 'valida');
  stub(resp(401, {}));
  assert.equal((await openai.validarCredencial('sk')).status, 'invalida');
  stub(resp(503, {}));
  assert.equal((await openai.validarCredencial('sk')).status, 'indisponivel');
});

/* ===================== Anthropic ===================== */

test('Anthropic · listarModelos usa x-api-key + anthropic-version', async () => {
  stub(resp(200, { data: [{ id: 'claude-opus-5' }] }));
  const modelos = await anthropic.listarModelos('key-abc');
  assert.equal(chamadas[0].url, 'https://api.anthropic.com/v1/models');
  assert.equal(chamadas[0].opcoes.headers['x-api-key'], 'key-abc');
  assert.equal(chamadas[0].opcoes.headers['anthropic-version'], '2023-06-01');
  assert.deepEqual(modelos, [{ id: 'claude-opus-5' }]);
});

test('Anthropic · gerarTexto extrai system, manda max_tokens e lê content[text]', async () => {
  stub(resp(200, { content: [{ type: 'text', text: 'ola' }] }));
  const r = await anthropic.gerarTexto({
    chave: 'key', modelo: 'claude-opus-5',
    mensagens: [{ papel: 'system', texto: 'seja breve' }, { papel: 'user', texto: 'x' }]
  });
  assert.equal(chamadas[0].url, 'https://api.anthropic.com/v1/messages');
  const corpo = corpoEnviado();
  assert.equal(corpo.system, 'seja breve');                 // system top-level
  assert.equal(corpo.max_tokens, 1024);
  assert.deepEqual(corpo.messages, [{ role: 'user', content: 'x' }]);  // system fora de messages
  assert.deepEqual(r, { texto: 'ola', modelo: 'claude-opus-5' });
});

test('Anthropic · 401 → 401; sem bloco de texto → 502', async () => {
  stub(resp(401, {}));
  await assert.rejects(() => anthropic.listarModelos('k'), (e) => e.status === 401);
  stub(resp(200, { content: [{ type: 'tool_use' }] }));
  await assert.rejects(() => anthropic.gerarTexto({ chave: 'k', modelo: 'claude-opus-5', mensagens: UM_USER }), (e) => e.status === 502);
});

/* ===================== Gemini ===================== */

test('Gemini · listarModelos manda ?key=, filtra por generateContent e normaliza o id', async () => {
  stub(resp(200, { models: [
    { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/embed-1', supportedGenerationMethods: ['embedContent'] }
  ] }));
  const modelos = await gemini.listarModelos('AIza-abc');
  assert.match(chamadas[0].url, /\/v1beta\/models\?key=AIza-abc$/);
  assert.deepEqual(modelos, [{ id: 'gemini-2.5-flash' }]);   // 'models/' removido, embed filtrado
});

test('Gemini · gerarTexto mapeia assistant→model, systemInstruction e lê candidates', async () => {
  stub(resp(200, { candidates: [{ content: { parts: [{ text: 'oi' }] } }] }));
  const r = await gemini.gerarTexto({
    chave: 'AIza', modelo: 'gemini-2.5-flash',
    mensagens: [{ papel: 'system', texto: 'contexto' }, { papel: 'assistant', texto: 'ola' }, { papel: 'user', texto: 'x' }]
  });
  assert.match(chamadas[0].url, /\/models\/gemini-2\.5-flash:generateContent\?key=AIza$/);
  const corpo = corpoEnviado();
  assert.equal(corpo.systemInstruction.parts[0].text, 'contexto');
  assert.deepEqual(corpo.contents, [
    { role: 'model', parts: [{ text: 'ola' }] },             // assistant→model
    { role: 'user', parts: [{ text: 'x' }] }
  ]);
  assert.deepEqual(r, { texto: 'oi', modelo: 'gemini-2.5-flash' });
});

test('Gemini · 400/401/403 → 401; sem partes → 502', async () => {
  for (const s of [400, 401, 403]){
    stub(resp(s, {}));
    await assert.rejects(() => gemini.listarModelos('AIza'), (e) => e.status === 401);
  }
  stub(resp(200, { candidates: [{ content: { parts: [] } }] }));
  await assert.rejects(() => gemini.gerarTexto({ chave: 'AIza', modelo: 'gemini-2.5-flash', mensagens: UM_USER }), (e) => e.status === 502);
});

/* ===================== Rede fora + vazamento ===================== */

test('Falha de rede vira ErroDeUso indisponível (503), não exceção crua', async () => {
  globalThis.fetch = async () => { throw new Error('ECONNREFUSED'); };
  await assert.rejects(() => openai.listarModelos('sk'), (e) => e.status === 503);
  await assert.rejects(() => anthropic.gerarTexto({ chave: 'k', modelo: 'claude-opus-5', mensagens: UM_USER }), (e) => e.status === 503);
});

test('NEGATIVO · corpo de erro do provedor com cara de segredo NUNCA sobe no erro', async () => {
  const veneno = 'sk-VAZAMENTO-SEGREDO-123 AIzaVAZOU api_key=NAO_PODE';
  for (const [nome, fn] of [
    ['openai', () => openai.gerarTexto({ chave: 'sk-x', modelo: 'gpt-4o', mensagens: UM_USER })],
    ['anthropic', () => anthropic.gerarTexto({ chave: 'k', modelo: 'claude-opus-5', mensagens: UM_USER })],
    ['gemini', () => gemini.gerarTexto({ chave: 'AIza', modelo: 'gemini-2.5-flash', mensagens: UM_USER })]
  ]){
    stub(resp(500, { error: { message: veneno }, detail: veneno }));
    await assert.rejects(fn, (e) => {
      assert.equal(String(e.message).includes('VAZAMENTO'), false, `${nome} vazou o corpo do provedor`);
      assert.equal(String(e.message).includes('AIzaVAZOU'), false, `${nome} vazou chave-like`);
      return true;
    });
  }
});

/* ===================== M2 · mock fora de produção ===================== */

test('M2 · mock só entra no catálogo com PAJB_IA_MOCK=1 e NUNCA em produção', () => {
  const envMock = process.env.PAJB_IA_MOCK;
  const envNode = process.env.NODE_ENV;
  try {
    process.env.PAJB_IA_MOCK = '1';
    process.env.NODE_ENV = 'production';
    assert.equal(registro.ehProvedor('mock'), false);
    assert.equal(registro.publico().some((p) => p.id === 'mock'), false);

    process.env.NODE_ENV = 'development';
    assert.equal(registro.ehProvedor('mock'), true);

    delete process.env.PAJB_IA_MOCK;
    assert.equal(registro.ehProvedor('mock'), false);
  } finally {
    if (envMock === undefined) delete process.env.PAJB_IA_MOCK; else process.env.PAJB_IA_MOCK = envMock;
    if (envNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = envNode;
  }
});
