/* Chrome/Edge headless via CDP, sem dependências instaladas no projeto.
   Este helper requer Node 22+ (WebSocket nativo) e um navegador local. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

async function navegador(){
  if (typeof WebSocket === 'undefined') throw Error('test:browser requer Node 22+; npm test continua compatível com Node 18+.');
  const executavel = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].find(p => p && fs.existsSync(p));
  if (!executavel) throw Error('Defina CHROME_PATH para um Chrome/Edge instalado.');
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'pajb-browser-'));
  const processo = spawn(executavel, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking', '--disable-extensions',
    '--remote-debugging-port=0', '--user-data-dir=' + pasta, 'about:blank'], { windowsHide: true });
  let socket;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let stderr = '';
      const limite = setTimeout(() => reject(Error('Navegador não iniciou: ' + stderr.slice(-1200))), 15000);
      processo.once('error', e => { clearTimeout(limite); reject(e); });
      processo.once('exit', code => { clearTimeout(limite); reject(Error('Navegador encerrou: ' + code)); });
      processo.stderr.on('data', data => {
        stderr += data;
        const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match){ clearTimeout(limite); resolve(match[1]); }
      });
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    let numero = 0, sessao;
    const pendentes = new Map();
    const erros = [];
    socket.addEventListener('message', evento => {
      const mensagem = JSON.parse(evento.data);
      if (mensagem.method === 'Runtime.exceptionThrown') erros.push(mensagem.params.exceptionDetails.exception?.description || mensagem.params.exceptionDetails.text);
      const item = pendentes.get(mensagem.id);
      if (!item) return;
      clearTimeout(item.timer); pendentes.delete(mensagem.id);
      if (mensagem.error) item.reject(Error(JSON.stringify(mensagem.error)));
      else item.resolve(mensagem.result);
    });
    function enviar(method, params = {}, raiz = false){
      return new Promise((resolve, reject) => {
        const id = ++numero;
        const timer = setTimeout(() => { pendentes.delete(id); reject(Error('Timeout CDP: ' + method)); }, 15000);
        pendentes.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params, ...(sessao && !raiz ? { sessionId: sessao } : {}) }));
      });
    }
    const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
    ({ sessionId: sessao } = await enviar('Target.attachToTarget', { targetId, flatten: true }));
    await enviar('Runtime.enable'); await enviar('Page.enable');
    async function avaliar(expression){
      const result = await enviar('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    }
    async function esperar(expression){
      const inicio = Date.now();
      while (Date.now() - inicio < 7000){
        if (await avaliar(expression)) return;
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      throw Error('Condição não satisfeita: ' + expression);
    }
    return { pasta, erros, enviar, avaliar, esperar,
      async navegar(url){
        await enviar('Page.navigate', { url: 'about:blank' });
        await esperar('location.href === "about:blank" && document.readyState === "complete"');
        await enviar('Page.navigate', { url });
        await esperar('location.href === ' + JSON.stringify(url) + ' && document.readyState === "complete" && !!window.Portal?.buscaMotor');
      },
      async fechar(){
        try { await enviar('Browser.close', {}, true); } catch {}
        socket.close();
        if (processo.exitCode === null) processo.kill();
      }
    };
  } catch (erro) {
    socket?.close(); processo.kill(); throw erro;
  }
}

module.exports = { navegador };
