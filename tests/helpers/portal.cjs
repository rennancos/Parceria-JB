const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const raiz = path.resolve(__dirname, '../..');

// CONTRATO DE TESTE: simula apenas o DOM necessário aos módulos puros, sem
// layout, foco ou dialog real. Esses comportamentos pertencem a browser.cjs.
// Manter a ordem dos scripts compatível com index.html ao ampliar a simulação.
function ambiente(extras = {}){
  const eventos = new Map();
  const document = {
    querySelectorAll: () => [], querySelector: () => null, getElementById: () => null,
    addEventListener(nome, fn){
      if (!eventos.has(nome)) eventos.set(nome, []);
      eventos.get(nome).push(fn);
    },
    dispatchEvent(evento){
      for (const fn of eventos.get(evento.type) || []) fn(evento);
    }
  };
  const contexto = { document, location: { hash: '', protocol: 'file:' },
    CustomEvent: class { constructor(type, opcoes = {}){ this.type = type; this.detail = opcoes.detail; } },
    addEventListener: document.addEventListener, scrollTo(){}, setTimeout, clearTimeout, ...extras };
  contexto.window = contexto;
  vm.createContext(contexto);
  return { contexto, carregar(...arquivos){
    for (const arquivo of arquivos){
      vm.runInContext(fs.readFileSync(path.join(raiz, arquivo), 'utf8'), contexto, { filename: arquivo });
    }
    return contexto.Portal;
  } };
}

function adiado(){
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}

function resposta(corpo, status = 200, tipo = 'application/json'){
  return { ok: status >= 200 && status < 300, status, headers: { get: () => tipo }, json: async () => corpo };
}

module.exports = { ambiente, adiado, resposta, raiz };
