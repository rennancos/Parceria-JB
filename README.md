# Portal Parceria JB

Para alterar o código, consulte o [Guia de Manutenção](docs/manutencao.md): arquitetura, contratos, dependências, riscos e validações.

Portal interno da Parceria JB: ponto único de entrada para primeiros passos, documentação, manuais, acessos e SharePoint da operação.

Sem build e sem framework. HTML, CSS e JavaScript em arquivos separados, lidos direto pelo navegador. A página abre até por duplo clique em `index.html`.

> **Repositório privado, e precisa continuar assim.** O código carrega nomes e e-mails reais da equipe (`js/equipe-dados.js`), fotos de pessoas (`Fotos/EQUIPE/`) e marca corporativa. Leia [md/02-seguranca.md](md/02-seguranca.md) antes de publicar isto em qualquer lugar.

## Como rodar

A raiz do projeto é esta pasta (`PA_JB/`), onde ficam o `.git` e o `package.json`.

```bash
cd PA_JB       # a partir de DEV PAJB
pnpm install   # só na primeira vez
pnpm dev       # http://localhost:8000
```

Duplo clique em `index.html` também funciona. O [md/01-como-rodar.md](md/01-como-rodar.md) explica o que muda na prática: `localStorage`, teste em celular e fidelidade ao resultado final.

`dev`, `start` e `servidor` usam o mesmo backend protegido: site e API em
`127.0.0.1:8000`, sem publicar a raiz inteira do repositório. Node 22 ou superior
é necessário; prefira uma versão LTS suportada. Para cadastrar quem edita:

```bash
pnpm servidor   # site + API num processo só, sem dependência nenhuma
pnpm usuarios   # cadastro de quem edita
```

O portal funciona sem esse serviço: quando não há API respondendo, os botões de edição simplesmente não aparecem.

O mesmo portal também é distribuível como aplicativo Windows, com verificação de atualização ao abrir:

```bash
npm run app         # abre o aplicativo, sem empacotar
npm run app:build   # gera dist/Parceria-JB-Setup-<versão>.exe
```

É Electron, e só existe em `app/`. O site não mudou uma linha para isso. Passo a passo em [md/10-aplicativo-windows.md](md/10-aplicativo-windows.md).

## As três ideias que explicam o resto

**1. Um HTML só.** Não há um arquivo por página. O menu troca o conteúdo dentro do mesmo `index.html`, a partir do hash da URL.

**2. Conteúdo é dado, não markup.** Texto das páginas e lista de pessoas vivem em `.js` como objetos e arrays; o HTML é gerado a partir deles. Quem edita conteúdo nunca toca em tag.

**3. Tem que funcionar em `file://`.** Isso proíbe `fetch()` de arquivo local e `<script type="module">`, e é a razão de os dados serem `.js` e não `.json`. O backend entrega esses arquivos sem transformação ou bundler.

## Estrutura

```
PA_JB/
├── index.html      # ÚNICO html: header, home e o container das páginas
├── css/            # tokens, styles, equipe, pagina, edicao, busca
├── js/
│   ├── script.js   # menu lateral
│   ├── equipe-dados.js # dados e identidade das pessoas
│   ├── equipe.js   # cards de pessoa
│   ├── paginas.js  # registro PAGINAS + renderizador
│   ├── router.js   # escolhe a página pelo hash da URL
│   ├── documentos.js  # integração da edição (inerte sem servidor)
│   ├── documentos/ # API, acervo, formulários e janela
│   ├── busca.js    # interface da busca
│   ├── busca/     # motor e adaptação do conteúdo
│   ├── compartilhado/ # escape HTML e contrato das seções
│   └── paginas/    # um arquivo por item do menu — só dados
├── docs/           # documentos e manuais em arquivo (DOC/PDF)
├── servidor/       # OPCIONAL: site + API de edição, sem dependências
├── app/            # OPCIONAL: o aplicativo Windows (Electron) — o site não usa
├── Fotos/          # logos e fotos da equipe
├── tests/          # unit/ (lógica e contratos) e browser.cjs (navegador real)
└── md/             # documentação do projeto
```

Os caminhos em `index.html` são relativos, então a estrutura de pastas precisa ser preservada ao mover ou publicar o projeto.

## Testes

```bash
pnpm test              # lógica e contratos; Node 22+
pnpm test:browser      # Chrome/Edge headless; Node 22+
```

O teste de navegador usa uma API simulada em memória e não modifica usuários, arquivos publicados ou o acervo real. Requer Chrome/Edge instalado; para outro caminho, defina `CHROME_PATH`. Perfis temporários e uma captura são criados na pasta temporária do sistema.

As verificações cobrem `file://`, HTTP sem API, submissões pendentes, sessão expirada, busca e layout responsivo.

## Documentação

Índice completo em [md/README.md](md/README.md). Um documento por parte:

| Documento | Para quê |
|---|---|
| [01-como-rodar.md](md/01-como-rodar.md) | Subir o projeto, `file://` vs `http://`, o que o pnpm faz (e não faz) aqui |
| [02-seguranca.md](md/02-seguranca.md) | O que não pode vazar. **Leia antes de publicar em qualquer lugar.** |
| [03-home.md](md/03-home.md) | A página inicial: header, grade de cards, as duas *views* |
| [04-paginas-internas.md](md/04-paginas-internas.md) | Como as páginas do menu funcionam e como editar o conteúdo delas |
| [05-equipe.md](md/05-equipe.md) | A seção "Nossa equipe": array, fotos, destaques |
| [06-estilos-e-tema.md](md/06-estilos-e-tema.md) | Tokens do tema atual, responsivo, drawer, acessibilidade |
| [07-pendencias.md](md/07-pendencias.md) | O que está inacabado ou merece atenção |
| [08-futuros-passos.md](md/08-futuros-passos.md) | Roteiro: subir na VM, conteúdo real, busca, e o que não fazer |
| [09-edicao-pela-pagina.md](md/09-edicao-pela-pagina.md) | A equipe editando documentos pela própria página: uso, administração e o servidor por trás |
| [10-aplicativo-windows.md](md/10-aplicativo-windows.md) | O portal como `.exe`: gerar o instalador, versionar, publicar atualização |
| [11-busca.md](md/11-busca.md) | A busca do portal: o que indexa, como ordena e as armadilhas do componente |

Para mexer em conteúdo, 04 e 05 bastam. Para aparência, 06.

## Status

A edição pela própria página está funcionando de ponta a ponta e testada nos dois papéis (`equipe` e `dev`); falta subir na VM. O conteúdo ainda é parcial: os itens de Documentação estão sem destino ("a definir"), `docs/` está vazia e a equipe está com dados de exemplo. A lista completa está em [md/07-pendencias.md](md/07-pendencias.md).
