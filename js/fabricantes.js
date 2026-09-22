/* Janela de contato do fabricante.

   A página lista só o nome de cada sistema; a ficha inteira (e-mail, telefone,
   site, número de série) abre aqui, numa janela por vez. São 48 fornecedores —
   com todas as fichas abertas a seção virava uma rolagem interminável.

   É <dialog> modal, como a busca (js/busca.js) e a edição
   (js/documentos/dialogo.js): ::backdrop, foco preso dentro e Esc são do
   navegador, não reimplementados aqui.

   Um listener só, no documento, em vez de um por botão: o router troca o HTML
   da página inteira a cada navegação, e listeners presos aos botões morreriam
   junto. Ver js/router.js. */
(function(){
  'use strict';

  let janela = null;
  let origem = null;   // quem abriu, para o foco voltar ao fechar

  const ICONE_FECHAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    + 'stroke-width="2" stroke-linecap="round" aria-hidden="true">'
    + '<path d="M18 6 6 18M6 6l12 12"/></svg>';

  function criarJanela(){
    const nova = document.createElement('dialog');
    nova.className = 'fab-janela';
    nova.setAttribute('aria-labelledby', 'fab-janela-titulo');
    nova.innerHTML = '<div class="fab-janela-head">'
      + '<h2 class="fab-janela-titulo" id="fab-janela-titulo"></h2>'
      + '<button type="button" class="icon-btn fab-fechar" aria-label="Fechar">' + ICONE_FECHAR + '</button>'
      + '</div><dl class="field-list fab-janela-campos"></dl>';

    nova.querySelector('.fab-fechar').addEventListener('click', fechar);
    // Esc chega como 'cancel'; deixo o fechamento passar pelo mesmo caminho do
    // botão, para o foco voltar para a lista em todos os casos.
    nova.addEventListener('cancel', (evento) => { evento.preventDefault(); fechar(); });
    // Clique no ::backdrop chega como clique no próprio <dialog>: o conteúdo
    // está dentro de filhos, então alvo === janela significa "fora da ficha".
    nova.addEventListener('click', (evento) => { if (evento.target === nova) fechar(); });

    document.body.appendChild(nova);
    return nova;
  }

  function fechar(){
    if (!janela || !janela.open) return;
    janela.close();
    // O <dialog> devolve o foco sozinho em navegador novo; fazer à mão cobre o
    // resto e o caso de a lista ter sido re-renderizada no meio.
    if (origem && document.contains(origem)) origem.focus();
    origem = null;
  }

  function abrir(botao){
    const dados = window.Portal.fabricantes;
    const ficha = dados && dados.ficha(botao.getAttribute('data-ficha'));
    if (!ficha) return;

    janela = janela && document.contains(janela) ? janela : criarJanela();
    janela.querySelector('.fab-janela-titulo').textContent = ficha.sistema || ficha.nome || 'Fabricante';
    // camposEmHtml escapa cada valor; nada daqui monta HTML com dado cru.
    janela.querySelector('.fab-janela-campos').innerHTML = dados.camposEmHtml(ficha);

    origem = botao;
    if (typeof janela.showModal === 'function') janela.showModal();
    else janela.setAttribute('open', '');
    janela.querySelector('.fab-fechar').focus();
  }

  document.addEventListener('click', (evento) => {
    const botao = evento.target.closest && evento.target.closest('.fab-item');
    if (botao) abrir(botao);
  });
})();
