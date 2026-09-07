const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { navegador } = require('./helpers/navegador.cjs');
const { raiz, adiado } = require('./helpers/portal.cjs');

test('portal no navegador real, com API simulada e dados descartáveis', { timeout: 120000 }, async t => {
  let modo = 'normal', autenticado = true, upload = null;
  const gravacoes = [], itens = [];
  const blocos = ['processos-politicas', 'padroes-modelos', 'manuais'].map(chave => ({ chave, rotulo: chave }));
  const servidor = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')){
        const json = (status, corpo) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(corpo)); };
        if (modo === 'estatico'){ res.writeHead(404); res.end('Sem API'); return; }
        if (url.pathname === '/api/sessao'){
          if (req.method === 'POST'){ autenticado = true; modo = 'normal'; }
          if (req.method === 'DELETE') autenticado = false;
          json(200, autenticado ? { autenticado: true, nome: 'Teste', login: 'teste', papel: 'dev' } : { autenticado: false }); return;
        }
        if (req.method === 'GET'){ json(200, { itens, blocos }); return; }
        if (modo === 'expirado'){ autenticado = false; json(401, { erro: 'Entre novamente.' }); return; }
        if (url.pathname === '/api/arquivos'){
          for await (const parte of req) { /* Consome somente bytes fictícios. */ }
          if (upload) await upload.promise;
          if (modo === 'falha-upload'){ json(500, { erro: 'Upload recusado no teste.' }); return; }
          json(201, { href: 'docs/teste.pdf' }); return;
        }
        const pedacos = [];
        for await (const parte of req) pedacos.push(parte);
        const corpo = JSON.parse(Buffer.concat(pedacos).toString());
        gravacoes.push(corpo);
        const item = { ...corpo, id: String(gravacoes.length), ordem: gravacoes.length };
        itens.push(item); json(201, { item }); return;
      }
      const relativo = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
      const alvo = path.resolve(raiz, relativo);
      if (!alvo.startsWith(raiz + path.sep) || !/^(index\.html|js\/|css\/|Fotos\/)/.test(relativo)){
        res.writeHead(404); res.end(); return;
      }
      const tipo = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp' }[path.extname(alvo)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': tipo }); res.end(fs.readFileSync(alvo));
    } catch (erro) { res.writeHead(500); res.end('Falha no servidor de teste'); }
  });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  t.after(() => { servidor.closeAllConnections(); servidor.close(); });
  const browser = await navegador();
  t.after(() => browser.fechar());
  t.after(() => { if (browser.erros.length) t.diagnostic(JSON.stringify(browser.erros)); });
  const { avaliar, esperar } = browser;
  const origem = `http://127.0.0.1:${servidor.address().port}/index.html`;
  const click = seletor => avaliar(`document.querySelector(${JSON.stringify(seletor)}).click()`);
  const titulo = valor => avaliar(`document.querySelector('.ed-form').elements.titulo.value = ${JSON.stringify(valor)}`);
  const submeter = () => avaliar("document.querySelector('.ed-form').requestSubmit()");
  const editar = async () => { await click('.ed-barra button'); await esperar("!!document.querySelector('.ed-janela[open]')"); };
  const prepararUpload = async () => avaliar(`(() => {
    const form = document.querySelector('.ed-form');
    form.elements.tipo.value = 'arquivo';
    form.querySelector('[value="arquivo"]').dispatchEvent(new Event('change'));
    const dt = new DataTransfer(); dt.items.add(new File(['teste'], 'teste.pdf', { type: 'application/pdf' }));
    form.elements.arquivo.files = dt.files;
  })()`);

  await t.test('file:// carrega páginas e busca com teclado, sem API', async () => {
    await browser.navegar(pathToFileURL(path.join(raiz, 'index.html')).href);
    assert.ok(await avaliar("document.querySelectorAll('.team-card').length > 0"));
    await avaliar("location.hash = '#documentacao'");
    await esperar("!document.getElementById('view-pagina').hidden");
    assert.equal(await avaliar("document.querySelectorAll('.ed-barra').length"), 0);
    await avaliar("window.abrirBusca(); document.querySelector('#busca-entrada').value = 'documentacao'; document.querySelector('#busca-entrada').dispatchEvent(new Event('input'));");
    await esperar("document.querySelectorAll('.busca-item').length > 0");
    await browser.enviar('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown' });
    assert.equal(await avaliar("document.querySelector('#busca-entrada').getAttribute('aria-activedescendant')"), 'busca-item-1');
    await browser.enviar('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape' });
    await esperar("!document.querySelector('.busca-janela').open && !document.body.classList.contains('busca-aberta')");
    await avaliar("location.hash = '#%'");
    await esperar("!document.getElementById('view-home').hidden");
  });

  await t.test('HTTP sem API mantém conteúdo estático e perfil inerte', async () => {
    modo = 'estatico'; await browser.navegar(origem + '#documentacao');
    await esperar("document.querySelectorAll('.link-list').length > 0");
    await click('[data-perfil]');
    assert.equal(await avaliar("document.querySelectorAll('.ed-janela').length"), 0);
  });

  await t.test('upload antigo não lê outro formulário nem fecha a nova janela', async () => {
    modo = 'normal'; await browser.navegar(origem + '#documentacao');
    await esperar("document.querySelectorAll('.ed-barra').length === 3");
    await editar(); await titulo('Primeiro'); await prepararUpload();
    upload = adiado(); await submeter();
    await click('.ed-fechar'); await editar(); await titulo('Segundo');
    upload.resolve(); upload = null;
    await esperar("document.querySelector('.link-list').textContent.includes('Primeiro')");
    assert.equal(gravacoes.at(-1).titulo, 'Primeiro');
    assert.equal(await avaliar("document.querySelector('.ed-form').elements.titulo.value"), 'Segundo');
    assert.equal(await avaliar("document.querySelector('.ed-primario').disabled"), false);
  });

  await t.test('erro antigo e close nativo tardio não afetam uma janela nova', async () => {
    await click('.ed-fechar'); await editar(); await titulo('Falha antiga'); await prepararUpload();
    upload = adiado(); modo = 'falha-upload'; await submeter();
    await avaliar("window.janelaAntiga = document.querySelector('.ed-janela')");
    await click('.ed-fechar'); await editar(); await titulo('Preservado');
    upload.resolve(); upload = null;
    await avaliar("window.janelaAntiga.dispatchEvent(new Event('close'))");
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(await avaliar("document.querySelector('.ed-form').elements.titulo.value"), 'Preservado');
    assert.equal(await avaliar("document.querySelector('.ed-erro').hidden"), true);
    modo = 'normal';
  });

  await t.test('submissão dupla gera uma gravação e fecha apenas a janela responsável', async () => {
    const antes = gravacoes.length;
    await avaliar("const f = document.querySelector('.ed-form'); f.requestSubmit(); f.requestSubmit();");
    await esperar("!document.querySelector('.ed-janela[open]')");
    assert.equal(gravacoes.length, antes + 1);
    assert.equal(gravacoes.at(-1).titulo, 'Preservado');
  });

  await t.test('401 remove ações autenticadas e permite entrar novamente', async () => {
    await editar(); await titulo('Sessão expirada'); modo = 'expirado'; await submeter();
    await esperar("!document.querySelector('.ed-erro').hidden");
    assert.equal(await avaliar("document.querySelectorAll('.ed-barra').length"), 0);
    assert.equal(await avaliar("document.querySelector('[data-perfil]').classList.contains('perfil-ativo')"), false);
    await click('.ed-fechar'); await click('[data-perfil]');
    assert.equal(await avaliar("document.querySelector('.ed-titulo').textContent"), 'Entrar');
    await avaliar("const form = document.querySelector('.ed-form'); form.elements.login.value = 'teste'; form.elements.senha.value = 'dados-ficticios'; form.requestSubmit();");
    await esperar("document.querySelectorAll('.ed-barra').length === 3 && !document.querySelector('.ed-janela[open]')");
  });

  await t.test('busca aberta recebe a confirmação de um upload em andamento', async () => {
    await editar(); await titulo('Encontravel'); await prepararUpload();
    upload = adiado(); await submeter(); await click('.ed-fechar');
    await avaliar("window.abrirBusca(); const input = document.querySelector('#busca-entrada'); input.value = 'Encontravel'; input.dispatchEvent(new Event('input'));");
    await esperar("document.querySelector('.busca-resumo').textContent.includes('Nada encontrado')");
    upload.resolve(); upload = null;
    await esperar("document.querySelector('.busca-lista').textContent.includes('Encontravel')");
    assert.equal(await avaliar("document.querySelector('.busca-janela').open"), true);
    await click('.busca-fechar');
  });

  await t.test('layout responsivo e comparação de estilos com a referência opcional', async () => {
    modo = 'estatico'; await browser.navegar(origem);
    const referencia = process.env.PAJB_BASELINE;
    const cssAnterior = referencia ? ['styles','equipe','pagina','edicao','busca']
      .map(nome => fs.readFileSync(path.join(referencia, 'css', nome + '.css'), 'utf8')).join('\n') : null;
    const capturar = `JSON.stringify([...document.querySelectorAll('body *')]
      .filter(e => !['SCRIPT','STYLE'].includes(e.tagName))
      .map(e => { const c = getComputedStyle(e); return ['color','backgroundColor','fontFamily','fontSize','fontWeight','letterSpacing',
        'lineHeight','borderRadius','boxShadow','width','height','padding','margin','display'].map(p => c[p]); }))`;
    for (const largura of [360, 900, 1280]){
      await browser.enviar('Emulation.setDeviceMetricsOverride', { width: largura, height: 900, deviceScaleFactor: 1, mobile: false });
      for (const hash of ['', '#documentacao']){
        await avaliar('location.hash = ' + JSON.stringify(hash));
        await esperar(hash ? "!document.getElementById('view-pagina').hidden" : "!document.getElementById('view-home').hidden");
        await avaliar("document.fonts.ready");
        await new Promise(resolve => setTimeout(resolve, 250));
        assert.ok(await avaliar('document.documentElement.scrollWidth <= innerWidth + 1'), `Overflow em ${largura}px`);
        if (cssAnterior){
          const atual = await avaliar(capturar);
          await avaliar(`(() => { document.querySelectorAll('link[rel="stylesheet"]').forEach(e => e.disabled = true);
            const style = document.createElement('style'); style.id = 'css-anterior'; style.textContent = ${JSON.stringify(cssAnterior)}; document.head.appendChild(style); })()`);
          await new Promise(resolve => setTimeout(resolve, 250));
          const anterior = await avaliar(capturar);
          await avaliar("document.getElementById('css-anterior').remove(); document.querySelectorAll('link[rel=stylesheet]').forEach(e => e.disabled = false)");
          await esperar("[...document.querySelectorAll('link[rel=stylesheet]')].every(e => e.sheet && !e.sheet.disabled)");
          await new Promise(resolve => setTimeout(resolve, 300));
          const a = JSON.parse(atual), b = JSON.parse(anterior);
          const diferencas = [];
          a.forEach((linha, i) => linha.forEach((valor, p) => {
            if (valor !== b[i]?.[p]) diferencas.push({ elemento: i, propriedade: p, atual: valor, anterior: b[i]?.[p] });
          }));
          assert.deepEqual(diferencas.slice(0, 8), [], `Estilos divergentes em ${largura}px ${hash || 'home'} (${diferencas.length} diferenças)`);
        }
      }
    }
    await esperar("getComputedStyle(document.querySelector('.menu-panel')).visibility === 'hidden'");
    const foto = await browser.enviar('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(browser.pasta, 'portal.png'), Buffer.from(foto.data, 'base64'));
    t.diagnostic('Captura local: ' + path.join(browser.pasta, 'portal.png'));
    if (!referencia) t.diagnostic('Comparação histórica não executada: PAJB_BASELINE não definido.');
  });

  assert.deepEqual(browser.erros, [], 'Exceções JavaScript no navegador');
});
