/* Roteamento por hash.

   A home e as páginas internas convivem em index.html: a home é #view-home
   (fixa no markup) e as internas são renderizadas em #view-pagina a partir de
   PAGINAS. Só uma das duas fica visível por vez.

   index.html#documentacao  →  chave "documentacao"  →  PAGINAS['documentacao']
   index.html               →  chave ""              →  home

   Precisa carregar DEPOIS de paginas.js e dos arquivos de js/paginas/ — é o
   responsável pela primeira renderização depois de todos os registros.
   Busca e edição carregam em seguida, conforme index.html.

   Por que hash e não History API: o site é aberto direto do disco (file://) e
   também não tem servidor para responder a /documentacao. Com hash, o link é
   colável, o botão voltar funciona e nada disso depende de configuração. */

(function(){
  'use strict';

  const viewHome = document.getElementById('view-home');
  const viewPagina = document.getElementById('view-pagina');
  const linksMenu = document.querySelectorAll('nav a[data-pagina]');

  /* O título da aba NÃO acompanha a navegação: é sempre o <title> do
     index.html. Escrever em document.title a cada troca de página já foi o
     comportamento daqui, e saía como "Documentação — Parceria JB"; a marca
     fixa é escolha da equipe. Quem quiser de volta, é uma linha em mostrar()
     — e o teste em tests/unit/conteudo.test.cjs cobra o silêncio de hoje. */

  if (!viewHome || !viewPagina) return;

  // Páginas que deixaram de existir por conta: link antigo já compartilhado
  // continua chegando ao conteúdo, em vez de cair na home sem explicação.
  const APELIDOS = { manuais: 'documentacao' };

  // Hash desconhecido (ou âncora da própria home, tipo #team-title) devolve ""
  // e cai na home — nada de tela de erro para um link antigo.
  function chaveAtual(){
    let bruta;
    try { bruta = decodeURIComponent(location.hash.replace(/^#/, '')).trim(); }
    catch (erro) { return ''; } // Hash externo malformado mantém o fallback para home.
    const chave = APELIDOS[bruta] || bruta;
    return Object.prototype.hasOwnProperty.call(window.PAGINAS, chave) ? chave : '';
  }

  function marcarMenu(chave){
    linksMenu.forEach((link) => {
      if (link.dataset.pagina === chave) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  // Sem recarregar o documento, o leitor de tela não percebe que o conteúdo
  // trocou: mandar o foco para o <h1> da página nova resolve.
  function focarTitulo(){
    const titulo = viewPagina.querySelector('h1');
    if (titulo) {
      titulo.focus({ preventScroll: true });
      titulo.scrollIntoView({ block: 'start' });
    }
  }

  function posicionarScroll(chave, mudou){
    if (!mudou) return;

    // Voltando para a home com uma âncora dela no hash (#team-title), respeita
    // a âncora em vez de jogar tudo para o topo.
    if (!chave && location.hash.length > 1){
      const alvo = document.getElementById(location.hash.slice(1));
      if (alvo){
        alvo.scrollIntoView();
        return;
      }
    }

    window.scrollTo(0, 0);
  }

  let chaveAnterior = null;

  function mostrar(chave, { focar }){
    const mudou = chaveAnterior !== null && chave !== chaveAnterior;

    if (chave){
      const dados = window.PAGINAS[chave];
      viewPagina.innerHTML = window.renderizarPagina(dados);
      viewHome.hidden = true;
      viewPagina.hidden = false;
      if (focar) focarTitulo();
    } else {
      viewPagina.hidden = true;
      viewPagina.innerHTML = '';   // não deixa conteúdo oculto tabulável
      viewHome.hidden = false;
    }

    marcarMenu(chave);
    posicionarScroll(chave, mudou);
    chaveAnterior = chave;

    // Quem precisa mexer no HTML recém-desenhado escuta isto — hoje só
    // js/documentos.js, para pendurar os botões de edição. Sem ouvintes, é um
    // evento que ninguém recebe: não custa nada e não muda nada.
    document.dispatchEvent(new CustomEvent('pagina:render', { detail: { chave } }));
  }

  // Cobre clique no menu, clique nos cards, botão voltar/avançar e link colado
  // direto na barra de endereços.
  window.addEventListener('hashchange', () => mostrar(chaveAtual(), { focar: true }));

  /* Redesenha a página atual com os dados que estiverem em PAGINAS agora. Existe
     para quem altera esses dados depois do carregamento — js/documentos.js, ao
     receber o acervo do servidor e a cada item salvo. Não mexe no foco nem no
     scroll: é a mesma página, só com conteúdo novo. */
  window.redesenharPagina = function(){
    mostrar(chaveAtual(), { focar: false });
  };

  // Primeira renderização: não rouba o foco de quem acabou de abrir a página.
  mostrar(chaveAtual(), { focar: false });
})();
