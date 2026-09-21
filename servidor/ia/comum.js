/* Peças que todo adapter de provedor repetia. Ficam aqui para a correção
   acontecer num lugar só: `validarCredencial` era idêntico byte a byte em
   openai.js, anthropic.js e gemini.js, e `traduzirFalha` só mudava a lista de
   status que significa "credencial recusada".

   O que NÃO vem para cá: URL, formato do corpo e leitura da resposta. É o que
   cada provedor tem de próprio, e é a razão de o adapter existir. */
'use strict';

const { ErroDeUso } = require('../erros');

/* 401/403 = credencial recusada; o resto o portal trata como indisponibilidade
   do provedor. A lista é parâmetro porque o Gemini responde 400 para chave
   errada, e não 401. */
function falhaDoProvedor(res, statusDeCredencial = [401, 403]){
  if (statusDeCredencial.includes(res.status))
    return new ErroDeUso('Credencial recusada pelo provedor.', 401);
  return new ErroDeUso('O provedor de IA não conseguiu responder agora.', 502);
}

/* validarCredencial em cima de listarModelos: a operação oficial barata que
   valida e lista ao mesmo tempo. Cada adapter passa a sua própria listagem. */
function validarPor(listarModelos){
  return async function validarCredencial(chave){
    try {
      await listarModelos(chave);
      return { status: 'valida' };
    } catch (erro) {
      if (erro instanceof ErroDeUso && erro.status === 401)
        return { status: 'invalida', mensagem: erro.message };
      return { status: 'indisponivel', mensagem: 'Não foi possível validar agora.' };
    }
  };
}

/* Lista do provedor -> [{ id }], descartando entrada sem id. `nomeDe` existe
   porque o Gemini devolve o id em `name`, com prefixo, e não em `id`. */
function idsDe(lista, nomeDe = (m) => m && m.id){
  return (Array.isArray(lista) ? lista : [])
    .map((m) => ({ id: String(nomeDe(m) || '') }))
    .filter((m) => m.id);
}

module.exports = { falhaDoProvedor, validarPor, idsDe };
