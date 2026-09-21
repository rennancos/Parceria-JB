/* Integração opcional com o serviço de IA. A chamada sai pelo backend. */
'use strict';

const { ErroDeUso } = require('./erros');

/* Configuração lida na inicialização do processo. */
const URL_IA = (process.env.PAJB_IA_URL || '').trim();
const TOKEN = (process.env.PAJB_IA_TOKEN || '').trim();
const TIMEOUT = Number(process.env.PAJB_IA_TIMEOUT_MS) > 0
  ? Number(process.env.PAJB_IA_TIMEOUT_MS)
  : 20000;

// Falha no boot, não na primeira pergunta: endereço errado precisa aparecer
// para quem sobe o serviço, não para quem usa o portal.
if (URL_IA && !/^https?:\/\//i.test(URL_IA)){
  throw new Error('PAJB_IA_URL deve comecar com http:// ou https://.');
}

const LIMITE_PERGUNTA = 2000;
const LIMITE_CONTEXTO = 10;

function disponivel(){
  return Boolean(URL_IA);
}

/* ---------- Contrato de entrada ----------

   Validado aqui, e não só no formulário: a rota também aceita chamada direta.
   Mesma postura de `texto` em dados.js. */

function validarPergunta(valor){
  const pergunta = String(valor ?? '').trim().replace(/\s+/g, ' ');
  if (!pergunta) throw new ErroDeUso('Escreva a pergunta.');
  if (pergunta.length > LIMITE_PERGUNTA){
    throw new ErroDeUso(`A pergunta passa de ${LIMITE_PERGUNTA} caracteres.`);
  }
  return pergunta;
}

/* Contexto é DICA de onde procurar — chave de bloco, nome de página, número de
   chamado. Texto curto, lista curta. Não é lugar para despejar o conteúdo da
   página: quem sabe onde o conhecimento está é o serviço de IA, não o portal. */
function validarContexto(valor){
  if (valor == null) return [];
  if (!Array.isArray(valor)) throw new ErroDeUso('O contexto deve ser uma lista.');
  if (valor.length > LIMITE_CONTEXTO){
    throw new ErroDeUso(`Envie no maximo ${LIMITE_CONTEXTO} itens de contexto.`);
  }
  return valor.map((item) => String(item ?? '').trim().slice(0, 200)).filter(Boolean);
}

/* ---------- Contrato de saída ----------

   O portal fala este formato, seja quem for que responda do outro lado:

     { resposta: string,
       fontes: [{ titulo, tipo, href, id }],
       confianca?: number,
       metadados?: object }

   `tipo` é o vocabulário do portal. Fonte que chegar com tipo desconhecido vira
   'documento': mostrar a fonte com rótulo genérico é melhor do que descartá-la. */
const TIPOS_FONTE = ['documento', 'procedimento', 'incidente', 'servico', 'pessoa'];

/* Mesma lista de permitidos de validarHref em dados.js, pelo mesmo motivo: a
   resposta da IA vira link na página, e href é executável. `javascript:`,
   `data:` e caminho para fora de docs/ caem fora — o item continua aparecendo,
   só sem virar link. */
function hrefSeguro(valor){
  const href = String(valor ?? '').trim();
  if (!href || href.length > 500) return '';
  if (/^docs\/[A-Za-z0-9._-]+$/.test(href)) return href;
  if (/^https?:\/\/[^\s<>"']+$/i.test(href)) return href;
  return '';
}

function fonte(bruta){
  const titulo = String(bruta?.titulo ?? bruta?.title ?? '').trim().slice(0, 200);
  if (!titulo) return null;   // fonte sem rótulo não é clicável nem citável

  const tipo = String(bruta?.tipo ?? bruta?.type ?? '').trim().toLowerCase();

  return {
    titulo,
    tipo: TIPOS_FONTE.includes(tipo) ? tipo : 'documento',
    href: hrefSeguro(bruta?.href ?? bruta?.url),
    id: String(bruta?.id ?? '').trim().slice(0, 64)
  };
}

/* O ÚNICO ponto que muda se o serviço de IA falar outro dialeto — é aqui que o
   próximo desenvolvedor mexe, e em lugar nenhum além daqui. Aceita os dois
   nomes mais prováveis de cada campo (resposta/answer, fontes/sources) para
   que a primeira integração não dependa de acertar o palpite. */
function mapear(bruta){
  if (!bruta || typeof bruta !== 'object' || Array.isArray(bruta)){
    throw new ErroDeUso('O assistente respondeu num formato inesperado.', 502);
  }

  const resposta = String(bruta.resposta ?? bruta.answer ?? '').trim();
  if (!resposta) throw new ErroDeUso('O assistente respondeu sem conteudo.', 502);

  const lista = bruta.fontes ?? bruta.sources;
  const fontes = Array.isArray(lista)
    ? lista.map(fonte).filter(Boolean).slice(0, 20)
    : [];

  const confianca = Number(bruta.confianca ?? bruta.confidence);
  const metadados = bruta.metadados ?? bruta.metadata;

  return {
    resposta: resposta.slice(0, 20000),
    fontes,
    ...(Number.isFinite(confianca) ? { confianca } : {}),
    ...(metadados && typeof metadados === 'object' && !Array.isArray(metadados)
      ? { metadados }
      : {})
  };
}

/* ---------- Auditoria ----------

   Uma linha no console por consulta: quem, quanto tempo, deu certo, quantas
   fontes. É o mínimo que responde "quem perguntou e quando" sem banco nem
   telemetria — e o suficiente para que trocar por gravação em arquivo, depois,
   seja mexer numa função só.

   A PERGUNTA NÃO ENTRA NA LINHA de propósito: log de portal interno acaba em
   arquivo compartilhado, e o que a pessoa perguntou é dela. */
function auditar({ login, ms, fontes, erro }){
  console.log('[ia]', new Date().toISOString(), login, `${ms}ms`,
    erro ? `erro=${erro}` : `ok fontes=${fontes}`);
}

/* ---------- Consulta ----------

   `usuario` vem da sessão já resolvida em servidor.js. Só login e papel saem
   daqui: é o que a IA precisa para decidir o que essa pessoa pode ver. */
async function consultar({ pergunta, contexto, usuario }){
  if (!disponivel()){
    throw new ErroDeUso('O assistente ainda nao esta configurado neste portal.', 503);
  }

  const corpo = {
    pergunta: validarPergunta(pergunta),
    contexto: validarContexto(contexto),
    usuario: { login: usuario.login, papel: usuario.papel }
  };

  const inicio = Date.now();

  try {
    // Sem timeout, uma IA lenta prende a conexão do portal até o cliente
    // desistir. AbortSignal.timeout é do Node, não precisa de dependência.
    const res = await fetch(URL_IA, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        'Content-Type': 'application/json',
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
      },
      body: JSON.stringify(corpo)
    });

    // O texto de erro da IA não é repassado: pode trazer detalhe interno dela,
    // e quem está no portal não tem o que fazer com isso.
    if (!res.ok) throw new ErroDeUso('O assistente nao conseguiu responder agora.', 502);

    const resultado = mapear(await res.json());
    auditar({ login: usuario.login, ms: Date.now() - inicio, fontes: resultado.fontes.length });
    return resultado;
  } catch (erro) {
    auditar({ login: usuario.login, ms: Date.now() - inicio, erro: erro.name });
    if (erro instanceof ErroDeUso) throw erro;
    if (erro.name === 'TimeoutError' || erro.name === 'AbortError'){
      throw new ErroDeUso('O assistente demorou demais para responder.', 504);
    }
    // Rede fora, DNS errado, JSON quebrado: para quem pergunta é tudo a mesma
    // coisa — o assistente não está no ar e o resto do portal continua.
    throw new ErroDeUso('O assistente esta indisponivel no momento.', 503);
  }
}

module.exports = { disponivel, consultar, mapear, LIMITE_PERGUNTA, TIPOS_FONTE };
