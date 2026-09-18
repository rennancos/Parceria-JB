/* Smoke OPCIONAL dos adapters de IA contra as APIs REAIS.

   NÃO faz parte do `npm test`: custa uma chamada de rede com a SUA credencial.
   É o único jeito de confirmar que a resposta real do provedor bate com o que
   os adapters esperam — o `npm test` prova o código contra formas de resposta
   oficiais stubadas, não contra a API ao vivo.

   A chave vem por variável de ambiente e NUNCA é impressa.

     PAJB_SMOKE_CHAVE=sk-...   node ferramentas/smoke-ia.js openai
     PAJB_SMOKE_CHAVE=...      node ferramentas/smoke-ia.js anthropic claude-opus-5 "diga oi em uma palavra"
     PAJB_SMOKE_CHAVE=AIza...  node ferramentas/smoke-ia.js gemini gemini-2.5-flash "diga oi"

   Sai 0 se validou; 1 se a credencial/rede falhou; 2 se o uso está errado. */
'use strict';

const reg = require('../servidor/ia/registro');

const provider = process.argv[2];
const modelo = process.argv[3];
const pergunta = process.argv[4];
const chave = (process.env.PAJB_SMOKE_CHAVE || '').trim();

if (!provider || !reg.ehProvedor(provider)){
  console.error('Uso: node ferramentas/smoke-ia.js <openai|anthropic|gemini> [modelo] ["pergunta"]');
  process.exit(2);
}
if (!chave){
  console.error('Defina PAJB_SMOKE_CHAVE com a sua credencial (ela nunca é impressa).');
  process.exit(2);
}

const adapter = reg.adapter(provider);

(async () => {
  let vivos;
  try {
    vivos = await adapter.listarModelos(chave);          // op oficial barata: valida E lista
  } catch (erro) {
    console.error(`validação falhou: ${erro.status || ''} ${erro.message}`);
    process.exit(1);
  }
  const permitidos = reg.meta(provider).modelos;
  const disponiveis = vivos.map((m) => m.id).filter((id) => permitidos.includes(id));
  console.log(`válida. modelos permitidos disponíveis nesta conta: ${disponiveis.join(', ') || '(nenhum)'}`);

  if (modelo && pergunta){
    if (!reg.modeloPermitido(provider, modelo)){
      console.error(`modelo "${modelo}" não está na allowlist deste provedor.`);
      process.exit(1);
    }
    try {
      const r = await adapter.gerarTexto({ chave, modelo, mensagens: [{ papel: 'user', texto: pergunta }] });
      console.log('resposta:', r.texto);
    } catch (erro) {
      console.error(`geração falhou: ${erro.status || ''} ${erro.message}`);
      process.exit(1);
    }
  }
})();
