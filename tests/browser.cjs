const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { navegador } = require('./helpers/navegador.cjs');
const { raiz, adiado } = require('./helpers/portal.cjs');

// A API abaixo é simulada: esta suíte cobre consumidores e concorrência no
// frontend, mas não valida auth.js, persistência real nem autorização HTTP.
// Mudança em servidor/ exige validação específica além deste teste.
test('portal no navegador real, com API simulada e dados descartáveis', { timeout: 120000 }, async t => {
  let modo = 'normal', autenticado = true, upload = null;
  let exclusao = null, pedidosExclusao = 0;
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
        const id = decodeURIComponent(url.pathname.split('/')[3] || '');
        const indice = itens.findIndex(item => item.id === id);
        if (req.method === 'DELETE'){
          pedidosExclusao++;
          if (exclusao) await exclusao.promise;
          if (modo === 'falha-exclusao'){ json(500, { erro: 'Exclusão recusada no teste.' }); return; }
          if (indice < 0){ json(404, { erro: 'Documento não encontrado.' }); return; }
          itens.splice(indice, 1); json(200, { ok: true }); return;
        }
        const pedacos = [];
        for await (const parte of req) pedacos.push(parte);
        const corpo = JSON.parse(Buffer.concat(pedacos).toString());
        gravacoes.push(corpo);
        if (req.method === 'PUT'){
          if (indice < 0){ json(404, { erro: 'Documento não encontrado.' }); return; }
          itens[indice] = { ...itens[indice], ...corpo };
          json(200, { item: itens[indice] }); return;
        }
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

  await t.test('edição preserva o arquivo existente e não duplica o documento', async () => {
    const antes = itens.length, original = { ...itens[0] };
    await click('li[data-item-id] .ed-neutro');
    await titulo('Documento revisado'); await submeter();
    await esperar("!document.querySelector('.ed-janela[open]')");
    assert.equal(itens.length, antes);
    assert.equal(itens[0].id, original.id);
    assert.equal(itens[0].href, original.href);
    assert.equal(itens[0].titulo, 'Documento revisado');
    assert.ok(await avaliar("document.querySelector('.link-list').textContent.includes('Documento revisado')"));
  });

  await t.test('exclusão pendente bloqueia repetição mesmo após redesenho e permite retry após erro', async () => {
    const antes = itens.length, pedidosAntes = pedidosExclusao;
    await avaliar("window.confirm = () => true; window.alert = mensagem => { window.ultimoAlerta = mensagem; }");
    exclusao = adiado(); modo = 'falha-exclusao';
    await click('li[data-item-id] .ed-perigo');
    await avaliar("window.redesenharPagina()");
    assert.equal(await avaliar("document.querySelector('li[data-item-id] .ed-perigo').disabled"), true);
    await click('li[data-item-id] .ed-perigo');
    exclusao.resolve(); exclusao = null;
    await esperar("window.ultimoAlerta === 'Exclusão recusada no teste.'");
    assert.equal(pedidosExclusao, pedidosAntes + 1);
    assert.equal(itens.length, antes);
    assert.equal(await avaliar("document.querySelector('li[data-item-id] .ed-perigo').disabled"), false);
    modo = 'normal'; await click('li[data-item-id] .ed-perigo');
    await esperar(`document.querySelectorAll('li[data-item-id]').length === ${antes - 1}`);
    assert.equal(itens.length, antes - 1);
    assert.equal(pedidosExclusao, pedidosAntes + 2);
    assert.equal(await avaliar("document.querySelector('.link-list').textContent.includes('Documento revisado')"), false);
  });

  await t.test('mailto sem cliente de e-mail avisa; com cliente assumindo, cala', async () => {
    const alvo = '.team-card a[href^="mailto:"]';
    modo = 'normal'; await browser.navegar(origem);
    await esperar(`document.querySelectorAll('${alvo}').length > 0`);
    const email = await avaliar(`document.querySelector('${alvo}').dataset.email`);

    // Ninguém assume o mailto: a aba fica com foco e o aviso aparece.
    await click(alvo);
    await esperar("!!document.querySelector('.team-aviso')");
    assert.ok((await avaliar("document.querySelector('.team-aviso').textContent")).includes(email));
    await avaliar("document.querySelector('.team-aviso').remove()");

    // Um cliente assumiu: a aba perde o foco e nada é dito.
    await click(alvo);
    await avaliar("window.dispatchEvent(new Event('blur'))");
    await new Promise(resolve => setTimeout(resolve, 1500));
    assert.equal(await avaliar("!!document.querySelector('.team-aviso')"), false);
  });

  /* Central de onboarding (md/12-primeiros-passos-layout.md). A navegação rápida
     e a barra lateral apontam para âncoras da própria página (#secao-1), e o
     portal roteia por hash: sem o tratamento em js/router.js, cada um desses
     cliques resolvia para "página desconhecida" e devolvia a pessoa à home,
     apagando o conteúdo. Este teste prende as duas pontas — a âncora rola e a
     chave de página continua navegando. */
  await t.test('primeiros passos: âncoras internas, busca local e fichas de fabricante', async () => {
    modo = 'estatico'; await browser.navegar(origem + '#primeiros-passos');
    await esperar("!!document.querySelector('.primeiros-passos')");

    const vivaEm = async seletor => {
      await click(seletor);
      await new Promise(resolve => setTimeout(resolve, 150));
      return avaliar("!!document.querySelector('.primeiros-passos') && !document.getElementById('view-pagina').hidden");
    };

    for (const alvo of ['#secao-0', '#secao-1', '#secao-2']){
      assert.ok(await vivaEm(`.onboarding-nav a[href="${alvo}"]`), `nav ${alvo} derrubou a página`);
      assert.equal(await avaliar('location.hash'), alvo);
      // scroll-margin-top tira o título de baixo do cabeçalho grudado.
      assert.ok(await avaliar(`document.getElementById('${alvo.slice(1)}').getBoundingClientRect().top > 0`), `${alvo} ficou sob o cabeçalho`);
    }
    assert.ok(await vivaEm('.onboarding-sidebar a[href="#secao-2"]'), 'sidebar derrubou a página');

    // "Navegação desta página" só aponta para esta página.
    assert.deepEqual(
      JSON.parse(await avaliar("JSON.stringify([...document.querySelectorAll('.onboarding-nav a')].map(a => a.getAttribute('href')))")),
      ['#secao-0', '#secao-1', '#secao-2']);

    // A busca é só filtro de DOM: o texto digitado tem de sobreviver ao pulo.
    await avaliar("const i = document.querySelector('[data-onboarding-search]'); i.value = 'Avid'; i.dispatchEvent(new Event('input'));");
    const filtrados = await avaliar("[...document.querySelectorAll('[data-onboarding-item]')].filter(e => !e.hidden).length");
    const total = await avaliar("document.querySelectorAll('[data-onboarding-item]').length");
    assert.ok(filtrados > 0 && filtrados < total, `busca não filtrou (${filtrados}/${total})`);
    assert.match(await avaliar("document.querySelector('[data-onboarding-status]').textContent"), /resultado/);
    assert.ok(await vivaEm('.onboarding-nav a[href="#secao-0"]'));
    assert.equal(await avaliar("document.querySelector('[data-onboarding-search]').value"), 'Avid');

    /* Buscar pelo contato tem de devolver o contato. Antes a busca só escondia
       caixas: sobravam o nome do sistema, sete <summary> de setor vazios e duas
       seções sem nada dentro, e o telefone continuava a um clique de distância. */
    const VIS = '(e => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length))';
    const buscar = async termo => {
      await avaliar(`(() => { const c = document.querySelector('[data-onboarding-search]');
        c.value = ${JSON.stringify(termo)}; c.dispatchEvent(new Event('input')); })()`);
      await new Promise(resolve => setTimeout(resolve, 120));
    };

    await buscar('Rafael Rolando');
    const contato = await avaliar(`(() => { const d = [...document.querySelectorAll('.fab-contato')].filter(${VIS});
      return d.length === 1 ? d[0].textContent : null; })()`);
    assert.ok(contato, 'a busca por contato não mostrou nenhum bloco de contato');
    assert.match(contato, /Rafael Rolando/);
    assert.match(contato, /99511-0429/);
    assert.ok(await avaliar(`[...document.querySelectorAll('.fab-contato a[href^="mailto:"]')].filter(${VIS}).length > 0`),
      'e-mail do contato não veio como link');

    // Contêiner esvaziado pela busca sai da tela em vez de virar casca.
    assert.deepEqual(
      JSON.parse(await avaliar(`JSON.stringify([...document.querySelectorAll('.onboarding-group:has(.fab-lista)')].filter(${VIS}).map(d => d.querySelector('summary').textContent))`)),
      ['Todos os setores']);
    assert.equal(await avaliar(`[...document.querySelectorAll('.page-section')].filter(${VIS}).length`), 1);

    /* Lista longa de grupos de um passo (as 27 contas de AD) nasce recolhida e
       em coluna estreita. Ela reusa .onboarding-group de propósito, então a
       busca tem de abri-la sozinha quando o achado está lá dentro. */
    await buscar('');
    const grupoAD = '.sys-grupo';
    assert.equal(await avaliar(`document.querySelector('${grupoAD}').open`), false,
      'a lista longa de grupos não nasceu recolhida');
    assert.match(await avaliar(`document.querySelector('${grupoAD} > summary').textContent`), new RegExp('[(][0-9]+[)]'),
      'o resumo do grupo recolhido não traz a contagem');
    const colunasDe = sel => avaliar(`getComputedStyle(document.querySelector(${JSON.stringify(sel)})).gridTemplateColumns.split(' ').length`);
    assert.ok(await colunasDe('.sys-list-compacta') > await colunasDe('.sys-list:not(.sys-list-compacta)'),
      'a lista recolhida devia ter mais colunas que a lista normal');
    /* Largura fixa: a quebra de nome depende dela, e sem fixar o teste herda
       o que o teste anterior deixou no emulador. 1280 é a maior da suíte. */
    await browser.enviar('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise(resolve => setTimeout(resolve, 200));
    // Nome de conta não pode quebrar em duas linhas na coluna estreita.
    assert.equal(await avaliar(`(() => {
      const nomes = [...document.querySelectorAll('.sys-list-compacta .sys-name')];
      const uma = parseFloat(getComputedStyle(nomes[0]).lineHeight);
      return nomes.filter(n => n.getBoundingClientRect().height > uma * 1.4)
        .filter(n => !n.textContent.includes('-')).length; })()`), 0,
      'nome de conta quebrou em duas linhas na coluna compacta');
    await browser.enviar('Emulation.clearDeviceMetricsOverride');

    await buscar('GSIUSRV_726');
    assert.equal(await avaliar(`document.querySelector('${grupoAD}').open`), true,
      'a busca não abriu a lista recolhida onde estava o achado');
    assert.equal(await avaliar("[...document.querySelectorAll('[data-onboarding-item]')].filter(e => !e.hidden).length"), 1);

    /* Card de fabricante e card de sistema têm de continuar iguais: mesma
       caixa, mesma tipografia, mesmo ladrilho de ícone. São o mesmo objeto na
       mesma página, e já viveram com grade e respiro diferentes. */
    await buscar('');
    const desenho = JSON.parse(await avaliar(`(() => {
      const caixa = e => { const c = getComputedStyle(e);
        return [c.padding, c.borderRadius, c.borderColor, c.backgroundColor, c.boxShadow]; };
      const texto = e => { const c = getComputedStyle(e); return [c.fontSize, c.fontWeight, c.color]; };
      const sys = [...document.querySelectorAll('.sys-list:not(.sys-list-compacta) li')]
        .find(e => !e.querySelector('.callout') && e.querySelector('.sys-role'));
      const fab = document.querySelector('.fab-item');
      const ler = (card, icone, nome, apoio) => {
        const partes = { icone: card.querySelector(icone), nome: card.querySelector(nome), apoio: card.querySelector(apoio) };
        const faltando = Object.keys(partes).filter(k => !partes[k]);
        if (faltando.length) return { faltando };
        return { card: caixa(card), icone: caixa(partes.icone), nome: texto(partes.nome), apoio: texto(partes.apoio) };
      };
      return JSON.stringify({
        sistema: ler(sys, '.sys-icon', '.sys-name', '.sys-role'),
        fabricante: ler(fab, '.sys-icon', '.fab-nome', '.fab-resumo'),
        colunas: [document.querySelector('.sys-list:not(.sys-list-compacta)'), document.querySelector('.fab-lista')]
          .map(e => getComputedStyle(e).gridTemplateColumns.split(' ').length)
      }); })()`));
    // Sem isto a comparação passaria "de graça" se os DOIS perdessem o ícone.
    assert.deepEqual([desenho.sistema.faltando, desenho.fabricante.faltando], [undefined, undefined],
      'card perdeu ícone, nome ou linha de apoio');
    assert.deepEqual(desenho.fabricante, desenho.sistema,
      'card de fabricante saiu do desenho do card de sistema');
    assert.deepEqual(desenho.colunas[1], desenho.colunas[0],
      'as duas listas deixaram de quebrar no mesmo número de colunas');
    assert.equal(await avaliar(`[...document.querySelectorAll('.fab-contato')].filter(${VIS}).length`), 0);
    assert.equal(await avaliar(`[...document.querySelectorAll('.onboarding-group:has(.fab-lista)')].filter(${VIS}).length`), 8);
    assert.equal(await avaliar(`[...document.querySelectorAll('.page-section')].filter(${VIS}).length`), 3);
    // Escondido não pode continuar tabulável.
    assert.equal(await avaliar(`[...document.querySelectorAll('.fab-contato a')].filter(${VIS}).length`), 0);

    /* Chave de página ainda vence a âncora, e o data-ficha da janela de
       fabricantes continua casando com o índice do renderer. Pelo hash, e não
       por um clique na nav: a nav só tem âncoras desta página, e o que se
       testa aqui é o router, não o botão. */
    await avaliar("location.hash = '#documentacao'");
    await esperar("document.querySelectorAll('.link-list').length > 0");
    assert.equal(await avaliar("!!document.querySelector('.primeiros-passos')"), false);

    await browser.navegar(origem + '#primeiros-passos');
    await esperar("!!document.querySelector('.onboarding-group[open] .fab-item')");
    await click('.onboarding-group[open] .fab-item');
    await esperar("!!document.querySelector('.fab-janela')?.open");
    assert.ok(await avaliar("document.querySelector('.fab-janela-titulo').textContent.trim().length > 0"));
    await click('.fab-fechar');

    // Hash que não é página nem âncora daqui continua caindo na home.
    await avaliar("location.hash = '#nao-existe-isto'");
    await esperar("!document.getElementById('view-home').hidden");

    // Sem overflow horizontal nas três larguras da suíte.
    await browser.navegar(origem + '#primeiros-passos');
    for (const largura of [360, 900, 1280]){
      await browser.enviar('Emulation.setDeviceMetricsOverride', { width: largura, height: 900, deviceScaleFactor: 1, mobile: false });
      await esperar("!!document.querySelector('.primeiros-passos')");
      for (const termo of ['', 'Rafael']){
        await buscar(termo);
        await new Promise(resolve => setTimeout(resolve, 200));
        assert.ok(await avaliar('document.documentElement.scrollWidth <= innerWidth + 1'),
          `Overflow em ${largura}px${termo ? ' com busca ativa' : ''}`);
      }
      // O contato não pode transbordar do card: foi o que `height: 100%` no
      // botão causava assim que o <li> ganhou um segundo filho.
      await buscar('Rafael');
      assert.ok(await avaliar(`(() => { const dl = [...document.querySelectorAll('.fab-contato')].filter(${VIS})[0];
        if (!dl) return false; const li = dl.closest('li');
        return Math.round(dl.getBoundingClientRect().bottom) <= Math.round(li.getBoundingClientRect().bottom) + 1; })()`),
        `Contato vazou para fora do card em ${largura}px`);
      await buscar('');
    }
    await browser.enviar('Emulation.clearDeviceMetricsOverride');
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
