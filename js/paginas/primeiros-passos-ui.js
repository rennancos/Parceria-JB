(function(){
  'use strict';

  const normalizar = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function iniciar(){
    const pagina = document.querySelector('.primeiros-passos');
    if (!pagina || pagina.dataset.uiPronta) return;
    pagina.dataset.uiPronta = 'true';

    const input = pagina.querySelector('[data-onboarding-search]');
    const status = pagina.querySelector('[data-onboarding-status]');
    const itens = [...pagina.querySelectorAll('[data-onboarding-item]')];

    /* Contêiner que só existe para segurar itens. Sem isto a busca esvaziava a
       página mas deixava as cascas: sete <summary> de setor e duas seções sem
       nada dentro. Quem não tem item nenhum (um bloco de notas, por exemplo)
       fica de fora da lista — não é resultado, é texto da página. */
    const caixas = [...pagina.querySelectorAll('.page-section, .page-block, .onboarding-group')]
      .filter((caixa) => caixa.querySelector('[data-onboarding-item]'));

    function filtrar(){
      const busca = normalizar(input.value.trim());
      let visiveis = 0;
      itens.forEach((item) => {
        const grupo = item.closest('.onboarding-group');
        const grupoTexto = grupo ? grupo.querySelector('summary')?.textContent : '';
        const corresponde = !busca || normalizar(`${item.dataset.search} ${grupoTexto}`).includes(busca);
        item.hidden = !corresponde;
        if (corresponde) visiveis += 1;
        if (grupo && busca && corresponde) grupo.open = true;
      });

      caixas.forEach((caixa) => {
        caixa.hidden = !!busca && !caixa.querySelector('[data-onboarding-item]:not([hidden])');
      });

      /* Liga o contato dentro do card do fabricante enquanto há busca. É o que
         faltava para "buscar pelo contato" devolver o contato, e não só o nome
         do sistema. Fora da busca, o card volta a ser só o nome e a ficha
         continua sendo assunto da janela. */
      pagina.classList.toggle('buscando', !!busca);

      status.textContent = busca ? `${visiveis} resultado${visiveis === 1 ? '' : 's'}` : '';
    }

    input.addEventListener('input', filtrar);
    input.addEventListener('search', filtrar);
  }

  document.addEventListener('pagina:render', iniciar);
  document.addEventListener('DOMContentLoaded', iniciar);
})();
