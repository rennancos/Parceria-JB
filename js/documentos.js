/* Integração da edição com o portal. Sem API, mantém o conteúdo estático.
   Autorização efetiva continua em servidor/auth.js. */
(function(){
  'use strict';
  if (location.protocol === 'file:') return;
  const api = window.Portal.documentosApi;
  const acervo = window.Portal.documentosAcervo.criar(api, window.PAGINAS);
  const estado = { disponivel: false, sessao: { autenticado: false } };
  // CONTRATO: o bloqueio acompanha o id, não o botão. pagina:render recria o
  // DOM durante a requisição; guardar o estado no elemento permitiria DELETE
  // duplicado. Cobertura: tests/browser.cjs (exclusão após redesenho).
  const exclusoesPendentes = new Set();
  function redesenhar(){
    // ORDEM IMPORTANTE: a projeção do acervo já deve estar em PAGINAS.
    // O router emite pagina:render para decorar; acervo:alterado faz busca.js
    // reconstruir os resultados de uma busca que esteja aberta.
    window.redesenharPagina();
    document.dispatchEvent(new CustomEvent('acervo:alterado'));
  }
  function atualizarSessao(sessao){
    estado.sessao = sessao;
    sincronizarPerfil();
    redesenhar();
  }
  const formularios = window.Portal.documentosFormularios.criar({
    api, acervo, estado, aoSessao: atualizarSessao, aoAlterar: redesenhar
  });
  document.addEventListener('sessao:expirada', () => atualizarSessao({ autenticado: false }));
  /* ---------- Ícones ---------- */
  // Mesmo traço do resto do portal (Feather: stroke currentColor, sem fill).

  function svg(d){
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  }

  const ICONE_MAIS    = svg('<path d="M12 5v14M5 12h14"/>');
  const ICONE_LAPIS   = svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>');
  const ICONE_LIXO    = svg('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>');

  function botao(classe, rotulo, icone){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ed-btn ' + classe;
    b.innerHTML = icone;                              // markup fixo daqui, não dado
    b.appendChild(document.createTextNode(rotulo));
    return b;
  }

  /* ---------- Botões em cima da página desenhada ---------- */

  /* Roda a cada `pagina:render`. O HTML foi refeito do zero pelo router, então
     não há botão antigo para limpar — só pendurar os novos. */
  function decorar(){
    const view = document.getElementById('view-pagina');
    if (!view || view.hidden) return;
    if (!estado.disponivel || !estado.sessao.autenticado) return;

    const podeExcluir = estado.sessao.papel === 'dev';

    view.querySelectorAll('ul.link-list[data-bloco]').forEach((lista) => {
      const chave = lista.dataset.bloco;

      lista.querySelectorAll('li[data-item-id]').forEach((li) => {
        const id = li.dataset.itemId;
        const acoes = document.createElement('div');
        acoes.className = 'ed-acoes';

        const editar = botao('ed-neutro', 'Editar', ICONE_LAPIS);
        editar.addEventListener('click', () => formularios.abrirItem(id, chave));
        acoes.appendChild(editar);

        if (podeExcluir){
          const excluir = botao('ed-perigo', 'Excluir', ICONE_LIXO);
          excluir.disabled = exclusoesPendentes.has(id);
          excluir.addEventListener('click', () => excluirItem(id));
          acoes.appendChild(excluir);
        }

        li.classList.add('com-acoes');
        li.appendChild(acoes);
      });

      const barra = document.createElement('div');
      barra.className = 'ed-barra';
      const incluir = botao('ed-neutro', 'Incluir nesta lista', ICONE_MAIS);
      incluir.addEventListener('click', () => formularios.abrirItem(null, chave));
      barra.appendChild(incluir);
      lista.insertAdjacentElement('afterend', barra);
    });
  }

  /* Os dois botões "Perfil" do cabeçalho (o ícone e o do menu em telas
     estreitas) eram decorativos — ver md/07-pendencias.md. Ganham função só
     quando a API respondeu; sem servidor, continuam como estavam. */
  function ligarPerfil(){
    document.querySelectorAll('[data-perfil]').forEach((botaoPerfil) => {
      botaoPerfil.addEventListener('click', () => {
        if (estado.sessao.autenticado) formularios.abrirPerfil();
        else formularios.abrirLogin();
      });
    });
  }

  function sincronizarPerfil(){
    const dentro = !!estado.sessao.autenticado;
    document.querySelectorAll('[data-perfil]').forEach((botaoPerfil) => {
      botaoPerfil.classList.toggle('perfil-ativo', dentro);
      if (botaoPerfil.hasAttribute('aria-label')){
        botaoPerfil.setAttribute('aria-label', dentro ? `Perfil — ${estado.sessao.nome}` : 'Perfil');
      }
    });
  }

  async function excluirItem(id){
    if (exclusoesPendentes.has(id)) return;
    const item = acervo.itemPorId(id);
    if (!item) return;

    const aviso = `Excluir “${item.titulo}” da lista?\n\n` +
      'O item sai da página. Um arquivo em docs/, se houver, continua no servidor.';
    if (!window.confirm(aviso)) return;

    exclusoesPendentes.add(id);
    atualizarBotoesExclusao(id, true);
    try {
      await acervo.excluir(id);
      redesenhar();
    } catch (erro) {
      window.alert(erro.message);
    } finally {
      exclusoesPendentes.delete(id);
      atualizarBotoesExclusao(id, false);
    }
  }

  function atualizarBotoesExclusao(id, pendente){
    document.querySelectorAll('li[data-item-id]').forEach(li => {
      if (li.dataset.itemId !== id) return;
      const excluir = li.querySelector('.ed-perigo');
      if (excluir) excluir.disabled = pendente;
    });
  }

  document.addEventListener('pagina:render', decorar);

  (async function iniciar(){
    try {
      await acervo.carregar();
    } catch (erro) {
      return;    // sem API: a semente do .js continua valendo e ninguém percebe
    }

    estado.disponivel = true;

    // Sessão é secundária: sem ela o portal ainda mostra o acervo do servidor,
    // só não mostra botão nenhum.
    try {
      estado.sessao = await api.sessao();
    } catch (erro) {
      estado.sessao = { autenticado: false };
    }

    ligarPerfil();
    sincronizarPerfil();
    redesenhar();     // já com os itens do servidor no lugar da semente
  })();
})();
