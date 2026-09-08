[← Índice](README.md)

# Aplicativo Windows (.exe)

**Objetivo:** distribuir o portal também como programa instalável no Windows, com verificação de atualização ao abrir e um botão **Atualizar agora** que baixa e instala a versão nova.

> **Status:** a base está pronta e testada em desenvolvimento. **Falta uma decisão para ligar de verdade:** o endereço onde o `versao.json` e os instaladores ficam publicados — que depende do nome da VM, ainda não escolhido ([08](08-futuros-passos.md), item 2.2). Enquanto esse endereço estiver vazio, o aplicativo funciona normalmente e a verificação de atualização fica desligada, sem erro na tela.

O site não mudou. `index.html`, `css/`, `js/` e `servidor/` estão exatamente como estavam — a pasta `app/` só existe dentro do executável, e apagá-la devolve o projeto ao que era. Ver [O que não mudou](#o-que-não-mudou-e-por-quê).

---

## Índice

- [A escolha da tecnologia](#a-escolha-da-tecnologia)
- [Impactos de virar executável](#impactos-de-virar-executável)
- [Versionamento](#versionamento-onde-fica-o-número)
- [Como funciona a atualização](#como-funciona-a-atualização)
- [Gerar o .exe](#gerar-o-exe)
- [Publicar uma nova versão](#publicar-uma-nova-versão)
- [Onde os arquivos ficam no servidor](#onde-os-arquivos-ficam-no-servidor)
- [O que não mudou, e por quê](#o-que-não-mudou-e-por-quê)
- [Limitações conhecidas](#limitações-conhecidas)

---

## A escolha da tecnologia

O projeto é **HTML, CSS e JavaScript lidos direto pelo navegador**, mais um servidor Node opcional sem nenhuma dependência. Não é Python, não é .NET, não é Java — e isso restringe bastante o caminho para um `.exe`.

Foram consideradas quatro saídas:

| Caminho | Por que não foi escolhido |
|---|---|
| **Node SEA** (executável único, nativo do Node) | Empacota o *servidor*, não uma janela. A pessoa continuaria abrindo `localhost` no navegador — não é um aplicativo, é um serviço com um ícone. E o .exe já sai com ~110 MB, porque é uma cópia do `node.exe`. |
| **Tauri** (janela nativa usando o WebView2 do Windows) | É o mais leve de todos: um `.exe` de 5 a 10 MB. Mas exige a cadeia de compilação do **Rust** na máquina de quem gera — uma tecnologia a mais para o projeto manter, e a única aqui que ninguém já usa. Revisto com o aplicativo pronto: [A troca por Tauri](#a-troca-por-tauri-revisto-em-2026-09-08). |
| **.NET + WebView2** | Mesmo ganho de tamanho do Tauri, mesmo custo: passa a existir um projeto C# ao lado do portal. |
| **`pkg`** | Descontinuado pela Vercel. Não entra em projeto novo. |

**Escolhido: Electron + electron-builder.**

A razão principal não é popularidade, é que **o código atual roda sem nenhuma alteração**. O Electron carrega a página por `file://` — exatamente o cenário que este projeto suporta desde o primeiro dia e que a documentação trata como requisito ([01](01-como-rodar.md), [08](08-futuros-passos.md) item 5). Não há build, não há bundler, não há `import`: o `index.html` que abre por duplo clique é o mesmo que o aplicativo abre.

O custo é tamanho, e ele é grande — o próximo tópico é sobre isso.

**Nada disso entra em produção do site.** `electron` e `electron-builder` são `devDependencies`: existem só na máquina de quem gera o instalador. A VM continua rodando `node servidor/servidor.js` sem `npm install`, como sempre.

### A troca por Tauri (revisto em 2026-09-08)

A pergunta voltou depois de o aplicativo estar pronto, agora com o código na
mão para medir. **A decisão se manteve: fica o Electron.** O registro existe
para ninguém refazer a conta do zero.

O que se ganharia:

- instalador de 104 MB → ~8 MB; instalado 340 MB → ~25 MB (dos quais 15 são
  `Fotos/`, que pesam igual nas duas tecnologias);
- o motor se atualiza sozinho pelo Windows Update, em vez de cada CVE do
  Chromium virar um release do portal só para subir a versão do Electron;
- `tauri-plugin-updater` traz manifesto, download e **assinatura criptográfica**
  prontos — fecharia o buraco do HTTP interno descrito em [Sobre HTTP](#sobre-http).

O que se pagaria:

- **Rust vira dependência permanente do projeto**, e ninguém aqui usa;
- **`file://` deixa de existir.** O Tauri serve por `http://tauri.localhost`, e
  a primeira linha de `js/documentos.js` (`if (location.protocol === 'file:')
  return;`) para de disparar: a edição sobe dentro do aplicativo e passa a
  chamar `/api` contra o próprio webview. Ou se mexe no site — perdendo a
  propriedade que sustenta a escolha atual — ou o aplicativo ganha botão
  quebrado;
- **~1.090 linhas reescritas**: `principal.js` (319), `atualizacao.js` (427) e
  `barra-atualizacao.js` (345), mais os 32 testes de `teste-atualizacao.js`;
- **some o preload.** A barra viraria `initialization_script`, que roda no mesmo
  mundo da página — o isolamento registrado em [O que não mudou](#o-que-não-mudou-e-por-quê)
  teria de ser reconstruído com as capabilities do Tauri;
- **a renderização vira variável.** Hoje o Chromium é fixo e a página sai
  idêntica em toda máquina; com WebView2 ela segue a versão do Edge de cada PC.

**Gatilho para reabrir — os dois juntos, nunca um só:** alguém na equipe já
usar Rust **e** as atualizações ficarem frequentes o bastante para os 104 MB
por release incomodarem de verdade.

Se o que incomodar for só a segurança do canal HTTP, o meio-termo é muito mais
barato: assinar o manifesto com uma chave própria dentro do
`app/atualizacao.js` que já existe (`crypto.verify`, ~20 linhas) mata o mesmo
cenário que o updater do Tauri mataria. E se o que incomodar for o tamanho, o
que paga mais rápido continua sendo otimizar `Fotos/` — ver [Tamanho](#tamanho).

---

## Impactos de virar executável

### Dependências

Duas, ambas de desenvolvimento:

```
electron          ^38   o runtime (Chromium + Node) que vira o aplicativo
electron-builder  ^26   monta o instalador NSIS
```

`pnpm install` baixa **419 MB** para `node_modules/` na máquina de quem gera o instalador — a maior parte é o binário do Electron. Fica fora do git (`node_modules/` já está no `.gitignore`).

**O código escrito para isto não usa dependência nenhuma.** A verificação de atualização, o download, a conferência de integridade e a instalação estão em `app/atualizacao.js`, com `crypto`, `fs` e o `net` do Electron. Não foi usado nem o `electron-updater` — o motivo está comentado no topo daquele arquivo.

### Tamanho

Medido no build de 1.0.0, não estimado:

| | |
|---|---|
| Instalador (`.exe`) | **104 MB** |
| Instalado em disco | **340 MB** |
| Do que é do portal | **15 MB** — e 15 dos 15 são `Fotos/` |

O resto é Chromium. Não há como reduzir sem trocar de tecnologia (a alternativa é o Tauri, na tabela acima). Se o tamanho vier a incomodar de verdade, o item que paga mais rápido é **otimizar `Fotos/EQUIPE/`**: são PNGs de foto de pessoa, que deveriam ser JPEG/WebP redimensionados — isso corta os 15 MB para 1 ou 2, e vale para o site também, não só para o aplicativo.

### Permissões de sistema

**Nenhuma.** Foi configurado assim de propósito, em `electron-builder.yml`:

- `perMachine: false` — instala em `%LOCALAPPDATA%\Programs\`, na conta de quem está usando. **Não pede UAC, não pede administrador.**
- `oneClick: true` — duplo clique instala e abre. Sem assistente, sem escolher pasta.

A consequência prática é que a equipe consegue instalar e atualizar sozinha, sem abrir chamado. A contrapartida é que a instalação é por usuário: numa máquina compartilhada, cada login instala o seu.

O aplicativo em si não escreve fora da própria pasta de dados, não abre porta, não instala serviço e não mexe no registro além do que o instalador registra para aparecer em "Aplicativos instalados".

### Armazenamento de dados e configurações

Três lugares, e a distinção importa na hora de atualizar:

| O quê | Onde | Sobrevive à atualização? |
|---|---|---|
| Tema (black mode) | `%APPDATA%\Parceria JB\` — é o `localStorage` da página | **Sim** |
| Arquivos do portal (html, css, js, fotos) | `%LOCALAPPDATA%\Programs\parceria-jb\` | Substituídos — é justamente o que a atualização troca |
| Instalador baixado | `%TEMP%\parceria-jb-atualizacao\` | Descartado na abertura seguinte |

`deleteAppDataOnUninstall: false` está escrito explicitamente no `electron-builder.yml`: **nem a atualização nem a desinstalação apagam `%APPDATA%`.**

O acervo de documentos que a equipe edita **não fica na máquina de ninguém** — ele vive na VM, em `servidor/dados/`, e continua fazendo backup lá ([09](09-edicao-pela-pagina.md)). O aplicativo não tem cópia dele. Ver [Limitações](#limitações-conhecidas).

### Compatibilidade com Windows

**Windows 10 (1809 ou mais recente) e Windows 11, 64 bits.** É o piso do Electron 38, e cobre o parque corporativo atual.

Não sai para 32 bits nem para ARM sem acrescentar alvos no `electron-builder.yml` — não foram incluídos porque não há máquina assim em vista, e cada alvo a mais é um instalador a mais para publicar e testar.

O instalador **precisa ser gerado no Windows**. Gerar para Windows a partir de Linux/macOS é possível com Wine, mas não vale a pena aqui: quem mantém o projeto já está no Windows.

### Antivírus e assinatura digital

Este é o ponto que mais dá trabalho na prática, e é honesto dizer de saída: **o instalador não é assinado.**

O que isso significa:

- **SmartScreen.** Na primeira execução, o Windows mostra "O Windows protegeu o computador" e esconde o botão de continuar atrás de "Mais informações". Não é erro, é reputação: um executável novo e sem assinatura não tem histórico. Some sozinho depois que o arquivo circula um pouco, ou nunca, dependendo do volume.
- **Antivírus corporativo.** Pode segurar o download ou colocar o instalador em quarentena. O aplicativo trata esse caso: se o Windows recusar abrir o instalador, aparece a mensagem sugerindo o antivírus e o botão **Baixar pelo navegador**.
- **Instalador do Electron dá falso positivo com alguma frequência** em antivírus menos conhecidos, porque a assinatura de arquivo de um app Electron empacotado se parece com a de vários malwares que também usam Electron.

**A saída é um certificado de assinatura de código** (Code Signing), comprado de uma autoridade certificadora — na faixa de algumas centenas de dólares por ano, e desde 2023 os certificados OV exigem que a chave fique num token de hardware ou HSM. Com ele, no `electron-builder.yml`:

```yaml
win:
  certificateSubjectName: "Nome da empresa como está no certificado"
```

**Recomendação:** antes de comprar, verificar com a infra se a empresa **já tem** um certificado de assinatura de código — em organização grande, normalmente tem, e o custo vira só um pedido. E, no curto prazo, pedir para a infra colocar a pasta de instalação e o instalador na lista de exceções do antivírus corporativo resolve o problema para a equipe, que é quem vai usar.

Enquanto não houver assinatura, o **SHA-256 no manifesto** é o que garante integridade: o aplicativo recusa e apaga qualquer instalador que não bata com o publicado. Isso protege contra download corrompido e contra troca do arquivo no servidor — não substitui a assinatura, que é o que faz o *Windows* confiar.

---

## Versionamento: onde fica o número

**Um lugar só: o campo `version` do `package.json`.**

```json
{
  "name": "pa-jb-portal",
  "version": "1.0.0",
```

Dali sai tudo, sem ninguém repetir o número em lugar nenhum:

- o `app.getVersion()` que o aplicativo mostra em *Ajuda › Sobre*;
- a versão com que ele se compara ao manifesto;
- o nome do instalador (`Parceria-JB-Setup-1.0.0.exe`);
- o campo `versao` do `versao.json`, carimbado por `app/manifesto.js`.

O formato é `MAIOR.MENOR.CORREÇÃO`, comparado campo a campo como número:

- **correção** (`1.0.0` → `1.0.1`): erro corrigido, texto ajustado;
- **menor** (`1.0.1` → `1.1.0`): conteúdo ou funcionalidade nova;
- **maior** (`1.1.0` → `2.0.0`): mudança grande o suficiente para valer aviso.

Não há sufixo (`1.2.0-beta`): a comparação em `app/atualizacao.js` ignora, então não use.

---

## Como funciona a atualização

```
        ┌──────────────────────────────────────────────────────────┐
        │ 1. Ao abrir, 2,5 s depois de a página aparecer            │
        │    GET <ORIGEM>versao.json                                │
        └──────────────────────────────────────────────────────────┘
                                   │
          falhou (sem rede, VPN     │   respondeu
          fora, servidor no chão)   │
                    │               │
        ┌───────────▼───────┐  ┌────▼──────────────────────────────┐
        │ silêncio.          │  │ 2. versao > a instalada?          │
        │ O portal abre      │  └────┬──────────────────────┬───────┘
        │ como sempre.       │       │ não                  │ sim
        └────────────────────┘  ┌────▼─────┐  ┌─────────────▼──────┐
                                │ silêncio │  │ 3. barra na página │
                                └──────────┘  │    [Atualizar agora]│
                                              └─────────┬──────────┘
                                                        │ clique
        ┌───────────────────────────────────────────────▼──────────┐
        │ 4. baixa o .exe · confere o tamanho · confere o SHA-256   │
        └───────────────────────────────┬──────────────────────────┘
                        falhou          │          conferiu
                  ┌─────────────────────┴────────┐
        ┌─────────▼──────────────┐   ┌────────────▼─────────────────┐
        │ mensagem + botões:     │   │ 5. executa o instalador,      │
        │ [Tentar de novo]       │   │    o aplicativo fecha, a nova │
        │ [Baixar pelo navegador]│   │    versão instala e abre      │
        └────────────────────────┘   └───────────────────────────────┘
```

Três decisões dentro desse desenho:

**A verificação do início é silenciosa.** Sem rede, com a VPN fora ou com o servidor no chão, nada aparece — o portal abre normalmente. Quem quiser saber *por que* não apareceu usa **Ajuda › Verificar atualizações…**, que é a versão barulhenta da mesma verificação e mostra o erro.

**O botão só existe quando há o que atualizar.** Não há "você está atualizado" fixo na tela. Sem versão nova, a barra não é desenhada.

**A barra é injetada pelo aplicativo, não pelo site.** Ela mora em `app/barra-atualizacao.js`, que roda como *preload* do Electron: enxerga o DOM da página, mas roda isolado do JavaScript do portal. Por isso o `index.html` não precisou de uma linha, e quem abre o portal pelo navegador não carrega nada disso.

### Erros tratados

| Situação | O que acontece |
|---|---|
| Sem internet / DNS não resolve / servidor fora | Início: silêncio. Manual: "Não foi possível falar com o servidor de atualizações." |
| Servidor demora demais | Corta em 10 s (manifesto) ou 15 min (download) |
| `versao.json` ilegível ou com campo inválido | Recusa a verificação inteira e diz para avisar quem cuida do portal |
| Instalador apontado para outro servidor | Recusado — o `arquivo` precisa ser da mesma origem do `versao.json` |
| Download interrompido no meio | O arquivo parcial é apagado; "Tentar de novo" recomeça do zero |
| Arquivo baixado não bate com o SHA-256 | Apagado, com mensagem mandando baixar pela página oficial |
| Windows/antivírus barra o instalador | Mensagem citando o antivírus + botão "Baixar pelo navegador" |

Enquanto baixa, o arquivo se chama `.exe.parcial`. **Nunca existe em disco um `.exe` pela metade com nome de arquivo bom** — o `rename` só acontece depois do SHA-256 conferir.

---

## Gerar o .exe

Uma vez, na máquina de quem vai gerar:

```bash
pnpm install
```

**Precisa ser o pnpm**, não o npm. O `package.json` declara `packageManager: pnpm@9.12.0`, e o electron-builder lê esse campo para descobrir como montar a árvore de dependências — com o pnpm ausente do `PATH` ele falha com uma mensagem que não ajuda em nada:

```
⨯ No JSON content found in output
```

Se o `pnpm` não existir na máquina, `npm install -g pnpm@9.12.0` resolve (instala em `%APPDATA%\npm`, sem pedir administrador — o `corepack enable` pede, porque escreve em `C:\Program Files\nodejs`).

Depois, sempre que quiser um instalador:

```bash
npm run app          # abre o aplicativo sem empacotar — para testar rápido
npm run app:build    # gera dist/Parceria-JB-Setup-<versão>.exe
npm run app:teste    # 32 testes do fluxo de atualização, sem publicar nada
npm run icone        # regera app/icone.ico a partir da marca — só se ela mudar
```

`npm run app` é o modo de desenvolvimento: abre a janela com o portal, com as Ferramentas do desenvolvedor disponíveis em *Exibir*.

`npm run app:build` demora alguns minutos na primeira vez (baixa o Electron da versão alvo) e termina com:

- `dist/Parceria-JB-Setup-<versão>.exe` — **o instalador, que é o que se distribui**;
- `%TEMP%\pajb-build\win-unpacked\` — a pasta solta, útil para conferir o que entrou no pacote.

`dist/` está no `.gitignore`: instalador não entra no repositório.

### O ícone

O executável, o atalho e a janela usam `app/icone.ico`, que é versionado — quem gera o instalador não precisa de nada além do repositório.

Ele não é desenhado à mão: `npm run icone` o monta a partir de `Fotos/LOGOS/TVGLOBO_LOGO.png`, com os seis tamanhos que o Windows escolhe conforme o lugar (256 na lista de programas e no Alt+Tab, 16 na barra de título). **Só rode se a marca mudar.**

Duas armadilhas ficaram resolvidas dentro de `ferramentas/gerar-icone.js`, e é por isso que a origem não é apontada direto no `electron-builder.yml`:

- **O arquivo de origem é um JPEG**, apesar da extensão `.png` — `head -c4` mostra `ff d8 ff e0` em vez da assinatura PNG. O ffmpeg decide pelo conteúdo e lê sem reclamar; o electron-builder decide pela extensão e recusaria.
- **A arte tem 148×148 e o Windows pede 256×256.** A ampliação acontece na geração, uma vez. Se algum dia aparecer a marca em vetor ou num PNG maior, troque a origem e rode de novo: os seis tamanhos saem mais nítidos sem mexer em mais nada.

A ferramenta depende de ffmpeg no `PATH`, como `npm run fotos`, e de nenhum pacote npm.

### O projeto está dentro do OneDrive — e isso importa aqui

O electron-builder monta o aplicativo criando uma pasta de 340 MB com milhares de arquivos e renomeando-a inteira no fim. O OneDrive abre cada arquivo para sincronizar enquanto isso acontece, e a montagem morre no meio. Não é intermitente — acontece toda vez:

```
⨯ EBUSY: resource busy or locked, unlink '…\dist\win-unpacked.tmp\…'
⨯ EPERM: operation not permitted, rename '…\dist\win-unpacked.tmp' → '…'
```

**Já está resolvido:** `npm run app:build` chama `app/empacotar.js`, que monta em `%TEMP%\pajb-build` — fora do alcance do OneDrive — e copia só o instalador pronto de volta para `dist/`. Um arquivo, uma cópia, sem renomear nada: isso o OneDrive aguenta.

Duas consequências para quem mantém:

- **Não chame `npx electron-builder --win` direto.** Vai falhar, e com um erro que não explica por quê. Use `npm run app:build`.
- Depois de publicar, **pode apagar `dist/`** — são 104 MB que o OneDrive sincroniza à toa.

Se uma tentativa antiga tiver deixado um `dist/win-unpacked.tmp` que não apaga ("Device or resource busy"), é o OneDrive ainda segurando os arquivos. Ele solta sozinho; pausar a sincronização e apagar também funciona.

### Se `npm run app` disser que `app` é undefined

```
TypeError: Cannot read properties of undefined (reading 'whenReady')
```

É o **terminal embutido do VS Code**: ele exporta `ELECTRON_RUN_AS_NODE=1` para os seus próprios processos, e a variável é herdada. Nesse modo o Electron roda como Node puro e `require('electron')` devolve um caminho de arquivo em vez da API — daí o `app` indefinido.

Não é problema do projeto: num terminal normal (PowerShell, Prompt de Comando, Windows Terminal) funciona. Para rodar de dentro do VS Code mesmo, limpe a variável antes:

```powershell
$env:ELECTRON_RUN_AS_NODE = ""
npm run app
```

Vale para `npm run app` e `npm run app:teste`. O `npm run app:build` não sofre disso.

---

## Publicar uma nova versão

Cinco passos, na ordem.

**1. Suba o número em `package.json`.**

```json
"version": "1.1.0"
```

**2. Escreva o que mudou em `publicacao/versao.json`.**

```json
{
  "notas": [
    "Conteúdo real da página Acessos Parceria.",
    "Correção do menu em telas estreitas."
  ],
  "pagina": "http://portal-pajb/download/"
}
```

Uma frase por item, escrita para quem usa o portal. É o texto que aparece na barra de atualização. `pagina` é o endereço para onde vai o botão "Baixar pelo navegador" quando o download automático falha — deixe preenchido.

**3. Gere o instalador.**

```bash
npm run app:build
```

**4. Gere o manifesto.**

```bash
npm run app:manifesto
```

Ele lê o `.exe` recém-gerado e o `publicacao/versao.json`, calcula o SHA-256 e o tamanho, e grava **`dist/versao.json`** já pronto. Se o nome do instalador não bater com a versão do `package.json`, ele para e avisa — é a trava contra publicar o manifesto novo apontando para o build antigo.

**5. Copie os dois arquivos para o servidor — o instalador primeiro.**

```
1º   Parceria-JB-Setup-1.1.0.exe
2º   versao.json
```

**A ordem não é detalhe.** O `versao.json` é o gatilho: assim que ele estiver no ar, todo aplicativo aberto começa a baixar o instalador. Publicado antes, ele anuncia um arquivo que ainda não existe, e a equipe inteira recebe erro de download.

Não apague o instalador da versão anterior de imediato — quem estiver com o download no meio ainda está buscando aquele arquivo.

---

## Onde os arquivos ficam no servidor

Não é preciso serviço novo: **a própria VM que serve o portal serve a atualização.** `servidor/servidor.js` entrega qualquer arquivo dentro da pasta do projeto, e `.json` já está na lista de tipos que ele conhece.

Crie uma pasta `download/` na raiz do projeto na VM:

```
<projeto na VM>/
├── app/            ← o código do Electron, que veio no git pull. NÃO mexa.
└── download/       ← criada à mão na VM, fora do git
    ├── versao.json
    └── Parceria-JB-Setup-1.1.0.exe
```

> **Não use `app/` para isso.** Essa pasta já existe no repositório (é o código do Electron) e chega à VM pelo `git pull`. Um instalador de 90 MB largado ali seria apagado ou daria conflito no deploy seguinte. `download/` é criada só na VM e não entra no git.

O endereço fica:

```
http://portal-pajb/download/versao.json
http://portal-pajb/download/Parceria-JB-Setup-1.1.0.exe
```

E é esse endereço — **a pasta, com barra no fim** — que vai em `app/atualizacao.js`:

```js
const ORIGEM_PADRAO = 'http://portal-pajb/download/';
```

Esse é o **único lugar** a mexer. Enquanto estiver vazio, a verificação fica desligada.

O `.exe` não está na lista de tipos de `servidor/servidor.js`, então ele sai como `application/octet-stream` — que é o certo para download e não precisa de ajuste.

### Sobre HTTP

Na rede interna, em HTTP, alguém posicionado no meio do caminho poderia trocar manifesto e instalador ao mesmo tempo — e o SHA-256 não pegaria, porque ele viria do mesmo atacante. É a mesma aposta já registrada no cookie de sessão sem `Secure` ([09](09-edicao-pela-pagina.md)): rede interna. Publicando em HTTPS, o problema desaparece e nada no código precisa mudar — basta o `ORIGEM_PADRAO` começar com `https://`.

---

## O que não mudou, e por quê

Nenhum arquivo do site foi alterado. `index.html`, `css/`, `js/`, `servidor/`, `Fotos/`, `docs/` e `md/` estão como estavam.

O que foi acrescentado:

```
app/
├── principal.js            a janela e o menu            ─┐ vão dentro
├── atualizacao.js          verificar, baixar, instalar   │ do executável
├── barra-atualizacao.js    a barra "Atualizar agora"    ─┘
├── empacotar.js            gera o instalador            ─┐ ferramentas de
├── manifesto.js            gera o versao.json            │ quem publica;
└── teste-atualizacao.js    os 32 testes                 ─┘ não são embarcadas
electron-builder.yml        como o instalador é montado
publicacao/versao.json      as notas da versão, escritas à mão
```

E no `package.json`: o campo `main`, quatro scripts (`app`, `app:build`, `app:manifesto`, `app:teste`) e duas `devDependencies`.

**A pasta `app/` é removível.** Apagar `app/`, `electron-builder.yml`, `publicacao/` e desfazer as linhas do `package.json` devolve o projeto exatamente ao que era — nada no site ou no servidor depende deles.

Duas escolhas de projeto merecem registro:

**A barra de atualização não está no `index.html`.** Se estivesse, todo mundo que abre o portal pelo navegador carregaria código de um aplicativo que não tem. Como *preload*, ela existe só dentro do executável.

**A página não ganhou acesso a nada.** Não há `contextBridge`, não há `window.alguma-coisa`. O JavaScript do portal não tem como disparar o download nem descobrir que está rodando dentro do aplicativo. `contextIsolation`, `sandbox` e `nodeIntegration: false` estão nos valores seguros em `app/principal.js`.

---

## Limitações conhecidas

**1. O aplicativo não edita documentos.** Ele abre os arquivos locais (`file://`), e `js/documentos.js` desiste em `file://` pela primeira linha dele — de propósito, desde antes deste trabalho. Então o aplicativo mostra a semente dos `.js`, sem os botões de incluir/editar/excluir.

Isso é intencional, não pendência. A edição depende da API, e a API vive na VM junto com o acervo — que precisa ser **um só** para a equipe inteira. Se cada instalação tivesse o seu `documentos.json` local, o acervo se partiria em dezenas de cópias divergentes. **Quem edita continua editando pelo navegador, no endereço da VM.**

**2. O conteúdo do aplicativo é o da versão instalada.** Um documento que a equipe publicar hoje pela VM só aparece no aplicativo na próxima versão. É a contrapartida de funcionar sem rede. Se o mais importante passar a ser conteúdo sempre atual, a alternativa é o aplicativo carregar a URL da VM em vez dos arquivos locais — é uma linha em `app/principal.js` (`loadURL` no lugar de `loadFile`), mas aí ele vira uma janela do navegador e perde o funcionamento offline. **Não faça a troca sem decidir qual dos dois vale mais**, e registre a decisão aqui.

**3. Sem assinatura digital.** SmartScreen na primeira execução e risco de falso positivo em antivírus. Ver [Antivírus e assinatura digital](#antivírus-e-assinatura-digital).

**4. Instalação por usuário.** Numa máquina compartilhada, cada login instala e atualiza o seu. É o preço de não pedir administrador.

**5. Só x64.** Sem 32 bits e sem ARM, por ora.
