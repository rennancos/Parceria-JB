/* Ataques locais contra servidor real copiado para uma pasta descartável.
   Nenhum dado de produção é lido; junctions apontam apenas para esta fixture. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

test('segurança HTTP com dados descartáveis', async t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pajb-seguranca-'));
  fs.mkdirSync(path.join(base, 'servidor'));
  const origem = process.env.PAJB_TESTE_FONTE || path.resolve(__dirname, '../..');
  for (const f of fs.readdirSync(path.join(origem, 'servidor')).filter(f => f.endsWith('.js')))
    fs.copyFileSync(path.join(origem, 'servidor', f), path.join(base, 'servidor', f));
  for (const dir of ['docs', 'css', 'js', 'privado']) fs.mkdirSync(path.join(base, dir));
  fs.writeFileSync(path.join(base, 'index.html'), '<h1>fixture</h1>');
  fs.writeFileSync(path.join(base, 'privado', 'interno.pdf'), 'fixture privada');
  fs.writeFileSync(path.join(base, 'docs', 'manutencao.md'), 'fixture interna');
  fs.writeFileSync(path.join(base, 'docs', 'manual.pdf'), '%PDF-1.4');
  fs.writeFileSync(path.join(base, 'css', 'styles.css'), 'body{}');
  const auth = require(path.join(base, 'servidor/auth.js'));
  const { servidor } = require(path.join(base, 'servidor/servidor.js'));
  t.after(async () => {
    servidor.closeAllConnections();
    await new Promise(resolve => servidor.close(resolve));
    // Resolve e confere o alvo antes da remoção recursiva no Windows.
    assert.equal(path.dirname(path.resolve(base)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(base).startsWith('pajb-seguranca-'));
    fs.rmSync(base, { recursive: true, force: true });
  });
  auth.criarUsuario({ login: 'editor', nome: 'Fixture', papel: 'equipe', senha: 'senha-ficticia-123' });
  auth.criarUsuario({ login: 'admin', nome: 'Fixture', papel: 'dev', senha: 'senha-ficticia-123' });
  const token = auth.entrar('editor', 'senha-ficticia-123').token;
  const tokenDev = auth.entrar('admin', 'senha-ficticia-123').token;
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  const port = servidor.address().port;
  const origemHttp = `http://127.0.0.1:${port}`;
  const pedir = (alvo, { metodo = 'GET', corpo, headers = {} } = {}) => new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: alvo, method: metodo, headers }, res => {
      const dados = [];
      res.on('data', d => dados.push(d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, corpo: Buffer.concat(dados).toString() }));
    });
    req.on('error', reject); req.end(corpo);
  });
  const headers = { 'X-Portal-Request': '1', 'Content-Type': 'application/json', Cookie: `pajb_sessao=${token}`, Origin: origemHttp };
  const item = JSON.stringify({ bloco: 'manuais', titulo: 'Fixture', href: 'docs/manual.pdf' });

  await t.test('CSRF: escrita cross-origin e formulário simples são recusados', async () => {
    const ataque = await pedir('/api/documentos', { metodo: 'POST', corpo: item, headers: { ...headers, Origin: 'https://outro.example' } });
    assert.equal(ataque.status, 403);
    assert.equal((await pedir('/api/sessao', { metodo: 'POST', corpo: '{}', headers: { 'Content-Type': 'text/plain' } })).status, 403);
    assert.equal((await pedir('/api/documentos', { metodo: 'POST', corpo: item, headers: { ...headers, 'Sec-Fetch-Site': 'same-site' } })).status, 403);
  });
  await t.test('contratos: escrita válida, papéis e autoria definida pelo servidor', async () => {
    const criado = await pedir('/api/documentos', { metodo: 'POST', headers, corpo: JSON.stringify({ ...JSON.parse(item), criadoPor: 'forjado', papel: 'dev' }) });
    assert.equal(criado.status, 201);
    const doc = JSON.parse(criado.corpo).item;
    assert.equal(doc.criadoPor, 'editor');
    assert.equal((await pedir(`/api/documentos/${doc.id}`, { metodo: 'DELETE', headers })).status, 403);
    assert.equal((await pedir(`/api/documentos/${doc.id}`, { metodo: 'DELETE', headers: { ...headers, Cookie: `pajb_sessao=${tokenDev}` } })).status, 200);
  });
  await t.test('entrada malformada: JSON null, cookie e URL retornam 4xx', async () => {
    assert.equal((await pedir('/api/documentos', { metodo: 'POST', headers, corpo: 'null' })).status, 400);
    assert.equal((await pedir('/api/documentos', { metodo: 'POST', headers, corpo: '[]' })).status, 400);
    assert.equal((await pedir('/api/sessao', { headers: { Cookie: 'pajb_sessao=%' } })).status, 400);
    assert.equal((await pedir('/%')).status, 400);
    assert.equal((await pedir('/api/sessao', { headers: { Host: '[' } })).status, 400);
  });
  await t.test('estático: relatórios, caminhos internos e junctions não são públicos', async () => {
    assert.equal((await pedir('/docs/manutencao.md')).status, 403);
    assert.equal((await pedir('/servidor%2Fdados%2Fusuarios.json')).status, 403);
    fs.symlinkSync(path.join(base, 'privado'), path.join(base, 'docs', 'atalho'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.equal((await pedir('/docs/atalho/interno.pdf')).status, 403);
    assert.equal((await pedir('/css/styles.css')).status, 200);
  });
  await t.test('cabeçalhos: CSP, anti-framing, nosniff e download como anexo', async () => {
    const pagina = await pedir('/');
    assert.match(pagina.headers['content-security-policy'] || '', /script-src 'self'/);
    assert.equal(pagina.headers['x-content-type-options'], 'nosniff');
    assert.equal(pagina.headers['x-frame-options'], 'DENY');
    assert.match((await pedir('/docs/manual.pdf')).headers['content-disposition'] || '', /^attachment/);
  });
  await t.test('sessão perde privilégio após alteração de papel no disco', () => {
    const arquivo = path.join(base, 'servidor/dados/usuarios.json');
    const usuarios = JSON.parse(fs.readFileSync(arquivo));
    usuarios.usuarios.find(u => u.login === 'admin').papel = 'equipe';
    fs.writeFileSync(arquivo, JSON.stringify(usuarios));
    assert.equal(auth.sessaoDe(tokenDev), null);
  });
  await t.test('limite do body responde 413 sem derrubar o serviço', async () => {
    assert.equal((await pedir('/api/documentos', { metodo: 'POST', headers, corpo: 'x'.repeat(65537) })).status, 413);
    assert.equal((await pedir('/')).status, 200);
  });
  await t.test('upload recusa extensão executável e junction como pasta docs', async () => {
    assert.equal((await pedir('/api/arquivos?nome=teste.exe', { metodo: 'POST', headers, corpo: 'fixture' })).status, 400);
    fs.renameSync(path.join(base, 'docs'), path.join(base, 'docs-original'));
    fs.symlinkSync(path.join(base, 'privado'), path.join(base, 'docs'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.equal((await pedir('/api/arquivos?nome=novo.pdf', { metodo: 'POST', headers, corpo: '%PDF-1.4' })).status, 403);
    assert.equal(fs.existsSync(path.join(base, 'privado', 'novo.pdf')), false);
  });
  await t.test('limite por origem de rede impede alternância ilimitada de logins', async () => {
    let ultima;
    for (let i = 0; i < 25; i++) ultima = await pedir('/api/sessao', { metodo: 'POST', headers, corpo: JSON.stringify({ login: `inexistente-${i}`, senha: 'incorreta' }) });
    assert.equal(ultima.status, 429);
  });
});
