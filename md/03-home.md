[← Índice](README.md)

# A home

## Header

`position: sticky` no topo, com fundo translúcido e `backdrop-filter: blur`. É o mesmo em todas as telas, porque existe uma vez só no `index.html`.

- **Marca:** logo circular + "Parceria JB". Clicar volta para a home (`href="#"`).
- **Navegação:** Primeiros passos · Documentação · Acessos Parceria · Sharepoint
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

**Grade de 4 cards** (`.cards`): 3 na primeira linha, 1 na segunda (coluna 1, alinhado com o de cima). Cada card tem ícone, "eyebrow", título, descrição e CTA "Acessar" com seta que desliza no hover.

Os cards espelham os itens do menu:

| # | Card | Eyebrow | Cor do ícone |
|---|------|---------|--------------|
| 1 | Primeiros passos | Comece por aqui | `--accent-1` (azul) |
| 2 | Documentação | Central de conteúdo | `--accent-2` (roxo) |
| 3 | Acessos Parceria | Acessos rápidos | `--accent-4` (âmbar) |
| 4 | Sharepoint | Acesso corporativo | `--accent-3` (rosa) |

Menu e cards apontam para os mesmos quatro destinos (`#primeiros-passos`, `#documentacao`, …). **Manuais deixou de ser card e página**: virou seção dentro de Documentação — ver [04-paginas-internas.md](04-paginas-internas.md). A cor do ícone vem do `:nth-child`, então cada card herdou a cor de quem estava naquela posição antes.

**Seção "Nossa equipe"** (`.team-section`, no fim do `main`) — cabeçalho centralizado com tag, título, subtítulo e um chip de contagem, seguido da grade de cards de pessoa. Detalhes em [05-equipe.md](05-equipe.md).

## Cuidado ao mexer na grade de cards

O arranjo 3+1 vem de posicionamento explícito por `nth-child`, e essas regras vivem **dentro** de `@media (min-width: 901px)`:

```css
@media (min-width: 901px){
  .cards .card:nth-child(1){ grid-column: 1; grid-row: 1; }
  /* ... */
  .cards .card:nth-child(4){ grid-column: 1; grid-row: 2; }
}
```

Isso é deliberado. `:nth-child` acrescenta especificidade — `.cards .card:nth-child(2)` é (0,3,0) e um reset `.cards .card` seria (0,2,0) —, e **media query não conta na especificidade**. Ou seja: tentar desfazer o posicionamento num breakpoint menor não funciona; o reset perde a disputa e os cards continuam empurrados para colunas que não existem, o que faz o Grid criar colunas implícitas e estourar a largura da tela no mobile.

A regra prática: **declare o posicionamento só na faixa onde ele vale**, nunca desfaça depois. Acrescentar ou remover um card exige ajustar essas linhas à mão — foi o que aconteceu ao tirar o card de Manuais.
