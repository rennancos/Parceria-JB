[← Índice](README.md)

# Edição pela própria página

**Objetivo:** a equipe inclui e edita os documentos e manuais da página Documentação por botões na própria página, sem abrir código. **Excluir é só de quem desenvolveu.**

> **Status em 12/08/2026:** funcionando de ponta a ponta, testado nos dois papéis. Falta subir na VM — ver [Antes de subir na VM](#antes-de-subir-na-vm) no fim.

O portal continua abrindo por duplo clique, sem servidor nenhum. Quando não há API respondendo, `js/documentos.js` desiste em silêncio e a página se comporta como o site estático de sempre.

---

## Para quem vai usar

Três coisas bastam.

**1. Entrar.** Botão **Perfil**, no canto superior direito (no celular, dentro do menu). Usuário e senha são os que quem administra o portal cadastrou — não existe tela de criar conta. Enquanto a sessão está aberta, o botão fica com um ponto azul.

**2. Incluir ou editar.** Logo abaixo de cada lista de documentos aparece **Incluir nesta lista**, e em cada item, **Editar**. O formulário pede:

- **Título** e **Descrição** — a descrição é opcional, é a linha cinza menor;
- **Em qual lista entra** — dá para mover um item de lista por aqui;
- **O documento é…** um endereço (portal, SharePoint, intranet) ou um arquivo para baixar (DOC, PDF, planilha).

Sendo arquivo, escolha o arquivo e pronto: ele é enviado para a pasta `docs/` do portal com o nome tratado (minúsculo, sem acento, sem espaço) e o item passa a apontar para ele. O ícone e o chip cinza ("PDF", "DOC", "Link") saem sozinhos — não há campo para isso.

Enviando **a versão nova de um documento que já existe**, marque *Substituir o arquivo de mesmo nome*. Sem marcar, o portal guarda os dois (`manual-video.pdf` e `manual-video-2.pdf`), para ninguém apagar arquivo de outra pessoa sem querer.

Sem endereço e sem arquivo, o item aparece na lista como **"a definir"** — no lugar certo, sem fingir que já abre. É assim que os 12 itens de hoje estão.

**3. Excluir** só aparece para quem tem papel `dev`. Se você é da equipe e precisa tirar um item da página, peça — ou deixe o item sem destino até alguém apagar.

O que **não** se edita pela página: os textos de seção, as categorias, os blocos por área e os passos de "Como usar um manual". Isso continua em `js/paginas/documentacao.js`, com quem mexe em código. Foi escolhido assim porque é o que a equipe precisa alimentar de fato, e porque quanto menos a tela deixa mexer, menos chance de alguém desmontar a página sem querer.

---

## Para quem administra

### Subir o serviço

```bash
pnpm servidor                       # porta 8000
node servidor/servidor.js --porta 80    # produção na VM
```

Um processo só serve **o site inteiro e a API**. Não precisa de IIS/nginx junto, nem de `pnpm install` (o servidor não usa nenhuma dependência, só o `node:` embutido).

`pnpm dev` continua existindo e serve só o estático, sem API — útil para mexer em CSS sem subir o backend.

### Cadastrar quem edita

```bash
pnpm usuarios listar
pnpm usuarios incluir            # pergunta login, nome, papel e senha
pnpm usuarios senha <login>      # troca a senha
pnpm usuarios remover <login>    # derruba as sessões abertas junto
```

Dois papéis, e a diferença entre eles é a razão de o portal ter servidor:

| Papel | Pode |
|---|---|
| `equipe` | incluir e editar |
| `dev` | incluir, editar e **excluir** |

A senha vira hash scrypt em `servidor/dados/usuarios.json` e não é recuperável — esquecendo, use `pnpm usuarios senha`.

### Onde mora o que a equipe escreveu

```
servidor/dados/documentos.json    o acervo (o que aparece nas listas)
servidor/dados/usuarios.json      quem edita, com hash de senha
docs/                             os arquivos enviados
```

**Os dois primeiros estão fora do git de propósito** (`.gitignore`). São conteúdo de produção e hash de senha: não devem ser versionados, e o acervo da VM não pode ser sobrescrito por um `git pull` do deploy.

**Isso torna o backup obrigatório.** Uma cópia diária de `servidor/dados/` e de `docs/` resolve — é o único lugar onde o trabalho da equipe existe.

---

## As duas decisões que definem o resto

**1. Backend leve na VM (Node + JSON + login).** Foi a opção escolhida entre três (a outra era um editor no navegador que exporta arquivo para o dev publicar; a terceira, jogar os documentos numa biblioteca do SharePoint).

O motivo de ser a única que atende o pedido: **permissão feita só no navegador é cosmética.** Esconder o botão de excluir de quem é da equipe não impede ninguém de abrir o DevTools e mandar a requisição na mão. Para "só quem desenvolveu pode excluir" ser verdade, alguém precisa recusar do lado do servidor — e é isso que `servidor/auth.js` faz.

O preço, assumido: o portal deixa de ser uma pasta de arquivos estáticos e passa a ter um processo Node na VM, que precisa subir no boot e ter o JSON no backup. Ver [08-futuros-passos.md](08-futuros-passos.md) §2.1.

**2. Escopo: só os itens de documentos e manuais.** Título, descrição, link ou arquivo, e em qual lista o item entra — nada além disso, pelos motivos da última seção de "Para quem vai usar".

---

## Como está montado

### No servidor

| Arquivo | O que faz |
|---|---|
| `servidor/dados.js` | Lê, valida e grava `servidor/dados/documentos.json`. Única porta de entrada do acervo. Define os blocos, as extensões aceitas e o `nomeSeguro()` dos arquivos enviados. |
| `servidor/auth.js` | Usuários, senha (scrypt + salt), sessões em memória, cookie e a checagem de papel. |
| `servidor/servidor.js` | Um processo que serve **o site estático e a API**. |
| `servidor/usuarios.js` | CLI de cadastro. Roda no terminal da VM. |

### No navegador

| Arquivo | O que faz |
|---|---|
| `js/documentos.js` | Inicializa o recurso, sincroniza sessão e desenha as ações. **Não faz nada sem API.** |
| `js/documentos/api.js` | Transporte JSON, credenciais, erros e invalidação em `401`. |
| `js/documentos/acervo.js` | Carregamento, validação, projeção dos dados e operações de escrita. |
| `js/documentos/dialogo.js` | DOM e ciclo de submissão de cada abertura da janela. |
| `js/documentos/formularios.js` | Campos de login, perfil e documento; captura dos valores antes de enviar. |
| `css/edicao.css` | Botões, barra de incluir e a janela de formulário/login. |

E dois ganchos pequenos no que já existia:

- `js/paginas.js` emite `data-bloco="<chave>"` no `<ul class="link-list">` e `data-item-id="<id>"` no `<li>` — este só quando o item tem `id`, ou seja, só quando veio do servidor. Sem isso, o front de edição não teria onde se pendurar;
- `js/router.js` dispara `pagina:render` ao terminar de desenhar e expõe `window.redesenharPagina()`, usado depois de cada item salvo.

Os dois são inofensivos quando o dado não existe: sem servidor, nenhum `data-item-id` é emitido e ninguém escuta o evento.

**A chave que liga um item ao lugar onde ele aparece** está em dois arquivos: `chave` nos blocos `tipo: 'links'` de `js/paginas/documentacao.js`, e `BLOCOS` no topo de `servidor/dados.js`. São `processos-politicas`, `padroes-modelos` e `manuais`. **Bloco novo precisa entrar nos dois lugares.**

### Contrato da API

```
GET    /api/sessao            quem sou eu        → { autenticado, nome, login, papel }
POST   /api/sessao            entrar             { login, senha }
DELETE /api/sessao            sair

GET    /api/documentos        acervo             → { itens, blocos }     aberto
POST   /api/documentos        incluir                                    equipe, dev
PUT    /api/documentos/:id    editar                                     equipe, dev
DELETE /api/documentos/:id    excluir                                    SÓ dev
POST   /api/arquivos?nome=…   subir DOC/PDF      corpo = bytes do arquivo   equipe, dev
```

Leitura é aberta de propósito: quem está na rede e abriu o portal já enxerga a página inteira. O que exige login é escrever.

### Um item do acervo

```json
{
  "id": "uuid",
  "bloco": "manuais",
  "titulo": "Manual de Vídeo",
  "descricao": "Roteamento, monitoração e configuração",
  "href": "docs/manual-video.pdf",
  "formato": "",
  "ordem": 1,
  "criadoPor": "login", "criadoEm": "ISO",
  "atualizadoPor": "login", "atualizadoEm": "ISO"
}
```

`formato` vazio é o normal — o renderizador deduz do fim do `href`. Só é preenchido (`'link'`) quando o item é um endereço sem extensão conhecida e se quer o chip "Link". É o mesmo formato dos itens de `tipo: 'links'` descrito em [04-paginas-internas.md](04-paginas-internas.md), de propósito: o que vem do servidor entra no renderizador sem tradução.

Os 12 itens de hoje nasceram da semente que está em `documentacao.js` e trazem `criadoPor: "semente"`.

---

## Decisões pequenas, já tomadas

Estão comentadas no código; ficam aqui para não serem revisitadas por engano.

- **`href` só aceita `https?://…` ou `docs/arquivo.ext`** (lista de permitidos, `validarHref`). É o que barra `javascript:` — o renderizador escapa texto, mas href continua sendo executável.
- **Upload sem multipart:** o corpo da requisição é o arquivo cru e o nome vai na query. `fetch(url, { body: arquivo })` resolve no navegador, e evita um parser de multipart à mão ou uma dependência.
- **Nome de arquivo é reescrito pelo servidor** (`nomeSeguro`): minúsculo, sem acento, sem espaço, extensão da lista fechada — a mesma convenção que [docs/LEIA-ME.md](../docs/LEIA-ME.md) pede à mão.
- **Excluir só apaga a linha do acervo**, nunca o arquivo em `docs/`. PDF órfão custa menos que arquivo apagado por engano; a limpeza é manual, na VM.
- **Sessão em memória:** reiniciar o serviço desloga todo mundo. Persistir traria token válido depois de dias fora do ar, sem benefício real num portal interno.
- **Cookie `HttpOnly; SameSite=Strict`, sem `Secure`** — a VM serve HTTP na rede interna e `Secure` faria o navegador descartar o cookie. **Se entrar HTTPS, acrescente `Secure`** em `cookieDeSessao()`.
- **Não existe tela de "criar conta".** Quem entra na lista é decisão de quem administra, pela CLI.
- **Escrita síncrona + `rename`:** o Node é single-thread, então `writeFileSync` já serializa quem salva ao mesmo tempo, e o rename evita JSON pela metade se a máquina cair.
- **Os itens do servidor substituem os da semente mesmo quando a lista volta vazia.** Um "só troca se vier alguma coisa" faria o último item excluído reaparecer na carga seguinte.
- **`confirm()` nativo antes de excluir.** É destrutivo: o aviso do navegador não tem como ser clicado por engano nem estilizado a ponto de passar despercebido.

---

## Regressões automatizadas do frontend

`npm test` verifica contratos e operações com respostas simuladas. `npm run test:browser` exercita a interface em Chrome/Edge headless com API descartável.

Cada abertura do editor tem sua própria janela. Todos os campos são capturados antes do upload; fechar a janela não cancela uma gravação já enviada e uma resposta antiga não altera outra janela. Submissões duplas na mesma janela são ignoradas enquanto houver envio.

Após salvar, o item confirmado pela API atualiza a projeção local. Após excluir, o ID confirmado sai da projeção. A confirmação não depende de outro GET que poderia falhar depois da gravação; novas leituras continuam disponíveis em `acervo.carregar()`. Leituras anteriores a uma confirmação são descartadas. Um `401` remove o estado visual autenticado e permite entrar novamente pelo perfil.

## O que foi testado anteriormente

Rodado em 12/08/2026, com o serviço na porta 8123 e dois usuários de teste, dirigindo a própria interface num navegador headless:

| | Resultado |
|---|---|
| Entrar como `equipe` | 12 Editar, 3 barras de Incluir, **nenhum Excluir** |
| Entrar como `dev` | os mesmos, **mais 12 Excluir**, e excluir funciona |
| Com sessão de `equipe`, `DELETE /api/documentos/:id` na mão | **403 — "Seu perfil não permite esta ação."** É o teste que prova que a regra vale de verdade |
| Escrever sem sessão nenhuma | 401 |
| Incluir por link, pela tela | item aparece com chip "Link", abrindo em outra aba |
| Incluir por arquivo, pela tela | `Política de Acesso — 2026.pdf` virou `docs/politica-de-acesso-2026.pdf`, com chip "PDF" |
| Mesmo arquivo de novo, sem *substituir* | virou `…-2.pdf`; com *substituir*, manteve o nome |
| Subir `.exe` | recusado |
| `href` `javascript:alert(1)` e `docs/../../.env` | os dois recusados |
| Título vazio, bloco inexistente | recusados, com mensagem em português |
| `/servidor/dados/usuarios.json`, `/.env`, `/../.env` pela web | 403 |
| Abrir `index.html` por duplo clique (`file://`) | página inteira com a semente, **nenhum erro no console**, nenhum botão de edição |
| Servir por `pnpm start` (sem API) | idem: a API não responde, o portal não muda de comportamento |

---

## Antes de subir na VM

- **Backup do `servidor/dados/` e de `docs/`.** É o único lugar onde o trabalho da equipe existe. Uma cópia diária resolve.
- **O `git pull` do deploy não pode passar por cima do acervo** — daí o `.gitignore`.
- **A porta.** Hoje o padrão é 8000; em produção é `--porta 80`, com firewall liberado e DNS interno apontando o nome — ver [08-futuros-passos.md](08-futuros-passos.md) §2.2.
- **Subir no boot** (serviço do Windows via `nssm`, ou `systemd` no Linux). `node servidor/servidor.js` preso a um terminal cai quando a sessão fecha.
- **Cadastrar os usuários reais** e remover qualquer usuário de teste (`pnpm usuarios listar`).
- **Publicar os arquivos que hoje faltam.** Os 12 itens estão sem destino ("a definir") — agora dá para preenchê-los pela própria página, que é o ponto.
