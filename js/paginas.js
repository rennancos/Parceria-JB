/* Registro e renderização das páginas internas.

   Cada item do menu tem um arquivo em js/paginas/ que só REGISTRA dados aqui —
   nenhum deles escreve HTML. Este arquivo transforma esses dados em markup, e
   js/router.js escolhe qual página mostrar a partir do hash da URL.

   Ordem de carregamento em index.html (importa):
     paginas.js  →  js/paginas/*.js  →  router.js

   Por que dados e não HTML: mesmo motivo do equipe.js — editar conteúdo não
   deve exigir mexer em markup, e um `<h3>` esquecido não pode quebrar a página.

   Scripts clássicos encapsulados preservam file://. O registro PAGINAS e o
   renderizador são os pontos de integração com navegação e edição.

   ---------------------------------------------------------------------------
   FORMATO DE UMA PÁGINA

   PAGINAS['documentacao'] = {
     titulo:    'Documentação',           // <h1> e título da aba
     eyebrow:   'Central de conteúdo',    // rótulo pequeno acima do <h1>
     descricao: 'Consulte processos...',  // parágrafo de abertura
     secoes:    [ ...ver abaixo... ],
     aviso:     'Conteúdo em construção'  // OPCIONAL, bloco tracejado no fim
   };

   Cada seção tem `titulo`, `texto` (opcional) e um ou mais blocos de conteúdo.
   Com um bloco só, declare `tipo` e `itens` direto na seção:

     { titulo: 'Categorias', tipo: 'paineis', itens: [...] }

   Com vários, use `blocos` — cada um pode ter um `titulo` próprio, que vira um
   rótulo (não um heading, para não bagunçar a hierarquia do h1/h2):

     { titulo: '2. Acesso a sistemas', blocos: [
         { tipo: 'passos', itens: [...] },
         { tipo: 'sistemas', titulo: 'Sistemas mais utilizados', itens: [...] }
     ]}

   TIPOS DE BLOCO

     tipo: 'paineis'      itens: { titulo, texto, meta?, href? }
                          Grade de blocos. Com `href` vira card clicável; sem,
                          fica estático. `meta` é o chip cinza no rodapé.

     tipo: 'passos'       itens: { titulo, texto, destaque?, href?, grupos? }
                          Lista numerada — a numeração é do CSS, não digite "1.".
                          `destaque` desenha a faixa azul dentro do passo, para
                          caminho de menu, nome de categoria e afins.
                          Com `href`, a faixa vira link: o `destaque` quando ele
                          existe, senão o próprio `texto`. Hash abre na página,
                          o resto abre em outra aba.
                          `grupos` é uma lista { sistema, perfil, href? } — a
                          mesma do tipo 'sistemas' — desenhada DENTRO do passo,
                          para os acessos que se pede naquela etapa.

     tipo: 'links'        itens: { titulo, descricao?, href?, formato?, icone? }
                          Lista de links com ícone à esquerda e seta à direita.
                           Serve tanto para endereço (portal, ParcerIA) quanto
                          para arquivo baixável (DOC/PDF na pasta docs/).
                          `formato` é 'pdf', 'doc', 'xls', 'ppt' ou 'link' e
                          desenha o chip cinza à direita; omitido, sai da
                          extensão do href — e href sem extensão conhecida não
                          ganha chip nenhum. Tudo que não é hash (#pagina) abre
                          em outra aba. Item sem `href` aparece como "a definir",
                          sem virar link.
                          `icone` é uma chave de ICONES (abaixo) e sobrepõe o
                          ícone do formato; inválida ou ausente cai no do
                          formato e, sem formato, no ícone de arquivo.
                          O bloco pode ter `chave`: ela sai como data-bloco no
                          <ul> e liga a lista à edição pela própria página
                          (js/documentos.js). Item vindo do servidor traz `id`,
                          que sai como data-item-id no <li>.

     tipo: 'atalhos'      itens: { titulo, descricao?, href?, icone?, categoria? }
                          Grade de acesso rápido: os MESMOS itens de 'links',
                          desenhados em cards com campo de busca, alternância
                          grade/lista, coração de favorito e "Mostrar mais".
                          Trocar o `tipo` do bloco troca o layout sem mexer nos
                          itens. `categoria` é o rótulo curto no topo do card;
                          sem ele entra o `formato` ("Link", "PDF") e, sem
                          formato, "Acesso". O bloco aceita `limite`: quantos
                          cards aparecem antes do botão (padrão 8; 0 mostra
                          todos e o botão não aparece).
                          Busca, favoritos e limite são de js/atalhos.js. A
                          edição pela própria página (`chave`) continua só em
                          'links'.

     tipo: 'notas'        itens: ['texto', 'texto', ...]
                          Lista com marcador. Para observações e regras curtas.

     tipo: 'sistemas'     itens: { sistema, perfil, href? }
                          Grade compacta de sistema + perfil de acesso. Com
                          `href` o item inteiro vira link; hash abre na página,
                          o resto abre em outra aba.

     tipo: 'fabricantes'  itens: { nome, portal?, email?, telefone?, horario? }
                          Ficha de contato. Campo vazio aparece como "a definir"
                          — nunca invente dado de suporte. E-mail vira mailto:
                          e portal vira link só quando preenchidos.

   Para linkar outra página interna use o hash dela: href: '#manuais'.
   --------------------------------------------------------------------------- */

window.PAGINAS = {};

(function(){
  'use strict';

  const esc = window.Portal.escaparHtml;
  const { blocosDaSecao } = window.Portal.paginasModelo;

  /* ---------- Ícones ---------- */
  // Mesmo estilo do resto do projeto (Feather: stroke currentColor, sem fill).
  function svg(d, classe){
    return `<svg${classe ? ` class="${classe}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  }

  const ICONES = {
    portal:     svg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>'),
    chamado:    svg('<path d="M4 4h16v16H4z"/><path d="M4 9h16M9 20V9"/>'),
    agenda:     svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
   parceria: svg('<path d="M3 21h18M5 21V10M19 21V10M7 10h10M8 7h8M10 4h4M6 14h12"/>'),
    pessoas:    svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    pasta:      svg('<path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H3z"/><path d="M3 7V5a2 2 0 0 1 2-2h4"/>'),
    arquivo:    svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
    planilha:   svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>'),
    imagem:     svg('<rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>'),
    escudo:     svg('<path d="M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6z"/>'),
    documento:  svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>'),
    pdf:        svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 18v-4h1.6a1.2 1.2 0 0 1 0 2.4H8"/><path d="M13 18v-4h1a1.7 1.7 0 0 1 0 4z"/>'),
    mapa:       svg('<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    externo:    svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),

    /* Destinos que antes dividiam o ícone de `portal` e por isso se liam como
       a mesma coisa na grade: o sistema onde se trabalha, o que vigia o
       ambiente, o que só mostra número, o que se consulta e o que descreve um
       caminho. Servidor, pulso, ponteiro, livro e dois nós ligados. */
    sistema:       svg('<rect x="2" y="3" width="20" height="7" rx="2"/><rect x="2" y="14" width="20" height="7" rx="2"/><path d="M6 6.5h.01M6 17.5h.01"/>'),
    monitoramento: svg('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
    dashboard:     svg('<path d="M3 18a9 9 0 1 1 18 0"/><path d="m12 18 4.2-5.2"/><path d="M3 18h2M19 18h2M12 7V5"/>'),
    catalogo:      svg('<path d="M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M4 18a2 2 0 0 1 2-2h13"/><path d="M9 8h6M9 11h4"/>'),
    fluxo:         svg('<rect x="2" y="4" width="7" height="6" rx="1.5"/><rect x="15" y="14" width="7" height="6" rx="1.5"/><path d="M5.5 10v5a2 2 0 0 0 2 2H15"/><path d="m12.5 14.5 2.5 2.5-2.5 2.5"/>'),
    vm:            svg('<path d="m12 2.5 8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5z"/><path d="m12 12 8.5-4.75M12 12v9.5M12 12 3.5 7.25"/>')
  };

  const ICONE_VOLTAR = svg('<path d="M19 12H5M11 18l-6-6 6-6"/>');
  const ICONE_SETA = svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 'link-arrow');

  /* Ícones da grade de acesso rápido (tipo 'atalhos'). Ficam aqui, e não em
     ICONES, porque não são escolha de dado: são partes fixas do controle. */
  const ICONE_LUPA = svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>');
  const ICONE_GRADE = svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>');
  const ICONE_LISTA = svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>');
  /* O coração é o único ícone do portal que ganha preenchimento: vazio quando
     o item não é favorito, cheio quando é (`fill: currentColor` no CSS). */
  const ICONE_CORACAO = svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>');

  /* ---------- Blocos ---------- */

  function painel(item){
    const corpo =
      `<h3>${esc(item.titulo)}</h3>` +
      `<p>${esc(item.texto)}</p>` +
      (item.meta ? `<span class="panel-meta">${esc(item.meta)}</span>` : '');

    // Só quem tem destino vira link — um <a> sem href não é focável e um
    // href="#" jogaria o leitor de volta para a home.
    return item.href
      ? `<a class="panel" href="${esc(item.href)}">${corpo}</a>`
      : `<div class="panel">${corpo}</div>`;
  }

  /* Só hash é navegação interna; arquivo e portal abrem em outra aba para não
     tirar a pessoa do portal. Usado por `link` e por `passo`. */
  function alvoDe(href){
    return String(href).startsWith('#') ? '' : ' target="_blank" rel="noopener noreferrer"';
  }

  /* `href` num passo precisa virar link em algum lugar visível, e o lugar
     depende do que o passo tem:

       com destaque  — o destaque vira o link, porque é ele que nomeia o
                       destino ("Finanças… > Acessos a Áreas e Ambientes");
       sem destaque  — quem vira link é o texto ("Entre no KB."), que é a ação
                       do passo; o título apenas nomeia o passo. O texto vira
                       a mesma faixa do destaque, para os dois casos lerem
                       igual na página.

     Sem texto nenhum o título assume o link, porque ignorar o `href` seria
     pior: some sem erro nenhum, que foi exatamente como este campo se
     comportava antes. */
  function passo(item){
    const comLink = (conteudo, classe) =>
      `<a class="${classe}" href="${esc(item.href)}"${alvoDe(item.href)}>${conteudo}${ICONE_SETA}</a>`;

    const linkSolto = item.href && !item.destaque;

    const titulo = linkSolto && !item.texto
      ? comLink(`<span>${esc(item.titulo)}</span>`, 'step-link')
      : esc(item.titulo);

    const texto = !item.texto ? ''
      : linkSolto
        ? comLink(`<span>${esc(item.texto)}</span>`, 'callout')
        : `<p>${esc(item.texto)}</p>`;

    const destaque = !item.destaque ? ''
      : item.href
        ? comLink(`<span>${esc(item.destaque)}</span>`, 'callout')
        : `<p class="callout">${esc(item.destaque)}</p>`;

    /* Grade de sistema + perfil pendurada no passo, com o MESMO renderizador do
       bloco 'sistemas' — é a lista de acessos que se pede naquela etapa, e não
       um assunto à parte. Como bloco irmão ela sairia fora do card e, pior,
       partiria a lista em duas: o contador reseta a cada <ol class="steps">
       (ver css/pagina.css), então os passos seguintes voltariam a numerar do 1. */
    const grupos = !Array.isArray(item.grupos) || !item.grupos.length ? ''
      : `<ul class="sys-list">${item.grupos.map(sistema).join('')}</ul>`;

    return `
      <li>
        <h3>${titulo}</h3>
        ${texto}
        ${destaque}
        ${grupos}
      </li>`;
  }

  /* Sistema com `href` vira link para o portal (ou formulário de acesso) do
     próprio sistema — mesma regra de `passo` e `link`: hash navega aqui dentro,
     o resto abre em outra aba. Sem `href` o item continua estático, como sempre
     foi; ignorar o campo era pior, porque ele sumia sem erro nenhum.

     A classe é `callout`, a mesma faixa do `destaque` de um passo, e não um
     estilo próprio: todo destino da página tem um layout só, então mexer nessa
     aparência é mexer em um lugar. O CSS de `.sys-list` só ajusta o encaixe na
     grade (ver css/pagina.css). */
  function sistema(item){
    const corpo =
      `<span class="sys-name">${esc(item.sistema)}</span>` +
      (item.perfil ? `<span class="sys-role">${esc(item.perfil)}</span>` : '');

    return item.href
      ? `<li><a class="callout" href="${esc(item.href)}"${alvoDe(item.href)}>${corpo}${ICONE_SETA}</a></li>`
      : `<li>${corpo}</li>`;
  }

  /* Fabricantes: a ficha tem sempre os mesmos quatro campos, na mesma ordem.
     Deixar isso no renderizador (e não nos dados) garante que nenhuma ficha
     saia com rótulo diferente ou campo faltando. */
  const CAMPOS_FABRICANTE = [
    { chave: 'portal',   rotulo: 'Portal' },
    { chave: 'email',    rotulo: 'E-mail' },
    { chave: 'telefone', rotulo: 'Telefone' },
    { chave: 'horario',  rotulo: 'Atendimento' }
  ];

  // Campo em branco vira "a definir" — visível como pendência, nunca como dado.
  function valorFabricante(chave, valor){
    if (!valor) return '<span class="field-vazio">a definir</span>';
    if (chave === 'email') return `<a href="mailto:${esc(valor)}">${esc(valor)}</a>`;
    if (chave === 'portal') return `<a href="${esc(valor)}" target="_blank" rel="noopener noreferrer">${esc(valor)}</a>`;
    return esc(valor);
  }

  function fabricante(item){
    const linhas = CAMPOS_FABRICANTE.map((campo) => `
      <div>
        <dt>${campo.rotulo}</dt>
        <dd>${valorFabricante(campo.chave, item[campo.chave])}</dd>
      </div>`).join('');

    return `
      <div class="panel">
        <h3>${esc(item.nome)}</h3>
        <dl class="field-list">${linhas}</dl>
      </div>`;
  }

   /* Um item de 'links' pode ser um endereço (portal, ParcerIA, outra página
     daqui) ou um arquivo baixável — DOC/PDF na pasta do projeto. O formato dá o
     ícone e o chip cinza à direita; ele vem de `formato` ou, quando ausente, da
     extensão do próprio href, para não obrigar a repetir a informação. */
  const FORMATOS = {
    pdf:  { rotulo: 'PDF',      icone: 'pdf' },
    doc:  { rotulo: 'DOC',      icone: 'documento' },
    docx: { rotulo: 'DOC',      icone: 'documento' },
    xls:  { rotulo: 'Planilha', icone: 'planilha' },
    xlsx: { rotulo: 'Planilha', icone: 'planilha' },
    ppt:  { rotulo: 'Slides',   icone: 'imagem' },
    pptx: { rotulo: 'Slides',   icone: 'imagem' },
    link: { rotulo: 'Link',     icone: 'externo' }
  };

  // Sem `formato` e sem extensão conhecida devolve null: o item fica igual ao
  // que sempre foi (ícone de arquivo, nenhum chip), e as páginas que já usavam
  // 'links' antes deste campo não mudam de aparência.
  function formatoDe(item){
    if (item.formato) return FORMATOS[String(item.formato).toLowerCase()]
      || { rotulo: item.formato, icone: 'arquivo' };

    const extensao = String(item.href || '').split(/[?#]/)[0].split('.').pop().toLowerCase();
    return FORMATOS[extensao] || null;
  }

  /* CONTRATO: `data-item-id` só aparece quando o item veio do servidor (js/documentos.js
     substitui os itens do bloco pelos do acervo). É o gancho onde os botões de
     editar/excluir se penduram; item de semente, sem id, sai como sempre saiu.
     Preservar o atributo no li e data-bloco na ul: documentos.js procura essa
     combinação para decorar e bloquear exclusões durante o redesenho. */
  function link(item){
    const formato = formatoDe(item);
    const marca = item.id ? ` data-item-id="${esc(item.id)}"` : '';
    const icone = ICONES[item.icone] || (formato && ICONES[formato.icone]) || ICONES.arquivo;

    const corpo =
      icone +
      `<span class="link-text">` +
        esc(item.titulo) +
        (item.descricao ? `<span class="link-desc">${esc(item.descricao)}</span>` : '') +
      `</span>` +
      (formato ? `<span class="link-format">${esc(formato.rotulo)}</span>` : '');

    // Item sem destino não vira <a>: um href="#" jogaria o leitor de volta para
    // a home. Fica visível como pendência, no mesmo lugar da lista.
    if (!item.href) return `<li${marca}><div class="link-pendente">${corpo}<span class="field-vazio">a definir</span></div></li>`;

    return `<li${marca}><a href="${esc(item.href)}"${alvoDe(item.href)}>${corpo}${ICONE_SETA}</a></li>`;
  }

  /* ---------- Acesso rápido (tipo 'atalhos') ----------

     A mesma grade de cards do portal corporativo: campo de busca, alternância
     entre grade e lista, categoria e coração de favorito em cada card, e o
     botão "Mostrar mais" quando a lista passa do limite.

     O item é o MESMO de 'links', com um campo a mais (`categoria`): trocar o
     `tipo` do bloco troca o layout sem reescrever um item sequer, e um bloco
     não fica com dois vocabulários de dados para a mesma coisa.

     Aqui só sai markup. Filtro, favoritos e limite são de js/atalhos.js, que
     mexe no que já está desenhado — sem ele (ou com ele quebrado) a grade
     aparece inteira e legível, só a barra é que deixa de responder. */

  function atalho(item){
    const formato = formatoDe(item);
    const icone = ICONES[item.icone] || (formato && ICONES[formato.icone]) || ICONES.arquivo;
    const marca = item.id ? ` data-item-id="${esc(item.id)}"` : '';
    const categoria = item.categoria || (formato ? formato.rotulo : 'Acesso');

    const corpo =
      `<span class="atalho-topo">${icone}<span class="atalho-tipo">${esc(categoria)}</span></span>` +
      `<span class="atalho-titulo">${esc(item.titulo)}</span>` +
      (item.descricao ? `<span class="atalho-desc">${esc(item.descricao)}</span>` : '');

    // Mesma regra do resto da página: item sem destino não vira <a>. Fica na
    // grade como pendência visível, em vez de um card que não leva a nada.
    const alvo = item.href
      ? `<a class="atalho-alvo" href="${esc(item.href)}"${alvoDe(item.href)}>${corpo}</a>`
      : `<div class="atalho-alvo atalho-pendente">${corpo}<span class="field-vazio">a definir</span></div>`;

    /* O coração fica FORA do <a>: botão dentro de link não é markup válido e o
       clique cairia na navegação. O card inteiro continua clicável porque o
       <a> se estica por cima do <li> (::after em css/pagina.css) e o coração
       sobe acima dele. */
    const favorito =
      `<button class="atalho-fav" type="button" aria-pressed="false"` +
      ` data-fav="${esc(item.titulo)}" aria-label="Favoritar ${esc(item.titulo)}">${ICONE_CORACAO}</button>`;

    /* data-termos junta o que o filtro compara — título, descrição e categoria
       — para js/atalhos.js não ter de remontar isso a cada tecla digitada.

       O nome NÃO pode ser data-busca: js/busca.js liga todo [data-busca] ao
       botão que abre a janela de busca do portal, e cada card viraria um
       gatilho dela — clicar num atalho abria a janela em vez de ir ao destino. */
    const termos = [item.titulo, item.descricao, categoria].filter(Boolean).join(' ');

    return `<li class="atalho" data-termos="${esc(termos)}"${marca}>${alvo}${favorito}</li>`;
  }

  // Cards visíveis antes do "Mostrar mais". O bloco pode declarar outro valor
  // em `limite`; 0 (ou negativo) desliga o botão e mostra a lista inteira.
  const ATALHOS_LIMITE = 8;

  /* O botão "Mostrar mais" e o aviso de busca vazia nascem com `hidden`: quem
     decide se eles aparecem é js/atalhos.js, depois de contar quantos cards
     sobraram. Assim, sem JavaScript nenhum, a página não mostra um botão que
     não faz nada nem um "nada encontrado" acima de doze cards. */
  function gradeAtalhos(itens, dados){
    const declarado = Number(dados.limite);
    const limite = Number.isFinite(declarado) ? Math.max(0, Math.floor(declarado)) : ATALHOS_LIMITE;

    return `
      <div class="atalhos" data-atalhos data-limite="${limite}">
        <div class="atalhos-barra">
          <div class="atalhos-campo">
            <input type="search" placeholder="Pesquise aqui" aria-label="Pesquisar nesta lista" autocomplete="off">
            <button class="atalhos-lupa" type="button" aria-label="Pesquisar">${ICONE_LUPA}</button>
          </div>

          <div class="atalhos-vista" role="group" aria-label="Formato de exibição">
            <button type="button" data-vista="grade" aria-pressed="true" aria-label="Ver em grade" title="Grade">${ICONE_GRADE}</button>
            <button type="button" data-vista="lista" aria-pressed="false" aria-label="Ver em lista" title="Lista">${ICONE_LISTA}</button>
          </div>
        </div>

        <ul class="atalhos-grade" data-vista="grade">${itens.map(atalho).join('')}</ul>

        <p class="atalhos-vazio" role="status" hidden>Nenhum item corresponde à busca.</p>

        <div class="atalhos-rodape">
          <button class="atalhos-mais" type="button" aria-expanded="false" hidden>Mostrar Mais</button>
        </div>
      </div>`;
  }

  /* O segundo argumento é o bloco inteiro; só 'links' usa, para carimbar a
     `chave` na lista (o gancho do botão "Incluir" — ver js/documentos.js).
     Bloco sem `chave` sai sem o atributo, igual a antes. */
  const LAYOUTS = {
    passos:      (itens) => `<ol class="steps">${itens.map(passo).join('')}</ol>`,
    atalhos:     (itens, dados) => gradeAtalhos(itens, dados),
    links:       (itens, dados) => `<ul class="link-list"${dados.chave ? ` data-bloco="${esc(dados.chave)}"` : ''}>${itens.map(link).join('')}</ul>`,
    paineis:     (itens) => `<div class="panel-grid">${itens.map(painel).join('')}</div>`,
    notas:       (itens) => `<ul class="notes">${itens.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`,
    sistemas:    (itens) => `<ul class="sys-list">${itens.map(sistema).join('')}</ul>`,
    fabricantes: (itens) => `<div class="panel-grid">${itens.map(fabricante).join('')}</div>`
  };

  // O título do bloco é um <p>, não um heading: entre o <h2> da seção e os <h3>
  // dos itens não sobra nível, e ele é mais rótulo do que subdivisão.
  function bloco(dados, exibirTitulo = true){
    const layout = LAYOUTS[dados.tipo] || LAYOUTS.paineis;
    return (exibirTitulo && dados.titulo ? `<p class="block-title">${esc(dados.titulo)}</p>` : '')
      + layout(dados.itens || [], dados);
  }

  function secao(dados, indice){
    const id = `secao-${indice}`;

    return `
      <section class="page-section" aria-labelledby="${id}">
        <h2 id="${id}">${esc(dados.titulo)}</h2>
        ${dados.texto ? `<p>${esc(dados.texto)}</p>` : ''}
        ${blocosDaSecao(dados).map((b) => bloco(b, b !== dados)).join('')}
      </section>`;
  }

  /* ---------- Página inteira ---------- */

  // O <h1> leva tabindex="-1" para o router poder mandar o foco até ele a cada
  // troca de página: sem recarregar o documento, quem usa leitor de tela não
  // recebe nenhum aviso de que o conteúdo mudou.
  window.renderizarPagina = function(dados){
    return `
      <a class="back-link" href="#">${ICONE_VOLTAR}Voltar ao portal</a>

      <div class="intro">
        ${dados.eyebrow ? `<p class="page-eyebrow">${esc(dados.eyebrow)}</p>` : ''}
        <h1 tabindex="-1">${esc(dados.titulo)}</h1>
        ${dados.descricao ? `<p>${esc(dados.descricao)}</p>` : ''}
      </div>

      ${(dados.secoes || []).map(secao).join('')}
      ${dados.aviso ? `<p class="notice">${esc(dados.aviso)}</p>` : ''}`;
  };
})();
