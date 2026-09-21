/* Catálogo de provedores e contrato dos adapters.

   Cada adapter exporta:
     validarCredencial(chave)  -> Promise<ResultadoValidacao>
     listarModelos(chave)      -> Promise<AIModelo[]>   (op oficial barata: valida E lista)
     gerarTexto(pedido)        -> Promise<AIResposta>
     streamTexto?(pedido)      -> AsyncIterable<string>  (opcional)

   @typedef {{status:'valida'|'invalida'|'indisponivel', mensagem?:string}} ResultadoValidacao
   @typedef {{id:string}} AIModelo
   @typedef {{papel:'user'|'assistant'|'system', texto:string}} AIMensagem
   @typedef {{chave:string, modelo:string, mensagens:AIMensagem[], sinal?:AbortSignal}} AIPedido
   @typedef {{texto:string, modelo:string}} AIResposta

   A lista `modelos` limita o que o portal pode oferecer. */
'use strict';

const { ErroDeUso } = require('../erros');

const PROVEDORES = {
  openai: {
    rotulo: 'OpenAI',
    instrucoesUrl: 'https://platform.openai.com/api-keys',
    modelos: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
    adapter: () => require('./openai')
  },
  anthropic: {
    rotulo: 'Anthropic Claude',
    instrucoesUrl: 'https://console.anthropic.com/settings/keys',
    modelos: ['claude-haiku-4-5', 'claude-sonnet-5', 'claude-opus-5'],
    adapter: () => require('./anthropic')
  },
  gemini: {
    rotulo: 'Google Gemini',
    instrucoesUrl: 'https://aistudio.google.com/apikey',
    modelos: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    adapter: () => require('./gemini')
  }
};

/* Mock para testes: NÃO aparece no catálogo a menos que PAJB_IA_MOCK=1, e
   NUNCA em produção — mesmo com a variável setada por engano, NODE_ENV=production
   o ignora. Existe para os testes não consumirem API paga (requisito 17) e para
   exercitar validação/stream/cancelamento sem rede. */
const MOCK = {
  rotulo: 'Mock (teste)',
  instrucoesUrl: '',
  modelos: ['mock-rapido', 'mock-esperto'],
  adapter: () => require('./mock')
};

function catalogo(){
  const c = Object.assign({}, PROVEDORES);
  if (process.env.PAJB_IA_MOCK === '1' && process.env.NODE_ENV !== 'production') c.mock = MOCK;
  return c;
}

function ehProvedor(id){
  return Object.prototype.hasOwnProperty.call(catalogo(), id);
}

function meta(id){
  const p = catalogo()[id];
  if (!p) throw new ErroDeUso('Provedor não suportado.', 400);
  return p;
}

function adapter(id){
  return meta(id).adapter();
}

function modeloPermitido(id, modelo){
  return meta(id).modelos.includes(modelo);
}

// O que a interface pode mostrar: id, rótulo, link oficial e a allowlist de
// modelos. Nunca credencial, nunca URL de endpoint (essa mora no adapter).
function publico(){
  return Object.entries(catalogo()).map(([id, p]) => ({
    id, rotulo: p.rotulo, instrucoesUrl: p.instrucoesUrl, modelos: p.modelos
  }));
}

module.exports = { catalogo, ehProvedor, meta, adapter, modeloPermitido, publico };
