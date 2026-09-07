const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ambiente, raiz } = require('../helpers/portal.cjs');

function conteudo(){
  const env = ambiente();
  env.carregar('js/compartilhado/html.js', 'js/compartilhado/paginas-modelo.js',
    'js/equipe-dados.js', 'js/paginas.js', ...fs.readdirSync(path.join(raiz, 'js/paginas')).map(f => 'js/paginas/' + f),
    'js/busca/motor.js', 'js/busca/indice.js');
  return env.contexto;
}

test('escape protege texto e atributos sem executar markup', () => {
  const { Portal } = conteudo();
  assert.equal(Portal.escaparHtml('<b title="a&b">\'Oi\'</b>'), '&lt;b title=&quot;a&amp;b&quot;&gt;&#39;Oi&#39;&lt;/b&gt;');
  assert.equal(Portal.escaparHtml(null), '');
});

test('seção simplificada preserva chave, referência e um único título', () => {
  const { Portal, renderizarPagina } = conteudo();
  const secao = { titulo: 'Seção única', tipo: 'links', chave: 'exemplo', itens: [] };
  assert.equal(Portal.paginasModelo.blocosDaSecao(secao)[0], secao);
  const html = renderizarPagina({ titulo: 'Página', secoes: [secao] });
  assert.match(html, /data-bloco="exemplo"/);
  assert.equal(html.split('Seção única').length - 1, 1);
});

test('seção composta mantém títulos e metadados dos blocos', () => {
  const { Portal, renderizarPagina } = conteudo();
  const bloco = { tipo: 'links', titulo: 'Sublista', chave: 'modelo', itens: [] };
  const secao = { titulo: 'Seção', blocos: [bloco] };
  assert.equal(Portal.paginasModelo.blocosDaSecao(secao)[0], bloco);
  assert.match(renderizarPagina({ titulo: 'Página', secoes: [secao] }), /class="block-title">Sublista/);
});

test('conteúdo real renderiza e identifica pessoas sem depender dos cards', () => {
  const { Portal, PAGINAS, renderizarPagina } = conteudo();
  for (const pagina of Object.values(PAGINAS)) assert.match(renderizarPagina(pagina), /<h1/);
  const indice = Portal.buscaIndice.montar(PAGINAS, Portal.equipe.pessoas);
  const pessoas = indice.filter(i => i.tipo === 'pessoa');
  const ids = Portal.equipe.pessoas.map(p => Portal.equipe.idDaPessoa(p.nome));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(pessoas.length, ids.length);
  assert.ok(pessoas.every(p => ids.includes(p.alvoId)));
});

test('busca combina termos, prioriza título e ignora acentos', () => {
  const { Portal } = conteudo();
  const paginas = {
    a: { titulo: 'Captação', descricao: 'Portal', secoes: [] },
    b: { titulo: 'Outro', descricao: 'Portal de captação', secoes: [] },
    c: { titulo: 'Portal', descricao: 'Sem o outro termo', secoes: [] }
  };
  const indice = Portal.buscaIndice.montar(paginas, []);
  const resultados = Portal.buscaMotor.buscar(indice, 'captacao portal');
  assert.equal(resultados.length, 2);
  assert.equal(resultados[0].item.href, '#a');
  assert.equal(Portal.buscaMotor.buscar(indice, '').length, 0);
});

test('destaque preserva acentos e une termos sobrepostos sem HTML injetado', () => {
  const { destacar, termosDe } = conteudo().Portal.buscaMotor;
  assert.equal(destacar('Captação <script>', termosDe('captacao')), '<mark>Captação</mark> &lt;script&gt;');
  assert.equal(destacar('mamute', termosDe('mam mamute')), '<mark>mamute</mark>');
  assert.equal(destacar('a\u0303', termosDe('a')), '<mark>a\u0303</mark>');
});

test('blocos de edição e extensões concordam com o contrato do servidor', () => {
  const { Portal, PAGINAS } = conteudo();
  const { BLOCOS, EXTENSOES } = require('../../servidor/dados.js');
  const chaves = Object.values(PAGINAS).flatMap(p => p.secoes.flatMap(s =>
    Portal.paginasModelo.blocosDaSecao(s).filter(b => b.chave).map(b => b.chave)));
  assert.deepEqual([...chaves].sort(), BLOCOS.map(b => b.chave).sort());
  const env = ambiente();
  const mod = env.carregar('js/compartilhado/html.js', 'js/compartilhado/paginas-modelo.js', 'js/documentos/acervo.js');
  assert.deepEqual(mod.documentosAcervo.ACEITOS.split(',').map(s => s.slice(1)).sort(), [...EXTENSOES].sort());
});

test('ordem real do HTML funciona em file:// e tolera hashes malformados', () => {
  const env = ambiente();
  const home = { hidden: false };
  const pagina = { hidden: true, innerHTML: '', querySelector: () => null };
  env.contexto.document.getElementById = id => id === 'view-home' ? home : id === 'view-pagina' ? pagina : null;
  env.contexto.fetch = () => { throw Error('file:// não deve consultar a API'); };
  const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  env.carregar(...scripts);
  const navegar = hash => {
    env.contexto.location.hash = hash;
    env.contexto.document.dispatchEvent({ type: 'hashchange' });
  };
  navegar('#documentacao');
  assert.equal(home.hidden, true);
  assert.match(pagina.innerHTML, /data-bloco/);
  navegar('#%');
  assert.equal(home.hidden, false);
  assert.equal(pagina.hidden, true);
  navegar('#manuais');
  assert.equal(pagina.hidden, false);
  assert.match(env.contexto.document.title, /Documentação/);
});
