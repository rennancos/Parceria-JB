/* A ponte para o serviço de IA, contra um serviço FALSO levantado aqui.

   Nenhuma IA de verdade é chamada e nenhum endereço externo é usado: o "serviço
   de IA" destes testes é um http.createServer em 127.0.0.1 que devolve o que
   cada caso precisa. O que está sob teste é o contrato — o que sai daqui, o que
   é aceito de volta e o que acontece quando o outro lado falha.

   servidor/ia.js lê as variáveis de ambiente no `require`. Por isso cada cenário
   ajusta process.env e limpa o cache do módulo antes de carregá-lo de novo. */
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');

const CAMINHO = path.resolve(__dirname, '../../servidor/ia.js');

function carregar(env = {}){
  delete require.cache[CAMINHO];
  for (const chave of ['PAJB_IA_URL', 'PAJB_IA_TOKEN', 'PAJB_IA_TIMEOUT_MS']) delete process.env[chave];
  Object.assign(process.env, env);
  return require(CAMINHO);
}

// Serviço de IA de mentira: `responder` decide o que ele faz com cada chamada.
function servicoFalso(responder){
  const recebidas = [];
  const servidor = http.createServer((req, res) => {
    const partes = [];
    req.on('data', p => partes.push(p));
    req.on('end', () => {
      recebidas.push(JSON.parse(Buffer.concat(partes).toString()));
      responder(res);
    });
  });
  return { servidor, recebidas };
}

function subir(falso){
  return new Promise(pronto => falso.servidor.listen(0, '127.0.0.1',
    () => pronto(`http://127.0.0.1:${falso.servidor.address().port}/consulta`)));
}

const usuario = { login: 'editor', papel: 'equipe', nome: 'Fulano', credencial: 'salt-secreto' };

test('ponte para o serviço de IA', async t => {
  const original = { ...process.env };
  t.after(() => {
    for (const chave of ['PAJB_IA_URL', 'PAJB_IA_TOKEN', 'PAJB_IA_TIMEOUT_MS']) delete process.env[chave];
    Object.assign(process.env, original);
    delete require.cache[CAMINHO];
  });

  await t.test('sem PAJB_IA_URL o assistente está desligado, não quebrado', async () => {
    const ia = carregar();
    assert.equal(ia.disponivel(), false);
    await assert.rejects(() => ia.consultar({ pergunta: 'oi', usuario }),
      erro => erro.status === 503 && /nao esta configurado/.test(erro.message));
  });

  await t.test('endereço inválido falha ao subir, não na primeira pergunta', () => {
    assert.throws(() => carregar({ PAJB_IA_URL: 'ia-pajb:3000' }), /http/);
  });

  await t.test('só login e papel saem do portal — nunca senha, salt ou cookie', async () => {
    const falso = servicoFalso(res => res.end(JSON.stringify({ resposta: 'ok' })));
    const url = await subir(falso);
    const ia = carregar({ PAJB_IA_URL: url, PAJB_IA_TOKEN: 'segredo' });

    await ia.consultar({ pergunta: '  como   abro  chamado?  ', contexto: ['documentacao'], usuario });
    falso.servidor.close();

    const enviado = falso.recebidas[0];
    assert.deepEqual(enviado.usuario, { login: 'editor', papel: 'equipe' });
    assert.equal(enviado.pergunta, 'como abro chamado?');   // espaço normalizado
    assert.deepEqual(enviado.contexto, ['documentacao']);
    assert.equal(JSON.stringify(enviado).includes('salt-secreto'), false);
    assert.equal(JSON.stringify(enviado).includes('credencial'), false);
  });

  await t.test('resposta do serviço é normalizada para o formato do portal', () => {
    const ia = carregar();

    const mapeada = ia.mapear({
      answer: 'Abra pelo portal de chamados.',
      sources: [
        { title: 'Manual de acesso', type: 'procedimento', url: 'docs/manual.pdf' },
        { titulo: 'Chamado 4412', tipo: 'inventado', href: 'https://portal/4412', id: '4412' },
        { titulo: 'Malicioso', href: 'javascript:alert(1)' },
        { tipo: 'documento', href: 'https://x/y' }              // sem título: descartada
      ],
      confidence: 0.8
    });

    assert.equal(mapeada.resposta, 'Abra pelo portal de chamados.');
    assert.equal(mapeada.fontes.length, 3);
    assert.equal(mapeada.fontes[0].tipo, 'procedimento');
    assert.equal(mapeada.fontes[1].tipo, 'documento');          // tipo desconhecido não é descartado
    assert.equal(mapeada.fontes[2].href, '');                   // javascript: não vira link
    assert.equal(mapeada.confianca, 0.8);

    assert.throws(() => ia.mapear({ fontes: [] }), erro => erro.status === 502);
    assert.throws(() => ia.mapear('texto solto'), erro => erro.status === 502);
  });

  await t.test('falha do serviço vira erro do portal, sem vazar detalhe interno', async () => {
    const falso = servicoFalso(res => { res.writeHead(500); res.end('stack trace interna da IA'); });
    const url = await subir(falso);
    const ia = carregar({ PAJB_IA_URL: url });

    await assert.rejects(() => ia.consultar({ pergunta: 'oi', usuario }),
      erro => erro.status === 502 && !/stack trace/.test(erro.message));
    falso.servidor.close();
  });

  await t.test('serviço lento é cortado no timeout, não fica pendurado', async () => {
    const falso = servicoFalso(() => {});          // nunca responde
    const url = await subir(falso);
    const ia = carregar({ PAJB_IA_URL: url, PAJB_IA_TIMEOUT_MS: '120' });

    await assert.rejects(() => ia.consultar({ pergunta: 'oi', usuario }),
      erro => erro.status === 504);
    falso.servidor.closeAllConnections();
    falso.servidor.close();
  });

  await t.test('pergunta vazia ou longa demais nem chega ao serviço', async () => {
    const falso = servicoFalso(res => res.end(JSON.stringify({ resposta: 'ok' })));
    const url = await subir(falso);
    const ia = carregar({ PAJB_IA_URL: url });

    await assert.rejects(() => ia.consultar({ pergunta: '   ', usuario }), /Escreva a pergunta/);
    await assert.rejects(() => ia.consultar({ pergunta: 'a'.repeat(ia.LIMITE_PERGUNTA + 1), usuario }), /passa de/);
    await assert.rejects(() => ia.consultar({ pergunta: 'oi', contexto: 'texto', usuario }), /lista/);

    assert.equal(falso.recebidas.length, 0);
    falso.servidor.close();
  });
});
