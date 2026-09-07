[← Índice](README.md)

# Estilos e tema

## Tema por CSS variables

O portal usa um tema escuro fixo. As definições compartilhadas ficam em `:root` de [css/tokens.css](../css/tokens.css), carregado antes dos outros estilos. A refatoração preservou a aparência efetiva; não adicionou alternância de tema.

| Grupo | Tokens |
|---|---|
| Superfícies | `--bg`, `--bg-2`, `--card`, `--card-hover`, `--header-bg`, `--tile` |
| Texto e traço | `--ink`, `--ink-soft`, `--line` |
| Destaque | `--accent`, `--accent-1`, `--accent-soft`, `--on-accent` |
| Decoração | `--stripe`, `--shadow-card`, `--shadow-tile` |
| Geometria | `--radius` (18px), `--radius-sm` (12px), `--radius-xs` (10px), `--radius-pill` |
| Escala de texto | `--fs-2xs` a `--fs-3xl`; ver [Escala de texto](#escala-de-texto) |

`--panel`, `--chip` e `--team-card` são aliases definidos no mesmo arquivo de tokens. Os estilos das funcionalidades não redefinem a paleta. `--danger` identifica ações destrutivas e `--modal-backdrop` é compartilhado entre busca e edição.

O CSS base (`styles.css`) contém reset, tipografia, layout e navegação, incluindo a regra global de `[hidden]`. Regras específicas permanecem em `pagina.css`, `equipe.css`, `edicao.css` e `busca.css`.

## Escala de texto

A escala principal usa os tokens `--fs-*` declarados em `css/tokens.css`. Cada token é um `clamp()` que interpola com a largura da tela; dimensões ligadas a elementos específicos podem ter valores locais.

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

## Tema atual e JavaScript

Não há `.theme-toggle`, classe `dark-mode` ou persistência de tema em `localStorage` no portal atual. `js/script.js` controla somente o drawer. As descrições antigas de alternância não correspondiam ao código e foram substituídas por esta documentação.

## Ícones

Todos são SVG inline no estilo Feather (`stroke="currentColor"`, `stroke-width="2"`, sem `fill`). Herdam a cor via `currentColor` — cada componente define a cor de seu ícone. Não há biblioteca de ícones.

Os ícones das páginas internas ficam na tabela `ICONES` em `js/paginas.js`; ver [04-paginas-internas.md](04-paginas-internas.md).

## Fonte

`--font-body` e `--font-heading`, em `tokens.css`, definem as famílias. Inter e Syne não são baixadas pelo portal: quando não estão instaladas, o navegador usa as alternativas declaradas. Os testes de regressão comparam a tipografia calculada no mesmo ambiente.

## Fundo decorativo

`.backdrop::before` desenha listras diagonais sutis (`repeating-linear-gradient` a -35°, na cor `--stripe`) e `.backdrop::after` um brilho radial na cor do token `--glow` à direita. Ambos com `pointer-events: none`.

A geometria do `::after` fica **dentro** dos limites do `.backdrop` de propósito. Como o `.backdrop` tem overflow visível, valores negativos ali (era `right: -10%; top: -20%; height: 140%`) vazam para fora do elemento e criam rolagem de verdade: barra horizontal à direita e uma faixa vazia no fim da página. Ao mexer nesse brilho, mantenha `top/right/bottom/left` em zero ou positivo.

## Responsivo

Breakpoints existentes, preservados:

- 1100px: espaçamento do layout geral.
- 980px: grade de cards da home.
- 900px: navegação do topo, espaçamento, equipe e páginas internas.
- 700px: ações de edição passam a ser empilhadas.
- 600px: ajustes de celular nas funcionalidades.

São limites por conteúdo; não precisam ser reduzidos a um único breakpoint. Os tokens de fonte continuam fluidos.

O drawer funciona no desktop e no celular. Quando fechado, usa `visibility: hidden` para tirar os links da tabulação. O scrim é transparente e captura o clique externo. `js/script.js` trata cliques, Escape e foco; quando existe um diálogo aberto, deixa o teclado a cargo desse diálogo.

## Acessibilidade

Já contemplada: `lang="pt-BR"`, `aria-label` em todos os botões de ícone e na navegação, `aria-current="page"` no item de menu ativo, `:focus-visible` visível em links/botões/cards, foco enviado ao `<h1>` a cada troca de página, e `@media (prefers-reduced-motion: reduce)` desligando transições e o `transform` de hover. Manter esse padrão ao adicionar elementos.

A comparação automatizada de estilos calculados cobriu home e Documentação em 360, 900 e 1280 pixels, preservando o visual anterior. Isso não substitui uma auditoria completa de contraste e acessibilidade em todos os dispositivos.
