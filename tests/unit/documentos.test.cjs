const test = require('node:test');
const assert = require('node:assert/strict');
const { ambiente, adiado, resposta } = require('../helpers/portal.cjs');

function modelo(api){
  const env = ambiente();
  const Portal = env.carregar('js/compartilhado/html.js', 'js/compartilhado/paginas-modelo.js', 'js/documentos/acervo.js');
  const bloco = { titulo: 'Lista', tipo: 'links', chave: 'manuais', itens: [{ titulo: 'Semente' }] };
  const paginas = { documentacao: { secoes: [bloco] } };
  return { acervo: Portal.documentosAcervo.criar(api, paginas), bloco };
}
const documento = (id = '1') => ({ id, bloco: 'manuais', titulo: 'Manual', href: 'docs/manual.pdf', formato: 'pdf' });

test('upload captura todos os campos antes de aguardar a resposta', async () => {
  const upload = adiado();
  let enviado;
  const { acervo, bloco } = modelo({ pedir: () => upload.promise, enviarJson: async (url, metodo, corpo) => {
    enviado = corpo;
    return { item: { id: 'novo', ...corpo } };
  } });
  const rascunho = { tipo: 'arquivo', titulo: 'Primeiro', descricao: 'Original', bloco: 'manuais',
    href: '', arquivo: { name: 'manual.pdf' }, substituir: false };
  const operacao = acervo.salvar(rascunho, null);
  rascunho.titulo = 'Segundo'; rascunho.bloco = 'outra-lista';
  upload.resolve({ href: 'docs/manual.pdf' });
  await operacao;
  assert.equal(enviado.titulo, 'Primeiro');
  assert.equal(enviado.bloco, 'manuais');
  assert.equal(enviado.href, 'docs/manual.pdf');
  assert.equal(bloco.itens[0].titulo, 'Primeiro');
});

test('editar metadados preserva arquivo existente sem reenviar upload', async () => {
  const item = documento();
  const { acervo } = modelo({ pedir(){ throw Error('Upload inesperado'); }, enviarJson: async (url, metodo, corpo) => {
    assert.equal(metodo, 'PUT'); assert.equal(url, '/documentos/1');
    assert.equal(corpo.href, item.href);
    return { item: { ...item, ...corpo } };
  } });
  await acervo.salvar({ tipo: 'arquivo', titulo: 'Revisto', descricao: '', bloco: 'manuais', href: '' }, item);
  assert.equal(acervo.itemPorId('1').titulo, 'Revisto');
});

test('lista vazia substitui sementes; resposta inválida preserva o último acervo', async () => {
  let dados = { itens: [documento()], blocos: [{ chave: 'manuais', rotulo: 'Manuais' }] };
  const { acervo, bloco } = modelo({ pedir: async () => dados });
  await acervo.carregar();
  dados = { itens: 'inválido', blocos: [] };
  await assert.rejects(acervo.carregar(), /acervo inválido/);
  assert.equal(bloco.itens.length, 1);
  dados = { itens: [], blocos: [] };
  await acervo.carregar();
  assert.equal(bloco.itens.length, 0);
});

test('uma leitura antiga não substitui a leitura mais recente', async () => {
  const antiga = adiado(), nova = adiado();
  let chamadas = 0;
  const { acervo } = modelo({ pedir: () => ++chamadas === 1 ? antiga.promise : nova.promise });
  const a = acervo.carregar(), b = acervo.carregar();
  nova.resolve({ itens: [documento('novo')], blocos: [] }); await b;
  antiga.resolve({ itens: [documento('antigo')], blocos: [] }); await a;
  assert.equal(acervo.itens[0].id, 'novo');
});

test('confirmação de escrita não depende de GET adicional e invalida leitura antiga', async () => {
  const leitura = adiado();
  const { acervo } = modelo({ pedir: () => leitura.promise,
    enviarJson: async (url, metodo, corpo) => ({ item: { id: 'confirmado', ...corpo } }) });
  const pendente = acervo.carregar();
  await acervo.salvar({ tipo: 'link', titulo: 'Novo', descricao: '', bloco: 'manuais', href: 'https://example.invalid' }, null);
  leitura.resolve({ itens: [], blocos: [] }); await pendente;
  assert.equal(acervo.itens[0].id, 'confirmado');
});

test('exclusão confirmada remove o último item da projeção', async () => {
  const { acervo, bloco } = modelo({ pedir: async (url, opcoes) => opcoes?.method === 'DELETE'
    ? { ok: true } : { itens: [documento()], blocos: [] } });
  await acervo.carregar(); await acervo.excluir('1');
  assert.equal(bloco.itens.length, 0);
  assert.equal(acervo.itens.length, 0);
});

test('cliente HTTP envia credenciais e JSON; 401 emite invalidação e 403 não', async () => {
  let status = 200, expiracoes = 0;
  const env = ambiente({ fetch: async (url, opcoes) => {
    assert.equal(url, '/api/documentos');
    assert.equal(opcoes.credentials, 'same-origin');
    assert.equal(opcoes.headers['Content-Type'], 'application/json');
    return resposta(status === 200 ? { ok: true } : { erro: 'Recusado' }, status);
  } });
  const Portal = env.carregar('js/compartilhado/html.js', 'js/documentos/api.js');
  env.contexto.document.addEventListener('sessao:expirada', () => expiracoes++);
  await Portal.documentosApi.enviarJson('/documentos', 'POST', {});
  status = 401;
  await assert.rejects(Portal.documentosApi.enviarJson('/documentos', 'POST', {}), e => e.status === 401);
  status = 403;
  await assert.rejects(Portal.documentosApi.enviarJson('/documentos', 'POST', {}), e => e.status === 403);
  assert.equal(expiracoes, 1);
});

test('servidor estático sem API é recusado como indisponível', async () => {
  const env = ambiente({ fetch: async () => resposta('<html>', 200, 'text/html') });
  const Portal = env.carregar('js/compartilhado/html.js', 'js/documentos/api.js');
  await assert.rejects(Portal.documentosApi.pedir('/documentos'), /não está respondendo/);
});
