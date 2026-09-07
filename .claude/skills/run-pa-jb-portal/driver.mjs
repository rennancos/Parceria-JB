#!/usr/bin/env node
/* Driver do portal PA_JB: dirige o site num Chrome headless via CDP.

   Zero dependência de propósito — o projeto inteiro é assim (ver
   md/01-como-rodar.md), e um driver que exigisse `pnpm add playwright`
   contradiria a premissa de "abre sem build". Node 22+ traz `WebSocket`
   global e `fetch`, que é tudo que o Chrome DevTools Protocol precisa.

   Uso:
     node .claude/skills/run-pa-jb-portal/driver.mjs --smoke
     node .claude/skills/run-pa-jb-portal/driver.mjs ir '#equipe' foto equipe.png
     node .claude/skills/run-pa-jb-portal/driver.mjs        # REPL (stdin)

   Flags:
     --porta N     porta do portal já servido (padrão 8000)
     --visivel     abre o Chrome com janela, para ver acontecendo
     --smoke       roda o roteiro de fumaça e sai 0/1

   Comandos (argv ou uma por linha no stdin):
     ir <hash>          navega para http://localhost:PORTA/<hash> e espera o router
     clique <seletor>   .click() no elemento
     digitar <texto>    insere texto no elemento focado (dispara input)
     tecla <Key>        Enter | Escape | ArrowDown | ArrowUp | ... (evento real)
     js <expr>          avalia e imprime o resultado
     texto <seletor>    imprime o textContent
     conta <seletor>    imprime quantos elementos casam
     visivel <seletor>  imprime true/false (existe e tem caixa na tela)
     espera <expr>      espera a expressão virar truthy (10s)
     foto [arquivo]     PNG em .claude/skills/run-pa-jb-portal/telas/
     erros              imprime o que o console registrou como erro
     sair               fecha tudo                                            */

import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const AQUI = dirname(fileURLToPath(import.meta.url));
const TELAS = join(AQUI, 'telas');

const argv = process.argv.slice(2);
const tirar = (flag) => { const i = argv.indexOf(flag); return i === -1 ? null : argv.splice(i, 1) && flag; };
const valor = (flag, padrao) => { const i = argv.indexOf(flag); if (i === -1) return padrao; return argv.splice(i, 2)[1]; };

const SMOKE   = Boolean(tirar('--smoke'));
const VISIVEL = Boolean(tirar('--visivel'));
const ARQUIVO = Boolean(tirar('--file'));
const ANEXAR  = valor('--anexar', null);
const PORTA   = Number(valor('--porta', 8000));

/* --file reproduz o cenário do duplo clique E do aplicativo Windows: o
   app/principal.js faz `loadFile(index.html)`, ou seja, o Electron roda a
   página em file:// sem uma linha de diferença. É o modo em que as quebras
   deste projeto aparecem — nada aqui pode usar `type="module"` nem fetch de
   arquivo local, e js/documentos.js desiste sozinho. Vale rodar a fumaça nos
   dois modos antes de dar um PR por bom. */
const RAIZ = resolve(AQUI, '../../..');

// Em --anexar o endereço vem do alvo já aberto (o Electron carrega por
// file://), então BASE só é conhecido depois de conectar.
let BASE = ARQUIVO
  ? `file:///${resolve(RAIZ, 'index.html').replace(/\\/g, '/')}`
  : `http://localhost:${PORTA}/`;

/* ---------- Chrome ----------

   O Chrome do Windows não está no PATH; os caminhos abaixo cobrem as duas
   instalações comuns. CHROME=/caminho/para/chrome sobrepõe. */
const CANDIDATOS = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome',
].filter(Boolean);

function acharChrome(){
  const achado = CANDIDATOS.find((c) => existsSync(c));
  if (!achado) throw new Error(`Chrome não encontrado. Tentei:\n  ${CANDIDATOS.join('\n  ')}\nDefina CHROME=<caminho>.`);
  return achado;
}

const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));

/* O Chrome demora a abrir a porta de depuração; /json/version só responde
   depois. Tentar em laço é mais confiável do que chutar um sleep. */
async function esperarDevTools(porta, ate = 20000){
  const limite = Date.now() + ate;
  while (Date.now() < limite){
    try {
      const r = await fetch(`http://127.0.0.1:${porta}/json/version`);
      if (r.ok) return r.json();
    } catch { /* ainda subindo */ }
    await dormir(200);
  }
  throw new Error(`Chrome não abriu a porta de depuração ${porta} em ${ate}ms.`);
}

/* ---------- Sessão CDP ---------- */

class Sessao {
  #ws; #id = 0; #pendentes = new Map();
  erros = [];

  /* --anexar: nada é lançado, a sessão se pendura num CDP que já existe. É
     assim que o MESMO driver dirige o aplicativo Windows — o Electron abre a
     mesma porta de depuração que o Chrome (`electron . --remote-debugging-port=9444`). */
  static async anexar(porta){
    const alvos = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json();
    const pagina = alvos.find((a) => a.type === 'page');
    if (!pagina) throw new Error(`Nenhuma página no CDP da porta ${porta}. O app subiu?`);

    BASE = pagina.url.split('#')[0];

    const s = new Sessao();
    await s.#conectar(pagina.webSocketDebuggerUrl);
    await s.cmd('Page.enable');
    await s.cmd('Runtime.enable');
    return s;
  }

  static async abrir(){
    const perfil = await mkdtemp(join(tmpdir(), 'pajb-chrome-'));
    const porta = 9000 + Math.floor(Math.random() * 900);   // evita colidir com outra sessão

    const chrome = spawn(acharChrome(), [
      VISIVEL ? '--new-window' : '--headless=new',
      `--remote-debugging-port=${porta}`,
      `--user-data-dir=${perfil}`,
      '--no-first-run', '--no-default-browser-check',
      '--disable-gpu', '--disable-extensions',
      '--window-size=1400,900',
      'about:blank',
    ], { stdio: 'ignore' });

    await esperarDevTools(porta);

    // A aba já existe (about:blank): conecto direto no alvo dela, o que evita
    // o vaivém de sessionId que a conexão pelo alvo do navegador exigiria.
    const alvos = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json();
    const pagina = alvos.find((a) => a.type === 'page');
    if (!pagina) throw new Error('Chrome subiu sem nenhuma aba.');

    const s = new Sessao();
    s.perfil = perfil;
    s.chrome = chrome;
    await s.#conectar(pagina.webSocketDebuggerUrl);
    await s.cmd('Page.enable');
    await s.cmd('Runtime.enable');
    return s;
  }

  #conectar(url){
    this.#ws = new WebSocket(url);
    this.#ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);

      if (msg.id !== undefined){
        const p = this.#pendentes.get(msg.id);
        this.#pendentes.delete(msg.id);
        if (!p) return;
        return msg.error ? p.rej(new Error(msg.error.message)) : p.ok(msg.result);
      }

      // Erro de JS na página é o achado mais útil que um driver pode entregar:
      // guardo tudo e o comando `erros` despeja no fim.
      if (msg.method === 'Runtime.exceptionThrown'){
        this.erros.push(msg.params.exceptionDetails.exception?.description
          || msg.params.exceptionDetails.text);
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error'){
        this.erros.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
      }
    });

    return new Promise((ok, rej) => {
      this.#ws.addEventListener('open', ok, { once: true });
      this.#ws.addEventListener('error', () => rej(new Error('WebSocket do CDP falhou.')), { once: true });
    });
  }

  cmd(method, params = {}){
    const id = ++this.#id;
    this.#ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, rej) => this.#pendentes.set(id, { ok, rej }));
  }

  async js(expressao){
    const r = await this.cmd('Runtime.evaluate', {
      expression: expressao, returnByValue: true, awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(`js falhou: ${r.exceptionDetails.text} — ${expressao}`);
    return r.result.value;
  }

  async espera(expressao, ate = 10000){
    const limite = Date.now() + ate;
    while (Date.now() < limite){
      if (await this.js(`Boolean(${expressao})`)) return true;
      await dormir(100);
    }
    throw new Error(`espera estourou (${ate}ms): ${expressao}`);
  }

  // Em --anexar não há `chrome` nem `perfil`: o app é de quem o abriu, e
  // matá-lo seria fechar a janela na cara de quem está usando.
  async fechar(){
    try { this.#ws?.close(); } catch { /* já caiu */ }
    if (!this.chrome) return;
    this.chrome.kill();
    await dormir(300);
    await rm(this.perfil, { recursive: true, force: true }).catch(() => {});
  }
}

/* ---------- Comandos ---------- */

/* O portal é uma SPA de hash (js/router.js): trocar o hash não recarrega, o
   router redesenha. Esperar o <main> ter conteúdo é o sinal de "pronto" que
   vale para os dois casos — carga inicial e troca de rota. */
async function ir(s, hash = ''){
  const destino = BASE + (hash.startsWith('#') ? hash : hash ? `#${hash}` : '');
  const atual = await s.js('location.href').catch(() => '');

  if (atual && atual.split('#')[0] === destino.split('#')[0]){
    await s.js(`location.hash = ${JSON.stringify(hash || '')}`);
  } else {
    await s.cmd('Page.navigate', { url: destino });
    await s.espera('document.readyState === "complete"');
  }

  await s.espera('document.querySelector("main")?.textContent.trim().length > 0');
  await dormir(150);   // deixa a animação de troca de view assentar
  return destino;
}

async function foto(s, nome = `tela-${Date.now()}.png`){
  await mkdir(TELAS, { recursive: true });
  const { data } = await s.cmd('Page.captureScreenshot', { format: 'png' });
  const caminho = join(TELAS, nome.endsWith('.png') ? nome : `${nome}.png`);
  await writeFile(caminho, Buffer.from(data, 'base64'));
  return caminho;
}

/* Input.dispatchKeyEvent e não um KeyboardEvent sintético: a busca escuta
   keydown de verdade (setas, Enter, Esc) e evento fabricado por JS não tem
   `isTrusted`, o que já basta para alguns caminhos não dispararem. */
const CODIGOS = {
  Enter: 13, Escape: 27, ArrowDown: 40, ArrowUp: 38, Tab: 9,
  Home: 36, End: 35, Backspace: 8,
};

async function tecla(s, nome){
  const codigo = CODIGOS[nome] ?? 0;
  for (const type of ['keyDown', 'keyUp']){
    await s.cmd('Input.dispatchKeyEvent', {
      type, key: nome, code: nome,
      windowsVirtualKeyCode: codigo, nativeVirtualKeyCode: codigo,
    });
  }
  await dormir(80);
}

const COMANDOS = {
  ir:      (s, a) => ir(s, a),
  clique:  async (s, a) => { await s.js(`document.querySelector(${JSON.stringify(a)}).click()`); await dormir(200); return 'ok'; },
  digitar: async (s, a) => { await s.cmd('Input.insertText', { text: a }); await dormir(250); return 'ok'; },
  tecla:   async (s, a) => { await tecla(s, a); return 'ok'; },
  js:      (s, a) => s.js(a),
  texto:   (s, a) => s.js(`document.querySelector(${JSON.stringify(a)})?.textContent.trim().slice(0, 300) ?? null`),
  conta:   (s, a) => s.js(`document.querySelectorAll(${JSON.stringify(a)}).length`),
  visivel: (s, a) => s.js(`(() => { const e = document.querySelector(${JSON.stringify(a)}); return Boolean(e && e.getClientRects().length); })()`),
  espera:  (s, a) => s.espera(a),
  foto:    (s, a) => foto(s, a),
  erros:   (s) => (s.erros.length ? s.erros : 'nenhum'),
};

async function executar(s, linha){
  const [nome, ...resto] = linha.trim().split(/\s+/);
  if (!nome) return;
  if (nome === 'sair') return 'SAIR';

  const fn = COMANDOS[nome];
  if (!fn) throw new Error(`comando desconhecido: ${nome} (tenho: ${Object.keys(COMANDOS).join(', ')}, sair)`);

  const saida = await fn(s, resto.join(' '));
  console.log(`${nome} ${resto.join(' ')} -> ${typeof saida === 'object' ? JSON.stringify(saida) : saida}`);
}

/* ---------- Fumaça ----------

   Cobre o que quebra de verdade neste portal: o router de hash desenhando
   cada view, a busca (dialog + listbox) abrindo, filtrando e FECHANDO — este
   último é regressão real, a janela ficava na tela depois do close porque o
   CSS sobrescrevia o display do <dialog>. */
async function fumaca(s){
  const falhas = [];
  const checar = async (rotulo, fn) => {
    try { await fn(); console.log(`  ok   ${rotulo}`); }
    catch (e){ falhas.push(`${rotulo}: ${e.message}`); console.log(`  FALHA ${rotulo}: ${e.message}`); }
  };

  console.log(`\nfumaça em ${BASE}\n`);

  await checar('home carrega', async () => {
    await ir(s);
    await s.espera('document.querySelectorAll("a[href^=\\"#\\"]").length > 0');
  });

  const rotas = await s.js('Object.keys(window.PAGINAS || {})');
  if (!rotas?.length) falhas.push('PAGINAS vazio — js/paginas.js não carregou');

  for (const rota of rotas || []){
    await checar(`rota #${rota}`, async () => {
      await ir(s, `#${rota}`);
      const vazio = await s.js('document.querySelector("main").textContent.trim().length < 20');
      if (vazio) throw new Error('main praticamente vazio');
    });
  }

  await checar('busca abre', async () => {
    await ir(s);
    await s.js('window.abrirBusca()');
    await s.espera('document.querySelector(".busca-janela")?.open');
  });

  await checar('busca filtra', async () => {
    await s.cmd('Input.insertText', { text: 'equipe' });
    await s.espera('document.querySelectorAll(".busca-item").length > 0', 4000);
  });

  await checar('busca navega no teclado', async () => {
    await tecla(s, 'ArrowDown');
    const ativo = await s.js('document.querySelector("#busca-entrada").getAttribute("aria-activedescendant")');
    if (!ativo) throw new Error('aria-activedescendant não acompanhou a seta');
  });

  // A regressão que motivou o driver: fechada, a janela não pode continuar na tela.
  await checar('busca some ao fechar (regressão)', async () => {
    await tecla(s, 'Escape');
    await s.espera('!document.querySelector(".busca-janela")?.open');
    const fantasma = await s.js(
      '(() => { const j = document.querySelector(".busca-janela"); return Boolean(j && j.getClientRects().length); })()');
    if (fantasma) throw new Error('janela fechada continua ocupando espaço na tela — ver css/busca.css');
  });

  await checar('sem erro de JS no console', async () => {
    if (s.erros.length) throw new Error(s.erros.join(' | '));
  });

  const modo = ANEXAR ? 'electron' : ARQUIVO ? 'file' : 'http';
  console.log(`\ntela: ${await foto(s, `fumaca-${modo}.png`)}`);
  console.log(falhas.length ? `\n${falhas.length} FALHA(S)\n` : '\ntudo passou\n');
  return falhas.length;
}

/* ---------- Entrada ---------- */

async function main(){
  // Falhar aqui evita um Chrome órfão tentando carregar uma porta morta.
  // Em --file não há servidor para checar: o arquivo ou existe, ou o Chrome
  // mostra a própria página de erro e a fumaça acusa `main` vazio.
  const vivo = ARQUIVO || ANEXAR || await fetch(BASE).then((r) => r.ok).catch(() => false);
  if (!vivo){
    console.error(`Nada respondendo em ${BASE}. Suba o portal antes:\n` +
      `  pnpm dev                              (estático)\n` +
      `  node servidor/servidor.js --porta ${PORTA}   (estático + API de edição)`);
    process.exit(2);
  }

  const s = ANEXAR ? await Sessao.anexar(Number(ANEXAR)) : await Sessao.abrir();
  let codigo = 0;

  try {
    if (SMOKE){
      codigo = (await fumaca(s)) ? 1 : 0;
    } else if (argv.length){
      // Uma linha só: `ir #equipe foto equipe.png` são dois comandos. Quebro
      // pelos nomes conhecidos para não exigir aspas em cada um.
      const linhas = [];
      for (const t of argv){
        if (COMANDOS[t] || t === 'sair') linhas.push(t);
        else linhas[linhas.length - 1] += ` ${t}`;
      }
      for (const l of linhas) if (await executar(s, l) === 'SAIR') break;
    } else {
      console.log(`REPL — comandos: ${Object.keys(COMANDOS).join(', ')}, sair`);
      const rl = createInterface({ input: process.stdin });
      for await (const linha of rl){
        try { if (await executar(s, linha) === 'SAIR') break; }
        catch (e){ console.log(`erro: ${e.message}`); }
      }
    }
  } catch (e){
    console.error(`erro: ${e.message}`);
    codigo = 1;
  } finally {
    await s.fechar();
  }

  process.exit(codigo);
}

main();
