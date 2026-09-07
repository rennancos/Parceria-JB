[← Índice](README.md)

# Auditoria da estrutura do backend

Auditoria de `servidor/` — os quatro arquivos que sustentam a edição pela
própria página. `app/` entra só onde busca a rede (o verificador de
atualização); o front (`js/`, `css/`) está fora do escopo.

Feita em 07/09/2026, sobre o estado atual da branch `main`. Tudo aqui foi
verificado com o servidor no ar (`node servidor/servidor.js --porta 8123`) —
cada achado cita arquivo, linha e o comando que o produziu.

> **Havia uma falha crítica.** O servidor estático entregava
> `servidor/dados/usuarios.json` — com os hashes de senha —, o `.env` e o
> `.git` para qualquer pessoa que soubesse escrever `%2F` na URL. Detalhe,
> prova e correção no achado 1.
>
> **A correção do achado 1 já está aplicada** em `servidor/servidor.js` e
> verificada (os quatro vazamentos passaram a 403, o portal e a API continuam
> em 200, a fumaça de `run-pa-jb-portal` passa inteira). É a única alteração de
> código feita por esta auditoria — `git diff servidor/servidor.js` mostra as
> 10 linhas, `git checkout servidor/servidor.js` desfaz. Todo o resto é só
> relato.

---

## 1. Diagnóstico geral

**Boa** — com uma falha crítica pontual.

Porte: **pequeno**. Quatro arquivos, 755 linhas, um domínio (acervo de
documentos) mais autenticação, zero dependência de runtime. Para esse tamanho,
a separação atual é a certa: transporte, identidade e acervo em arquivos
distintos, com a direção de dependência correta e nenhum ciclo.

A qualidade do código é acima da média para um portal interno: senha com scrypt
e salt por usuário, comparação em tempo constante, freio de tentativas,
autorização decidida no servidor a partir da sessão (nunca do corpo da
requisição), escrita atômica por `tmp` + `rename`, `href` validado por lista de
permitidos, erros tipados que não vazam mensagem interna. Quase toda decisão
está justificada por comentário no ponto onde foi tomada.

O que rebaixa a nota não é arquitetura: é **um bug de segurança** no
manipulador de estáticos. A lista de pastas bloqueadas é conferida contra o
primeiro segmento da URL, e o primeiro segmento mente quando a URL traz `%2F`.
É um erro de cinco linhas num arquivo, não um sintoma de estrutura errada — e
por isso a recomendação central desta auditoria é **corrigir e manter tudo o
mais como está**.

## 2. Estrutura atual

```text
servidor/
├── servidor.js     303 linhas  HTTP: rotas, API, estáticos, erros
├── auth.js         240 linhas  usuários, senha, sessão, papéis, cookie
├── dados.js        212 linhas  acervo: leitura, validação, escrita, upload
├── usuarios.js     116 linhas  CLI de cadastro (só terminal da VM)
└── dados/                      documentos.json + usuarios.json (fora do git)
```

Dependências externas: **nenhuma**. Só `http`, `fs`, `path`, `crypto` e
`readline` do próprio Node.

## 3. O que está bem separado

Não mexa nestes pontos — eles estão certos:

- **Três arquivos, três responsabilidades.** `servidor.js` só fala HTTP;
  `auth.js` só resolve quem é a pessoa e o que ela pode; `dados.js` só cuida do
  acervo. `usuarios.js` é casca de terminal: pergunta e delega para `auth.js`,
  sem uma regra própria.
- **Porta única para cada arquivo de dados, e a promessa é cumprida.**
  `documentos.json` só é aberto por `dados.js:24`, `usuarios.json` só por
  `auth.js:26`. Verificado por varredura em `servidor/`, `js/` e `app/` — não
  há segunda porta.
- **Autorização no servidor, papel vindo da sessão.** `auth.exigir` é chamado
  em cada rota de escrita ([servidor.js:155](../servidor/servidor.js#L155),
  [166](../servidor/servidor.js#L166),
  [173](../servidor/servidor.js#L173)) e o papel sai de
  `sessaoDe` ([auth.js:194](../servidor/auth.js#L194)), nunca do corpo. O front
  esconder o botão é conforto visual; quem recusa é o servidor. Correto.
- **Escrita atômica** (`tmp` + `rename`) nos dois módulos que gravam
  ([dados.js:63](../servidor/dados.js#L63),
  [auth.js:57](../servidor/auth.js#L57)) — nunca sobra JSON truncado.
- **Erros tipados com status.** `ErroDeUso` vira 4xx, o resto vira 500 com
  mensagem genérica ([servidor.js:76-83](../servidor/servidor.js#L76-L83)). O
  cliente não recebe stack nem caminho de disco.
- **`href` por lista de permitidos** ([dados.js:86-93](../servidor/dados.js#L86-L93)):
  só `http(s)` ou `docs/<nome>`. É o que barra `javascript:` e `data:` num campo
  que vira atributo de link.
- **Nome de arquivo enviado é reescrito, não confiado**
  ([dados.js:189-206](../servidor/dados.js#L189-L206)): `basename`, extensão de
  lista fechada, acento removido, tudo achatado.
- **Concorrência resolvida pela escolha do IO.** `ler()` → alterar → `gravar()`
  é inteiramente síncrono, e não há um único `await` em `dados.js` nem em
  `auth.js` (verificado). Numa thread só, isso torna o ciclo indivisível: não há
  lost update, e o comentário que afirma isso está correto. **Não converta para
  IO assíncrono** — seria trocar uma garantia real por uma condição de corrida.

## 4. Problemas encontrados

### 1 — Travessia de caminho por barra codificada expõe o repositório inteiro

```text
Arquivo:    servidor/servidor.js:230-236 (com servidor/servidor.js:214-219)
Severidade: CRÍTICA
Situação:   corrigido nesta auditoria — patch aplicado e verificado
```

**Problema.** A lista `BLOQUEADOS` é conferida contra o *primeiro segmento* da
URL decodificada:

```js
const primeiro = decodeURIComponent(url.pathname).split('/').filter(Boolean)[0] || '';
```

Com `%2F`, o primeiro segmento passa a ser inofensivo e a travessia acontece
depois, dentro de `caminhoSeguro`, que decodifica de novo e resolve o caminho.
A checagem de contenção (`alvo.startsWith(RAIZ)`) segura o ataque na raiz do
projeto — mas o projeto inteiro é o que vaza.

**Evidência.** Com o servidor na porta 8123:

```bash
curl --path-as-is "http://localhost:8123/docs%2F..%2Fservidor%2Fdados%2Fusuarios.json"
```

```json
{ "usuarios": [ { "login": "teste.equipe", "papel": "equipe",
  "salt": "70f1c1e7…", "hash": "e1ecee34…" }, … ] }
```

Mesma técnica, mesmos 200: `.env`, `.git/config`, `node_modules/…`,
`.claude/…`. Só o que está **acima** da raiz é recusado (403), o que confirma
que a contenção funciona e a lista de bloqueio não.

Por que o ataque óbvio não funciona: `new URL()` normaliza `..` e também
`%2E%2E` (o padrão WHATWG trata as duas formas como segmento duplo-ponto), mas
**não** normaliza `%2F`. Por isso `/docs/../…` dá 403 e `/docs%2F..%2F…` dá 200.

**Impacto.** Qualquer pessoa com acesso ao portal — hoje, quem estiver na rede
interna — lê os hashes e salts de todos os editores e ataca offline; lê o
`.env`; lê o histórico do git. Como `servidor/dados/` está fora do repositório
justamente para não vazar, a falha derruba a proteção que o `.gitignore` dava.

**Correção.** A lista tem de ser conferida contra o caminho **resolvido**, e não
contra o que a URL aparenta. Uma função, e a checagem antiga em `tratarEstatico`
sai:

```js
function caminhoSeguro(pathname){
  const relativo = decodeURIComponent(pathname).replace(/^\/+/, '');
  const alvo = path.resolve(RAIZ, relativo || 'index.html');
  if (alvo !== RAIZ && !alvo.startsWith(RAIZ + path.sep)) return null;

  // A lista vale sobre o caminho JÁ RESOLVIDO: o primeiro segmento da URL
  // mente quando ela traz %2F (ou qualquer outra forma de ../ codificada).
  const [primeiro = ''] = alvo.slice(RAIZ.length + 1).split(path.sep);
  if (BLOQUEADOS.includes(primeiro) || primeiro.startsWith('.env')) return null;

  return alvo;
}
```

Depois disso, `tratarEstatico` mantém só o `if (!alvo) return 403`. Confira a
correção repetindo os quatro `curl` acima — todos devem dar 403.

### 2 — Trocar a senha não derruba as sessões abertas

```text
Arquivo:    servidor/auth.js:111-120
Severidade: Média
```

**Problema.** `removerUsuario` chama `encerrarSessoesDe`
([auth.js:127](../servidor/auth.js#L127)); `trocarSenha` não. A própria CLI
avisa: *"As sessões abertas continuam valendo até vencer"*
([usuarios.js:77](../servidor/usuarios.js#L77)).

**Impacto.** Trocar a senha é a primeira reação a uma suspeita de vazamento — e
é justamente a ação que não expulsa quem já entrou. Com o achado 1 em aberto, os
dois se combinam mal: quem obteve acesso continua dentro por até 12 h depois da
troca.

**Correção.** Uma linha em `trocarSenha`, depois de `gravarUsuarios`:
`encerrarSessoesDe(normalizarLogin(login));` — e ajustar a mensagem da CLI.

### 3 — A soma de verificação da atualização viaja pelo mesmo canal que ela protege

```text
Arquivo:    app/atualizacao.js:53, 144-146, 321
Severidade: Média (hoje inerte) · Alta quando ligarem
```

**Problema.** O instalador é conferido por SHA-256
([atualizacao.js:321](../app/atualizacao.js#L321)), mas o hash vem do
`versao.json` servido pela mesma origem HTTP — o exemplo no próprio arquivo é
`http://portal-pajb/app/`. Quem consegue alterar o instalador no caminho altera
o manifesto junto. O hash protege contra download corrompido, não contra
adulteração.

O desenho ao redor está certo: o `arquivo` precisa ser da mesma origem do
manifesto, há teto de tamanho, e `ORIGEM_PADRAO` está vazio — ou seja, **a
verificação está desligada e nada disso roda hoje**.

**Correção quando forem ligar:** publicar o manifesto e o instalador por HTTPS,
ou assinar o `.exe` e conferir a assinatura. Enquanto `ORIGEM` estiver vazio,
não é risco corrente.

### 4 — Arquivo enviado pode ficar órfão em `docs/`

```text
Arquivo:    servidor/servidor.js:183-205
Severidade: Baixa
```

**Problema.** Enviar o arquivo e incluir o item no acervo são duas requisições
independentes. Se a segunda falhar (validação, sessão vencida, aba fechada), o
arquivo já está gravado em `docs/` sem nada apontando para ele.

**Impacto.** Lixo em disco, não inconsistência de dados — o acervo é a fonte da
verdade e não fica com item quebrado. `excluir` já deixa o arquivo de
propósito ([dados.js:172-174](../servidor/dados.js#L172-L174)), então órfão é um
estado que o sistema já aceita e limpa à mão.

**Correção:** nenhuma no código. Vale uma linha em
[09-edicao-pela-pagina.md](09-edicao-pela-pagina.md) dizendo que `docs/` pode
acumular arquivo sem dono, e que a limpeza é manual na VM.

### 5 — O backend não tem nenhum teste

```text
Arquivo:    servidor/ (inteiro)
Severidade: Baixa (Média depois da correção do achado 1)
```

O único arquivo de teste do repositório é `app/teste-atualizacao.js`, que é do
Electron. Nada exercita `caminhoSeguro`, `validarHref`, `nomeSeguro` nem
`exigir` — que são exatamente as funções onde um erro vira falha de segurança, e
onde o achado 1 mora.

O código está pronto para ser testado: as três funções são puras e
`servidor.js` já exporta o `servidor` sem escutar quando importado
([servidor.js:295-303](../servidor/servidor.js#L295-L303)).

## 5. Arquivos que deveriam ser separados

**Nenhum.** Os quatro arquivos têm responsabilidade única e tamanho adequado. O
maior (`servidor.js`, 303 linhas) é grande porque faz HTTP de verdade — parse de
corpo com limite, roteamento, estáticos com ETag — e essas partes são coesas
entre si.

Se um dia `servidor.js` passar de umas 450 linhas, o corte natural é
`estatico.js` (o par `caminhoSeguro` + `tratarEstatico`, que hoje é o único
trecho sem relação com a API). Não é preciso agora, e a correção do achado 1
deixa o par ainda mais autocontido.

## 6. Arquivos que NÃO deveriam ser separados

Explicitamente, para não voltar à mesa:

- **Não crie `controllers/`, `services/` e `repositories/`.** 755 linhas, um
  domínio, seis pessoas editando. As camadas dobrariam o número de arquivos sem
  reduzir acoplamento nenhum.
- **Não crie um repository sobre `dados.js`.** Ele já é a camada de dados, e
  envolver um JSON de 12 itens numa interface é a abstração vazia que só se paga
  em teste — que não existe ainda.
- **Não crie DTOs.** A validação de `dados.js` já é o contrato de entrada, num
  lugar só, e devolve mensagem em português pronta para a tela.
- **Não separe `usuarios.js`** em CLI + serviço. Ele já é só a casca; a regra
  está em `auth.js`.
- **Não troque o JSON por banco** enquanto forem dezenas de itens. A
  justificativa em [dados.js:8-11](../servidor/dados.js#L8-L11) continua válida.

## 7. Problemas de dependência

Nenhum. O grafo é raso e a direção está certa:

```text
usuarios.js ──► auth.js
servidor.js ──► auth.js
            └─► dados.js
```

`auth.js` e `dados.js` não conhecem HTTP nem um ao outro. Não há ciclo, não há
camada baixa importando camada alta, não há import cruzado. Nada a corrigir.

Uma observação, não um problema: cada módulo define a própria classe
`ErroDeUso`, e `responderErro` testa as duas
([servidor.js:77](../servidor/servidor.js#L77)). É duplicação consciente que
mantém os módulos independentes — o custo é uma linha no tratador. Unificar num
`erros.js` só se aparecer um terceiro módulo.

## 8. Problemas de domínio

As regras estão onde deveriam. Papéis em `auth.js`, validação do acervo em
`dados.js`, nenhuma regra de negócio dentro do tratador HTTP.

Um acoplamento a registrar: `BLOCOS` em
[dados.js:29-33](../servidor/dados.js#L29-L33) precisa bater com as `chave` dos
blocos em `js/paginas/documentacao.js`, e isso é garantido por comentário, não
por código. Bloco novo cadastrado em um só lugar produz item que existe na API e
não aparece na página. Severidade baixa (muda raramente, e o comentário está no
lugar certo), mas é o candidato natural a virar a primeira asserção de teste.

## 9. Banco de dados

Não há banco, e essa decisão está correta para o volume (12 itens,
`documentos.json` com 5 KB). O que existiria como constraint:

- **Unicidade de id:** `crypto.randomUUID()` — suficiente.
- **Integridade referencial `item → docs/arquivo`:** não existe. Um item pode
  apontar para arquivo apagado à mão na VM. Aceitável: o front mostra o link
  quebrado, ninguém perde dado.
- **Atomicidade:** garantida por `tmp` + `rename`, e o ciclo
  ler→alterar→gravar é indivisível porque é todo síncrono (ver §3). Não há
  transação a acrescentar.
- **Índices, N+1, paginação:** não se aplicam. `listar()` relê 5 KB do disco a
  cada `GET /api/documentos`; com dezenas de itens e dezenas de acessos por dia,
  cachear seria complexidade sem ganho medível.

## 10. Segurança

| # | Item | Severidade | Situação |
|---|---|---|---|
| 1 | Travessia por `%2F` expõe `usuarios.json`, `.env`, `.git` | **Crítica** | Corrigida nesta auditoria — achado 1 |
| 2 | Troca de senha não encerra sessões | Média | Aberta — achado 2 |
| 3 | Hash da atualização pelo mesmo canal HTTP | Média | Inerte (`ORIGEM` vazio) — achado 3 |
| 4 | Cookie sem `Secure` | Baixa | Consciente: a VM serve HTTP interno; documentado em [auth.js:224-229](../servidor/auth.js#L224-L229). Acrescentar junto com HTTPS |
| 5 | Sem limite de requisição fora do login | Baixa | Aceitável em rede interna. O freio de senha (5 tentativas / 5 min) cobre o que importa |
| 6 | Senha (scrypt + salt + tempo constante) | — | Correto |
| 7 | Autorização no servidor, papel da sessão | — | Correto |
| 8 | Upload: extensão de lista fechada, nome reescrito, teto de 25 MB | — | Correto |
| 9 | `href` por lista de permitidos (barra `javascript:`/`data:`) | — | Correto |
| 10 | CSRF | — | Coberto por `SameSite=Strict` + ausência de CORS |
| 11 | Erro interno não vaza para o cliente | — | Correto |

## 11. Performance

Nada a fazer. As leituras são de arquivos de poucos KB, o IO síncrono é
proposital e correto neste desenho, e o volume é de dezenas de acessos por dia.
Qualquer otimização aqui seria sem evidência.

## 12. Organização recomendada

**Manter.** Nenhuma árvore nova. A correção do achado 1 é dentro de um arquivo;
os achados 2 e 4 são uma linha e uma nota na documentação. Reorganizar pastas
não resolveria nenhum dos cinco achados.

## 13. Plano

### P0 — agora

1. ~~**Corrigir a travessia de caminho** (achado 1).~~ **Feito** — patch
   aplicado e verificado. Falta só revisar o diff e commitar.
2. **Trocar as senhas dos usuários existentes** — os hashes estiveram
   acessíveis a quem tem acesso ao portal, e a correção não desfaz o que já
   possa ter vazado. `node servidor/usuarios.js senha <login>`, para os dois.
3. **Encerrar sessões ao trocar a senha** (achado 2). Uma linha em `auth.js`.

### P1 — antes de subir na VM

4. Rever `.env` e `.git` no que estará servido na VM (a correção do P0 os
   fecha; vale confirmar que a VM não guarda mais nada dentro da raiz).
5. HTTPS, ou assinatura do instalador, antes de preencher `ORIGEM` no
   verificador de atualização (achado 3).

### P2 — quando houver folga

6. Testes das quatro funções de fronteira: `caminhoSeguro`, `validarHref`,
   `nomeSeguro`, `exigir`. Com `node:test`, sem framework — a primeira asserção
   é o `curl` do achado 1 virando teste.
7. Uma linha em `09-edicao-pela-pagina.md` sobre arquivo órfão em `docs/`
   (achado 4).

### P3 — opcional

8. Asserção ligando `BLOCOS` de `dados.js` às chaves de
   `js/paginas/documentacao.js` (§8).
9. Cortar `estatico.js` de `servidor.js` — só se o arquivo crescer.

## 14. Veredito

**O backend está bem separado? Sim.**

- **O que está correto:** a divisão em transporte / identidade / acervo, a
  direção das dependências (sem ciclo), a porta única para cada arquivo de
  dados, a autorização decidida no servidor, a escrita atômica, os erros
  tipados, o tratamento de senha e a ausência total de dependências. A
  arquitetura é proporcional ao sistema — nem faltando camada, nem sobrando.
- **O que está errado:** a lista de pastas bloqueadas do servidor estático
  confere a URL aparente em vez do caminho resolvido, e por isso entrega os
  hashes de senha, o `.env` e o `.git` a quem pedir com `%2F`. É o único achado
  grave, e é um bug, não uma consequência do desenho.
- **Quais arquivos devem mudar:** `servidor/servidor.js` (achado 1, P0),
  `servidor/auth.js` e `servidor/usuarios.js` (achado 2, uma linha e uma
  mensagem). Mais nada.
- **Quais devem permanecer como estão:** `servidor/dados.js` inteiro, a
  estrutura de pastas, o JSON como armazenamento, o IO síncrono e a ausência de
  camadas intermediárias.
- **Maturidade:** madura para o porte. O código demonstra as decisões que
  costumam faltar em projeto pequeno — papel validado no servidor, senha bem
  tratada, escrita atômica, entrada por lista de permitidos. O que falta é o
  cinto de segurança que teria pegado o achado 1 sozinho: **teste automatizado
  das funções de fronteira**. É a única lacuna estrutural real, e é P2 porque o
  P0 vem primeiro.

---

## Simplificação da arquitetura do backend

Revisão feita depois da auditoria acima, procurando especificamente camadas
supérfluas: arquivos que só repassam parâmetros, services que chamam services,
use cases sem responsabilidade, interfaces com uma implementação, repositories
intermediários, adapters, mappers triviais, helpers de operação óbvia,
validação repetida entre camadas e erro tratado mais de uma vez.

**Resultado: não havia camada para remover.** O que existia de gordura eram
três exports sem consumidor. A conclusão principal desta seção é uma decisão
de *não* refatorar, e o resto dela explica por quê — para que ninguém refaça
essa análise daqui a seis meses.

### Problemas encontrados

O fluxo procurado era este:

```text
Route → Controller → Handler → Service → UseCase → Repository → Adapter → Banco
```

Nenhum desses degraus existe. Varredura em `servidor/` e `app/`:

| Padrão | Ocorrências |
|---|---|
| UseCase, Repository, Adapter, Mapper | 0 |
| DTO, class-validator, Zod, interface | 0 |
| NestJS, Prisma, TypeScript | 0 |
| `index.js` (barrel) | 0 |
| Dependência de runtime no `package.json` | 0 |
| Profundidade de pastas em `servidor/` | 1 (`servidor/dados/`, que guarda dados, não código) |

Foi encontrado de fato:

1. **Três exports sem consumidor.** `auth.PAPEIS` e `dados.validarHref` são
   usados só dentro do próprio arquivo. Superfície pública inútil.
2. **Validação duplicada entre backend e front** — o único caso real de
   duplicação, e ele **não** é entre camadas do backend:

   | Regra | Fonte da verdade | Cópia manual |
   |---|---|---|
   | Blocos do acervo | `dados.js:29-33` | — servido pela API, front consome |
   | Extensões aceitas | `dados.js:37` | `js/documentos/acervo.js:7` (`ACEITOS`) |
   | Limites de campo | `dados.js:39` | `js/documentos/formularios.js:81,85,98` (`maxlength`) |

   O mecanismo certo já existe e já é usado: `GET /api/documentos` devolve
   `blocos` junto dos itens, e o front os valida ao chegar
   (`acervo.js:44-49`). Extensões e limites simplesmente não pegaram carona
   nesse mesmo caminho.
3. **`ErroDeUso` declarado duas vezes** (`dados.js:43`, `auth.js:37`), com
   `responderErro` testando as duas classes (`servidor.js:77`). Avaliado e
   **mantido** — ver "Abstrações mantidas".

Não foi encontrado: função que só repassa, service chamando service, log
duplicado por camada (só `servidor.js` e `usuarios.js` escrevem no console, e
em pontos distintos), erro tratado em mais de um nível, dependência circular,
código morto, arquivo órfão ou dependência npm sem uso.

### Camadas removidas

Nenhuma. Não havia camada intermediária no projeto.

### Camadas consolidadas

Nenhuma. As três camadas existentes — transporte, identidade, acervo — já são
o mínimo para separar HTTP de regra e de persistência.

### Estrutura anterior

```text
servidor/
├── servidor.js     HTTP: rotas, API, estáticos, erros
├── auth.js         usuários, senha, sessão, papéis, cookie
├── dados.js        acervo: leitura, validação, escrita, upload
└── usuarios.js     CLI de cadastro
```

### Estrutura atual

Idêntica. Nenhum arquivo criado, removido, movido ou renomeado.

### Fluxo de uma requisição

É o que o pedido descreve como alvo, e já era assim antes desta revisão.
`POST /api/documentos`, do socket ao disco:

```text
http.createServer            servidor.js:274   separa /api/ de estático
  └─ tratarApi               servidor.js:117   lê o cookie, resolve a sessão
       ├─ auth.exigir        auth.js:207       papel autorizado? senão 401/403
       ├─ lerJson            servidor.js:105   corpo com teto de 64 KB
       ├─ dados.incluir      dados.js:127      valida campos e monta o item
       │    └─ gravar        dados.js:63       tmp + rename (atômico)
       └─ responderJson      servidor.js:65    201 + item
```

Quatro arquivos abertos no pior caso, três saltos de função entre o HTTP e o
disco. Não há para onde encurtar sem juntar responsabilidades que estão
corretamente separadas.

### Decisões arquiteturais

- **Sem framework HTTP.** `http` do Node basta para 7 rotas. Express traria
  dependência, middleware e um roteador para substituir 30 linhas de `if`.
- **Sem banco.** Dezenas de itens, edição esporádica, meia dúzia de pessoas.
  JSON é legível, versionável e o backup é um `copy`.
- **IO síncrono.** Não é descuido: numa thread só, ler→alterar→gravar sem
  `await` no meio é indivisível. É o que dispensa lock e transação. Tornar
  assíncrono introduziria a corrida que hoje não existe.
- **Sem camada de repositório sobre o JSON.** `dados.js` já é a camada de
  dados; envolvê-la em outra seria a abstração vazia que o pedido manda evitar.
- **Validação num lugar só.** As funções de `dados.js` (`texto`,
  `validarHref`, `validarBloco`, `validarFormato`) são o contrato de entrada.
  Não há DTO, schema nem validator paralelos — e não deve haver.
- **Papel decidido no servidor.** `auth.exigir` lê o papel da sessão, nunca do
  corpo. É a fronteira que justifica `auth.js` existir separado.

### Abstrações mantidas e justificativa

| Abstração | Por que fica |
|---|---|
| `auth.js` separado de `servidor.js` | Fronteira de segurança real: quem é a pessoa e o que pode. É a única regra que não pode viver perto do parsing de HTTP |
| `dados.js` separado de `servidor.js` | Porta única para `documentos.json` — verificado: nenhum outro arquivo abre esse caminho. Toda gravação passa pela mesma validação e pelo mesmo `tmp`+`rename` |
| `usuarios.js` separado | Roda no terminal da VM, nunca pelo navegador. Juntá-lo ao servidor colocaria `readline` no processo que atende HTTP |
| `ErroDeUso` duplicado nos dois módulos | Unificar exigiria um quinto arquivo (`erros.js`) para poupar 7 linhas, ou uma dependência entre `auth.js` e `dados.js`, que hoje não se conhecem. O custo da duplicação é uma linha a mais em `responderErro`; o custo da unificação é um arquivo a mais para navegar ou um acoplamento novo. Fica como está |
| `EXTENSOES` e `LIMITES` exportados sem consumidor | São o contrato que o front deveria consumir em vez de repetir à mão. Mantidos de propósito, com comentário no `module.exports` apontando a pendência |
| `module.exports = { servidor }` em `servidor.js` | Junto do `require.main === module`, é o que permite importar o servidor sem escutar numa porta — o gancho dos testes do P2 |

### Abstrações removidas e justificativa

| Removido | Onde | Por quê |
|---|---|---|
| `PAPEIS` do `module.exports` | `auth.js:236` | Usado só dentro de `auth.js` (linha 93). Superfície pública sem consumidor |
| `validarHref` do `module.exports` | `dados.js:211` | Idem — `incluir` e `editar` a chamam internamente. Continua exportável no dia em que virar alvo de teste |

### Arquivos removidos

Nenhum.

### Arquivos movidos

Nenhum.

### Arquivos renomeados

Nenhum.

### Riscos da refatoração

Baixos, porque a refatoração foi mínima. As duas alterações retiram nomes de
`module.exports`; a varredura que as motivou cobriu `servidor/`, `app/` e
`js/`, então não há consumidor a quebrar. Se algum código futuro precisar de
`PAPEIS` ou `validarHref`, o conserto é recolocar a palavra na lista.

O risco real deste documento é outro: **alguém ler o pedido genérico de
"reduzir camadas" e aplicar a receita mesmo assim**, criando
`modules/documentos/` com controller, service, repository e DTO para embrulhar
755 linhas. Isso multiplicaria arquivos sem reduzir acoplamento nenhum, e é
exatamente o que esta seção existe para evitar.

### Testes executados

Com `node servidor/servidor.js --porta 8123` no ar, depois das alterações:

| Verificação | Resultado |
|---|---|
| `node --check` nos 4 arquivos | ok |
| `GET /api/sessao` | `{"autenticado":false}` |
| `GET /api/documentos` | 12 itens, 3 blocos |
| `POST /api/documentos` sem sessão | 401 |
| `POST /api/sessao` com senha errada | 401 `Usuário ou senha incorretos.` |
| Travessia `%2F` (achado 1) | 403 — segue fechada |
| `node servidor/usuarios.js listar` | lista os dois usuários |
| Fumaça do front (`run-pa-jb-portal --smoke`) | 10/10, sem erro de console |

Não há suíte automatizada a rodar — é a pendência 6 do plano (P2). Lint,
type-check e build não se aplicam: não há linter configurado, não há
TypeScript e o projeto não tem build.

### Pendências

1. **Servir o contrato em vez de duplicá-lo.** Em `servidor.js:151`, incluir o
   que já está exportado:

   ```js
   return responderJson(res, 200, {
     itens: dados.listar(),
     blocos: dados.BLOCOS,
     extensoes: dados.EXTENSOES,
     limites: dados.LIMITES
   });
   ```

   E no front, trocar `ACEITOS` (`js/documentos/acervo.js:7`) e os `maxlength`
   literais (`js/documentos/formularios.js:81,85,98`) pelos valores recebidos,
   validando na chegada como já é feito com `blocos`.

   **Não executado aqui de propósito:** `js/documentos/` está sendo reescrito
   em paralelo (arquivos ainda não versionados no momento desta auditoria), e
   servir campos que ninguém lê seria adicionar peso morto. As duas metades
   devem ir juntas, num momento em que o front esteja estável.

2. Os itens P0-2, P1 e P2 do plano acima continuam valendo — em especial
   **trocar as senhas** e **testar as funções de fronteira**.
