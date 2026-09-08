[← Índice](README.md)

# Arquitetura e integração da IA

O assistente de IA é um **projeto separado, de outra frente**, e ainda não foi
entregue. Este documento é o que o portal preparou para recebê-lo: onde ele se
encaixa, qual o contrato, o que já está pronto e o que só pode ser feito quando
o serviço existir.

**A IA não está implementada aqui, e não deve ser.** Não há chamada a OpenAI,
Claude, Gemini nem a nenhum provider — nem falsa, nem de exemplo. O que existe é
a ponte: [`servidor/ia.js`](../servidor/ia.js), que hoje responde "não
configurado" e amanhã responde o que o serviço da equipe responder.

---

## 1. Arquitetura atual

Antes de qualquer coisa, três fatos sobre o portal que mudam o que faz sentido
preparar — todos verificados no código, não presumidos.

### Não há framework, build, nem dependência de runtime

O site é estático, os scripts são clássicos (`<script src>`, sem `type="module"`),
e o backend usa só o `node:` embutido. O "sistema de módulos" do frontend é o
namespace `window.Portal.*` montado em [`js/compartilhado/html.js`](../js/compartilhado/html.js).
Isso é decisão registrada, não descuido — ver
[08-futuros-passos.md](08-futuros-passos.md#5-o-que-não-fazer): o portal precisa
abrir por `file://` e dentro do Electron.

**Consequência para a IA:** nada de pasta `modules/`, `components/ai/` ou
providers em TypeScript. Um arquivo `js/` novo, carregado na ordem certa do
`index.html`, é o mecanismo de extensão que este projeto tem.

### O frontend já tem UMA porta HTTP

Todo tráfego do navegador para o backend passa por `pedir()` em
[`js/documentos/api.js`](../js/documentos/api.js) — mesma origem, prefixo
`/api`, contrato de erro `{erro}` com `status`. Nenhum componente monta URL por
conta própria. **O desacoplamento que a integração exigiria já existe;** não foi
preciso criar camada de serviço nenhuma no frontend.

### Não existe integração com SharePoint

Procurado no código inteiro: **nenhum `fetch`, nenhuma URL, nenhuma credencial,
nenhuma biblioteca.** A página `#sharepoint`
([`js/paginas/sharepoint.js`](../js/paginas/sharepoint.js)) é conteúdo estático
com cinco bibliotecas e `href: '#'` em todas — links por preencher, listados em
[07-pendencias.md](07-pendencias.md).

**Não havia acoplamento com SharePoint para remover.** Criar `SharePointAdapter`,
`AccessService` ou uma camada de providers hoje seria abstração sobre nada — o
que a auditoria do backend já concluiu por outro caminho, em
[auditoria-estrutura-backend.md](auditoria-estrutura-backend.md#simplificação-da-arquitetura-do-backend).

### Fluxo de hoje

```text
Usuário
 ↓
Frontend (index.html + js/, estático)
 ↓  fetch('/api/...')  ← único ponto, js/documentos/api.js
Backend (servidor/servidor.js)
 ├── auth.js    sessão, papel
 └── dados.js   acervo → servidor/dados/documentos.json
```

A busca **não aparece nesse fluxo de propósito**: ela roda inteira no navegador,
sobre `window.PAGINAS` e o array da equipe que já estão em memória
([11-busca.md](11-busca.md)). Não consulta backend nenhum.

---

## 2. Arquitetura preparada

```text
Usuário
 ↓
Portal Parceria JB (frontend estático)
 ↓  /api/...
Backend (servidor/servidor.js)
 ├── auth.js     quem é a pessoa, o que ela pode          ✔ existe
 ├── dados.js    acervo de documentos                     ✔ existe
 └── ia.js       ponte para o assistente                  ✔ existe, desligada
                  ↓  HTTP + JSON, PAJB_IA_URL
            Serviço de IA (projeto de outra equipe)
                  ↓
            base de conhecimento própria dele
```

**A base de conhecimento fica do lado do serviço de IA, não do portal.** Essa é
a decisão que mais economiza trabalho aqui, e vale explicar: o pedido original
previa um `KnowledgeService` no portal, com providers de SharePoint, banco,
documentação e incidentes. O portal não tem nenhuma dessas fontes — tem um JSON
com algumas dezenas de links e um índice de busca em memória. Um
`KnowledgeService` aqui seria uma camada vazia entre a IA e o nada.

Quem tem — ou vai ter — procedimentos, incidentes, histórico de soluções e
documentação indexada é o **projeto da IA**. O portal entra como *cliente* dele,
e o que o portal sabe (o acervo) já está publicado em `GET /api/documentos`,
pronto para o serviço de IA consumir de fora, quando quiser.

Se um dia o portal precisar oferecer conhecimento próprio à IA, o lugar já está
definido: uma rota `GET /api/conhecimento/busca` ao lado das outras, alimentada
por `dados.js`. Não é preciso preparar nada agora para isso — é uma rota de
oito linhas no mesmo arquivo, como a da IA foi.

---

## 3. SharePoint

**O que ainda está acoplado ao SharePoint: nada.** Não há código a migrar.

O que existe é conteúdo:

| Onde | O que é |
|---|---|
| [`js/paginas/sharepoint.js`](../js/paginas/sharepoint.js) | Página com 5 bibliotecas, todas `href: '#'` |
| [`js/paginas/acessos-parceria.js`](../js/paginas/acessos-parceria.js) | Um item "Sharepoint da parceria" apontando para `#sharepoint` |
| `index.html`, `css/pagina.css` | Entrada de menu, card da home e um ícone |

**O caminho quando os endereços reais chegarem** é o mesmo de qualquer outro
link do portal: preencher o `href`. Um endereço de biblioteca é **dado**, não
integração — e se a equipe quiser mantê-los sem mexer em código, o mecanismo já
existe: dar uma `chave` aos blocos `tipo: 'links'` dessas páginas e acrescentá-la
a `BLOCOS` em [`servidor/dados.js`](../servidor/dados.js), como a Documentação já
faz. Os itens passam a ser editáveis pela própria página
([09-edicao-pela-pagina.md](09-edicao-pela-pagina.md)).

**Quando isso deixaria de bastar:** no dia em que o portal precisar *ler* do
SharePoint — listar arquivos de uma biblioteca, checar permissão, buscar dentro
dos documentos. Aí, e só aí, nasce um `servidor/sharepoint.js` no mesmo formato
de `ia.js`: um arquivo, config por variável de ambiente, contrato de saída
próprio do portal. As variáveis já estão reservadas e comentadas no
[`.env.example`](../.env.example), explicitamente sem consumidor.

---

## 4. Acessos Parceria

Página de conteúdo, como as outras. Não tem serviço, não tem backend, não tem
integração — e não precisa ter. Está listada aqui porque o plano de longo prazo
a trata como o domínio que continuaria no SharePoint: se isso se confirmar, o
que muda é o `href` dos itens, não a arquitetura.

---

## 5. O assistente — `servidor/ia.js`

Um arquivo, ~200 linhas, sem dependência. Responsabilidade única: **falar com o
serviço de IA e traduzir os dois lados**.

| Faz | Não faz |
|---|---|
| Lê a configuração do ambiente | Guardar segredo no código |
| Valida a pergunta e o contexto | Decidir o que a IA responde |
| Envia identidade mínima (`login`, `papel`) | Enviar cookie, senha, hash ou salt |
| Corta no timeout | Esperar indefinidamente |
| Normaliza a resposta para o formato do portal | Confiar no `href` que a IA mandou |
| Registra uma linha de auditoria por consulta | Registrar o texto da pergunta |
| Transformar qualquer falha em `{erro}` com status | Repassar mensagem interna da IA |

### Por que passa pelo backend

Não é preferência de arquitetura: a CSP do portal declara `connect-src 'self'`
([`servidor/seguranca.js`](../servidor/seguranca.js)). **O navegador é proibido
de falar com outra origem.** Não existe a opção de o frontend chamar a IA
direto, nem por engano — e é o que garante que a URL e o token do serviço nunca
apareçam no DevTools de quem acessa.

### A rota

```text
POST /api/ia/consulta        exige sessão (equipe ou dev)
```

Exige sessão porque a IA precisa saber **em nome de quem** responde: o que a
pessoa pode ver depende do papel dela. O papel sai da sessão do cookie
(`auth.sessaoDe`), **nunca do corpo da requisição** — quem manda a pergunta não
escolhe quem é. É a mesma fronteira que já vale para editar documentos.

---

## 6. Contrato esperado

### O portal envia (para o serviço de IA)

```json
{
  "pergunta": "como solicito acesso ao MAM?",
  "contexto": ["acessos-parceria"],
  "usuario": { "login": "rennan", "papel": "equipe" }
}
```

- `pergunta` — obrigatória, até 2000 caracteres, espaços normalizados.
- `contexto` — opcional, até 10 itens de até 200 caracteres. É **dica de onde
  procurar** (chave de bloco, nome de página, número de chamado), não o conteúdo
  da página. Quem sabe onde o conhecimento está é o serviço de IA.
- `usuario` — só esses dois campos. Nunca sai daqui nada além.

Se `PAJB_IA_TOKEN` estiver preenchida, vai também
`Authorization: Bearer <token>`.

### O portal espera de volta

```json
{
  "resposta": "Abra um chamado na categoria Acessos...",
  "fontes": [
    { "titulo": "Manual de acesso", "tipo": "procedimento", "href": "docs/manual.pdf", "id": "" }
  ],
  "confianca": 0.82,
  "metadados": {}
}
```

- `resposta` — obrigatória. Vazia ou ausente vira erro 502.
- `fontes` — opcional, até 20. `tipo` é o vocabulário do portal: `documento`,
  `procedimento`, `incidente`, `servico`, `pessoa`. **Tipo desconhecido vira
  `documento`** em vez de a fonte ser descartada.
- `href` de fonte passa pela mesma lista de permitidos do acervo: só `http(s)://`
  ou `docs/arquivo`. `javascript:` e `data:` são zerados — a resposta da IA vira
  link na página, e link é executável.
- `confianca` e `metadados` são repassados quando vierem no formato certo.

**Se o serviço falar outro dialeto**, `mapear()` em
[`servidor/ia.js`](../servidor/ia.js) é o único lugar a mexer — e ele já aceita
`answer`/`sources`/`confidence` além dos nomes em português, para que a primeira
integração não dependa de acertar o palpite.

### Erros que o portal devolve ao navegador

Todos no formato `{ "erro": "texto para a pessoa" }`, o mesmo do resto da API:

| Status | Quando |
|---|---|
| 400 | Pergunta vazia, longa demais, contexto inválido |
| 401 | Sem sessão |
| 502 | O serviço respondeu, mas com erro ou formato inesperado |
| 503 | Não configurado, fora do ar ou inalcançável |
| 504 | Passou do timeout |

---

## 7. Variáveis de ambiente

Todas opcionais. **Vazias = assistente desligado**, que é o estado de hoje.
Documentadas em [`.env.example`](../.env.example).

| Variável | Para quê |
|---|---|
| `PAJB_IA_URL` | Endereço completo do endpoint de consulta. É o interruptor: vazia, a rota responde 503. Precisa começar com `http://` ou `https://` — endereço inválido derruba o servidor no boot, de propósito |
| `PAJB_IA_TOKEN` | Vai como `Bearer`. Vazia, nenhum `Authorization` é enviado |
| `PAJB_IA_TIMEOUT_MS` | Teto de espera. Padrão 20000 |

**O servidor não carrega `.env` sozinho** — isso não mudou. Na VM, as variáveis
entram no ambiente do serviço (`nssm set ... AppEnvironmentExtra`, ou o `unit`
do systemd). Ver [01-como-rodar.md](01-como-rodar.md).

Nenhum segredo entra em `js/`: o que a VM entrega ao navegador é legível por
quem acessa. Ver [02-seguranca.md](02-seguranca.md).

---

## 8. Indisponibilidade

**O portal não depende da IA para funcionar, e isso está testado.**

O assistente vive atrás de uma rota só. Ele não é chamado no carregamento da
página, não participa da renderização, não participa da busca e não é consultado
por nenhum outro módulo. IA fora do ar significa uma rota respondendo 503:

```text
Portal
 ├── Home, equipe, contatos   ✓   HTML e js/ estáticos
 ├── Páginas e navegação      ✓   window.PAGINAS, no navegador
 ├── Busca                    ✓   índice em memória, sem backend
 ├── Acessos, Sharepoint      ✓   conteúdo estático
 ├── Documentos               ✓   servidor/dados.js
 └── Assistente               ✗   503
```

`tests/unit/seguranca.test.cjs` verifica exatamente isso: com a IA desligada, a
rota devolve 503 e, na sequência, o `index.html`, `/api/documentos` e
`/api/sessao` continuam respondendo.

**Quando a interface do assistente for construída, ela precisa herdar essa
postura** — e o portal já tem o padrão pronto para copiar:
[`js/documentos.js`](../js/documentos.js) tenta carregar o acervo do servidor e,
se falhar, **volta em silêncio** para o conteúdo estático do `.js`. Ninguém vê
erro; a página simplesmente não ganha os botões de edição. O painel do
assistente deve fazer o mesmo: se `/api/ia/consulta` responder 503, o painel não
aparece — não um alerta vermelho em cima do portal.

---

## 9. Auditoria

Uma linha no console por consulta, em `auditar()`:

```text
[ia] 2026-09-08T20:49:49.207Z rennan 412ms ok fontes=3
[ia] 2026-09-08T20:49:52.881Z rennan 20001ms erro=TimeoutError
```

Cobre quem perguntou, quando, quanto tempo levou, se deu certo e quantas fontes
voltaram. **O texto da pergunta não entra** de propósito: log de portal interno
acaba em arquivo compartilhado, e o que a pessoa perguntou é dela.

Não há banco nem telemetria, e não deve haver enquanto ninguém precisar
consultar esse histórico. Quando precisar, é uma função só a trocar — `auditar()`
é o único lugar que escreve.

---

## 10. Como integrar a futura IA

Passo a passo para quem receber o projeto do assistente.

### Passo 1 — Levantar o contrato do serviço

Antes de mexer no portal, descubra do outro lado: **endereço do endpoint**,
**como ele autentica** e **o formato exato de request e response**. Compare com
a seção 6 acima. Se bater (ou usar `answer`/`sources`), não há código a escrever.

### Passo 2 — Configurar

```bash
PAJB_IA_URL=http://ia-pajb:3000/consulta
PAJB_IA_TOKEN=...          # se o serviço exigir
```

Reinicie o serviço do portal. `POST /api/ia/consulta` para de responder 503.
Teste antes de escrever qualquer interface:

```bash
curl -X POST http://localhost:8000/api/ia/consulta \
  -H 'Content-Type: application/json' -H 'X-Portal-Request: 1' \
  -H 'Cookie: pajb_sessao=<token de uma sessão válida>' \
  -d '{"pergunta":"como abro um chamado?"}'
```

### Passo 3 — Adaptar `mapear()`, se preciso

Só se o formato divergir. Mexa **apenas** em `mapear()` e `fonte()` em
[`servidor/ia.js`](../servidor/ia.js) — o resto do arquivo e a rota não mudam.
`tests/unit/ia.test.cjs` já cobre a normalização; acrescente um caso com o
formato real do serviço.

### Passo 4 — Construir a interface

O que não existe ainda, e **é aqui que está o trabalho de verdade**. Sugestão de
forma, seguindo o que o portal já faz:

- `js/ia/api.js` — reaproveita `window.Portal.documentosApi.pedir()`. **Não
  escreva um `fetch` novo:** `pedir()` já trata sessão expirada, contrato de
  erro e o cabeçalho `X-Portal-Request` que a proteção contra CSRF exige.
- `js/ia/painel.js` — a interface. Use `<dialog>`, como
  [`js/busca.js`](../js/busca.js) e `js/documentos/dialogo.js` já fazem: foco
  preso, `Esc` fecha, `aria-live` no resultado.
- Um botão no header, ao lado de Buscar.
- Registre os `<script>` no `index.html` **depois** de `js/documentos/api.js`.
  A ordem dos scripts é dependência implícita e quebra em silêncio —
  [07-pendencias.md](07-pendencias.md).

Esses arquivos **não foram criados como placeholder** de propósito: arquivo
vazio sem consumidor é peso para manter e ruído para quem procura o código de
verdade.

### Passo 5 — Fontes na resposta

Cada fonte já vem com `titulo`, `tipo` e `href` validado. Renderize como a lista
de links do portal (`.link-list` em `css/pagina.css`) para não inventar um
componente novo. `href` vazio significa fonte sem destino: mostre o título sem
virar link, como os itens "a definir" já fazem.

### Passo 6 — Testar a queda

**Antes de publicar**, derrube o serviço de IA e confira que o portal inteiro
continua: home, menu, busca, equipe, documentos. É o teste que mais importa e o
mais fácil de esquecer.

---

## 11. Checklist de integração

```text
[ ] Levantar endereço, autenticação e formato do serviço de IA
[ ] Preencher PAJB_IA_URL (e PAJB_IA_TOKEN, se houver) no ambiente da VM
[ ] Confirmar a rota com curl, autenticado, antes de qualquer interface
[ ] Adaptar mapear()/fonte() se o formato divergir — e só isso
[ ] Acrescentar um caso em tests/unit/ia.test.cjs com o formato real
[ ] Ajustar PAJB_IA_TIMEOUT_MS ao tempo real de resposta do serviço
[ ] Criar js/ia/api.js reaproveitando Portal.documentosApi.pedir()
[ ] Criar js/ia/painel.js (dialog, foco preso, aria-live)
[ ] Registrar os scripts no index.html na ordem certa
[ ] Botão de acesso no header e no drawer
[ ] Renderizar fontes com .link-list; href vazio não vira link
[ ] Painel some (sem alarde) quando a rota responde 503
[ ] Testar com o serviço de IA derrubado: portal inteiro continua
[ ] Testar com o serviço lento: corta no timeout, 504, portal segue
[ ] Confirmar no log [ia] que a pergunta NÃO está sendo registrada
[ ] Verificar no DevTools que URL e token da IA não aparecem em js/
[ ] Rodar pnpm test e pnpm test:browser
```

---

## 12. O que foi deliberadamente NÃO criado

Registrado para não ser refeito daqui a seis meses como se fosse esquecimento:

| Não criado | Por quê |
|---|---|
| `modules/` com access, knowledge, incidents, procedures, search, users | Seis pastas sem consumidor. O portal tem 4 páginas de conteúdo e 1 acervo |
| `KnowledgeService` + providers | O conhecimento é do serviço de IA. Aqui seria camada entre a IA e o nada |
| `SharePointAdapter` / `AccessService` | Não há integração com SharePoint para adaptar — seção 3 |
| `components/ai/*` (AssistantPanel, ChatInput…) | Arquivo vazio é peso para manter e ruído na busca. Passo 4 diz onde vão quando existirem |
| `GET /api/conhecimento/*`, `/api/incidentes/*`, `/api/procedimentos/*` | Rotas para dados que o portal não tem. São oito linhas no dia em que tiver |
| `AIProvider` como interface + `MockAIProvider` | Interface com uma implementação. O mock dos testes é um `http.createServer` de 10 linhas, que exercita a rede de verdade |
| Camada de config validada | `ia.js` valida a própria URL no boot. Um módulo de config para três variáveis seria o repasse que a auditoria do backend já recusou |

O critério foi o do próprio pedido: preparar ponto de extensão, não antecipar
complexidade. Ver
[auditoria-estrutura-backend.md](auditoria-estrutura-backend.md#simplificação-da-arquitetura-do-backend),
que chegou à mesma conclusão analisando o backend por outro ângulo.
