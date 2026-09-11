/* Faixa "Seus atalhos" da home.

   Os favoritos são gravados por js/atalhos.js como uma lista de títulos, sem
   destino junto. Quem sabe o destino de cada título é o índice da busca, que
   já percorre PAGINAS inteiro: daí a resolução ser feita contra ele em vez de
   uma segunda varredura das páginas aqui.

   O índice é montado a cada desenho, e não uma vez na carga, porque a edição
   pela página troca os itens dos blocos quando o servidor responde.

   Carrega depois de js/atalhos.js (ver index.html). Sem localStorage, sem
   favoritos ou sem o índice, a faixa some e o resto da home segue igual.

   Script clássico encapsulado preserva a abertura por file://. */

(function(){
  'use strict';

  const CHAVE_FAVORITOS = 'parceria:favoritos';
  const LIMITE = 6;

  const bloco = document.querySelector('[data-home-favoritos]');
  if (!bloco) return;

  const lista = bloco.querySelector('.home-favoritos-lista');

  function favoritos(){
    try {
      const cru = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS) || '[]');
      return Array.isArray(cru) ? cru : [];
    } catch (erro){ return []; }
  }

  // Só os itens de acesso rápido: são os únicos que ganham coração.
  function atalhosPorTitulo(){
    const Portal = window.Portal || {};
    const mapa = new Map();
    if (!Portal.buscaIndice || !window.PAGINAS) return mapa;

    const pessoas = (Portal.equipe && Portal.equipe.pessoas) || [];
    Portal.buscaIndice.montar(window.PAGINAS, pessoas).forEach((entrada) => {
      if (entrada.tipo === 'atalhos' && !mapa.has(entrada.titulo)) mapa.set(entrada.titulo, entrada);
    });
    return mapa;
  }

  function esconder(){
    bloco.hidden = true;
    lista.innerHTML = '';
  }

  function desenhar(){
    const marcados = favoritos();
    if (!marcados.length) return esconder();

    const mapa = atalhosPorTitulo();
    // Favorito de um item que saiu do ar some da faixa em vez de virar link morto.
    const itens = marcados.map((titulo) => mapa.get(titulo)).filter(Boolean).slice(0, LIMITE);
    if (!itens.length) return esconder();

    const esc = window.Portal.escaparHtml;
    lista.innerHTML = itens.map((item) => {
      const externo = !/^#/.test(item.href);
      const fora = externo ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<li><a class="home-favorito" href="${esc(item.href)}"${fora}>${esc(item.titulo)}</a></li>`;
    }).join('');

    bloco.hidden = false;
  }

  desenhar();

  // O coração está numa página interna, então a faixa é redesenhada depois do
  // clique que marca ou desmarca. O setTimeout deixa js/atalhos.js gravar antes.
  document.addEventListener('click', (evento) => {
    const alvo = evento.target;
    if (alvo && alvo.closest && alvo.closest('.atalho-fav')) setTimeout(desenhar, 0);
  });

  document.addEventListener('acervo:alterado', desenhar);
  window.addEventListener('storage', (evento) => {
    if (evento.key === CHAVE_FAVORITOS) desenhar();
  });
})();
