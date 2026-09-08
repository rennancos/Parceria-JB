# Auditoria estrutural do frontend — Parceria JB

Data: 7 de setembro de 2026. Atualizado após a implementação das correções.

**Parte 1 — Frontend.** A análise parcial do servidor permanece em [Auditoria estrutural do backend](auditoria-estrutura-backend.md).

Este documento registra o diagnóstico inicial, as correções realizadas e a estrutura resultante. A autorização para implementar foi dada após a auditoria. O escopo desta refatoração é o frontend; o backend e a distribuição Electron não foram refatorados nesta tarefa.

## 1. Diagnóstico geral

**Classificação atual: Boa.** A classificação inicial era **Precisa de ajustes**.

Os nove achados A–I do relatório inicial foram tratados. A condição de corrida do editor foi corrigida; transporte, acervo e interface têm limites próprios; busca e conteúdo compartilhado podem ser testados sem DOM; e a definição efetiva do tema foi consolidada.

A arquitetura continua proporcional ao portal: HTML, CSS e JavaScript sem framework, sem build e com suporte a `file://`. Não foram adicionadas dependências de produção, stores, hooks ou uma arquitetura genérica de repositories.

### Escopo e evidências

Foram revisados os scripts do portal, CSS, composição HTML, dados de páginas e equipe, contratos da API e a integração visual com Electron. A estrutura resultante possui **19 arquivos JavaScript do portal e seis arquivos CSS**.

Verificações realizadas:

- `npm test`: **16 testes de lógica e contratos**, com respostas simuladas e sem escrita no acervo real.
- `npm run test:browser`: **oito cenários em Chrome headless**, além do teste agregador registrado pelo executor.
- Abertura em `file://`, navegação por hash, busca por teclado e HTTP sem API.
- Upload pendente, fechamento e reabertura do formulário, erro antigo, evento `close` tardio e submissão dupla.
- Resposta `401`, remoção do estado visual autenticado e novo login.
- Busca já aberta sendo atualizada após confirmação de alteração no acervo.
- Comparação de 14 propriedades de estilo calculado nos elementos da home e de Documentação, em **360, 900 e 1280 pixels**, contra a cópia anterior à refatoração: sem diferenças nos cenários comparados.
- Dados de equipe preservados e HTML gerado pelas quatro páginas igual ao da referência anterior. O conteúdo que já estava sendo editado pelo usuário foi mantido.
- Testes de contrato entre chaves das listas do frontend e constantes do servidor, além das extensões aceitas no upload.

As verificações de navegador usam um servidor de teste com dados fictícios em memória. Não gravam documentos nem usuários reais. Uma captura da página também foi inspecionada durante a revisão.

Após a comparação histórica, ocorreram alterações paralelas no projeto, incluindo estilos de quebra de texto em `pagina.css`. Os 16 testes de lógica e os oito cenários de navegador foram executados novamente sobre esse estado mais recente e passaram. Nessa última rodada foi verificado o layout responsivo, sem exigir igualdade com o CSS antigo. As afirmações de igualdade de HTML e estilos acima se referem à versão da refatoração comparada, antes dessas alterações posteriores.

**Limitações:** não foram executados testes em todos os navegadores, uma auditoria completa de acessibilidade, testes contra o backend real ou o empacotamento Electron. A comparação de estilos não é uma comparação pixel a pixel de todas as telas.

## 2. Estrutura atual

```text
PA_JB/
├── index.html
├── js/
│   ├── script.js                  # Drawer, encapsulado em IIFE
│   ├── router.js                  # Navegação e fallback de hash
│   ├── paginas.js                 # Registro e renderizadores de blocos
│   ├── paginas/                   # Quatro arquivos de conteúdo
│   ├── equipe-dados.js             # Pessoas e identidade compartilhada
│   ├── equipe.js                   # Cards da equipe
│   ├── busca.js                    # Diálogo, teclado e navegação da busca
│   ├── busca/
│   │   ├── motor.js               # Normalização, ranking e destaque
│   │   └── indice.js              # Adaptação de páginas e pessoas
│   ├── documentos.js               # Integração, sessão visual e ações
│   ├── documentos/
│   │   ├── api.js                 # Transporte e validação de sessão
│   │   ├── acervo.js              # Estado, projeção e operações do acervo
│   │   ├── dialogo.js             # Ciclo de vida de cada janela
│   │   └── formularios.js         # Telas de login, perfil e documento
│   └── compartilhado/
│       ├── html.js                # Escape de texto para HTML
│       └── paginas-modelo.js      # Contrato das seções
├── css/
│   ├── tokens.css                 # Tema efetivo, escalas e aliases
│   ├── styles.css                 # Base, layout e navegação
│   ├── equipe.css
│   ├── pagina.css
│   ├── edicao.css
│   └── busca.css
├── tests/
│   ├── unit/
│   │   ├── conteudo.test.cjs
│   │   └── documentos.test.cjs
│   ├── helpers/
│   │   ├── portal.cjs             # Ambiente isolado para scripts clássicos
│   │   └── navegador.cjs          # Chrome/Edge headless via CDP
│   └── browser.cjs                # Fluxos reais de interface com API simulada
├── Fotos/
├── docs/
├── servidor/
├── app/
└── md/
```

A ordem de carregamento está explícita em [index.html](../index.html): contratos e dados antes dos consumidores; módulos das funcionalidades antes de seus controladores. Os novos arquivos JS e CSS já estão abrangidos pelos padrões existentes de empacotamento.

## 3. O que está bem separado

- **Conteúdo:** `js/paginas/` contém dados e `equipe-dados.js` não inicializa a UI.
- **Composição:** `index.html` mantém layout, home e containers de páginas.
- **Renderização:** `paginas.js` reúne os renderizadores coesos dos blocos; `equipe.js` monta os cards.
- **Navegação:** `router.js` trata hash, título, foco e views, incluindo hashes malformados.
- **Busca:** o motor não conhece DOM, rotas ou dados globais; o índice adapta conteúdo recebido; a interface gerencia interação.
- **Edição:** HTTP, acervo, formulários, janela e integração possuem responsabilidades distintas.
- **Estilos:** tokens têm uma fonte efetiva; estilos de funcionalidade permanecem específicos e `[hidden]` fica no CSS base.
- **Testes:** lógica e contratos são exercitados sem navegador; fluxos de interação usam DOM real no Chrome.
- **Electron:** o preload visual continua isolado em `app/`, consumindo os tokens existentes.

### Estado e contratos

| Categoria | Responsável |
|---|---|
| URL | Hash lido pelo router. |
| Estado local da busca | Interface em `busca.js`: consulta, seleção, resultados e debounce. |
| Estado do formulário | DOM próprio de cada janela; valores capturados antes do primeiro `await`. |
| Sessão visual | Estado local do controlador `documentos.js`, invalidado pelo evento `sessao:expirada`. |
| Estado do servidor | Acervo completo mantido em `documentos/acervo.js`. |
| Projeção de leitura | Itens de `PAGINAS` atualizados a partir do acervo confirmado. |
| Estado derivado | Índice reconstruído ao abrir a busca e após `acervo:alterado`. |

A API continua sendo a autoridade de autenticação e autorização. A invalidação visual não substitui a verificação dos papéis no servidor.

Foram adicionados contratos JSDoc e validações dos campos essenciais de resposta. Não se exige TypeScript ou uma biblioteca de schemas para esse volume de dados. A projeção para renderização e o documento completo do servidor têm finalidades diferentes; não foram unidos artificialmente.

## 4. Problemas encontrados

Os itens abaixo preservam a identificação do diagnóstico original. A severidade é a do problema antes da correção; **todos estão tratados nesta refatoração**.

| ID | Arquivos e problema original | Impacto original | Severidade | Correção realizada |
|---|---|---|---|---|
| A | `js/documentos.js`: responsabilidades misturadas e leitura de campos após upload | Mistura de metadados entre formulários; resposta antiga fecha outra janela | Alta | [acervo.js](../js/documentos/acervo.js) captura valores antes de aguardar a rede; [dialogo.js](../js/documentos/dialogo.js) cria DOM e ciclo próprios para cada abertura. |
| B | `js/documentos.js`: `401` não invalidava a sessão local | UI autenticada oferecendo ações recusadas | Média | [api.js](../js/documentos/api.js) emite `sessao:expirada`; o controlador atualiza perfil e ações. `403` não é tratado como expiração. |
| C | `js/busca.js`: algoritmo, índice e interface no mesmo fechamento | Testes de ranking dependiam de contornar a UI | Média | Extraídos [motor.js](../js/busca/motor.js) e [indice.js](../js/busca/indice.js). |
| D | Renderizador, busca e acervo interpretavam seções de formas diferentes | Forma simplificada perdia `chave` e deixava de receber ações de edição | Média | Todos usam [paginas-modelo.js](../js/compartilhado/paginas-modelo.js), preservando referência e metadados sem repetir o título da seção. |
| E | `js/equipe.js`: dados junto da renderização e identificador duplicado | Busca dependia de inicialização visual e de concordância manual dos IDs | Baixa | Dados e `idDaPessoa()` em [equipe-dados.js](../js/equipe-dados.js), consumidos por cards e índice. |
| F | Paleta clara em `:root` e sobrescrita escura global no final do CSS | Alteração em um token podia não afetar a aparência | Média | Tema escuro efetivo e aliases consolidados em [tokens.css](../css/tokens.css), preservando os estilos comparados. |
| G | `[hidden]` e navegação ativa dentro de `pagina.css` | Layout global dependia de CSS apresentado como específico | Baixa | Regras movidas para [styles.css](../css/styles.css). O `!important` de `[hidden]` foi mantido por sua função. |
| H | `decodeURIComponent()` sem tratamento no router | Hash como `#%` interrompia a navegação | Média | [router.js](../js/router.js) aplica fallback para home sem lançar erro. |
| I | Ausência de testes automatizados do frontend | Contratos e fluxo assíncrono sem proteção contra regressões | Média | Testes de lógica, contratos, navegador e comparação de estilos adicionados. |

### Comportamento da gravação e atualização local

Uma janela fechada não cancela uma gravação já enviada. A operação continua usando seu snapshot, mas não pode alterar o DOM de outra abertura. O botão de fechamento passa a indicar “Fechar” durante o envio.

O item retornado pela API após salvar atualiza a projeção local; a exclusão confirmada remove o ID. A confirmação não depende de um GET adicional, evitando apresentar como falha uma gravação concluída apenas porque uma leitura posterior falhou. Uma leitura iniciada antes de uma confirmação não pode sobrescrever esse estado.

Isso não implementa sincronização em tempo real entre usuários nem uma transação entre upload e cadastro no backend. Essas capacidades não foram prometidas pela refatoração.

## 5. Arquivos que deveriam ser separados

**As separações justificadas foram realizadas.** Não há nova divisão obrigatória identificada no recorte revisado.

| Antes | Depois | Justificativa |
|---|---|---|
| `js/documentos.js` | Controlador mais `documentos/api.js`, `acervo.js`, `dialogo.js` e `formularios.js` | Isolar transporte, estado confirmado, apresentação dos campos e ciclo assíncrono da janela. |
| `js/busca.js` | Interface mais `busca/motor.js` e `busca/indice.js` | Testar ranking sem DOM e separar adaptação do conteúdo da interação. |
| `js/equipe.js` | Dados/identidade em `equipe-dados.js`; cards em `equipe.js` | Permitir que a busca consuma pessoas sem executar renderização. |
| `css/styles.css` | Tokens em `tokens.css`; base e layout em `styles.css` | Eliminar fontes concorrentes do tema efetivo. |
| Interpretação repetida das seções | `compartilhado/paginas-modelo.js` | Manter um único contrato de transformação com preservação de metadados. |

`formularios.js` foi acrescentado ao desenho inicial para que o controlador não continuasse acumulando o markup das três telas. Trata-se de uma fronteira da funcionalidade de edição, não de uma biblioteca global de formulários.

## 6. Arquivos que NÃO deveriam ser separados

- **`index.html`:** continua como composição do portal.
- **`js/router.js`:** navegação tem responsabilidade específica e recebeu correção localizada.
- **`js/script.js`:** contém apenas o comportamento do drawer e agora está encapsulado.
- **`js/paginas/*.js`:** arquivos de conteúdo por página; nenhuma necessidade de extrações menores.
- **Renderizadores de `js/paginas.js`:** mantidos juntos por coesão; não há arquivo por tipo de bloco.
- **`css/busca.css`, `css/equipe.css`, `css/edicao.css`:** mantidos por funcionalidade.
- **`app/barra-atualizacao.js`:** componente próprio do preload; o tamanho não justifica alterar sua distribuição.

## 7. Duplicações

| Categoria | Ocorrências anteriores | Decisão implementada |
|---|---|---|
| Lógica | Escape em equipe, páginas e busca | Consolidado em `compartilhado/html.js`, também utilizado nos rótulos de opções vindos da API. |
| Identificação | Slug de pessoa nos cards e no índice | Consolidado em `Portal.equipe.idDaPessoa()`. |
| Transformação | Formas de seção em três consumidores | Consolidado em `paginasModelo.blocosDaSecao()`. |
| Configuração | Paletas e aliases espalhados | Consolidado em `css/tokens.css`. |
| Visual | Backdrop de busca/edição e cor de perigo | Tokens compartilhados; diálogos permanecem distintos. |
| Visual | Cards de home, equipe e painéis | Permanecem separados por diferenças reais de conteúdo e interação. |
| Visual | Fichas de perfil e fabricante | Permanecem separadas; não foi criado componente configurável para dois usos pequenos. |
| Validação/configuração | Extensões e chaves presentes em fronteiras diferentes | Validação do servidor preservada; testes verificam concordância com o frontend. |
| Navegação | Destinos no topo, drawer, rodapé e cards | Markup explícito mantido, proporcional aos quatro destinos atuais. |

Não foram criados hooks, componentes universais de formulário ou um design system de componentes sem necessidade de reutilização.

## 8. Organização recomendada

**A organização recomendada é a estrutura atual mostrada na seção 2.** Não se propõe nova reorganização geral.

A dependência segue dos controladores para módulos da funcionalidade e contratos compartilhados. O motor da busca não conhece a UI; os dados da equipe não renderizam cards; o acervo não manipula DOM; o transporte não chama o controlador diretamente.

Os módulos expõem uma API pequena sob `window.Portal`, preservando scripts clássicos. `PAGINAS`, `renderizarPagina`, `redesenharPagina` e `abrirBusca` mantêm os pontos de integração existentes.

Não há barrels ou imports ES no portal. Não foram identificados ciclos de imports; a ordem necessária dos scripts é explícita no HTML e exercitada pelos testes. Os eventos `pagina:render`, `sessao:expirada` e `acervo:alterado` comunicam renderização e mudanças de estado sem importar detalhes da interface em módulos compartilhados.

Assets, caminhos relativos e a separação entre servidor e Electron permanecem. A distribuição existente já inclui subdiretórios de `js/` e `css/`.

## 9. Plano de refatoração

### P0 — crítico

**Concluído:** corrigida a captura dos valores e a independência entre submissões/janelas. Validação com upload lento, fechamento, reabertura, retorno de sucesso/erro e evento nativo tardio. Não há P0 pendente entre os achados deste relatório.

### P1 — importante

**Concluído:** separações do editor e da busca, invalidação da sessão em `401`, unificação do contrato das seções e testes de regressão. A edição mantém o fallback sem API e trata lista vazia como substituição do conteúdo.

### P2 — melhoria

**Concluído:** tokens consolidados, regras globais relocadas, dados de equipe independentes, escape/identidade compartilhados, fallback de hash malformado e contratos essenciais documentados/validados.

A aparência efetiva foi comparada com a referência anterior. A documentação de equipe, páginas, busca, edição e estilos foi atualizada para apontar aos arquivos corretos.

### P3 — opcional

Decisões mantidas deliberadamente:

- `script.js` não foi renomeado: sua responsabilidade está clara, e renomear não acrescentaria comportamento ou cobertura.
- Fichas visuais e ícones específicos não viraram componentes globais.
- Não foram adicionados temas alternativos, framework, banco de dados ou novas dependências de produção.

Essas decisões não representam pendências de correção.

### Como repetir a validação

### Complemento de melhorias e testes — 07/09/2026

- **Arquivo:** `js/documentos.js`. **Problema:** a exclusão não controlava requisições pendentes por documento. **Impacto:** cliques repetidos podiam enviar exclusões concorrentes e apresentar erros após uma exclusão já confirmada. **Severidade:** média. **Status:** corrigido com estado local por ID, botões desabilitados durante a operação e liberação em `finally`, inclusive após redesenho ou erro. Não foi necessária divisão de arquivos.
- `tests/browser.cjs` agora simula PUT e DELETE e verifica edição sem duplicação, preservação do arquivo existente, bloqueio de exclusões repetidas após redesenho, manutenção do item após erro e nova tentativa bem-sucedida.
- Validação desta rodada: **16 testes de lógica e 10 cenários de navegador aprovados**, com API simulada e dados descartáveis. O executor de navegador contabiliza 11 testes ao incluir o teste pai. A checagem responsiva passou em 360, 900 e 1280 px; a comparação histórica de CSS não foi executada nesta rodada.

### Comandos

```bash
npm test
npm run test:browser
```

Os testes de lógica exigem Node 18+. O helper de navegador utiliza WebSocket nativo e requer Node 22+ com Chrome/Edge instalado; `CHROME_PATH` permite indicar outro executável local.

A comparação histórica de CSS é opcional no teste de navegador: defina `PAJB_BASELINE` para uma pasta contendo os cinco CSS anteriores em `css/`. Sem essa referência, os demais cenários e a verificação responsiva continuam executando, e o teste informa que não comparou a versão anterior.

Não são usados dados reais de autenticação nem arquivos publicados. A integração final contra o backend e o empacotamento Electron continuam fora da validação desta tarefa.

## 10. Veredito final

**O código frontend está bem separado? Sim, de forma adequada ao porte atual do portal, após estas correções.**

A base já possuía boas decisões: conteúdo por página, renderizadores compartilhados, navegação por hash e separação da distribuição Electron. Esses limites foram mantidos.

Foram corrigidos o cruzamento assíncrono entre formulários, a sessão visual desatualizada, o contrato divergente de seções e o parser de hash. Busca, dados de equipe, transporte, acervo e tema agora têm responsabilidades explícitas e cobertura de regressão.

Não há justificativa técnica, no escopo revisado, para ampliar a arquitetura além do que foi implementado.
