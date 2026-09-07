[← Índice](README.md)

# Estilos e tema

## Tema por CSS variables

Todas as cores vivem em `:root` (tema claro) e são sobrescritas em `body.dark-mode` (tema escuro), no topo de `css/styles.css`. Para mudar a paleta, altere só esses dois blocos — nada de cor solta pelo CSS.

| Grupo | Tokens |
|---|---|
| Superfícies | `--bg`, `--bg-2`, `--card`, `--card-hover`, `--header-bg`, `--tile` |
| Texto e traço | `--ink`, `--ink-soft`, `--line` |
| Destaque | `--accent-1` a `--accent-4` |
| Decoração | `--stripe`, `--shadow-card`, `--shadow-tile` |
| Geometria | `--radius` (18px), `--radius-sm` (12px), `--radius-xs` (10px), `--radius-pill` |
| Escala de texto | `--fs-2xs` a `--fs-3xl` — iguais nos dois temas; ver [Escala de texto](#escala-de-texto) |

`css/pagina.css` e `css/equipe.css` acrescentam os próprios (`--panel`, `--chip`, `--team-card`…) seguindo o mesmo par claro/escuro.

**Nada de cor fixa fora dos tokens.** Sombra preta some no tema escuro e listra preta idem — por isso `--stripe`, `--shadow-card` e `--shadow-tile` existem em vez de valores literais espalhados. As únicas exceções são geometria (os `--radius`, iguais nos dois temas) e o `#fff`/`#101114` do número dentro do círculo em `.steps li::before`, que acompanha o `--accent-1`.

**O `background` fica só no `body`, nunca no `html`.** O tema escuro é declarado em `body.dark-mode`, então o `html` — que resolve as variáveis no `:root` — ficaria com o `--bg` claro para sempre, aparecendo no overscroll e atrás da barra de URL no mobile. Sem background no `html`, o canvas do navegador usa o do `body`.

## Escala de texto

Nenhum `font-size` fica solto em px pelo CSS: todos saem dos tokens `--fs-*` declarados no `:root` de `css/styles.css`, e cada token é um `clamp()` que interpola com a largura da tela.

| Token | 360px → 1180px | Onde entra |
|---|---|---|
| `--fs-2xs` | 11 → 12.5 | etiquetas em caixa alta, chips (`.intro-tag`, `.card-eyebrow`, `.link-format`, `.team-area`) |
| `--fs-xs` | 12 → 13.5 | apoio e legendas (`.card-cta`, `.footer-sub`, `.link-desc`, `.block-title`, `.ed-btn`) |
| `--fs-sm` | 13 → 14.5 | texto secundário (`.card p`, `.panel p`, `.steps p`, `nav a` no desktop) |
| `--fs-base` | 14 → 16 | corpo (`body`, `.intro p`, `.notes li`) |
| `--fs-md` | 15 → 17 | itens clicáveis e nomes (`.brand-name`, `.link-list a`, `.steps h3`, links do drawer) |
| `--fs-lg` | 16.5 → 19.5 | títulos de card (`.card h2`, `.panel h3`, `.team-info h3`, `.ed-titulo`) |
| `--fs-xl` | 19 → 22 | título de seção (`.page-section > h2`) |
| `--fs-2xl` | 21 → 30 | título de página interna e da equipe |
| `--fs-3xl` | 24 → 34 | `h1` da home |

Abaixo de 360px o valor trava no mínimo; acima de 1180px (a largura máxima do `<main>`), no máximo. Entre os dois, cresce sozinho — é por isso que **as media queries não trazem `font-size`**. Antes traziam, e o texto ficava do mesmo tamanho por toda uma faixa e depois pulava de uma vez no breakpoint; para mudar um tamanho era preciso caçar o mesmo seletor em três lugares. Hoje se muda o token e vale em todas as larguras.

Mínimo e máximo estão em **rem**, só a inclinação usa `vw`. Isso é acessibilidade, não estilo: `vw` ignora o tamanho de fonte configurado no navegador, então uma escala inteiramente em `vw` deixaria o botão de aumentar fonte sem efeito na página.

Duas exceções, ambas comentadas no CSS:

- `.team-photo-wrapper::after` (as iniciais dentro do avatar) fica em 34px fixos — é proporcional ao círculo de 132px, não à página.
- Os campos de formulário em `edicao.css` usam `max(1rem, var(--fs-base))`: com menos de 16px o Safari do iPhone dá zoom sozinho ao focar o campo.

O `<body>` também define `line-height: 1.55`, com `1.25` para `h1`–`h4` — entrelinha de leitura no corpo, mais fechada no título, que a escala fluida costuma quebrar em duas linhas no celular.

## Medida de leitura (`--medida`)

Nas páginas internas, **todo texto corrido para no mesmo x**: `--medida`, declarada uma vez no `:root` como `44rem` (≈704px, ≈75 caracteres). Vale para a descrição da página (`#view-pagina .intro`), o texto de cada seção (`h2 + p`), as notas, o aviso e o texto dentro dos passos. Os títulos de seção, os cards e as listas de link continuam com a largura cheia da coluna — eles são estrutura, não leitura.

Dois blocos precisam descontar o recuo próprio para terminar alinhados com o resto:

| Bloco | Trava |
|---|---|
| `.notes li` | `calc(var(--medida) - 20px)` — o `padding-left` do marcador no `<ul>` |
| `.steps h3`, `.steps p`, `.callout` | `calc(var(--medida) - var(--recuo))` — o `padding-left` do passo, onde mora o número |

`--recuo` é declarado no próprio `.steps li` (64px, 58px abaixo de 900px) e usado tanto no `padding` quanto na conta. **Ao mudar o padding do passo, mude o token junto** — é o que mantém o texto do passo alinhado com o parágrafo solto acima dele.

**Por que `rem` e não `ch`.** A medida já foi `78ch` em dois blocos e `70ch` num terceiro, e mesmo assim eles paravam em lugares diferentes: `ch` é calculado sobre o tamanho de fonte do **próprio elemento**, então `78ch` valia 673px na descrição (16px) e 610px no texto de seção (14,5px). Numa tela de 1920px isso empilhava quatro larguras de parágrafo diferentes, com os cards em 1100px ao lado — a página parecia "quebrada". Em `rem` a conta é a mesma para todo mundo, e continua respeitando o tamanho de fonte configurado no navegador.

## Alternância de tema

`js/script.js` (carregado no fim do body, sem `defer` — depende de o DOM já existir) ouve o clique em `.theme-toggle`, alterna a classe `dark-mode` no `<body>`, sincroniza `aria-pressed` + `aria-label` e grava a escolha em `localStorage` (chave `pajb-tema`).

A leitura acontece antes: há um `<script>` inline logo depois de `<body>` que aplica `dark-mode` já na primeira pintura. Sem ele, o tema escuro só entraria no fim do carregamento e a página piscaria branca a cada recarga. É o único JS inline do projeto, e é proposital — precisa rodar antes do CSS pintar, então não dá para movê-lo para um arquivo carregado no fim do body. Navegar entre as páginas internas não recarrega nada, então o tema já se mantinha; o `localStorage` cobre o F5 e o link colado direto na barra.

Ambos os acessos ao `localStorage` estão em `try/catch`: em `file://` com storage bloqueado o tema segue funcionando na página aberta, só não sobrevive à navegação.

Não há regra para `.theme-toggle[aria-pressed="true"]`: o botão só fica pressionado junto com o `dark-mode`, e a regra `body.dark-mode .theme-toggle` tem especificidade maior — qualquer estilo baseado no `aria-pressed` seria código morto.

## Ícones

Todos são SVG inline no estilo Feather (`stroke="currentColor"`, `stroke-width="2"`, sem `fill`). Herdam a cor via `currentColor` — daí as regras `.card:nth-child(n) .card-icon svg`. Não há biblioteca de ícones.

Os ícones das páginas internas ficam na tabela `ICONES` em `js/paginas.js`; ver [04-paginas-internas.md](04-paginas-internas.md).

## Fonte

**A "Inter" não é carregada.** Não há `@font-face` nem `<link>` — ela só aparece para quem já a tem instalada. No Windows, a fonte real é a Segoe UI. Consequência: os `font-weight: 650` do projeto arredondam para 700, porque a Segoe UI não tem peso intermediário. Para valer de verdade, seria preciso versionar o arquivo da fonte no projeto e declarar um `@font-face` local (CDN não serve: quebra em `file://` e depende de rede externa).

## Fundo decorativo

`.backdrop::before` desenha listras diagonais sutis (`repeating-linear-gradient` a -35°, na cor `--stripe`) e `.backdrop::after` um brilho radial azulado à direita. Ambos com `pointer-events: none`.

A geometria do `::after` fica **dentro** dos limites do `.backdrop` de propósito. Como o `.backdrop` tem overflow visível, valores negativos ali (era `right: -10%; top: -20%; height: 140%`) vazam para fora do elemento e criam rolagem de verdade: barra horizontal à direita e uma faixa vazia no fim da página. Ao mexer nesse brilho, mantenha `top/right/bottom/left` em zero ou positivo.

## Responsivo

Breakpoints:

- `min-width: 901px` — o arranjo 3+2 dos cards da home. Fica aqui, e não como reset lá embaixo, por causa da especificidade do `:nth-child` — ver [03-home.md](03-home.md).
- `max-width: 1100px` — aperta o header (paddings e `gap` do nav/ícones) mantendo o menu horizontal.
- `max-width: 900px` — grade de cards em coluna única, equipe em 2 colunas, e o nav vira **drawer lateral**.
- `max-width: 600px` — equipe em 1 coluna e cards da home empilhados.

Todos mexem em espaçamento, grade e arranjo. Tamanho de texto não passa por aqui — ver [Escala de texto](#escala-de-texto).

## Menu mobile (drawer)

O `<nav>` mora dentro de `.menu-panel#primary-menu`. No desktop esse wrapper usa `display: contents`, então o `<nav>` continua sendo filho direto do `header` e o layout não muda. Abaixo de 900px o painel vira `position: fixed` à direita, entra por `transform: translateX(...)` e é controlado pela classe `menu-open` no `<body>`.

Nessa faixa os botões Buscar/Notificações/Perfil (`.icon-secondary`) somem do header e reaparecem como `.menu-action` dentro do drawer — o header fica só com marca, tema e hambúrguer, o que evita aperto em telas de ~360px.

O drawer fechado usa `visibility: hidden` (não só `translateX`), para que os links não fiquem tabuláveis fora da tela.

**O scrim não escurece a página.** `.scrim` é uma camada `position: fixed` transparente: existe só para captar o clique fora e fechar o drawer. Era `rgba(10,11,13,0.5)` e foi removido por decisão de aparência — a página atrás fica com o brilho normal. Para trazer o escurecimento de volta, basta um `background: rgba(10,11,13,0.28)` na regra; o resto do comportamento já está pronto.

`js/script.js` cobre: clique no hambúrguer/`.menu-close`/scrim, `Escape`, clique em link (navega e fecha), foco preso dentro do painel enquanto aberto, foco devolvido ao hambúrguer ao fechar, e fechamento automático ao voltar para desktop (via `matchMedia`).

## Acessibilidade

Já contemplada: `lang="pt-BR"`, `aria-label` em todos os botões de ícone e na navegação, `aria-current="page"` no item de menu ativo, `:focus-visible` visível em links/botões/cards, foco enviado ao `<h1>` a cada troca de página, e `@media (prefers-reduced-motion: reduce)` desligando transições e o `transform` de hover. Manter esse padrão ao adicionar elementos.

O par mais apertado de contraste é `--ink-soft` sobre `--card` no tema claro, em ~4.97:1 — passa no AA por pouco. Ao escurecer superfícies ou clarear texto secundário, vale recalcular.
