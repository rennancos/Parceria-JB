[← Índice](README.md)

# A home

## Header

`position: sticky` no topo, com fundo translúcido e `backdrop-filter: blur`. É o mesmo em todas as telas, porque existe uma vez só no `index.html`.

- **Marca:** logo circular + "Parceria JB". Clicar volta para a home (`href="#"`).
- **Navegação:** Primeiros passos · Documentação · Acessos Parceria · ParcerIA · Central das Parcerias
- **Ícones:** Buscar, Notificações, Perfil e o botão de tema (black mode)

Abaixo de 900px o `<nav>` vira drawer lateral — ver [06-estilos-e-tema.md](06-estilos-e-tema.md).

## As duas views

O `<main>` tem duas *views* que se alternam, e só uma fica visível por vez:

```
index.html
  ├─ #view-home     ← intro + cards + equipe (fixo no markup)
  └─ #view-pagina   ← preenchido por js/router.js; vazio na home
```

`#view-home` é HTML de verdade, escrito no arquivo. `#view-pagina` começa vazia e é montada em tempo de execução. Quem faz a troca é o `js/router.js`, a partir do hash da URL — ver [04-paginas-internas.md](04-paginas-internas.md).

## Conteúdo da home

**Bloco de introdução** (`.intro`) com título e subtítulo.

**Grade de cards** (`.cards`): `grid-template-columns: repeat(3, minmax(0, 1fr))`, sem posicionamento manual — os cards preenchem as colunas na ordem em que aparecem no HTML. Cada card tem ícone, "eyebrow", título, descrição e CTA "Acessar" com seta que desliza no hover.

Os cards espelham os itens do menu:

| # | Card | Eyebrow | Destino |
|---|------|---------|---------|
| 1 | Primeiros passos | Comece por aqui | `#primeiros-passos` |
| 2 | Documentação | Central de conteúdo | `#documentacao` |
| 3 | Acessos Parceria | Acessos rápidos | `#acessos-parceria` |
| 4 | ParcerIA | Nossa IA de pesquisa | externo (host em criação) |
| 5 | Central das Parcerias | Portal corporativo | externo |

Todos usam o mesmo acento no ícone (`--accent-1`): a distinção vem do texto, não da cor — ver `css/styles.css`, na regra `.card-icon`.

**Manuais deixou de ser card e página**: virou seção dentro de Documentação — ver [04-paginas-internas.md](04-paginas-internas.md). **ParcerIA também deixou de ser página**: o arquivo `js/paginas/parceria.js` foi removido e o destino virou link externo.

**Seção "Nossa equipe"** (`.team-section`, no fim do `main`) — cabeçalho centralizado com tag, título, subtítulo e um chip de contagem, seguido da grade de cards de pessoa. Detalhes em [05-equipe.md](05-equipe.md).

## Como acrescentar um card

Um destino do portal aparece em **quatro lugares**, e todos são editados à mão no `index.html`. Esquecer um é o erro comum — o card existe mas some do menu, ou vice-versa.

| Onde | Trecho no `index.html` |
|------|------------------------|
| Barra do topo | `<nav class="top-nav">` |
| Menu lateral | `<div class="menu-panel">` → `<nav>` |
| Card da home | `<div class="cards">` |
| Rodapé | `<nav class="footer-nav">` |

O que muda é **só o destino**, e ele tem duas formas:

**Link externo** (site fora do portal). Copie um card inteiro, troque ícone e textos, e use a URL:

```html
<a class="card" href="https://exemplo.corp" target="_blank" rel="noopener noreferrer">
```

Nos três `<nav>`, a linha é a mesma coisa em versão curta. Sempre com `target="_blank" rel="noopener noreferrer"` — é o padrão que `js/paginas.js` aplica a tudo que não é hash. **Não** ponha `data-pagina`: esse atributo só serve para o router marcar o item ativo, e link externo não tem página para marcar.

**Página interna** (conteúdo dentro do portal). Aí são três passos a mais, antes dos quatro links:

1. Crie `js/paginas/<chave>.js` registrando `PAGINAS['<chave>'] = { titulo, eyebrow, descricao, secoes: [...] }`. O formato completo dos tipos de bloco está no cabeçalho de `js/paginas.js`; copie `js/paginas/acessos-parceria.js` como molde.
2. Inclua `<script src="js/paginas/<chave>.js"></script>` no fim do `index.html`, junto dos outros `js/paginas/*.js` e **antes** de `router.js` — a ordem importa.
3. Nos quatro links, use `href="#<chave>"`; nos dois `<nav>` do topo e do menu, acrescente `data-pagina="<chave>"`.

A busca não precisa de nada: `js/busca.js` monta o índice a partir de `window.PAGINAS`. Página interna entra sozinha; link externo, por não estar em `PAGINAS`, não é indexado.

Para **remover** um destino, é o caminho inverso: apague os quatro links, o `<script>` e o arquivo da página. Link antigo que continue circulando cai na home, sem tela de erro — hash desconhecido devolve `""` em `js/router.js`. Se valer a pena redirecionar, há o mapa `APELIDOS` no mesmo arquivo, mas ele só aponta para outra página interna.

## A grade não tem posicionamento manual

Já teve: o arranjo 3+1 vinha de regras `:nth-child` dentro de `@media (min-width: 901px)`, e acrescentar ou remover um card exigia mexer nelas à mão. Isso saiu do CSS. Hoje `.cards` é uma grade de três colunas e os cards fluem na ordem do HTML — o quarto abre a segunda linha, o quinto vai ao lado dele, e assim por diante. Abaixo de 1100px são duas colunas; abaixo de 900px, uma só.

Se um dia o posicionamento explícito voltar, a regra que se aprendeu aqui vale: **declare o posicionamento só na faixa onde ele vale**, nunca tente desfazê-lo num breakpoint menor. `:nth-child` acrescenta especificidade e media query não conta na disputa, então o reset perde, os cards continuam empurrados para colunas que não existem e o Grid estoura a largura da tela no mobile.
