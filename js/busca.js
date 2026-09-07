/* Busca do portal.

   O botão "Buscar" existia no header e no drawer sem fazer nada. Isto o liga a
   uma busca que varre TODO o conteúdo do portal — páginas, seções, passos,
   links, sistemas, fabricantes, notas e pessoas da equipe.

   Por que não há backend, índice persistido nem biblioteca: a arquitetura já
   entregava isso de graça. `PAGINAS` e `equipe` são objetos estruturados que já
   estão em memória quando esta busca abre. O trabalho aqui é percorrer,
   pontuar e desenhar — não buscar em lugar nenhum.

   Carrega DEPOIS de js/router.js: depende de PAGINAS já registrado (por
   paginas.js + js/paginas/*.js) e de `equipe`, que js/equipe.js declara.

   O índice é montado A CADA ABERTURA, de propósito. js/documentos.js troca os
   itens dos blocos pelos do acervo quando o servidor responde, e volta a mexer
   a cada item salvo; um índice montado no load ficaria desatualizado sem
   avisar. Montar custa poucos milissegundos para algumas centenas de entradas.

   ---------------------------------------------------------------------------
   ACESSIBILIDADE

   A janela é um <dialog> aberto com showModal(), como o modal da edição
   (css/edicao.css): o navegador prende o foco, torna o resto da página inerte,
   desenha o ::backdrop e fecha no Esc — nada disso precisa ser reimplementado.

   Dentro dela, o padrão é o combobox do WAI-ARIA: o campo é `role="combobox"`
   apontando por `aria-controls` para uma `role="listbox"`, e o item ativo é
   apontado por `aria-activedescendant`. O foco do DOM nunca sai do campo, que
   é o que permite continuar digitando enquanto as setas andam pela lista.

   Consequência: os itens NÃO são <a> nem focáveis. Quem usa leitor de tela
   recebe o item ativo pelo aria-activedescendant; quem usa mouse clica; Enter
   abre o ativo.
   --------------------------------------------------------------------------- */

(function(){
  'use strict';

  const MAX_RESULTADOS = 30;
  const DEBOUNCE_MS = 120;
  const MIN_CARACTERES = 2;
  const REALCE_MS = 2000;

  /* ---------- Normalização ----------

     Comparar "captação" com "captacao" exige tirar o acento dos dois lados. O
     mapa de índices existe porque tirar acento MUDA O COMPRIMENTO da string:
     'ã' em NFD vira 'a' + til combinante, e remover o til devolve 1 caractere
     onde havia 2. Sem o mapa, o destaque grifaria a letra errada em qualquer
     palavra acentuada — que aqui é quase toda palavra. */
  function normalizar(texto){
    const origem = String(texto ?? '');
    let saida = '';
    const mapa = [];

    for (let i = 0; i < origem.length; i += 1){
      const limpo = origem[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      for (let j = 0; j < limpo.length; j += 1){
        saida += limpo[j];
        mapa.push(i);   // cada caractere normalizado aponta para sua origem
      }
    }

    return { texto: saida, mapa };
  }

  function normal(texto){
    return normalizar(texto).texto;
  }

  function escaparHtml(texto){
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function slug(texto){
    return normal(texto).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function termosDe(consulta){
    return normal(consulta).split(/\s+/).filter(Boolean);
  }

  /* ---------- Índice ----------

     Cada entrada é uma coisa que a pessoa pode querer achar. `titulo` e
     `subtitulo` são o que o resultado mostra; `contexto` é a trilha
     ("Acessos Parceria › Sistemas"); `corpo` casa mas não aparece. */

  function entrada(dados){
    return {
      tipo: dados.tipo,
      titulo: dados.titulo || '',
      subtitulo: dados.subtitulo || '',
      contexto: dados.contexto || '',
      href: dados.href || '',
      alvoId: dados.alvoId || '',
      // Pré-normalizado: a comparação roda a cada tecla, a normalização não.
      nTitulo: normal(dados.titulo),
      nSubtitulo: normal(dados.subtitulo),
      nContexto: normal(dados.contexto),
      nCorpo: normal(dados.corpo),
    };
  }

  /* Cada tipo de bloco guarda o texto em campos diferentes. Um lugar só decide
     como cada um vira entrada — acrescentar um tipo de bloco em paginas.js
     significa acrescentar uma linha aqui, e nada mais. Tipo desconhecido é
     ignorado em silêncio: a busca perde aquele conteúdo, mas não quebra. */
  const ITEM_POR_TIPO = {
    paineis:     (i) => ({ titulo: i.titulo, subtitulo: i.texto, corpo: i.meta, href: i.href }),
    passos:      (i) => ({ titulo: i.titulo, subtitulo: i.texto, corpo: i.destaque, href: i.href }),
    links:       (i) => ({ titulo: i.titulo, subtitulo: i.descricao, corpo: i.formato, href: i.href }),
    sistemas:    (i) => ({ titulo: i.sistema, subtitulo: i.perfil ? `Perfil: ${i.perfil}` : '' }),
    fabricantes: (i) => ({ titulo: i.nome, subtitulo: i.portal || i.email || '',
                           corpo: [i.email, i.telefone, i.horario].filter(Boolean).join(' ') }),
    notas:       (i) => ({ titulo: typeof i === 'string' ? i : '' }),
  };

  // Uma seção declara `blocos: [...]` ou, no caso comum de um bloco só,
  // `tipo`/`itens` direto. As duas formas convergem aqui, como em paginas.js.
  function blocosDaSecao(secao){
    if (Array.isArray(secao.blocos)) return secao.blocos;
    return [{ tipo: secao.tipo, itens: secao.itens }];
  }

  function indexarPaginas(indice){
    const paginas = window.PAGINAS || {};

    Object.keys(paginas).forEach((chave) => {
      const pagina = paginas[chave] || {};
      const hrefPagina = `#${chave}`;

      indice.push(entrada({
        tipo: 'pagina',
        titulo: pagina.titulo,
        subtitulo: pagina.descricao,
        contexto: pagina.eyebrow,
        href: hrefPagina,
      }));

      (pagina.secoes || []).forEach((secao) => {
        const trilha = [pagina.titulo, secao.titulo].filter(Boolean).join(' › ');

        indice.push(entrada({
          tipo: 'secao',
          titulo: secao.titulo,
          subtitulo: secao.texto,
          contexto: pagina.titulo,
          href: hrefPagina,
        }));

        blocosDaSecao(secao).forEach((bloco) => {
          const comoItem = ITEM_POR_TIPO[bloco.tipo];
          if (!comoItem) return;

          (bloco.itens || []).forEach((item) => {
            const dados = comoItem(item);
            if (!dados.titulo) return;   // item sem rótulo não é achável

            indice.push(entrada({
              tipo: bloco.tipo,
              titulo: dados.titulo,
              subtitulo: dados.subtitulo,
              corpo: dados.corpo,
              contexto: bloco.titulo ? `${trilha} › ${bloco.titulo}` : trilha,
              // Item com destino próprio (portal, PDF) leva até ele; sem
              // destino, leva até a página onde ele está.
              href: dados.href || hrefPagina,
            }));
          });
        });
      });
    });
  }

  function indexarEquipe(indice){
    // `equipe` é const de topo em js/equipe.js: binding global, mas NÃO
    // propriedade de window. Daí o typeof em vez de window.equipe.
    if (typeof equipe === 'undefined' || !Array.isArray(equipe)) return;

    equipe.forEach((pessoa) => {
      indice.push(entrada({
        tipo: 'pessoa',
        titulo: pessoa.nome,
        subtitulo: pessoa.cargo,
        contexto: pessoa.area ? `Equipe › ${pessoa.area}` : 'Equipe',
        corpo: [pessoa.email, pessoa.destaque].filter(Boolean).join(' '),
        href: '#',
        alvoId: `pessoa-${slug(pessoa.nome)}`,
      }));
    });
  }

  function montarIndice(){
    const indice = [];
    indexarPaginas(indice);
    indexarEquipe(indice);
    return indice;
  }

  /* ---------- Pontuação ----------

     Todo termo digitado precisa aparecer em algum campo (E, não OU): quem
     digita "vizrt portal" quer o que tem os dois, não a união. O peso do campo
     decide a ordem, e casar no começo de uma palavra vale o dobro de casar no
     meio — quem digita "mam" quer a área MAM antes de "Ca[mam]bu". */
  const PESOS = { nTitulo: 10, nSubtitulo: 4, nContexto: 2, nCorpo: 1 };
  const CAMPOS = ['nTitulo', 'nSubtitulo', 'nContexto', 'nCorpo'];

  function pontuarTermo(item, termo){
    let melhor = 0;

    for (const campo of CAMPOS){
      const alvo = item[campo];
      if (!alvo) continue;

      const posicao = alvo.indexOf(termo);
      if (posicao === -1) continue;

      let pontos = PESOS[campo];
      if (posicao === 0 || /[\s›\-/(.,]/.test(alvo[posicao - 1])) pontos *= 2;  // início de palavra
      if (alvo === termo) pontos *= 2;                                          // campo inteiro

      if (pontos > melhor) melhor = pontos;
    }

    return melhor;
  }

  function buscar(indice, consulta){
    const termos = termosDe(consulta);
    if (!termos.length) return [];

    const achados = [];

    for (const item of indice){
      let total = 0;
      let todos = true;

      for (const termo of termos){
        const pontos = pontuarTermo(item, termo);
        if (!pontos){ todos = false; break; }
        total += pontos;
      }

      if (todos) achados.push({ item, pontos: total });
    }

    // Empate resolvido pelo título mais curto: o mais específico costuma ser o
    // mais curto, e a ordem fica estável entre digitações.
    achados.sort((a, b) => b.pontos - a.pontos || a.item.titulo.length - b.item.titulo.length);
    return achados.slice(0, MAX_RESULTADOS);
  }

  /* ---------- Destaque ----------

     Grifa no texto ORIGINAL (com acento e maiúscula) os trechos que casaram no
     texto normalizado, voltando pelo mapa de índices. */
  function destacar(texto, termos){
    const original = String(texto ?? '');
    if (!original) return '';

    const { texto: alvo, mapa } = normalizar(original);
    const faixas = [];

    for (const termo of termos){
      let de = alvo.indexOf(termo);
      while (de !== -1){
        const fim = de + termo.length;
        faixas.push([mapa[de], fim < mapa.length ? mapa[fim] : original.length]);
        de = alvo.indexOf(termo, fim);
      }
    }

    if (!faixas.length) return escaparHtml(original);

    // Termos que se sobrepõem ("mam" e "mamute") produziriam <mark> aninhado.
    faixas.sort((a, b) => a[0] - b[0]);
    const unidas = [faixas[0]];
    for (const faixa of faixas.slice(1)){
      const ultima = unidas[unidas.length - 1];
      if (faixa[0] <= ultima[1]) ultima[1] = Math.max(ultima[1], faixa[1]);
      else unidas.push(faixa);
    }

    let saida = '';
    let cursor = 0;
    for (const [inicio, fim] of unidas){
      saida += escaparHtml(original.slice(cursor, inicio));
      saida += `<mark>${escaparHtml(original.slice(inicio, fim))}</mark>`;
      cursor = fim;
    }
    return saida + escaparHtml(original.slice(cursor));
  }

  const ROTULOS = {
    pagina: 'Página', secao: 'Seção', pessoa: 'Pessoa', links: 'Link',
    passos: 'Passo', paineis: 'Item', sistemas: 'Sistema',
    fabricantes: 'Fabricante', notas: 'Nota',
  };

  /* ---------- Interface ----------

     A janela é construída aqui, e não no index.html: mantém o markup da home
     enxuto e garante que a busca não deixe rastro no DOM se este arquivo não
     carregar (o botão simplesmente volta a não fazer nada, como antes). */

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

  /* Esc e Tab não aparecem aqui: o <dialog> modal já fecha no Esc e já prende
     o foco entre o campo e o botão de fechar. */
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

  function abrir(){
    if (aberta()) return;
    if (!janela) construir();

    gatilhoAnterior = document.activeElement;
    indice = montarIndice();
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
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k'){
      evento.preventDefault();
      if (aberta()) fechar(); else abrir();
      return;
    }

    // "/" também abre, mas só fora de campo de texto — senão a barra nunca
    // chegaria ao que a pessoa está digitando.
    const emCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')
      || document.activeElement?.isContentEditable;

    if (evento.key === '/' && !emCampo && !aberta()){
      evento.preventDefault();
      abrir();
    }
  });

  // Para quem quiser abrir a busca de outro lugar (um atalho na home, por
  // exemplo) sem simular clique num botão.
  window.abrirBusca = abrir;
})();
