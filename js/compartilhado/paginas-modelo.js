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
    // Preserva a referência: a edição precisa atualizar a seção simplificada.
    return Array.isArray(secao.blocos) ? secao.blocos : [secao];
  }

  window.Portal.paginasModelo = { blocosDaSecao };
})();
