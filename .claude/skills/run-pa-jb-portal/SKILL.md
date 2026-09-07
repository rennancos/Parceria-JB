---
name: run-pa-jb-portal
description: Roda, serve, dirige e tira screenshot do portal Parceria JB (site estático + servidor de edição + aplicativo Windows/Electron). Use para "rodar o portal", "subir o servidor", "abrir o app", "tirar print da página", "testar a busca", "ver se quebrou", "rodar a fumaça/smoke", validar uma mudança de CSS/JS no app de verdade, ou exercitar a API de edição (/api/documentos, /api/sessao).
---

# Rodar e dirigir o portal PA_JB

Portal estático sem build (`index.html` + `css/` + `js/`), com dois anexos: um
servidor Node opcional que serve os mesmos arquivos **e** a API de edição, e um
aplicativo Windows (Electron) que abre o mesmo `index.html` por `file://`.

O jeito de dirigir tudo isso é `driver.mjs`, um harness CDP sem dependência
(Node 22+ tem `WebSocket` global). Ele lança um Chrome headless — ou **anexa**
num Electron já aberto, porque os dois falam o mesmo protocolo.

**Caminhos relativos a `PA_JB/`.** Testado com Node v24.15.0, pnpm 9.12.0,
Chrome em `C:\Program Files\Google\Chrome\Application\chrome.exe`.

## Preparo

`pnpm install` só é necessário para `pnpm dev` (o pacote `serve`) e para o
Electron. O servidor Node e o modo `--file` não dependem de nada instalado.

```bash
pnpm install
```

## Subir o portal — escolha UM

```bash
node servidor/servidor.js --porta 8123    # estático + API de edição  <- padrão para agente
pnpm dev                                  # só estático, porta 8000; /api responde 404
```

Nenhum dos dois é preciso no modo `--file` (ver abaixo).

> A porta 8000 costuma já estar ocupada por um `pnpm dev` do usuário. Use
> outra: o `servidor.js` **não** troca sozinho, ele morre com `EADDRINUSE`.

## Caminho do agente — o driver

```bash
# roteiro de fumaça: home, as 4 rotas, busca abre/filtra/teclado/fecha, console limpo
node .claude/skills/run-pa-jb-portal/driver.mjs --porta 8123 --smoke
```

Sai `0` se tudo passou, `1` se falhou, `2` se não há nada servindo. Salva
`telas/fumaca-http.png`. Saída real:

```text
  ok   home carrega
  ok   rota #primeiros-passos
  ok   rota #documentacao
  ok   rota #acessos-parceria
  ok   rota #sharepoint
  ok   busca abre
  ok   busca filtra
  ok   busca navega no teclado
  ok   busca some ao fechar (regressão)
  ok   sem erro de JS no console
```

Comandos avulsos — em sequência, na mesma sessão de browser:

```bash
node .claude/skills/run-pa-jb-portal/driver.mjs --porta 8123 \
  ir "#equipe" conta ".team-card" texto "main h1" foto equipe.png
```

```text
ir #equipe -> http://localhost:8123/#equipe
conta .team-card -> 36
texto main h1 -> Bem-vindo ao portal Parceria JB
foto equipe.png -> ...\.claude\skills\run-pa-jb-portal\telas\equipe.png
```

Sem argumentos, vira REPL lendo comandos do stdin — um por linha.

| Comando | O que faz |
|---|---|
| `ir <hash>` | navega e espera o router desenhar o `<main>` |
| `clique <seletor>` | `.click()` no elemento |
| `digitar <texto>` | insere no elemento focado (dispara `input`) |
| `tecla <Key>` | `Enter`, `Escape`, `ArrowDown`, `ArrowUp`, `Tab`, `Home`, `End` — evento real, não sintético |
| `js <expr>` | avalia e imprime |
| `texto <sel>` · `conta <sel>` · `visivel <sel>` | inspeção |
| `espera <expr>` | espera virar truthy (10s) |
| `foto [arquivo]` | PNG em `telas/` (viewport, não a página inteira) |
| `erros` | erros de JS/console capturados desde o início |

Flags: `--porta N` · `--file` · `--anexar N` · `--visivel` (abre com janela) ·
`--smoke`.

### Modo `file://` — o que o app Windows realmente faz

`app/principal.js` faz `loadFile(index.html)`. É o mesmo cenário do duplo
clique, e é onde as restrições do projeto mordem (nada de `type="module"`, nada
de `fetch` local, `js/documentos.js` desiste sozinho). Roda sem servidor
nenhum:

```bash
node .claude/skills/run-pa-jb-portal/driver.mjs --file --smoke
```

**Passe a fumaça nos dois modos antes de dar uma mudança de front por boa.**

### Dirigir o aplicativo Windows de verdade

O Electron abre a mesma porta de depuração do Chrome, então o driver anexa nele:

```bash
unset ELECTRON_RUN_AS_NODE                       # obrigatório — ver Gotchas
npx electron . --remote-debugging-port=9444 &

node .claude/skills/run-pa-jb-portal/driver.mjs --anexar 9444 --smoke
```

Em `--anexar` o driver **não** fecha o app no fim: a janela é de quem a abriu.
A screenshot sai em `telas/fumaca-electron.png` (1264×795, o tamanho da janela
do app — é assim que se confere que anexou no Electron e não no Chrome).

## API de edição — `curl`

Só existe sob `node servidor/servidor.js`. Verificados:

```bash
curl -s http://localhost:8123/api/sessao
# {"autenticado":false}

curl -s http://localhost:8123/api/documentos      # aberto: quem acessa, lê -> 12 itens

curl -s -X POST http://localhost:8123/api/documentos \
  -H 'Content-Type: application/json' -d '{"bloco":"x","titulo":"y"}'
# {"erro":"Entre com seu usuário para fazer isso."} [401]
```

Escrita exige sessão. Há dois usuários de teste (`node servidor/usuarios.js
listar` → `teste.equipe`, `teste.dev`), mas **as senhas não estão no repo**;
criar/trocar é `node servidor/usuarios.js incluir|senha <login>`, que pergunta
no terminal — não roda sem interação. Fluxo autenticado não foi exercitado aqui.

## Caminho humano

`pnpm dev` e abrir `http://localhost:8000` no navegador; ou `pnpm app` para a
janela do Electron. Ctrl-C derruba. Inútil para um agente: nada volta pelo
stdout.

## Gotchas

- **`ELECTRON_RUN_AS_NODE=1` está no ambiente do Claude Code / terminal do
  VS Code** (o próprio Claude Code roda em Electron e vaza a variável). Com ela
  setada, `npx electron .` roda como Node puro, `require('electron')` devolve
  uma *string* com o caminho do exe, e o app morre em
  `TypeError: Cannot read properties of undefined (reading 'isPackaged')` no
  `app/atualizacao.js:59`. Nada a ver com o código do app. `unset` antes.
- **`pnpm dev` na 8000 responde `/api/*` com o 404 HTML do `serve`.** Se você
  está testando edição e recebe uma página de erro bonitinha em vez de JSON,
  está no servidor errado, não com a API quebrada.
- **Processo em background morre junto com a chamada de Bash que o criou.**
  Subir o Electron com `... &` numa chamada e anexar na seguinte dá
  `ECONNREFUSED 127.0.0.1:9444`. Use o `run_in_background` da ferramenta.
- **`#equipe` não é rota.** As rotas do router são as chaves de `window.PAGINAS`
  — `primeiros-passos`, `documentacao`, `acessos-parceria`, `sharepoint`. A
  equipe (36 `.team-card`) é uma seção da home; `#equipe` é âncora.
- **A fumaça tem dente, e é a regressão de `css/busca.css`.** `.busca-janela`
  declara `display: flex`, o que sobrescreve o `dialog:not([open]){display:none}`
  do navegador — sem a regra `.busca-janela:not([open]){display:none}` a janela
  de busca continua na tela depois de fechada. Comentar essa linha faz
  `busca some ao fechar (regressão)` falhar. Foi assim que o harness foi
  validado; refaça isso se mexer no driver.
- **`foto` captura só o viewport.** Para conferir algo abaixo da dobra, role
  antes: `js window.scrollTo(0, 2000)`.

## Troubleshooting

| Sintoma | Causa · correção |
|---|---|
| `Error: listen EADDRINUSE :::8000` | já tem servidor na 8000. `node servidor/servidor.js --porta 8123` |
| `Nada respondendo em http://localhost:PORTA/` (saída 2) | driver sem portal no ar. Suba o servidor, ou use `--file` |
| `TypeError: ... (reading 'isPackaged')` ao abrir o Electron | `ELECTRON_RUN_AS_NODE=1`. `unset` antes de `npx electron .` |
| `fetch failed ... ECONNREFUSED 127.0.0.1:9444` | o Electron não está no ar (morreu com a shell). Relance em background rastreado |
| `Chrome não encontrado` | defina `CHROME=<caminho para chrome.exe>` |
| `espera estourou (10000ms): ...` | o seletor nunca apareceu. `erros` mostra se o JS da página estourou antes |
