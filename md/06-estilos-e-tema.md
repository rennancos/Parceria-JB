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

`css/pagina.css` e `css/equipe.css` acrescentam os próprios (`--panel`, `--chip`, `--team-card`…) seguindo o mesmo par claro/escuro.

**Nada de cor fixa fora dos tokens.** Sombra preta some no tema escuro e listra preta idem — por isso `--stripe`, `--shadow-card` e `--shadow-tile` existem em vez de valores literais espalhados. As únicas exceções são geometria (os `--radius`, iguais nos dois temas) e o `#fff`/`#101114` do número dentro do círculo em `.steps li::before`, que acompanha o `--accent-1`.

**O `background` fica só no `body`, nunca no `html`.** O tema escuro é declarado em `body.dark-mode`, então o `html` — que resolve as variáveis no `:root` — ficaria com o `--bg` claro para sempre, aparecendo no overscroll e atrás da barra de URL no mobile. Sem background no `html`, o canvas do navegador usa o do `body`.

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
- `max-width: 600px` — equipe em 1 coluna e títulos menores.

## Menu mobile (drawer)

O `<nav>` mora dentro de `.menu-panel#primary-menu`. No desktop esse wrapper usa `display: contents`, então o `<nav>` continua sendo filho direto do `header` e o layout não muda. Abaixo de 900px o painel vira `position: fixed` à direita, entra por `transform: translateX(...)` e é controlado pela classe `menu-open` no `<body>`.

Nessa faixa os botões Buscar/Notificações/Perfil (`.icon-secondary`) somem do header e reaparecem como `.menu-action` dentro do drawer — o header fica só com marca, tema e hambúrguer, o que evita aperto em telas de ~360px.

O drawer fechado usa `visibility: hidden` (não só `translateX`), para que os links não fiquem tabuláveis fora da tela.

**O scrim não escurece a página.** `.scrim` é uma camada `position: fixed` transparente: existe só para captar o clique fora e fechar o drawer. Era `rgba(10,11,13,0.5)` e foi removido por decisão de aparência — a página atrás fica com o brilho normal. Para trazer o escurecimento de volta, basta um `background: rgba(10,11,13,0.28)` na regra; o resto do comportamento já está pronto.

`js/script.js` cobre: clique no hambúrguer/`.menu-close`/scrim, `Escape`, clique em link (navega e fecha), foco preso dentro do painel enquanto aberto, foco devolvido ao hambúrguer ao fechar, e fechamento automático ao voltar para desktop (via `matchMedia`).

## Acessibilidade

Já contemplada: `lang="pt-BR"`, `aria-label` em todos os botões de ícone e na navegação, `aria-current="page"` no item de menu ativo, `:focus-visible` visível em links/botões/cards, foco enviado ao `<h1>` a cada troca de página, e `@media (prefers-reduced-motion: reduce)` desligando transições e o `transform` de hover. Manter esse padrão ao adicionar elementos.

O par mais apertado de contraste é `--ink-soft` sobre `--card` no tema claro, em ~4.97:1 — passa no AA por pouco. Ao escurecer superfícies ou clarear texto secundário, vale recalcular.
