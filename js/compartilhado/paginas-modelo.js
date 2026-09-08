/* Contrato compartilhado por renderização, busca e edição.
   Scripts clássicos preservam a abertura por file://. */
(function(){
  'use strict';

  /**
   * @typedef {Object} Bloco
   * @property {string} tipo
   * @property {Array} [itens]
   * @property {string} [chave] Vínculo com o acervo editável.
   * @property {string} [titulo]
   */

  /** @param {Bloco & {blocos?: Bloco[]}} secao @returns {Bloco[]} */
  function blocosDaSecao(secao){
    // DEPENDÊNCIA: paginas.js e busca/indice.js leem os mesmos objetos que
    // documentos/acervo.js modifica. Clonar aqui faria a projeção da edição
    // desaparecer ao renderizar a seção simplificada. Teste: conteudo.test.cjs.
    return Array.isArray(secao.blocos) ? secao.blocos : [secao];
  }

  window.Portal.paginasModelo = { blocosDaSecao };
})();
