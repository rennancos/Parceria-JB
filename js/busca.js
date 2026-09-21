/* Interface da busca e navegação dos resultados. */
(function(){
  'use strict';
  const { buscar, destacar, termosDe } = window.Portal.buscaMotor;
  const { montar: montarIndice } = window.Portal.buscaIndice;
  const { pessoas } = window.Portal.equipe;
  const escaparHtml = window.Portal.escaparHtml;
  const MAX_RESULTADOS = 30;
  const DEBOUNCE_MS = 120;
  const MIN_CARACTERES = 2;
  const REALCE_MS = 2000;

  const ROTULOS = {
    pagina: 'Página', secao: 'Seção', pessoa: 'Pessoa', links: 'Link',
    passos: 'Passo', paineis: 'Item', sistemas: 'Sistema', atalhos: 'Atalho',
    fabricantes: 'Fabricante', notas: 'Nota',
  };

  let janela, campo, lista, resumo;
  let indice = [];
  let resultados = [];
  let ativo = -1;
  let gatilhoAnterior = null;
  let debounce = 0;

  function aberta(){
    return Boolean(janela?.open);
  }

  function construir(){
    janela = document.createElement('dialog');
    janela.className = 'busca-janela';
    janela.setAttribute('aria-labelledby', 'busca-rotulo');

    janela.innerHTML = `
      <h2 class="busca-rotulo" id="busca-rotulo">Buscar no portal</h2>

      <div class="busca-campo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="search" id="busca-entrada" autocomplete="off" spellcheck="false"
               placeholder="Páginas, documentos, sistemas e pessoas"
               aria-label="Buscar no portal"
               role="combobox" aria-expanded="false" aria-autocomplete="list"
               aria-controls="busca-lista">
        <button class="busca-fechar" type="button" aria-label="Fechar busca">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <p class="busca-resumo" role="status" aria-live="polite"></p>
      <ul class="busca-lista" id="busca-lista" role="listbox" aria-label="Resultados"></ul>

      <p class="busca-rodape">
        <span><kbd>↑</kbd> <kbd>↓</kbd> navegar</span>
        <span><kbd>Enter</kbd> abrir</span>
        <span><kbd>Esc</kbd> fechar</span>
      </p>`;

    document.body.appendChild(janela);

    campo = janela.querySelector('#busca-entrada');
    lista = janela.querySelector('#busca-lista');
    resumo = janela.querySelector('.busca-resumo');

    campo.addEventListener('input', aoDigitar);
    campo.addEventListener('keydown', aoTeclar);
    janela.querySelector('.busca-fechar').addEventListener('click', () => fechar());

    /* Clique no ::backdrop chega como clique no próprio <dialog> — o conteúdo
       interno fica sobre os filhos, então comparar o alvo distingue os dois. */
    janela.addEventListener('mousedown', (e) => { if (e.target === janela) fechar(); });

    // Delegação: a lista é redesenhada a cada tecla, então o ouvinte fica nela.
    lista.addEventListener('click', (e) => {
      const li = e.target.closest('[data-indice]');
      if (li) abrirResultado(Number(li.dataset.indice));
    });

    /* Esc é tratado aqui, e não deixado para o <dialog>: o evento 'close' do
       Chromium não dispara de forma confiável depois que a lista foi
       redesenhada — e, quando não dispara, a limpeza não acontece e a rolagem
       do body fica travada com a janela já fechada. Interceptar no keydown faz
       o fechamento passar SEMPRE por fechar(), qualquer que seja o caminho.

       O ouvinte de 'close' fica como rede de segurança: limpar() é idempotente,
       então rodar duas vezes não custa nada. */
    janela.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      fechar();
    });

    janela.addEventListener('close', limpar);
  }

  function desenhar(consulta){
    const termos = termosDe(consulta);

    if (!resultados.length){
      lista.innerHTML = '';
      campo.setAttribute('aria-expanded', 'false');
      campo.removeAttribute('aria-activedescendant');
      return;
    }

    lista.innerHTML = resultados.map(({ item }, i) => `
      <li class="busca-item" id="busca-item-${i}" data-indice="${i}"
          role="option" aria-selected="${i === ativo}">
        <span class="busca-tipo">${escaparHtml(ROTULOS[item.tipo] || 'Item')}</span>
        <span class="busca-texto">
          <span class="busca-titulo">${destacar(item.titulo, termos)}</span>
          ${item.subtitulo ? `<span class="busca-sub">${destacar(item.subtitulo, termos)}</span>` : ''}
          ${item.contexto ? `<span class="busca-contexto">${destacar(item.contexto, termos)}</span>` : ''}
        </span>
      </li>`).join('');

    campo.setAttribute('aria-expanded', 'true');
    marcarAtivo();
  }

  function marcarAtivo(){
    const itens = lista.querySelectorAll('.busca-item');
    itens.forEach((li, i) => li.setAttribute('aria-selected', String(i === ativo)));

    if (ativo < 0){
      campo.removeAttribute('aria-activedescendant');
      return;
    }

    // O foco do DOM fica no campo: é o aria-activedescendant que diz ao leitor
    // de tela qual opção está ativa.
    campo.setAttribute('aria-activedescendant', `busca-item-${ativo}`);
    itens[ativo]?.scrollIntoView({ block: 'nearest' });
  }

  function aoDigitar(){
    // Debounce: em teclado rápido, refazer a lista a cada tecla é o que faria
    // o INP subir. 120ms não é perceptível e corta a maioria das passadas.
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      const consulta = campo.value.trim();

      if (consulta.length < MIN_CARACTERES){
        resultados = [];
        ativo = -1;
        resumo.textContent = consulta.length ? `Digite ao menos ${MIN_CARACTERES} caracteres.` : '';
        desenhar('');
        return;
      }

      resultados = buscar(indice, consulta);
      ativo = resultados.length ? 0 : -1;
      resumo.textContent = resultados.length
        ? `${resultados.length}${resultados.length === MAX_RESULTADOS ? '+' : ''} resultado${resultados.length > 1 ? 's' : ''}`
        : `Nada encontrado para "${consulta}".`;
      desenhar(consulta);
    }, DEBOUNCE_MS);
  }

  function mover(passo){
    if (!resultados.length) return;
    ativo = (ativo + passo + resultados.length) % resultados.length;   // circular
    marcarAtivo();
  }

  /* Esc passa pelo listener da janela em construir(), para executar limpar().
     Tab usa a contenção de foco do dialog modal; script.js ignora o drawer
     enquanto houver dialog aberto para não disputar o teclado. */
  function aoTeclar(evento){
    switch (evento.key){
      case 'ArrowDown': evento.preventDefault(); mover(1); break;
      case 'ArrowUp':   evento.preventDefault(); mover(-1); break;
      case 'Home':      if (resultados.length){ evento.preventDefault(); ativo = 0; marcarAtivo(); } break;
      case 'End':       if (resultados.length){ evento.preventDefault(); ativo = resultados.length - 1; marcarAtivo(); } break;
      case 'Enter':     if (ativo >= 0){ evento.preventDefault(); abrirResultado(ativo); } break;
      default: break;
    }
  }

  function abrirResultado(i){
    const item = resultados[i]?.item;
    if (!item) return;

    const href = item.href || '';

    // Tudo que não é hash é portal ou arquivo: abre em outra aba, como o resto
    // do portal já faz (alvoDe em js/paginas.js).
    if (href && !href.startsWith('#')){
      gatilhoAnterior = null;          // o foco vai para a outra aba
      fechar();
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }

    const destino = href || '#';
    // Trocar location.hash para o valor que já está lá não dispara hashchange:
    // o router não redesenha e, sem este ramo, o clique não faria nada.
    const mesmoLugar = location.hash === destino
      || (destino === '#' && (location.hash === '' || location.hash === '#'));

    gatilhoAnterior = null;            // o foco vai para o conteúdo, não volta ao botão
    fechar();

    /* Já estamos no destino: o router não vai redesenhar nada, então agir
       agora é o certo — e esperar por um evento que não vem, errado. */
    if (mesmoLugar){
      if (item.alvoId) realcar(item.alvoId);
      else window.scrollTo({ top: 0 });
      return;
    }

    /* Vamos trocar de view. O card só existe na tela depois que o router
       responder ao hashchange; como ele registrou o ouvinte dele no
       carregamento e este vai depois, a ordem de disparo garante que o router
       já terá trocado a view quando realcar() rodar.

       Sem requestAnimationFrame de propósito: o navegador o estrangula quando a
       janela está oculta ou em segundo plano, e o realce simplesmente não
       aconteceria. hashchange não depende de haver quadro sendo pintado. */
    if (item.alvoId){
      window.addEventListener('hashchange', () => realcar(item.alvoId), { once: true });
    }

    location.hash = destino;
  }

  function realcar(id){
    const alvo = document.getElementById(id);
    if (!alvo) return;

    alvo.scrollIntoView({ block: 'center' });
    alvo.classList.remove('is-encontrado');
    // Reflow forçado: sem ele, remover e readicionar a classe no mesmo quadro
    // não reinicia a animação quando se busca a mesma pessoa duas vezes.
    void alvo.offsetWidth;
    alvo.classList.add('is-encontrado');
    window.setTimeout(() => alvo.classList.remove('is-encontrado'), REALCE_MS);
  }

  /* Idempotente de propósito: é chamada por fechar() e também pelo ouvinte de
     'close', que pode ou não disparar. Rodar duas vezes não muda nada. */
  function limpar(){
    window.clearTimeout(debounce);
    document.body.classList.remove('busca-aberta');

    const voltar = gatilhoAnterior;
    gatilhoAnterior = null;
    if (voltar?.focus) voltar.focus();
  }

  function fechar(){
    if (!janela) return;
    limpar();
    if (janela.open) janela.close();
  }

  /* O índice é remontado a cada abertura, e não uma vez na carga: a edição
     troca os itens dos blocos quando o servidor responde, e um índice montado
     no load ficaria desatualizado sem avisar. */
  function remontarIndice(){
    indice = montarIndice(window.PAGINAS, pessoas);
  }

  function abrir(){
    if (aberta()) return;
    if (!janela) construir();

    gatilhoAnterior = document.activeElement;
    remontarIndice();
    resultados = [];
    ativo = -1;

    campo.value = '';
    resumo.textContent = '';
    desenhar('');

    document.body.classList.add('busca-aberta');
    janela.showModal();
    campo.focus();
  }

  /* ---------- Ligação com a página ---------- */

  document.querySelectorAll('[data-busca]').forEach((botao) => {
    botao.addEventListener('click', () => abrir());
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === '?'){
      evento.preventDefault();
      if (aberta()) fechar(); else abrir();
      return;
    }
  });

  // Uma confirmação do acervo também atualiza a busca já aberta.
  document.addEventListener('acervo:alterado', () => {
    if (!aberta()) return;
    remontarIndice();
    aoDigitar();
  });

  // Para quem quiser abrir a busca de outro lugar (um atalho na home, por
  // exemplo) sem simular clique num botão.
  window.abrirBusca = abrir;
})();
