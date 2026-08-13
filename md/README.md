# Parceria JB — Portal

Portal interno da Parceria JB. Sem build e sem framework: HTML, CSS e JavaScript em arquivos separados, que abrem até por duplo clique.

```bash
cd PA_JB       # a raiz do projeto — ver 01-como-rodar.md
pnpm install   # só na primeira vez
pnpm dev       # http://localhost:8000
```

Existe também um servidor Node opcional (`pnpm servidor`), que serve a mesma pasta **e** a API pela qual a equipe edita os documentos sem abrir código — ver [09](09-edicao-pela-pagina.md). Ele não usa nenhuma dependência, e a página funciona sem ele.

## Documentação

Um documento por parte. Comece pelo que você precisa mexer:

| Documento | Para quê |
|---|---|
| [01-como-rodar.md](01-como-rodar.md) | Subir o projeto, `file://` vs `http://`, o que o pnpm faz (e não faz) aqui |
| [02-seguranca.md](02-seguranca.md) | O que não pode vazar: dado pessoal, marca, `.env`. **Leia antes de publicar em qualquer lugar.** |
| [03-home.md](03-home.md) | A página inicial: header, grade de cards, as duas *views* |
| [04-paginas-internas.md](04-paginas-internas.md) | Como as páginas do menu funcionam e **como editar o conteúdo delas** |
| [05-equipe.md](05-equipe.md) | A seção "Nossa equipe": array, fotos, destaques |
| [06-estilos-e-tema.md](06-estilos-e-tema.md) | Tokens de cor, black mode, responsivo, drawer, acessibilidade |
| [07-pendencias.md](07-pendencias.md) | O que está inacabado ou merece atenção |
| [08-futuros-passos.md](08-futuros-passos.md) | Roteiro: subir na VM, conteúdo real, busca, e o que **não** fazer |
| [09-edicao-pela-pagina.md](09-edicao-pela-pagina.md) | A equipe editando documentos pela própria página: **como usar, como administrar** e o servidor por trás |
| [jotbird-document.md](jotbird-document.md) | Guia de origem do conteúdo de "Primeiros passos" |

Se for mexer em conteúdo (texto das páginas, pessoas da equipe), os documentos **04** e **05** bastam. Se for mexer em aparência, o **06**.

## Estrutura

```
PA_JB/
├── index.html          # ÚNICO html do projeto: header, home e o container das páginas
├── css/
│   ├── styles.css      # estilos base (temas, layout, header, cards)
│   ├── equipe.css      # estilos da seção "Nossa equipe"
│   ├── pagina.css      # estilos do conteúdo das páginas internas
│   └── edicao.css      # botões e janela da edição pela página — ver md/09
├── js/
│   ├── script.js       # alternância de tema (black mode) + menu mobile
│   ├── equipe.js       # array `equipe` + geração dos cards de pessoa
│   ├── paginas.js      # registro PAGINAS + renderizador das páginas internas
│   ├── router.js       # decide qual página mostrar a partir do hash da URL
│   ├── documentos.js   # edição pela página; não faz nada sem o servidor no ar
│   └── paginas/        # UM ARQUIVO POR ITEM DO MENU — só dados, sem HTML
│       ├── primeiros-passos.js
│       ├── documentacao.js       # inclui os manuais, que não têm página própria
│       ├── acessos-parceria.js
│       └── sharepoint.js
├── docs/               # documentos e manuais em arquivo (DOC/PDF) — ver docs/LEIA-ME.md
├── servidor/           # OPCIONAL: edição pela própria página — ver md/09
│   ├── servidor.js     # serve o site + a API (o site também abre sem ele)
│   ├── dados.js        # acervo de documentos em JSON
│   ├── auth.js         # usuários, senha, sessão, papéis (equipe / dev)
│   ├── usuarios.js     # CLI de cadastro, roda no terminal da VM
│   └── dados/          # acervo e usuários — FORA DO GIT, precisa de backup
├── Fotos/
│   ├── LOGOS/
│   │   └── TVGLOBO_LOGO.png   # logo usada no header (.brand-mark)
│   ├── EQUIPE/                # fotos da equipe (uma por pessoa do array)
│   └── 6427daa0-87e6-4c34-9c02-ba35e14891b1.jpg
├── md/                 # esta documentação — não é lida pelo site
│   ├── README.md
│   ├── 01-como-rodar.md
│   ├── 02-seguranca.md
│   ├── 03-home.md
│   ├── 04-paginas-internas.md
│   ├── 05-equipe.md
│   ├── 06-estilos-e-tema.md
│   ├── 07-pendencias.md
│   ├── 08-futuros-passos.md
│   ├── 09-edicao-pela-pagina.md
│   └── jotbird-document.md
├── package.json        # só o servidor local (`pnpm dev`) — não há build
├── pnpm-lock.yaml
├── .gitignore
├── .env.example        # modelo versionado das variáveis de ambiente
└── .env                # valores locais — ignorado pelo git
```

Os caminhos em `index.html` são relativos (`css/styles.css`, `js/script.js`), então a estrutura de pastas precisa ser preservada ao mover ou publicar o projeto.

## As três ideias que explicam o resto

Se você só for ler uma seção desta documentação, leia esta.

**1. Um HTML só.** Não existe um arquivo por página. O menu troca o conteúdo dentro do mesmo `index.html`, a partir do hash da URL. Sem build não há include de HTML, e um arquivo por página significaria uma cópia do header em cada. Ver [04](04-paginas-internas.md).

**2. Conteúdo é dado, não markup.** Texto de página e lista de pessoas vivem em arquivos `.js` como objetos e arrays; o HTML é gerado a partir deles. Quem edita conteúdo nunca precisa tocar em tag. Ver [04](04-paginas-internas.md) e [05](05-equipe.md).

**3. Tem que funcionar em `file://`.** A página precisa abrir com duplo clique, sem servidor. Isso proíbe `fetch()` de arquivo local e `<script type="module">` — os dois são bloqueados nesse protocolo. É a razão de os dados serem `.js` e não `.json`, e de o servidor local ser um estático burro em vez do Vite. Ver [01](01-como-rodar.md).
