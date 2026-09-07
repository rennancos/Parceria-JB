[← Índice](README.md)

# Busca

O botão "Buscar" existia no header e no drawer sem fazer nada. Agora ele abre uma busca que varre **todo** o conteúdo do portal: páginas, seções, passos, links, sistemas, fabricantes, notas e as pessoas da equipe.

A interface fica em [js/busca.js](../js/busca.js), o algoritmo em [js/busca/motor.js](../js/busca/motor.js), a adaptação dos dados em [js/busca/indice.js](../js/busca/indice.js) e os estilos em [css/busca.css](../css/busca.css). Nenhuma biblioteca foi adicionada.

## Como se usa

| | |
|---|---|
| Abrir | Botão "Buscar" (header ou drawer), `Ctrl+K` / `Cmd+K`, ou `/` |
| Navegar | `↑` `↓` — circular, do fim volta ao começo |
| Abrir o resultado | `Enter`, ou clique |
| Fechar | `Esc`, botão `×`, ou clique fora |

Digitar menos de 2 caracteres não busca. Acento não importa: `captacao` acha `Captação`, e o trecho encontrado é grifado na palavra certa, com acento e tudo.

Vários termos funcionam como **E**, não como OU: `vizrt portal` só traz o que tem os dois.

## Por que não há índice, backend nem biblioteca

A arquitetura do projeto já entregava a busca quase pronta. `PAGINAS` e `Portal.equipe.pessoas` são objetos estruturados que já estão na memória do navegador quando a página abre — não há o que consultar, baixar ou indexar previamente. O índice adapta o conteúdo, o motor pontua e a interface desenha os resultados.

É por isso que a busca continua funcionando com o portal aberto por duplo clique, sem servidor: ela nunca precisou de um.

## O índice é remontado a cada abertura

De propósito. [js/documentos.js](../js/documentos.js) troca os itens dos blocos pelos do acervo quando o servidor da edição responde, e volta a mexer a cada item salvo. Um índice montado uma vez no carregamento ficaria desatualizado **sem avisar** — a pessoa buscaria um documento que acabou de cadastrar e não acharia.

Remontar custa poucos milissegundos para as algumas centenas de entradas do portal.

O evento `acervo:alterado` também reconstrói o índice quando a busca já está aberta. O motor e o índice recebem testes sem depender da interface.

## O que entra no índice

Cada tipo de bloco guarda o texto em campos diferentes, e `ITEM_POR_TIPO` em `js/busca/indice.js` diz como cada um vira uma entrada:

| Bloco | Vira resultado com |
|---|---|
| `paineis` | título, texto, `meta`, e o `href` se tiver |
| `passos` | título, texto, destaque |
| `links` | título, descrição, formato, `href` |
| `sistemas` | nome do sistema e o perfil de acesso |
| `fabricantes` | nome, portal, e-mail, telefone, horário |
| `notas` | o texto da nota |
| equipe | nome, cargo, área, e-mail, destaque |

**Ao criar um tipo de bloco novo em [paginas.js](../js/paginas.js), acrescente uma linha em `ITEM_POR_TIPO`** — senão aquele conteúdo simplesmente não é achável. Não quebra nada: tipo desconhecido é ignorado em silêncio.

## Ordenação

Um termo vale mais quanto mais importante for o campo onde caiu (título 10, subtítulo 4, contexto 2, corpo 1), **dobra** se casar no começo de uma palavra e dobra de novo se for o campo inteiro. Empate é desfeito pelo título mais curto — o mais específico costuma ser o mais curto, e a ordem fica estável entre digitações.

## Para onde o resultado leva

- **Página, seção ou item sem destino próprio** → a página onde ele está (`#chave`).
- **Item com `href` de portal ou arquivo** → abre em outra aba, como o resto do portal.
- **Pessoa** → a home, rolando até o card, que recebe um anel por 2 segundos. É o que faz achar alguém no meio de 36 cards iguais.

O realce depende de cada card ter `id`. Cards e índice usam a mesma função `Portal.equipe.idDaPessoa()` de [js/equipe-dados.js](../js/equipe-dados.js), sem duplicar o cálculo.

## Acessibilidade

A janela é um `<dialog>` aberto com `showModal()`, como o modal da edição: o foco preso, o resto da página inerte e o `::backdrop` são do navegador.

Dentro dela vale o padrão combobox do WAI-ARIA: o campo é `role="combobox"` ligado por `aria-controls` a uma `role="listbox"`, e o item ativo é apontado por `aria-activedescendant`. **O foco do DOM nunca sai do campo** — é isso que permite continuar digitando enquanto as setas andam pela lista. Como consequência, os resultados não são `<a>` nem são focáveis: quem usa leitor de tela recebe o item ativo pelo `aria-activedescendant`.

A contagem de resultados fica num `role="status"`, anunciada sem roubar o foco.

## Duas armadilhas que já custaram caro aqui

Estão no código como comentário, e ficam registradas aqui para não voltarem:

- **O `Esc` é tratado no `keydown`, não deixado para o `<dialog>`.** O evento `close` do Chromium não dispara de forma confiável depois que a lista foi redesenhada; quando não dispara, a limpeza não roda e a página fica com a rolagem travada por trás de uma janela já fechada. Todo fechamento passa por `fechar()`.

- **A lista usa `flex: 0 1 auto`, nunca `flex: 1`.** Com `flex-basis: 0` ela não contribui altura nenhuma para a janela — que é dimensionada pelo conteúdo — e o resultado é uma lista de altura **zero**: os itens existem no DOM, respondem a clique e a leitor de tela, e não aparecem para ninguém. É o tipo de defeito que passa por qualquer teste que consulte o DOM em vez de olhar a tela.

## O que ainda não faz

- Não há atalho para "ver todos" quando passa de 30 resultados; o contador mostra `30+` e a pessoa refina o termo.
- Não busca dentro dos arquivos publicados em `docs/` — só nos títulos e descrições com que eles aparecem no portal.
- Não guarda histórico nem sugere buscas recentes.
