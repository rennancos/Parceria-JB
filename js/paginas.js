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

     tipo: 'passos'       itens: { titulo, texto, destaque?, href? }
                          Lista numerada — a numeração é do CSS, não digite "1.".
                          `destaque` desenha a faixa azul dentro do passo, para
                          caminho de menu, nome de categoria e afins.
                          Com `href`, a faixa vira link: o `destaque` quando ele
                          existe, senão o próprio `texto`. Hash abre na página,
                          o resto abre em outra aba.

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

     tipo: 'notas'        itens: ['texto', 'texto', ...]
                          Lista com marcador. Para observações e regras curtas.

     tipo: 'sistemas'     itens: { sistema, perfil }
                          Grade compacta de sistema + perfil de acesso.

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
    externo:    svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>')
  };

  const ICONE_VOLTAR = svg('<path d="M19 12H5M11 18l-6-6 6-6"/>');
  const ICONE_SETA = svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 'link-arrow');

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

    return `
      <li>
        <h3>${titulo}</h3>
        ${texto}
        ${destaque}
      </li>`;
  }

  function sistema(item){
    return `
      <li>
        <span class="sys-name">${esc(item.sistema)}</span>
        ${item.perfil ? `<span class="sys-role">${esc(item.perfil)}</span>` : ''}
      </li>`;
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

  /* O segundo argumento é o bloco inteiro; só 'links' usa, para carimbar a
     `chave` na lista (o gancho do botão "Incluir" — ver js/documentos.js).
     Bloco sem `chave` sai sem o atributo, igual a antes. */
  const LAYOUTS = {
    passos:      (itens) => `<ol class="steps">${itens.map(passo).join('')}</ol>`,
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
