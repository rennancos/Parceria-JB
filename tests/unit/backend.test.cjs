/* Fronteiras do backend: o que decide "isto entra" ou "isto não sai".

   Roda contra uma RAIZ falsa em %TEMP% — os `.js` de servidor/ são copiados
   para lá, e é o `__dirname` deles que manda em `dados/`, `docs/` e
   no estático. Nenhum usuário, documento ou arquivo real é tocado. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const http = require('node:http');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { raiz } = require('../helpers/portal.cjs');

const falsa = fs.mkdtempSync(path.join(os.tmpdir(), 'pajb-backend-'));
fs.mkdirSync(path.join(falsa, 'servidor', 'dados'), { recursive: true });
fs.mkdirSync(path.join(falsa, 'css'), { recursive: true });
for (const nome of fs.readdirSync(path.join(raiz, 'servidor')).filter(f => f.endsWith('.js'))){
  fs.copyFileSync(path.join(raiz, 'servidor', nome), path.join(falsa, 'servidor', nome));
}
// servidor.js agora depende de servidor/ia/ (integração BYOK): espelhar o subdir.
fs.mkdirSync(path.join(falsa, 'servidor', 'ia'), { recursive: true });
for (const nome of fs.readdirSync(path.join(raiz, 'servidor', 'ia')).filter(f => f.endsWith('.js'))){
  fs.copyFileSync(path.join(raiz, 'servidor', 'ia', nome), path.join(falsa, 'servidor', 'ia', nome));
}
fs.mkdirSync(path.join(falsa, 'md'), { recursive: true });
fs.mkdirSync(path.join(falsa, 'docs'), { recursive: true });
fs.writeFileSync(path.join(falsa, 'index.html'), '<h1>portal falso</h1>');
fs.writeFileSync(path.join(falsa, 'css', 'pagina.css'), 'body{}');
fs.writeFileSync(path.join(falsa, '.env'), 'SEGREDO=nao-deve-sair');
fs.writeFileSync(path.join(falsa, 'package.json'), '{}');
fs.writeFileSync(path.join(falsa, 'md', 'auditoria.md'), 'achados internos');
fs.writeFileSync(path.join(falsa, 'docs', 'manual.pdf'), '%PDF-1.4');

const CAMINHO_AUTH = path.join(falsa, 'servidor', 'auth.js');
const auth = require(CAMINHO_AUTH);
const dados = require(path.join(falsa, 'servidor', 'dados.js'));
const { servidor } = require(path.join(falsa, 'servidor', 'servidor.js'));

// A CLI usuarios.js roda separada do servidor HTTP: só um processo de verdade
// prova que a revogação atravessa a fronteira.
function noutroProcesso(expressao){
  const r = spawnSync(process.execPath, ['-e', `const auth = require(${JSON.stringify(CAMINHO_AUTH)}); ${expressao}`], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
}

test('fronteiras do backend, numa raiz descartável', async t => {
  await new Promise(pronto => servidor.listen(0, '127.0.0.1', pronto));
  const { port } = servidor.address();

  const pedir = (caminho, opcoes = {}) => new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: caminho, method: opcoes.metodo || 'GET', headers: { 'X-Portal-Request': '1', 'Content-Type': 'application/json', ...opcoes.headers } }, res => {
      const partes = [];
      res.on('data', parte => partes.push(parte));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, corpo: Buffer.concat(partes).toString() }));
    });
    req.on('error', reject);
    if (opcoes.corpo) req.write(opcoes.corpo);
    req.end();
  });

  await t.test('estático entrega o portal e recusa o que não é dele', async () => {
    assert.match((await pedir('/')).corpo, /portal falso/);
    assert.equal((await pedir('/css/pagina.css')).status, 200);
    assert.equal((await pedir('/docs/manual.pdf')).status, 200);

    // Achado 1 da auditoria virando teste: a lista vale sobre o caminho
    // resolvido, não sobre o primeiro segmento aparente da URL.
    assert.equal((await pedir('/servidor%2Fdados%2Fusuarios.json')).status, 403);
    assert.equal((await pedir('/servidor/dados/usuarios.json')).status, 403);
    assert.equal((await pedir('/.env')).status, 403);
    assert.equal((await pedir('/%2E%2E%2F%2E%2E%2Fwindows%2Fwin.ini')).status, 403);

    // Lista de permitidos: pasta e arquivo de raiz que não são do portal
    // ficam fora sem precisar ser listados em lugar nenhum.
    assert.equal((await pedir('/md/auditoria.md')).status, 403);
    assert.equal((await pedir('/package.json')).status, 403);
    assert.equal((await pedir('/css/nao-existe.css')).status, 404);

    const antes = await pedir('/css/pagina.css');
    fs.writeFileSync(path.join(falsa, 'css/pagina.css'), 'body{color:red}');
    const depois = await pedir('/css/pagina.css');
    assert.equal(antes.status, 200);
    assert.equal(depois.status, 200);
    assert.equal(depois.corpo, 'body{color:red}');
    assert.equal(depois.headers['cache-control'], 'no-cache');
    assert.notEqual(depois.headers.etag, antes.headers.etag);
  });

  await t.test('saúde não expõe dados nem exige sessão', async () => {
    const resposta = await pedir('/api/saude');
    assert.equal(resposta.status, 200);
    assert.deepEqual(JSON.parse(resposta.corpo), { ok: true });
  });

  await t.test('nomeSeguro achata o nome vindo do navegador', () => {
    assert.equal(dados.nomeSeguro('../../Relatório Final.PDF'), 'relatorio-final.pdf');
    assert.equal(dados.nomeSeguro(String.raw`C:\temp\Guia de Acesso.docx`), 'guia-de-acesso.docx');
    assert.equal(dados.nomeSeguro('....pdf'), 'documento.pdf');
    assert.throws(() => dados.nomeSeguro('script.exe'), /não aceito/);
    assert.throws(() => dados.nomeSeguro('sem-extensao'), /não aceito/);
  });

  await t.test('href só aceita http(s) ou arquivo dentro de docs/', () => {
    const base = { bloco: 'manuais', titulo: 'Item' };
    assert.equal(dados.incluir({ ...base, href: 'https://exemplo.internal/guia' }, 'teste').href, 'https://exemplo.internal/guia');
    assert.equal(dados.incluir({ ...base, href: 'docs/manual.pdf' }, 'teste').href, 'docs/manual.pdf');
    for (const href of ['javascript:alert(1)', 'data:text/html,<script>1</script>', 'docs/../.env', '/etc/passwd', 'file:///c:/']){
      assert.throws(() => dados.incluir({ ...base, href }, 'teste'), /Endereço inválido/, href);
    }
    assert.throws(() => dados.incluir({ ...base, bloco: 'inventado', href: '' }, 'teste'), /qual lista/);
  });

  await t.test('exigir decide pelo papel da sessão, não pelo corpo do pedido', () => {
    assert.throws(() => auth.exigir(null, ['equipe', 'dev']), erro => erro.status === 401);
    assert.throws(() => auth.exigir({ papel: 'equipe' }, ['dev']), erro => erro.status === 403);
    assert.equal(auth.exigir({ papel: 'dev' }, ['equipe', 'dev']).papel, 'dev');
  });

  await t.test('a API recusa escrita sem sessão e login com senha errada', async () => {
    assert.equal((await pedir('/api/documentos', { metodo: 'POST', corpo: '{}' })).status, 401);
    const login = await pedir('/api/sessao', { metodo: 'POST', corpo: JSON.stringify({ login: 'ninguem', senha: 'errada' }) });
    assert.equal(login.status, 401);
    assert.match(login.corpo, /incorretos/);
    assert.match((await pedir('/api/sessao')).corpo, /"autenticado":false/);
  });

  await t.test('o freio de senha conta por login e não se desarma com tentativas alheias', () => {
    auth.criarUsuario({ login: 'alvo', nome: 'Alvo', papel: 'equipe', senha: 'senha-do-alvo' });

    // Alternar logins não pode zerar a contagem do alvo. A varredura do Map de
    // tentativas roda a cada chamada; se o critério dela olhar `bloqueadoAte`
    // em vez de inatividade, quem tem menos de 5 erros é apagado por qualquer
    // tentativa de outro login e o freio nunca chega a fechar.
    for (let volta = 0; volta < 5; volta++){
      assert.throws(() => auth.entrar('alvo', 'errada'), erro => erro.status === 401);
      assert.throws(() => auth.entrar(`lixo-${volta}`, 'errada'), erro => erro.status === 401);
    }

    assert.throws(() => auth.entrar('alvo', 'senha-do-alvo'), erro => erro.status === 429);
    auth.removerUsuario('alvo');
  });

  await t.test('trocar a senha em outro processo derruba a sessão aberta', () => {
    auth.criarUsuario({ login: 'teste', nome: 'Teste', papel: 'dev', senha: 'senha-inicial' });
    const { token } = auth.entrar('teste', 'senha-inicial');
    assert.equal(auth.sessaoDe(token).papel, 'dev');

    noutroProcesso("auth.trocarSenha('teste', 'senha-trocada')");
    assert.equal(auth.sessaoDe(token), null);
    assert.throws(() => auth.entrar('teste', 'senha-inicial'), erro => erro.status === 401);
    assert.equal(auth.entrar('teste', 'senha-trocada').sessao.login, 'teste');
  });

  await t.test('remover o usuário em outro processo derruba a sessão aberta', () => {
    const { token } = auth.entrar('teste', 'senha-trocada');
    assert.ok(auth.sessaoDe(token));

    noutroProcesso("auth.removerUsuario('teste')");
    assert.equal(auth.sessaoDe(token), null);
  });

  servidor.close();
  fs.rmSync(falsa, { recursive: true, force: true });
});
