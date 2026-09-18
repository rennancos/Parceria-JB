/* Runtime Electron simulado, rede HTTP local real. Nunca chama instalar(). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const crypto = require('node:crypto');

test('segurança da atualização com servidor descartável', async t => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'pajb-update-security-'));
  const bytes = Buffer.from('instalador ficticio, nunca executado');
  let modo = 'normal', downloads = 0;
  const manifesto = { versao: '9.9.9', arquivo: 'fixture.exe', tamanho: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  const servidor = http.createServer((req, res) => {
    if (req.url === '/fixture.exe'){
      downloads++;
      if (modo === 'redirect-download'){ res.writeHead(302, { Location: '/destino.exe' }); return res.end(); }
      return res.end(bytes);
    }
    if (req.url === '/destino.exe') return res.end(bytes);
    if (modo === 'redirect' && req.url !== '/final.json'){ res.writeHead(302, { Location: '/final.json' }); return res.end(); }
    if (modo === 'grande') return res.end(JSON.stringify({ ...manifesto, extra: 'x'.repeat(70000) }));
    if (modo === 'lento'){
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.flushHeaders();
      return setTimeout(() => res.end(JSON.stringify(manifesto)), 400);
    }
    res.end(JSON.stringify(manifesto));
  });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    servidor.closeAllConnections(); await new Promise(resolve => servidor.close(resolve));
    assert.equal(path.dirname(path.resolve(pasta)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(pasta).startsWith('pajb-update-security-'));
    fs.rmSync(pasta, { recursive: true, force: true });
  });
  const origem = `http://127.0.0.1:${servidor.address().port}/`;
  function carregar(empacotado = false){
    const fonte = path.join(process.env.PAJB_TESTE_FONTE || path.resolve(__dirname, '../..'), 'app/atualizacao.js');
    const contexto = { module: { exports: {} }, Buffer, URL, AbortController, console,
      process: { env: { PAJB_ORIGEM: origem } },
      // Acelera só o cenário lento; o primeiro fetch pode levar mais de 100 ms.
      setTimeout: (fn, ms) => setTimeout(fn, ms === 10000 && modo === 'lento' ? 100 : ms), clearTimeout,
      require: nome => nome === 'electron' ? { app: { isPackaged: empacotado, getPath: () => pasta, getVersion: () => '1.0.0' }, net: { fetch } } : require(nome) };
    vm.runInNewContext(fs.readFileSync(fonte, 'utf8'), contexto, { filename: fonte });
    return contexto.module.exports;
  }
  const atualizacao = carregar();
  await t.test('cache adulterado é descartado e baixado novamente', async () => {
    const info = await atualizacao.verificar();
    const destino = await atualizacao.baixar(info);
    fs.writeFileSync(destino, 'adulterado');
    const antes = downloads;
    assert.equal(await atualizacao.baixar(info), destino);
    assert.deepEqual(fs.readFileSync(destino), bytes);
    assert.equal(downloads, antes + 1);
  });
  await t.test('redirect do manifesto é recusado', async () => {
    modo = 'redirect'; await assert.rejects(atualizacao.verificar()); modo = 'normal';
  });
  await t.test('manifesto tem limite de bytes', async () => {
    modo = 'grande'; await assert.rejects(atualizacao.verificar(), /grande|limite/i); modo = 'normal';
  });
  await t.test('timeout também cobre corpo após cabeçalhos', async () => {
    modo = 'lento'; await assert.rejects(atualizacao.verificar(), /demorou/i); modo = 'normal';
  });
  await t.test('URL HTTP não local é recusada antes do download', async () => {
    await assert.rejects(atualizacao.baixar({ ...manifesto, arquivo: 'http://example.invalid/fixture.exe' }), /HTTPS/i);
  });
  await t.test('redirect do download é recusado mesmo com hash correto', async () => {
    modo = 'normal'; const info = await atualizacao.verificar();
    fs.rmSync(path.join(atualizacao.PASTA_TEMP, 'Parceria-JB-9.9.9.exe'), { force: true });
    modo = 'redirect-download'; await assert.rejects(atualizacao.baixar(info)); modo = 'normal';
  });
});
