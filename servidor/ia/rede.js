/* Uma única saída HTTP para os adapters de IA. Usa o `fetch` global do Node
   (>=18, já usado em servidor/ia.js antigo) — sem dependência, sem SDK.

   Regras que valem para TODO adapter:
   - timeout por variável de ambiente (PAJB_IA_TIMEOUT_MS), padrão 20s;
   - erro de rede/timeout vira ErroDeUso sanitizado (nunca vaza detalhe interno);
   - o adapter decide o significado do status HTTP (401 = credencial recusada,
     etc.), então esta função NÃO lança por status — só por falha de transporte. */
'use strict';

const { ErroDeUso } = require('../erros');

const TIMEOUT = Number(process.env.PAJB_IA_TIMEOUT_MS) > 0
  ? Number(process.env.PAJB_IA_TIMEOUT_MS)
  : 20000;

async function chamar(url, opcoes = {}, sinal){
  try {
    return await fetch(url, Object.assign({}, opcoes, {
      signal: sinal || AbortSignal.timeout(TIMEOUT)
    }));
  } catch (erro) {
    if (erro && (erro.name === 'TimeoutError' || erro.name === 'AbortError')){
      // AbortError por cancelamento do cliente é relançado como está (o chamador
      // trata); timeout vira 504.
      if (sinal && sinal.aborted) throw erro;
      throw new ErroDeUso('O provedor demorou demais para responder.', 504);
    }
    // Rede fora, DNS errado, TLS: para quem usa é tudo "indisponível".
    throw new ErroDeUso('O provedor de IA está indisponível no momento.', 503);
  }
}

module.exports = { chamar, TIMEOUT };
