/* Teste do fluxo de atualização — sem publicar nada e sem tocar na rede.

     npm run app:teste

   POR QUE ISTO EXISTE

   Testar atualização à mão exige publicar uma versão de verdade para descobrir
   que a versão de verdade estava errada. Este script sobe um servidor HTTP
   local que finge ser o servidor de atualizações, e faz `app/atualizacao.js`
   passar por cada um dos caminhos: versão nova, versão velha, JSON quebrado,
   instalador de outra origem, SHA-256 que não bate, download truncado,
   servidor fora do ar.

   O que ele NÃO cobre, e não tem como cobrir sem instalar de verdade:
   `instalar()`, que executa o .exe e fecha o aplicativo. Esse passo é o teste
   manual descrito em md/10-aplicativo-windows.md.

   Roda no Electron (precisa do `net` e do `app`), mas não abre janela. */
'use strict';

// Se o console que recebe a saída fechar antes do fim (terminal fechado, app
// aberto sem console, saída canalizada para um leitor que sumiu), o write no
// stdout falha com EPIPE. Sem esta guarda, no processo principal do Electron
// isso vira exceção não tratada e abre o diálogo "A JavaScript error occurred".
process.stdout.on('error', (e) => { if (e.code === 'EPIPE') process.exit(0); });
process.stderr.on('error', (e) => { if (e.code === 'EPIPE') process.exit(0); });

const { app } = require('electron');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

/* ---------- Servidor que finge ser o de atualizações ---------- */

// O instalador de mentira: bytes quaisquer, com o SHA-256 calculado deles.
const INSTALADOR = Buffer.from('instalador de mentira '.repeat(500), 'utf8');
const SHA_BOM = crypto.createHash('sha256').update(INSTALADOR).digest('hex');
const SHA_RUIM = 'f'.repeat(64);

let cenario = 'nova';        // trocado antes de cada teste
let truncar = false;

/* As versões de mentira saem da versão instalada, não de um número fixo: assim
   o teste continua valendo depois de o package.json subir para 1.1.0, 2.0.0 ou
   o que for. `maior` soma 1 no primeiro campo, `menor` zera tudo. */
function maiorQue(versao){
  const partes = String(versao).split('.').map((n) => parseInt(n, 10) || 0);
  partes[0] = partes[0] + 1;
  return partes.join('.');
}

const servidor = http.createServer((req, res) => {
  const rota = req.url.split('?')[0];

  if (rota === '/Parceria-JB-Setup-9.9.9.exe'){
    const corpo = truncar ? INSTALADOR.slice(0, 100) : INSTALADOR;
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': corpo.length });
    return res.end(corpo);
  }

  if (rota !== '/versao.json'){
    res.writeHead(404); return res.end();
  }

  const base = {
    versao: maiorQue(app.getVersion()),
    arquivo: 'Parceria-JB-Setup-9.9.9.exe',
    sha256: SHA_BOM,
    tamanho: INSTALADOR.length,
    publicadoEm: '2026-08-18',
    notas: ['Primeira nota.', 'Segunda nota.'],
    pagina: 'https://exemplo.invalido/download'
  };

  const casos = {
    nova:        base,
    velha:       Object.assign({}, base, { versao: '0.0.0' }),
    igual:       Object.assign({}, base, { versao: app.getVersion() }),
    'sha-ruim':  Object.assign({}, base, { sha256: SHA_RUIM }),
    'sha-torto': Object.assign({}, base, { sha256: 'nao-e-hash' }),
    'outra-origem': Object.assign({}, base, { arquivo: 'http://outro-servidor.invalido/x.exe' }),
    'nao-exe':   Object.assign({}, base, { arquivo: 'leiame.txt' }),
    'versao-torta': Object.assign({}, base, { versao: '1.x' }),
    'notas-demais': Object.assign({}, base, { notas: Array(20).fill('nota') })
  };

  if (cenario === 'json-quebrado'){
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end('{ isto nao e json');
  }
  if (cenario === 'erro-500'){
    res.writeHead(500); return res.end('{}');
  }

  const corpo = JSON.stringify(casos[cenario] || base);
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(corpo);
});

/* ---------- Placar ---------- */

let passou = 0;
let falhou = 0;

function ok(nome, condicao, detalhe){
  if (condicao){
    passou++;
    console.log(`  ok    ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHA ${nome}${detalhe ? `  → ${detalhe}` : ''}`);
  }
}

// Espera que a chamada estoure, e que a mensagem contenha um trecho.
async function estoura(nome, fn, trecho){
  try {
    await fn();
    ok(nome, false, 'não deu erro nenhum');
  } catch (erro) {
    ok(nome, String(erro.message).indexOf(trecho) > -1, `mensagem: "${erro.message}"`);
  }
}

/* ---------- Os testes ---------- */

async function rodar(atualizacao){
  const atual = app.getVersion();
  const doPacote = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version;

  console.log(`\n  Versão que o aplicativo reporta: ${atual}`);

  /* Rodando por `electron app/teste-atualizacao.js`, o Electron toma app/ como
     pasta do aplicativo — e app/ não tem package.json, então `getVersion()`
     devolve a versão do próprio Electron. Não invalida nada abaixo (as versões
     de mentira saem daí mesmo), mas convém dizer em voz alta. */
  if (atual !== doPacote){
    console.log(`  Aviso: o package.json diz ${doPacote}. Fora deste teste, o aplicativo usa a do package.json.`);
  }
  console.log('');

  console.log('  Comparação de versões');
  ok('1.0.1 > 1.0.0', atualizacao.comparar('1.0.1', '1.0.0') === 1);
  ok('1.10.0 > 1.9.0 (compara número, não texto)', atualizacao.comparar('1.10.0', '1.9.0') === 1);
  ok('2.0 > 1.9.9', atualizacao.comparar('2.0', '1.9.9') === 1);
  ok('1.0.0 == 1.0', atualizacao.comparar('1.0.0', '1.0') === 0);
  ok('1.0.0 < 1.0.1', atualizacao.comparar('1.0.0', '1.0.1') === -1);

  console.log('\n  Verificação');

  cenario = 'nova';
  const nova = await atualizacao.verificar();
  ok('versão maior no servidor → há atualização', nova.ha === true);
  ok('devolve a versão nova', nova.versao === maiorQue(atual));
  ok('devolve a versão instalada', nova.atual === atual);
  ok('lê as notas', nova.notas.length === 2 && nova.notas[0] === 'Primeira nota.');
  ok('lê a página oficial', nova.pagina === 'https://exemplo.invalido/download');
  ok('resolve o arquivo relativo contra a origem do manifesto',
    nova.arquivo.indexOf('/Parceria-JB-Setup-9.9.9.exe') > -1);

  cenario = 'velha';
  ok('versão menor no servidor → não há atualização', (await atualizacao.verificar()).ha === false);

  cenario = 'igual';
  ok('mesma versão → não há atualização', (await atualizacao.verificar()).ha === false);

  cenario = 'notas-demais';
  ok('corta as notas em 6', (await atualizacao.verificar()).notas.length === 6);

  console.log('\n  Manifesto inválido');

  cenario = 'versao-torta';
  await estoura('versão fora do formato', () => atualizacao.verificar(), 'versão inválida');

  cenario = 'sha-torto';
  await estoura('sha-256 que não é hash', () => atualizacao.verificar(), 'soma de verificação');

  cenario = 'outra-origem';
  await estoura('instalador em outro servidor', () => atualizacao.verificar(), 'mesmo servidor');

  cenario = 'nao-exe';
  await estoura('arquivo que não é instalador', () => atualizacao.verificar(), 'não aponta para um instalador');

  cenario = 'json-quebrado';
  await estoura('json ilegível', () => atualizacao.verificar(), 'ilegível');

  cenario = 'erro-500';
  await estoura('servidor com erro', () => atualizacao.verificar(), 'respondeu 500');

  console.log('\n  Download');

  cenario = 'nova';
  truncar = false;
  atualizacao.limparTemporarios();

  const info = await atualizacao.verificar();
  const progresso = [];
  const caminho = await atualizacao.baixar(info, (p) => progresso.push(p));

  ok('baixou e o arquivo existe', fs.existsSync(caminho));
  ok('o conteúdo confere byte a byte', fs.readFileSync(caminho).equals(INSTALADOR));
  ok('avisou o progresso', progresso.length > 0 && progresso[progresso.length - 1] === 100);
  ok('não sobrou arquivo .parcial',
    !fs.readdirSync(atualizacao.PASTA_TEMP).some((n) => n.endsWith('.parcial')));

  ok('reaproveita o download já conferido',
    (await atualizacao.baixar(info, null)) === caminho);

  console.log('\n  Download que dá errado');

  atualizacao.limparTemporarios();
  cenario = 'sha-ruim';
  const comShaRuim = await atualizacao.verificar();
  await estoura('sha-256 não bate', () => atualizacao.baixar(comShaRuim, null), 'não confere com o publicado');
  ok('o instalador reprovado foi apagado',
    !fs.existsSync(path.join(atualizacao.PASTA_TEMP, 'Parceria-JB-Setup-9.9.9.exe')));

  atualizacao.limparTemporarios();
  cenario = 'nova';
  truncar = true;
  const inteiro = await atualizacao.verificar();
  await estoura('download truncado', () => atualizacao.baixar(inteiro, null), 'incompleto');
  truncar = false;

  console.log('\n  Sem servidor');

  await new Promise((resolve) => servidor.close(resolve));
  cenario = 'nova';
  await estoura('servidor fora do ar', () => atualizacao.verificar(), 'Verifique sua conexão');

  console.log('\n  Sem endereço configurado');

  // Recarrega o módulo sem PAJB_ORIGEM: é o estado em que o projeto é
  // entregue, e nele a verificação precisa devolver "não configurado" em vez
  // de tentar a rede.
  delete process.env.PAJB_ORIGEM;
  delete require.cache[require.resolve('./atualizacao')];
  const semOrigem = require('./atualizacao');
  const resultado = await semOrigem.verificar();
  ok('ORIGEM vazia → configurado: false', resultado.configurado === false);
  ok('ORIGEM vazia → não há atualização', resultado.ha === false);
  ok('ORIGEM vazia → não vai à rede', semOrigem.ORIGEM === '');

  atualizacao.limparTemporarios();
}

/* ---------- Início ---------- */

app.whenReady().then(() => {
  servidor.listen(0, '127.0.0.1', async () => {
    const porta = servidor.address().port;
    process.env.PAJB_ORIGEM = `http://127.0.0.1:${porta}/`;

    // Só agora: o módulo lê ORIGEM na hora em que é carregado.
    const atualizacao = require('./atualizacao');

    try {
      await rodar(atualizacao);
    } catch (erro) {
      falhou++;
      console.log(`\n  ERRO INESPERADO: ${erro && erro.stack}`);
    }

    console.log(`\n  ${passou} passou, ${falhou} falhou\n`);
    app.exit(falhou ? 1 : 0);
  });
});
