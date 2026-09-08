[← Índice](README.md)

# Teste de segurança do portal — 08/09/2026

Revisão de segurança do projeto inteiro: servidor Node (`servidor/`), portal no
navegador (`js/`, `index.html`), aplicativo Windows (`app/`) e dependências.
Todos os achados abaixo foram **corrigidos e cobertos por teste**; a seção 6
lista o que continua aberto e por quê.

> Como as auditorias de estrutura, este documento é a fotografia de um momento.
> Confira contra o código antes de agir sobre ele.

## 1. Método

- Leitura dos cinco arquivos de `servidor/`, de `app/atualizacao.js`,
  `app/principal.js` e `app/barra-atualizacao.js`, e dos módulos de `js/` que
  montam HTML.
- Servidor real no ar, com requisições de fronteira feitas à mão: travessia de
  caminho, CSRF, tipo de conteúdo, cabeçalhos de resposta.
- `pnpm audit` sobre a árvore de dependências, separando o que é **empacotado
  no instalador** do que só existe na máquina de quem compila.
- Suíte automatizada antes e depois de cada correção, mais a fumaça no
  navegador e a regeneração do instalador Windows.

**Nenhum dado real foi tocado.** Os testes de servidor rodam contra uma raiz
descartável em `%TEMP%`, com `servidor/dados/` e `docs/` próprios; o teste da
atualização sobe um servidor HTTP local e nunca chama `instalar()`.

## 2. Resumo

| # | Achado | Severidade | Situação |
|---|---|---|---|
| 1 | Download da atualização sempre falhava, com a causa disfarçada de erro de rede | **Alta** | Corrigido |
| 2 | Instalador em cache reaproveitado sem reconferir o SHA-256 | **Alta** | Corrigido |
| 3 | Endereço do instalador validado *depois* do cache | Média | Corrigido |
| 4 | Electron 38.8.6 com 12 vulnerabilidades conhecidas, 3 altas | **Alta** | Corrigido |
| 5 | Dependências de compilação com CVE (`fast-uri`, `@xmldom/xmldom`) | Baixa | Corrigido |
| 6 | `PAJB_ORIGEM_PUBLICA` sem documentação | Baixa | Corrigido |

`pnpm audit`: **25 vulnerabilidades → 1**, e a que sobrou não tem correção
publicada nem vai dentro do instalador (seção 5).

Os três primeiros achados estão todos no aplicativo Windows. O servidor e o
portal no navegador passaram sem achado novo — a seção 4 lista o que foi
conferido e está correto.

## 3. Achados e correções

### 1 — O download da atualização estava quebrado, e o erro mentia

**Arquivo:** `app/atualizacao.js`

`buscar(url, limiteMs, consumir)` ganhou o terceiro parâmetro para que o prazo
de rede cobrisse também a leitura do corpo. O caminho do manifesto foi
atualizado; **o do download não**. `baixar()` chamava `buscar(info.arquivo,
ESPERA_DOWNLOAD)` sem callback, e lá dentro `consumir(res)` virava
`undefined(res)`.

O `TypeError` caía no `catch` que existe para tratar DNS que não resolve e cabo
fora. A falha aparecia para quem usa como:

> "Não foi possível falar com o servidor de atualizações. Verifique sua conexão
> e tente de novo."

**Impacto.** O canal de atualização é o que entrega correção de segurança para
os desktops, e ele estava morto — com a mensagem apontando para o lugar errado,
o que faria alguém investigar rede e proxy por horas. Está inerte hoje só porque
`ORIGEM` está vazio; passaria a doer no dia em que fosse preenchido.

**Correção.** O corpo passou a ser consumido dentro do callback, como o desenho
previa: o prazo cobre todos os bytes, e o `buscar` continua sendo quem cancela
um corpo que ninguém leu.

**Teste.** `cache adulterado é descartado e baixado novamente` — só passa se o
download completar de verdade.

### 2 — Instalador em cache reaproveitado sem reconferir o hash

**Arquivo:** `app/atualizacao.js`

O download grava `%TEMP%/pajb-atualizacao/Parceria-JB-<versão>.exe` e o
reaproveitava só por existir:

```js
// CONTRATO: cache nomeado apenas pela versão. Este atalho não recalcula o
// hash do arquivo existente
if (fs.existsSync(destino)) return destino;
```

**Impacto.** A pasta é gravável por qualquer processo que rode como a pessoa. O
SHA-256 era conferido no download e nunca mais bastava trocar os bytes do
arquivo em cache para o aplicativo **executar** o que estivesse ali quando a
pessoa clicasse em "Instalar". A verificação de integridade existia e era pulada
exatamente no instante em que ela importa.

**Correção.** `confereNoDisco()` refaz tamanho e SHA-256 antes de reaproveitar;
o que não bate é apagado e baixado de novo.

**Teste.** O mesmo acima: o teste grava lixo por cima do cache e exige que o
arquivo volte a ser os bytes corretos, com um download novo contabilizado.

### 3 — O endereço do instalador era validado depois do cache

**Arquivo:** `app/atualizacao.js`

`exigirTransporte()` — que exige HTTPS fora de teste local e recusa credenciais
embutidas na URL — rodava dentro do `buscar`, ou seja, **depois** do atalho de
cache. Um manifesto apontando para `http://` externo passava sem reclamação
sempre que já existisse um arquivo com o nome daquela versão.

**Correção.** `exigirTransporte(info.arquivo)` virou a primeira linha de
`baixar()`, antes inclusive do `mkdir`.

**Teste.** `URL HTTP não local é recusada antes do download`.

### 4 — Electron com 12 vulnerabilidades conhecidas

**Arquivo:** `package.json`

`electron@38.8.6`, com advisories exigindo `>=39.8.10` — **3 de severidade
alta**. Diferente das outras dependências de desenvolvimento, **esta viaja
dentro do instalador**: é o Chromium e o Node que rodam na máquina de cada
pessoa da equipe.

**Correção.** `^39.8.10`. Zera as 12 advisories com o menor salto possível a
partir do 38.

**Teste.** Instalador regerado do zero (`npm run app:build`), 54 testes e a
fumaça no navegador rodados depois da troca.

### 5 — Dependências de compilação com CVE

**Arquivo:** `package.json`

`electron-builder` arrasta `fast-uri@3.1.5` (3 advisories altas, via `ajv`) e
`@xmldom/xmldom@0.8.14` (moderada, via `plist`). Só rodam na máquina de quem
gera o instalador, mas processam entrada de arquivo durante o build.

**Correção.** `pnpm.overrides` fixando `fast-uri ^3.1.7` e
`@xmldom/xmldom ^0.8.15` — as versões corrigidas **dentro da faixa que o `ajv` e
o `plist` aceitam**, e não a última de cada uma (`fast-uri@4`, `xmldom@0.9`),
que quebraria a compatibilidade.

### 6 — A variável que liga o Origin e o cookie Secure não estava documentada

**Arquivo:** `.env.example`

`servidor/seguranca.js` lê `PAJB_ORIGEM_PUBLICA`, e é ela que decide a origem
válida das escritas e faz o cookie de sessão ganhar `Secure`. Não aparecia em
lugar nenhum do modelo de ambiente — quem for montar o proxy HTTPS não teria
como descobrir que precisa preenchê-la, e o sintoma seria um portal que
"desloga sozinho" ou recusa toda edição.

**Correção.** Documentada no `.env.example`, com o formato exigido (origem sem
caminho nem barra final) e o motivo de existir.

## 4. O que já estava correto

Conferido nesta revisão e **não alterado**:

- **Travessia de caminho.** A lista do estático é de *permitidos*, aplicada
  sobre o caminho já resolvido, com recusa de componentes iniciados por `.`, da
  pasta `originais/` e de extensão fora da lista de cada pasta. Junction e
  symlink são recusados (`semLinks`).
- **CSRF.** Cabeçalho não simples (`X-Portal-Request`) obrigatório nas escritas,
  mais conferência de `Origin` e de `Sec-Fetch-Site`, mais `SameSite=Strict`.
- **Cabeçalhos.** CSP sem `unsafe-inline` em `script-src` (o `index.html` não
  tem script embutido, então a política é real), `X-Frame-Options: DENY`,
  `nosniff`, `Referrer-Policy: no-referrer`, e `Content-Disposition: attachment`
  em tudo que sai de `docs/`.
- **Senha.** scrypt com salt por usuário, comparação em tempo constante, e
  derivação feita **também** para login inexistente — sem oráculo de tempo para
  descobrir quem existe.
- **Sessão.** Token de 32 bytes aleatórios; revogação que atravessa processos
  (troca de senha e remoção pela CLI derrubam quem está logado); `HttpOnly`; e
  `Secure` automático quando a origem pública for HTTPS.
- **Freio de login.** Por login *e* por IP, com varredura por inatividade e teto
  no tamanho dos mapas.
- **Upload.** Extensão de lista fechada, nome reescrito, teto de 25 MB, e
  `flag: 'wx'` quando não é substituição declarada.
- **Electron.** `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`, preload sem `contextBridge`, `setWindowOpenHandler` e
  `will-navigate` fechados, três handlers IPC sem parâmetro vindo da página, e
  `abrirDestino` limitado à pasta do aplicativo e à lista de extensões de
  documento.
- **Atualização.** Manifesto validado campo a campo, instalador obrigado à mesma
  origem do manifesto, `redirect: 'error'`, teto de tamanho e SHA-256 conferido
  antes de executar.
- **Front.** Todo dado passa por `escaparHtml` ou `textContent`; o formulário de
  edição preenche por `value`, não por interpolação.

### Fronteiras conferidas com o servidor no ar

| Requisição | Resposta |
|---|---|
| `GET /` e `GET /css/pagina.css` | 200 |
| `GET /md/02-seguranca.md` | 403 |
| `GET /.env` | 403 |
| `GET /servidor%2Fdados%2Fusuarios.json` | 403 |
| `GET /docs/email%20equipe.txt` | 403 |
| `GET /Fotos/EQUIPE/originais/` | 403 |
| `POST /api/documentos` sem `X-Portal-Request` | 403 |
| `POST /api/documentos` com `Origin` forjado | 403 |
| `POST /api/documentos` com o cabeçalho, sem sessão | 401 |

## 5. Dependências

| | Antes | Depois |
|---|---|---|
| Total | 25 | **1** |
| Altas | 9 | 1 |
| Moderadas | 12 | 0 |
| Baixas | 4 | 0 |

A que sobrou é `extract-zip@2.0.1`, puxada pelo próprio `electron` para
descompactar o runtime **durante o `pnpm install`**. Não há versão corrigida
publicada (`patched_versions: <0.0.0`) e ela **não vai dentro do instalador** —
some no dia em que o `electron` trocar essa dependência.

`pnpm audit --prod` já era, e continua, limpo: o portal e o servidor não têm
nenhuma dependência de runtime.

## 6. O que continua aberto

- **Electron 39 não é a série mais recente** (a atual é a 44). O 39.8.10 zera
  todas as advisories conhecidas hoje com o menor salto a partir do 38, mas a
  série vai parar de receber correção antes da atual. Subir de major exige
  testar o aplicativo à mão — é decisão de *quando*, não de *se*.
- **`ORIGEM` continua vazio**, então o aplicativo não procura atualização. Só
  pode ser preenchido depois de HTTPS ou assinatura de código: em HTTP puro,
  manifesto e instalador vêm pelo mesmo canal, e o SHA-256 não protege contra
  quem controla os dois. Ver [10-aplicativo-windows.md](10-aplicativo-windows.md).
- **Sem HTTPS, o cookie não leva `Secure`.** É consciente e está documentado; o
  código já acrescenta o atributo sozinho quando `PAJB_ORIGEM_PUBLICA` começar
  com `https://`.
- **Tempo de espera de conexão** usa os padrões do Node. Suficiente para rede
  interna; num dia de exposição maior, valeria `headersTimeout` explícito.
- **`docs/` é servido, e é o desenho certo** — é de lá que saem os PDFs do
  portal. Arquivo com extensão fora da lista já é recusado, então
  `docs/email equipe.txt` não sai; e os e-mails que ele contém já vão no
  `js/equipe-dados.js` de qualquer forma.

## 7. Testes executados

Depois de todas as correções:

| Verificação | Resultado |
|---|---|
| `npm test` | **42 passando, 0 falhando** |
| `npm run test:browser` | **12 passando, 0 falhando** |
| Fumaça no portal real (`run-pa-jb-portal --smoke`) | 10/10, console limpo |
| Fronteiras HTTP à mão (tabela da seção 4) | todas conforme |
| `npm run app:build` | exit 0 — `dist/Parceria-JB-Setup-1.1.0.exe`, 90,2 MB |
| `pnpm audit` | 25 → 1 |

Antes das correções, `npm test` estava em **40 passando e 2 falhando** — as duas
falhas eram os achados 1 e 2 deste relatório.

### Como repetir

```bash
npm test
npm run test:browser
pnpm audit
node servidor/servidor.js --porta 8123
node .claude/skills/run-pa-jb-portal/driver.mjs --porta 8123 --smoke
```
