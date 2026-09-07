/* Escape de texto interpolado em HTML. Não substitui validação de URLs. */
(function(){
  'use strict';
  const portal = window.Portal = window.Portal || {};
  portal.escaparHtml = function(texto){
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  };
})();
