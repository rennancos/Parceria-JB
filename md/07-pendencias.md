[← Índice](README.md)

# Pendências e pontos de atenção

## Conteúdo

- **Os documentos e manuais ainda não têm destino.** O menu e os cards da home já levam às páginas certas, mas os itens listados dentro delas não. Em Documentação eles aparecem tracejados, com "a definir": falta o `href` — endereço do portal ou o arquivo em `docs/`. Nas outras páginas ainda há `href="#"`. **Os 12 de Documentação já podem ser preenchidos pela própria página**, sem mexer em código — ver [09-edicao-pela-pagina.md](09-edicao-pela-pagina.md).
- **A pasta `docs/` está vazia.** Nenhum DOC/PDF foi publicado ainda; ver [docs/LEIA-ME.md](../docs/LEIA-ME.md) para a convenção de nome e como vincular.
- **Os contatos dos fabricantes estão vazios no guia de origem.** Portal, e-mail e telefone da Vizrt e dos outros dois fabricantes aparecem como "a definir"; dois deles seguem sem nome ("Fabricante 2", "Fabricante 3"). Ver [04-paginas-internas.md](04-paginas-internas.md).
- **Três das quatro páginas têm conteúdo de rascunho.** Só "Primeiros passos" tem material real; as outras foram escritas a partir das descrições dos cards. O bloco tracejado (`aviso`) no fim de cada uma marca isso — remova ao preencher.
- **A equipe está com dados de exemplo** ("Pessoa 01", "Pessoa 02"…, e-mails `@empresa.com`, `perfil: "#"`) e `Fotos/EQUIPE/` está quase vazia — por isso quase todos os cards aparecem com iniciais.

## Estrutura

- **`md/jotbird-document.md` e `js/paginas/primeiros-passos.js` são cópias manuais um do outro.** Nada avisa quando saem de sincronia.
- **A ordem dos `<script>` em `index.html` é uma dependência implícita.** `paginas.js` → `js/paginas/*.js` → `router.js` → `documentos.js`. Trocar a ordem quebra silenciosamente: a página some do menu, ou os botões de edição não aparecem — sem erro no console.
- **O conteúdo das páginas não existe sem JavaScript.** Só a home é HTML de verdade; com JS desligado, o menu não leva a lugar nenhum. É aceitável para um portal interno, mas inviabiliza indexação por buscador.
- **A grade de cards depende de posicionamento explícito.** `.cards .card:nth-child(1..4)` fixa coluna e linha de cada um. As regras vivem em `@media (min-width: 901px)` de propósito — ver [03-home.md](03-home.md) para o porquê. Acrescentar ou remover um card exige ajustar essas linhas à mão.
- **`#manuais` sobrevive por um apelido no router.** `APELIDOS` em `js/router.js` traduz o hash antigo para `documentacao`. Se um dia a Documentação for renomeada, o apelido precisa acompanhar.

## Comportamento

- **O tema não respeita o `prefers-color-scheme`** do sistema na primeira visita — usa só o que estiver salvo em `localStorage`, e o padrão é claro.
- **Não há filtro nem busca na equipe.** O campo `area` já existe em cada pessoa e é espelhado em `data-area` no card, pronto para isso, mas nada consome.
- **Os botões Buscar e Notificações são decorativos.** Não têm comportamento associado, no header nem no drawer. **Perfil deixou de ser:** com o serviço da edição pela página no ar, ele abre o login e, logado, mostra nome, papel e "Sair" — ver [09-edicao-pela-pagina.md](09-edicao-pela-pagina.md). Sem o serviço, continua sem função.

## O que já foi resolvido

Registrado para não ser reintroduzido por engano:

- As fotos da equipe eram servidas no tamanho de origem — 15 MB para desenhar avatares de 132 px, sendo um único PNG de 4,4 MB (6720×4480). O peso ia junto em cada instalador Windows. Agora os masters ficam em `Fotos/EQUIPE/originais/` (fora da lista de `files` do electron-builder) e o portal carrega `.webp` de 264×264 gerados por `npm run fotos`: ~400 KB no total. **Não volte a apontar `foto` para o original** — ver [05-equipe.md](05-equipe.md).
- O campo `area` tinha grafia inconsistente em 20 dos 36 registros (`CAPTAÇÃO`/`captação`/`Captação`, `jcorp`/`JCORP`…). Como o chip aplica `text-transform: uppercase`, nada disso aparecia na tela — só quebraria no dia em que o filtro por área existisse, gerando 11 grupos onde há 7. A lista canônica está em [05-equipe.md](05-equipe.md).
- A grade de cards estourava a largura no mobile, porque o posicionamento por `nth-child` continuava valendo num grid de uma coluna e o Grid criava colunas implícitas. **Tentar desfazer com um reset não funciona** — `:nth-child` tem especificidade maior e media query não conta. A correção foi mover as regras para `@media (min-width: 901px)`.
- O `<html>` ficava com o tema claro para sempre no black mode, porque as variáveis do tema escuro estão em `body.dark-mode`. O `background` agora fica só no `body`.
- O brilho decorativo do fundo vazava para fora do `.backdrop` e criava rolagem horizontal e ~20% de página vazia no fim.
- As listras do fundo e as sombras dos cards eram pretas fixas e sumiam no tema escuro; viraram tokens (`--stripe`, `--shadow-card`, `--shadow-tile`).
- O `main` tinha `min-height: 1000px` redundante com o `flex: 1`, sobrando espaço morto.
