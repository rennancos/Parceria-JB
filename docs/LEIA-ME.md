# docs/

Aqui ficam os documentos e manuais que **são arquivo** — DOC, PDF, planilha —
e não um endereço de portal. A página Documentação aponta para eles por caminho
relativo, então funciona tanto abrindo o `index.html` direto do disco quanto
servido por `pnpm start`.

## Como publicar um arquivo

**Pelo portal, sem mexer em nada disto:** com o serviço no ar (`pnpm servidor`), quem tem usuário cadastrado publica pela própria página — o arquivo cai aqui já com o nome tratado e o item passa a apontar para ele. Ver [md/09-edicao-pela-pagina.md](../md/09-edicao-pela-pagina.md). O passo a passo abaixo é o caminho manual, para quem mexe em código ou está sem o serviço.

1. Copie o arquivo para esta pasta.
2. Nomeie em minúsculas, sem acento e sem espaço, separando por hífen:
   `manual-video.pdf`, `politica-de-acesso.docx`, `modelo-escala.xlsx`.
   O caminho vai virar link — espaço e acento viram `%20`/`%C3%A1` e ficam
   ilegíveis quando alguém cola o endereço no chat.
3. Em `js/paginas/documentacao.js`, acrescente o `href` no item correspondente:

   ```js
   { titulo: 'Manual de Vídeo', href: 'docs/manual-video.pdf' }
   ```

   O chip "PDF" e o ícone saem da extensão — não precisa declarar mais nada.
   O arquivo abre em outra aba, para não tirar a pessoa do portal.

Documento que vive em portal, SharePoint ou intranet **não entra aqui**: use o
endereço completo no `href`, com `formato: 'link'`.

## Versão

Um arquivo por documento, sempre o vigente. Nada de `manual-video-v2-final.pdf`:
sobrescreva o anterior, para que o link publicado nunca aponte para versão velha.
