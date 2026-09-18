/* Segurança e correção da integração multi-IA BYOK.

   Roda contra uma RAIZ falsa em %TEMP% (servidor/ e servidor/ia/ copiados) com
   usuários fake e o provedor 'mock' (PAJB_IA_MOCK=1) — NENHUMA API paga é
   chamada (requisito 17). Cobre os 17 testes obrigatórios do pedido; onde um
   requisito não se aplica a este projeto (multi-tenant), o teste registra o
   porquê e verifica a fronteira real equivalente (isolamento por usuário). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');

const raizReal = path.resolve(__dirname, '../..');
const CHAVE_A = crypto.randomBytes(32).toString('hex');
const CHAVE_B = crypto.randomBytes(32).toString('hex');

// Precisa valer antes de qualquer require dos módulos de IA.
process.env.PAJB_IA_MASTER_KEY = CHAVE_A;
process.env.PAJB_IA_MOCK = '1';

const falsa = fs.mkdtempSync(path.join(os.tmpdir(), 'pajb-byok-'));
fs.mkdirSync(path.join(falsa, 'servidor', 'ia'), { recursive: true });
fs.mkdirSync(path.join(falsa, 'servidor', 'dados'), { recursive: true });
fs.mkdirSync(path.join(falsa, 'css'), { recursive: true });
for (const f of fs.readdirSync(path.join(raizReal, 'servidor')).filter((f) => f.endsWith('.js')))
  fs.copyFileSync(path.join(raizReal, 'servidor', f), path.join(falsa, 'servidor', f));
for (const f of fs.readdirSync(path.join(raizReal, 'servidor', 'ia')).filter((f) => f.endsWith('.js')))
  fs.copyFileSync(path.join(raizReal, 'servidor', 'ia', f), path.join(falsa, 'servidor', 'ia', f));
fs.writeFileSync(path.join(falsa, 'index.html'), '<h1>fixture</h1>');
fs.writeFileSync(path.join(falsa, 'css', 'pagina.css'), 'body{}');

const auth = require(path.join(falsa, 'servidor', 'auth.js'));
const cred = require(path.join(falsa, 'servidor', 'ia', 'credenciais.js'));
const ARQUIVO_CRED = path.join(falsa, 'servidor', 'dados', 'credenciais-ia.json');
const { servidor } = require(path.join(falsa, 'servidor', 'servidor.js'));

test('IA BYOK numa raiz descartável, só com o provedor mock', async (t) => {
  auth.criarUsuario({ login: 'editor', nome: 'Ed', papel: 'equipe', senha: 'senha-ficticia-123' });
  auth.criarUsuario({ login: 'chefe', nome: 'Ch', papel: 'dev', senha: 'senha-ficticia-123' });
  const tEd = auth.entrar('editor', 'senha-ficticia-123').token;
  const tCh = auth.entrar('chefe', 'senha-ficticia-123').token;

  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const port = servidor.address().port;
  const origem = `http://127.0.0.1:${port}`;

  t.after(async () => {
    servidor.closeAllConnections && servidor.closeAllConnections();
    await new Promise((r) => servidor.close(r));
    assert.equal(path.dirname(path.resolve(falsa)), path.resolve(os.tmpdir()));
    fs.rmSync(falsa, { recursive: true, force: true });
  });

  const pedir = (alvo, { metodo = 'GET', corpo, token, semPortal } = {}) => new Promise((ok, no) => {
    const headers = { 'Content-Type': 'application/json', Origin: origem };
    if (!semPortal) headers['X-Portal-Request'] = '1';
    if (token) headers.Cookie = `pajb_sessao=${token}`;
    const req = http.request({ host: '127.0.0.1', port, path: alvo, method: metodo, headers }, (res) => {
      const d = [];
      res.on('data', (x) => d.push(x));
      res.on('end', () => ok({ status: res.statusCode, headers: res.headers, corpo: Buffer.concat(d).toString() }));
    });
    req.on('error', no);
    req.end(corpo);
  });
  const hEd = { token: tEd };

  // 12. Sem autenticação é bloqueado.
  await t.test('12 · sem sessão, toda rota /api/ai é 401', async () => {
    assert.equal((await pedir('/api/ai/providers')).status, 401);
    assert.equal((await pedir('/api/ai/settings')).status, 401);
    assert.equal((await pedir('/api/ai/chat', { metodo: 'POST', corpo: '{}' })).status, 401);
  });

  // 10. Provedor inválido rejeitado.
  await t.test('10 · provedor fora da allowlist é 400', async () => {
    const r = await pedir('/api/ai/settings/test', { metodo: 'POST', token: tEd, corpo: JSON.stringify({ provider: 'pirata', chave: 'x' }) });
    assert.equal(r.status, 400);
  });

  // Testar conexão: válida devolve modelos; inválida e indisponível se diferenciam.
  await t.test('teste diferencia válida / inválida / indisponível (sem salvar)', async () => {
    const boa = await pedir('/api/ai/settings/test', { metodo: 'POST', token: tEd, corpo: JSON.stringify({ provider: 'mock', chave: 'mock-ok-1' }) });
    assert.equal(JSON.parse(boa.corpo).status, 'valida');
    assert.deepEqual(JSON.parse(boa.corpo).modelos, ['mock-rapido', 'mock-esperto']);
    const ma = await pedir('/api/ai/settings/test', { metodo: 'POST', token: tEd, corpo: JSON.stringify({ provider: 'mock', chave: 'mock-invalida-1' }) });
    assert.equal(JSON.parse(ma.corpo).status, 'invalida');
    const ind = await pedir('/api/ai/settings/test', { metodo: 'POST', token: tEd, corpo: JSON.stringify({ provider: 'mock', chave: 'zzz' }) });
    assert.equal(JSON.parse(ind.corpo).status, 'indisponivel');
    // não salvou nada ao testar (requisito 4)
    assert.equal(cred.obter('editor'), null);
  });

  // 11. Modelo não permitido rejeitado (ao salvar).
  await t.test('11 · salvar com modelo fora da allowlist é 400', async () => {
    const r = await pedir('/api/ai/settings', { metodo: 'PUT', token: tEd, corpo: JSON.stringify({ provider: 'mock', chave: 'mock-ok-1', selectedModel: 'gpt-proibido' }) });
    assert.equal(r.status, 400);
  });

  // Salvar credencial válida e ler config (3 · nunca vaza a chave).
  await t.test('salvar credencial válida; GET não traz a chave nem ciphertext', async () => {
    const put = await pedir('/api/ai/settings', { metodo: 'PUT', token: tEd, corpo: JSON.stringify({ provider: 'mock', chave: 'mock-ok-SEGREDO', selectedModel: 'mock-rapido' }) });
    assert.equal(put.status, 200);
    const cfg = JSON.parse(put.corpo).configuracao;
    assert.equal(cfg.provider, 'mock');
    assert.equal(cfg.selectedModel, 'mock-rapido');
    assert.equal(cfg.enabled, true);
    // 3 · a resposta não contém a chave nem material de cifra
    assert.equal(/mock-ok-SEGREDO|ciphertext|authTag/.test(put.corpo), false);
    const get = await pedir('/api/ai/settings', { token: tEd });
    assert.equal(/mock-ok-SEGREDO|ciphertext|authTag/.test(get.corpo), false);
  });

  // 6. Credencial cifrada no disco (não aparece em texto puro).
  await t.test('6 · credencial no arquivo está cifrada (AES-256-GCM)', () => {
    const bruto = fs.readFileSync(ARQUIVO_CRED, 'utf8');
    assert.equal(bruto.includes('mock-ok-SEGREDO'), false);       // texto puro não está lá
    const reg = JSON.parse(bruto).credenciais[0];
    assert.ok(reg.ciphertext && reg.iv && reg.authTag);           // material GCM está
    assert.equal('chave' in reg || 'key' in reg, false);
  });

  // 1 e 2. Isolamento por usuário. (Tenant: N/A neste projeto mono-organização;
  // a fronteira real é o usuário, testada aqui.)
  await t.test('1/2 · um usuário não enxerga a config de outro', async () => {
    const doChefe = await pedir('/api/ai/settings', { token: tCh });
    assert.equal(JSON.parse(doChefe.corpo).configuracao, null);   // chefe não vê a do editor
    // e não existe parâmetro para pedir a de outro: o dono é sempre a sessão
    await pedir('/api/ai/settings', { metodo: 'PUT', token: tCh, corpo: JSON.stringify({ provider: 'mock', chave: 'mock-ok-DoChefe', selectedModel: 'mock-esperto' }) });
    assert.equal(cred.chaveDe('editor'), 'mock-ok-SEGREDO');       // não se misturaram
    assert.equal(cred.chaveDe('chefe'), 'mock-ok-DoChefe');
  });

  // 8. Trocar a credencial invalida a anterior.
  await t.test('8 · substituir a credencial descarta a anterior', async () => {
    await pedir('/api/ai/settings', { metodo: 'PUT', token: tEd, corpo: JSON.stringify({ provider: 'mock', chave: 'mock-ok-NOVA', selectedModel: 'mock-rapido' }) });
    assert.equal(cred.chaveDe('editor'), 'mock-ok-NOVA');
    const linhas = JSON.parse(fs.readFileSync(ARQUIVO_CRED, 'utf8')).credenciais.filter((c) => c.login === 'editor');
    assert.equal(linhas.length, 1);                                // uma linha por usuário
  });

  // Chat feliz.
  await t.test('chat responde usando o modelo salvo', async () => {
    const r = await pedir('/api/ai/chat', { metodo: 'POST', token: tEd, corpo: JSON.stringify({ mensagens: [{ papel: 'user', texto: 'oi' }] }) });
    assert.equal(r.status, 200);
    assert.match(JSON.parse(r.corpo).resposta, /mock\(mock-rapido\): oi/);
    assert.match(r.headers['content-type'], /application\/json/);  // 16 · resposta é JSON, não HTML
  });

  // Desabilitar temporariamente.
  await t.test('desabilitar bloqueia o chat (409) sem apagar a credencial', async () => {
    await pedir('/api/ai/settings', { metodo: 'PUT', token: tEd, corpo: JSON.stringify({ provider: 'mock', selectedModel: 'mock-rapido', enabled: false }) });
    const r = await pedir('/api/ai/chat', { metodo: 'POST', token: tEd, corpo: JSON.stringify({ mensagens: [{ papel: 'user', texto: 'oi' }] }) });
    assert.equal(r.status, 409);
    await pedir('/api/ai/settings', { metodo: 'PUT', token: tEd, corpo: JSON.stringify({ provider: 'mock', selectedModel: 'mock-rapido', enabled: true }) });
  });

  // 4 e 5. Logs e erros não contêm a chave.
  await t.test('4/5 · logs e erros nunca contêm a credencial', async () => {
    const original = console.log;
    const capturado = [];
    console.log = (...a) => capturado.push(a.join(' '));
    try {
      await pedir('/api/ai/chat', { metodo: 'POST', token: tEd, corpo: JSON.stringify({ mensagens: [{ papel: 'user', texto: 'oi' }] }) });
    } finally { console.log = original; }
    assert.equal(capturado.some((l) => l.includes('mock-ok-NOVA')), false);
    // erro de credencial recusada não devolve a chave
    const ruim = await pedir('/api/ai/settings', { metodo: 'PUT', token: tEd, corpo: JSON.stringify({ provider: 'mock', chave: 'mock-invalida-x', selectedModel: 'mock-rapido' }) });
    assert.equal(ruim.status, 400);
    assert.equal(ruim.corpo.includes('mock-invalida-x'), false);
  });

  // 13. Rate limiting.
  await t.test('13 · rate limit por usuário responde 429', async () => {
    let ult;
    for (let i = 0; i < 32; i++)
      ult = await pedir('/api/ai/settings/test', { metodo: 'POST', token: tCh, corpo: JSON.stringify({ provider: 'mock', chave: 'mock-ok-rl' }) });
    assert.equal(ult.status, 429);
  });

  // 15. Streaming pode ser cancelado (cliente desiste no meio).
  await t.test('15 · stream cancelado no meio não derruba o servidor', async () => {
    await new Promise((resolve) => {
      const req = http.request({
        host: '127.0.0.1', port, path: '/api/ai/chat', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Portal-Request': '1', Origin: origem, Cookie: `pajb_sessao=${tEd}` }
      }, (res) => {
        res.once('data', () => req.destroy());     // recebeu o 1º pedaço e abortou
        res.on('error', () => {});
        res.on('close', resolve);
      });
      req.on('error', () => resolve());
      req.end(JSON.stringify({ stream: true, mensagens: [{ papel: 'user', texto: 'um dois tres quatro cinco' }] }));
    });
    // servidor segue vivo depois do cancelamento
    const vivo = await pedir('/api/ai/providers', { token: tEd });
    assert.equal(vivo.status, 200);
  });

  // 9. Exclusão remove a credencial.
  await t.test('9 · DELETE remove a credencial do disco', async () => {
    const r = await pedir('/api/ai/settings/credential', { metodo: 'DELETE', token: tEd });
    assert.equal(r.status, 200);
    assert.equal(cred.obter('editor'), null);
    const linhas = JSON.parse(fs.readFileSync(ARQUIVO_CRED, 'utf8')).credenciais.filter((c) => c.login === 'editor');
    assert.equal(linhas.length, 0);
  });
});

// 7. Chave mestra errada não descriptografa (cifra autenticada).
test('7 · chave mestra errada não decifra (AES-GCM autenticado)', () => {
  process.env.PAJB_IA_MASTER_KEY = CHAVE_A;
  const enc = cred.cifrar('segredo-abc');
  assert.equal(cred.decifrar(enc), 'segredo-abc');
  process.env.PAJB_IA_MASTER_KEY = CHAVE_B;
  assert.throws(() => cred.decifrar(enc));           // authTag não bate
  process.env.PAJB_IA_MASTER_KEY = CHAVE_A;          // restaura para os demais testes
});

// 14. Timeout: sinal já abortado é propagado como AbortError pela camada de rede.
test('14 · rede propaga cancelamento/timeout como aborto', async () => {
  // Do repo real: a fixture já foi removida pela limpeza do teste anterior, e
  // rede.js é independente (só depende de ../erros).
  const { chamar } = require(path.join(raizReal, 'servidor', 'ia', 'rede.js'));
  const ac = new AbortController();
  ac.abort();
  await assert.rejects(() => chamar('https://exemplo.invalido/x', {}, ac.signal), (e) => e.name === 'AbortError');
});
