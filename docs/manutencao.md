# Guia de Manutenção

Este guia descreve o código inspecionado em 08/09/2026. Use-o para localizar consumidores e planejar validações antes de mudar um contrato. As auditorias em `md/` também contêm histórico e propostas; não são todas descrições do estado atual.

## Visão geral da arquitetura

O portal não usa framework, bundler ou ORM. Há três modos de execução:

| Modo | Entrada | Conteúdo e edição |
| --- | --- | --- |
| Arquivo local | `index.html` em `file://` | Dados dos scripts; sem API e sem edição |
| HTTP estático | `npm start` / `npm run dev` (`serve`) | Mesma semente; API indisponível |
| HTTP com backend | `npm run servidor` | Leitura pública do acervo; escrita autenticada |
| Aplicativo Windows | `npm run app` / instalador | Electron abre `index.html` em `file://`; não inicia backend |

O Electron é outra distribuição do modo local, não uma cópia sincronizada do acervo HTTP. Editar documentos na VM não atualiza os scripts incluídos no instalador.

### Mapa de responsabilidades

| Local | Responsabilidade e consumidores |
| --- | --- |
| `index.html` | Home, navegação e ordem dos scripts; IDs utilizados pelo router, equipe e drawer |
| `css/` | `tokens.css` define o tema; `styles.css` define base/layout; `pagina`, `equipe`, `edicao` e `busca` atendem o markup dos módulos correspondentes |
| `js/compartilhado/` | Namespace `Portal`, escape HTML e adaptação de seções; consumidos por renderização, busca e edição |
| `js/paginas.js`, `js/paginas/` | Registro `PAGINAS`, dados e geração de HTML das páginas internas |
| `js/router.js` | Rotas por hash, views, título da aba, foco e evento de renderização |
| `js/equipe-dados.js`, `js/equipe.js` | Cadastro/identidade e cards, fotos, contatos e fallback de cópia de e-mail |
| `js/busca/`, `js/busca.js` | Índice em memória, ranking, destaque seguro e diálogo de busca |
| `js/documentos/`, `js/documentos.js` | Transporte HTTP, acervo local, diálogos, formulários e integração da edição |
| `js/script.js` | Drawer e teclado; não controla tema |
| `servidor/servidor.js` | Entrada HTTP, roteamento, autorização, leitura dos corpos, upload e arquivos estáticos |
| `servidor/dados.js` | Validação e persistência do acervo; reúne papéis de serviço e repositório |
| `servidor/auth.js`, `servidor/usuarios.js` | Cadastro, scrypt, sessões, permissões e administração por CLI |
| `app/` | Processo principal, preload, atualização, empacotamento, manifesto e teste de atualização |
| `ferramentas/` | Geração de fotos WebP e ícone ICO com ffmpeg; altera arquivos de saída |
| `publicacao/` | Modelo de notas/URL de download e instruções de publicação |
| `tests/` | Testes Node, simulação de ambiente e navegador real via CDP |
| `Fotos/`, `docs/` | Recursos visuais e documentos; `docs/` também contém estes guias |
| `md/`, `README.md` | Documentação temática, referência de conteúdo e auditorias |
| `.claude/` | Configuração e driver de desenvolvimento; não integra o runtime do portal |

Não há controllers separados, entities, schemas de ORM, DTOs em classes, migrations, hooks React, contextos, filas, jobs ou cache distribuído. Os contratos são objetos JavaScript, validações manuais e atributos/eventos DOM. A API mantém suas camadas em poucos arquivos; não procurar estruturas de framework inexistentes.

## Fluxos principais

### Carregamento e navegação

1. `index.html` carrega CSS e scripts clássicos, sem `async` ou módulos ES.
2. `html.js` cria `window.Portal`; `paginas-modelo.js` fornece `blocosDaSecao`.
3. O cadastro da equipe precede seus cards e o índice de busca.
4. `paginas.js` cria `window.PAGINAS`; cada arquivo em `js/paginas/` registra sua chave.
5. O router renderiza a rota inicial; busca e edição inicializam depois.
6. Em `hashchange`, o router troca o conteúdo de `#view-pagina`, visibilidade, título e foco. `pagina:render` ocorre depois de gerar o DOM.

As rotas atuais são `#primeiros-passos`, `#documentacao`, `#acessos-parceria` e `#sharepoint`. `#manuais` é apelido de `#documentacao`; hashes desconhecidos caem na home. Links antigos dependem desse apelido. Nova página exige registro, inclusão do script e revisão de links nos menus/cards/rodapé.

`redesenharPagina()` atualiza a mesma página sem forçar foco ou scroll. Não substituir por navegação após salvar: o usuário pode estar em outra posição ou com uma busca aberta.

### Leitura e edição

```text
Formulário da instância do diálogo
  → snapshot em formularios.js
  → acervo.salvar / excluir
  → documentos/api.js (fetch na mesma origem)
  → servidor.js: rota → auth.exigir → leitura do body
  → dados.js: validação → leitura/modificação/escrita JSON
  → confirmação {item} ou {ok}
  → projeção em PAGINAS → router → pagina:render
  → acervo:alterado → índice da busca aberta
```

`GET /api/documentos` bem-sucedido substitui as listas editáveis da semente, inclusive por listas vazias. Não restaurar sementes ao excluir o último item. Se a primeira carga falhar, o frontend mantém o conteúdo estático e não liga o Perfil. Em `file://`, `documentos.js` sai antes de consultar a API.

O upload ocorre antes do POST/PUT dos metadados. Não existe transação entre as duas requisições. Fechar o diálogo não cancela a operação enviada; a confirmação ainda deve atualizar o acervo. O diálogo anterior não pode ler campos, fechar ou exibir erros na nova instância.

`acervo.js` usa revisão para descartar GET antigo após uma leitura mais recente ou escrita confirmada. Isso não é controle de concorrência entre usuários no servidor. `documentos.js` bloqueia exclusões por id para sobreviver ao redesenho dos botões.

### Busca e equipe

O índice usa `PAGINAS` e `Portal.equipe.pessoas`, sem serviço externo. É reconstruído ao abrir a busca e após `acervo:alterado` enquanto ela está aberta. Todos os termos devem corresponder; pesos priorizam título e início de palavra. `motor.destacar` retorna HTML escapado com marcas geradas localmente.

`idDaPessoa(nome)` é usado nos cards e em `alvoId` no índice. Nomes que normalizam para o mesmo identificador causam colisão; os testes unitários verificam a unicidade dos dados atuais. Renomear uma pessoa muda sua âncora.

Links externos/documentos abrem separadamente. Resultados de pessoa voltam à home e realçam o card depois que o router processa o hash. Busca e drawer precisam preservar a coordenação de teclado/foco quando um `dialog` está aberto.

### Aplicativo e atualização

`app/principal.js` carrega o site com isolamento de contexto, sandbox e Node desabilitado no renderer. O preload `barra-atualizacao.js` usa IPC sem expor uma API global ao JavaScript da página. O processo principal mantém o manifesto disponível e escolhe o destino da instalação.

`atualizacao.js` consulta `versao.json`, valida versão/URL/hash/tamanho, baixa para `.parcial`, verifica tamanho e SHA-256 e só então renomeia para `.exe`. `instalar()` inicia um processo separado e agenda a saída do aplicativo. Não executar essa etapa como teste automatizado de documentação.

Para publicação: atualizar a versão numérica do pacote, gerar instalador com `app:build`, editar notas/URL em `publicacao/versao.json` e gerar `dist/versao.json` com `app:manifesto`. Publicar o instalador antes do manifesto. O modelo em `publicacao/` não é o manifesto final a distribuir.

## Dependências críticas

| Alteração pretendida | Revisar em conjunto |
| --- | --- |
| Tipo/campos de bloco | `paginas.js`, `paginas-modelo.js`, `busca/indice.js`, `busca.js` (`ROTULOS`) e dados das páginas |
| Chave de bloco editável | `servidor/dados.js` (`BLOCOS`), `paginas/documentacao.js`, `documentos/acervo.js` e registros persistidos |
| Identificação do item no HTML | `paginas.js` (`data-bloco`, `data-item-id`), decoração em `documentos.js`, CSS de edição e testes |
| Papel de usuário | `auth.js`, permissões em `servidor.js`, `documentos/api.js`, ações em `documentos.js` e textos de `formularios.js`/CLI |
| Extensão de arquivo | `dados.js` (`EXTENSOES`), `acervo.js` (`ACEITOS`), `paginas.js` (chips), `principal.js` (`ABRIVEIS`) e MIME em `servidor.js` |
| Limites do formulário | `dados.js` (`LIMITES`) e `formularios.js` (`maxlength`); limites do body em `servidor.js` |
| Identidade de pessoa | `equipe-dados.js`, `equipe.js`, `busca/indice.js` e teste de unicidade |
| Estrutura visual | Markup em HTML/renderizadores, seletores em CSS e testes de navegador; `hidden` deve prevalecer sobre flex/grid |
| Versão/instalador | `package.json`, `electron-builder.yml`, `manifesto.js`, `atualizacao.js` e `teste-atualizacao.js` |
| Identidade Windows | `setAppUserModelId` em `principal.js` e `appId` em `electron-builder.yml` |
| Pasta/asset novo | Inclusão de scripts em `index.html`, allowlist do pacote e bloqueio de arquivos HTTP em `servidor.js` |

`blocosDaSecao` retorna referências originais tanto para `{tipo, itens}` quanto para `{blocos: [...]}`. Não clonar sem revisar a projeção: o editor precisa alterar os mesmos objetos que renderização e busca leem.

## Contratos frontend/backend

### API HTTP

| Método e rota | Entrada | Saída / autorização |
| --- | --- | --- |
| GET `/api/sessao` | Cookie | `{autenticado:false}` ou `{autenticado:true,nome,login,papel}` |
| POST `/api/sessao` | JSON `{login,senha}` | Sessão autenticada e Set-Cookie |
| DELETE `/api/sessao` | Cookie | `{autenticado:false}` e expiração do cookie |
| GET `/api/documentos` | Nenhuma | `{itens:[],blocos:[{chave,rotulo}]}`; leitura aberta |
| POST `/api/documentos` | Campos editáveis completos | `201 {item}`; equipe/dev |
| PUT `/api/documentos/:id` | Campos editáveis completos | `200 {item}`; equipe/dev |
| DELETE `/api/documentos/:id` | Nenhuma | `{ok:true}`; somente dev |
| POST `/api/arquivos?nome=...&substituir=1` | Bytes crus, sem multipart; substituição opcional | `201 {href,nome}`; equipe/dev |

Campos editáveis: `bloco`, `titulo`, `descricao`, `href`, `formato`. O PUT não é parcial: omitir campos pode limpar opcionais ou causar rejeição. `id`, `ordem`, `criadoPor`, `criadoEm`, `atualizadoPor`, `atualizadoEm` são definidos/preservados no backend, não confiados ao body.

`titulo`: obrigatório, até 120 caracteres; `descricao`: até 200; `href`: até 500. O backend normaliza espaços nos textos. `href` vazio representa pendência; são aceitos http(s) e caminhos planos `docs/...` conforme a validação. Escape HTML não substitui validação de protocolo. Os dados estáticos dos scripts não passam automaticamente pela validação do backend.

Corpos JSON têm limite de 64 KiB; arquivos, 25 MiB. Extensões aceitas: pdf, doc, docx, xls, xlsx, ppt e pptx. A validação de upload é de nome/extensão e tamanho, não inspeção do conteúdo nem antivírus. O nome é normalizado e pode receber sufixo; o consumidor deve usar o `href` retornado, não reconstruí-lo do nome original.

Erros conhecidos de auth/dados retornam `{erro: string}` com status 4xx; inesperados retornam mensagem genérica e log no servidor. O cliente exige JSON: uma página HTML retornada por servidor estático não pode ser interpretada como acervo válido. `401` emite `sessao:expirada`; `403` não deve deslogar quem apenas não tem permissão.

### Eventos DOM e IPC

| Contrato | Produtor → consumidor |
| --- | --- |
| `pagina:render`, `detail: {chave}` | router → decoração dos documentos |
| `acervo:alterado` | integração dos documentos → busca aberta |
| `sessao:expirada` | cliente HTTP em 401 → integração/perfil |
| `atualizacao:disponivel` | processo principal → preload |
| `atualizacao:pendente` | preload consulta → principal retorna manifesto disponível ou null |
| `atualizacao:instalar` | preload solicita → principal retorna `{ok,mensagem?}` |
| `atualizacao:progresso` | principal → preload; 0–100 ou -1 para indeterminado |
| `atualizacao:abrir-pagina` | preload → principal abre a página guardada no manifesto |

## Pontos sensíveis

- **Sessões:** tokens opacos, sem JWT, mantidos por 12 horas no `Map` de um processo. Reiniciar desloga todos. Os dados da sessão são um snapshot; mudanças no JSON de usuários não são relidas por `sessaoDe`.
- **Revogação pela CLI:** remover usuário chama a limpeza do Map da própria CLI, não do servidor em execução. A mensagem atual da CLI sugere revogação imediata, mas não há IPC entre esses processos. Trocar senha também preserva sessões. Para revogar imediatamente no fluxo atual, reiniciar o serviço.
- **Cookie e hospedagem:** `pajb_sessao`, Path=/, HttpOnly, SameSite=Strict, sem Secure. Não há token CSRF nem validação explícita de Origin. Revisar o conjunto ao mudar rede, subdomínios, HTTPS ou política de origem. HttpOnly não neutraliza XSS.
- **Tentativas de login:** controle em memória por login, cinco erros e bloqueio de cinco minutos. Não é rate limit por IP ou compartilhado entre instâncias.
- **Arquivos públicos:** o servidor bloqueia alguns caminhos após resolver a URL; não usa allowlist pública. Comparações textuais da lista merecem revisão em sistemas com filesystem sem distinção de caixa, como Windows. Não há resolução explícita de symlinks/junctions. Novas pastas não ficam privadas por estarem no `.gitignore`.
- **Guias e pacote:** `docs/manutencao.md` é acessível pelo servidor e incluído pelo padrão `docs/**/*` do Electron. Não colocar credenciais, dumps ou dados operacionais sensíveis aqui. A allowlist do pacote exclui `servidor/`, mas inclui documentos existentes em `docs/`.
- **Atualização:** validar a origem inicial da URL e conferir SHA-256 não autentica um manifesto entregue por HTTP. A verificação atual não revalida explicitamente a origem final após redirects. O timeout de fetch termina nos cabeçalhos; não limita a leitura inteira do body. Cache por versão reaproveita `.exe` existente sem recalcular hash. Não republicar outra compilação sob a mesma versão.
- **Build:** `%TEMP%/pajb-build` é uma oficina fixa, apagada no início. Não rodar builds simultâneos nem usá-la para arquivos manuais. O workaround existe para evitar locks de sincronização durante a montagem.
- **Build em caminho com espaços:** a execução nesta revisão falhou antes de iniciar electron-builder. `spawnSync(builder, ..., {shell:true})` recebeu o caminho da CLI dentro de `DEV PAJB`, e o shell tentou executar apenas o trecho anterior ao espaço. Registrado em `app/empacotar.js`; não corrigido nesta tarefa.
- **Fotos:** `migrarMasters()` também move WebP quando não há original com o mesmo nome. A extensão não distingue master de saída. Arquivos com o mesmo nome-base e extensões diferentes produzem o mesmo destino WebP.
- **Contatos:** a detecção do cliente de e-mail usa foco/visibilidade como heurística, não confirmação do sistema operacional; a cópia usa `execCommand` como fallback legado. A CLI oculta senha com `_writeToOutput`, API privada do readline.
- **Conteúdo pendente:** alguns links de Acessos/Sharepoint ainda são `#`, portanto navegam à home; não há integração Graph/SSO implementada. Globo Service é acessado por links, sem sincronização ou autenticação delegada no portal. `md/jotbird-document.md` e Primeiros passos não têm geração automática e podem divergir.
- **Documentação histórica:** há referências antigas a black mode/localStorage em arquivos de `md/` e comentários do aplicativo. O runtime atual tem tema fixo em `css/tokens.css`, sem alternância ou persistência de tema em `js/script.js`. Conferir o código antes de aplicar instruções antigas.

Esses riscos foram registrados, sem correção funcional nesta tarefa. A presença de um comentário preventivo não comprova que o comportamento já esteja protegido por teste.

## Banco de dados

Não há banco relacional, migrations, índices, constraints ou cascades. A persistência fica em:

- `servidor/dados/documentos.json`: `{itens:[...]}` com os campos de documento e auditoria descritos acima.
- `servidor/dados/usuarios.json`: `{usuarios:[...]}` com login, nome, papel, salt/hash scrypt e criação. Não copiar valores desse arquivo para documentação, testes ou logs.
- `docs/`: arquivos referenciados por `href`; múltiplos itens podem apontar para o mesmo arquivo.

`bloco` é uma relação lógica com `BLOCOS`. `criadoPor` e `atualizadoPor` são logins de auditoria, sem chave estrangeira: excluir usuário não apaga documentos. `ordem` é atribuída dentro do bloco; ao mover um item ele vai ao final do destino. `listar()` ordena numericamente e o frontend agrupa por bloco.

Excluir documento remove apenas seu registro, preservando arquivos. Substituir arquivo pode afetar todos os registros com aquele href. Não automatizar limpeza de órfãos sem procurar referências no JSON e nos scripts estáticos.

Gravações usam arquivo temporário e rename, sem lock entre processos e sem transação envolvendo uploads. O IO síncrono serializa operações apenas no processo atual. JSON malformado não deve virar silenciosamente uma lista vazia: ausência de arquivo é o caso de primeira execução; corrupção deve ser investigada.

Backup deve abranger `servidor/dados/` e `docs/` de forma consistente, com o serviço parado ou escritas suspensas. Git não substitui esse backup. Validar restauração em uma cópia isolada antes de mexer na produção; as sessões não são restauradas porque vivem em memória.

## Configuração

| Configuração | Consumidor e efeito |
| --- | --- |
| `PORTA` / `--porta` | `servidor.js`; argumento vence ambiente, padrão 8000. Serviço escuta sem host explícito |
| `.env.example` | Modelo comentado; nenhum módulo carrega `.env` automaticamente |
| `PAJB_ORIGEM` | `atualizacao.js`, somente em desenvolvimento e lida ao carregar o módulo |
| `ORIGEM_PADRAO` | `atualizacao.js`; vazia desliga consulta de atualização; produção ignora PAJB_ORIGEM |
| `CHROME_PATH` | `tests/helpers/navegador.cjs`; caminho do Chrome/Edge |
| `CHROME` | Driver em `.claude/skills/run-pa-jb-portal/driver.mjs`; variável diferente da suíte |
| `PAJB_BASELINE` | `tests/browser.cjs`; diretório de referência para comparação opcional de CSS |
| `ELECTRON_RUN_AS_NODE` | Afeta o runtime Electron; quando herdada do terminal pode impedir os scripts do app de iniciar corretamente |
| `package.json` | Scripts, versão e dependências de desenvolvimento; Node >=18 declarado |
| `electron-builder.yml` | NSIS, appId, arquivos incluídos/excluídos, asar desabilitado e identidade do instalador |

Testes de navegador/driver exigem Node 22+ por usarem WebSocket nativo. Ferramentas de imagem exigem ffmpeg no PATH. Não executar `fotos` ou `icone` como validação de comentários: são geradores que alteram assets. Fontes são declaradas em CSS com fallbacks; não há integração de autenticação ou serviço remoto de fontes implementada em JavaScript.

`npm start` serve a pasta por um servidor genérico; não aplica os bloqueios de `servidor.js` e não deve ser tratado como equivalente à hospedagem com API. Em produção, revisar exposição HTTP e os arquivos efetivamente incluídos no instalador.

## Antes de alterar

- [ ] Identifiquei os consumidores do símbolo, campo, seletor ou evento.
- [ ] Verifiquei contratos frontend/backend e respostas de erro.
- [ ] Verifiquei impacto nos JSON persistidos e nas referências de arquivos.
- [ ] Verifiquei autenticação, permissões e revogação de sessões.
- [ ] Verifiquei integrações externas, abertura de documentos e IPC.
- [ ] Preservei `file://`, ordem dos scripts e navegação por hash.
- [ ] Executei lint, se houver configuração; caso contrário registrei a ausência.
- [ ] Executei typecheck, se houver; não confundi JSDoc com checagem automática.
- [ ] Executei testes unitários e de navegador aplicáveis.
- [ ] Executei build do aplicativo quando aplicável e conferi seu conteúdo.
- [ ] Testei o fluxo afetado e os caminhos de falha, teclado e telas estreitas.
- [ ] Revisei o diff, inclusive mudanças anteriores que não pertencem à tarefa.
- [ ] Para mudança de dados, tenho backup e procedimento de restauração validado.

### Como validar

| Comando | Cobertura / limite |
| --- | --- |
| `npm test` | Conteúdo, escape, contratos de blocos/extensões, busca e estado/concorrência do cliente de documentos |
| `npm run test:browser` | file://, HTTP sem API, edição com API simulada, diálogo, busca, foco e responsividade |
| `npm run app:teste` | Manifesto e downloads com servidor local e bytes fictícios; não executa instalador |
| `npm run app:build` | Gera instalador Windows em dist; não publica nem instala |
| `node --check caminho.js` | Sintaxe JavaScript; não substitui lint ou testes |
| `git diff --check` | Whitespace; não prova equivalência funcional |

Não existem scripts de lint, typecheck ou build web no pacote atual. O build disponível é `app:build`. Os testes Node/Chrome não cobrem autenticação e CRUD reais de ponta a ponta: o teste de contrato importa constantes do backend, mas a API do navegador é simulada. Para mudar servidor/auth/dados, testar numa cópia isolada com JSON e uploads descartáveis; nunca usar contas ou arquivos de produção como fixture.

Uma mudança apenas documental deve preservar a estrutura executável do JavaScript e o conteúdo de CSS/HTML, além de passar pelos testes existentes. Comparar com a cópia do início da tarefa evita atribuir alterações anteriores ao trabalho atual.

## Recomendações futuras

Tratar em tarefas separadas: lançamento do build em caminhos com espaços; revogação efetiva de sessões entre processos; cobertura automatizada do backend real; política de arquivos públicos; proteção e timeouts da atualização; centralização de limites/extensões; tratamento de uploads órfãos; atualização dos textos históricos; preenchimento e revisão de links corporativos. Nenhuma dessas melhorias faz parte da documentação inline.

## Validação da revisão documental — 08/09/2026

| Verificação | Resultado |
| --- | --- |
| Lint | Não configurado no package.json |
| Typecheck | Não configurado; projeto JavaScript sem compilador de tipos |
| `npm test` | 16 testes passaram |
| `npm run test:browser` | 12 testes passaram, incluindo o teste agregador; comparação histórica opcional não executada |
| `npm run app:teste` | 32 verificações passaram; sem executar instalador |
| `npm run app:build` | Falhou no caminho com espaços antes de iniciar electron-builder; nenhum instalador gerado nesta execução |
| Equivalência JavaScript | AST dos 37 arquivos JS/CJS/MJS comparada com cópia do início da tarefa; sem mudanças executáveis |
| CSS e HTML | Seis CSS idênticos; HTML equivalente removendo comentários e suas quebras de linha |
| Configuração de runtime | package.json e electron-builder.yml preservados |
| Diff | Revisão contra cópia inicial, preservando mudanças anteriores; git diff --check sem erro |

Os testes que iniciam Chrome/Electron foram executados fora do sandbox. A única alteração de regra fora da documentação foi a exceção `!docs/manutencao.md` no `.gitignore`, necessária para versionar este guia sem incluir documentos enviados pela equipe.

### Arquivos que receberam comentários nesta revisão

- Entrada e configuração: `index.html`, `.env.example`, `.gitignore`.
- Frontend: `js/documentos.js`, `js/documentos/api.js`, `js/documentos/acervo.js`, `js/documentos/dialogo.js`, `js/documentos/formularios.js`, `js/compartilhado/paginas-modelo.js`, `js/equipe-dados.js`, `js/busca.js`, `js/busca/indice.js`, `js/busca/motor.js`, `js/router.js`, `js/paginas.js`, `js/paginas/documentacao.js`.
- Backend: `servidor/auth.js`, `servidor/dados.js`, `servidor/servidor.js`, `servidor/usuarios.js`.
- Aplicativo e ferramentas: `app/atualizacao.js`, `app/principal.js`, `app/empacotar.js`, `app/manifesto.js`, `ferramentas/otimizar-fotos.js`.
- Testes: `tests/helpers/portal.cjs`, `tests/browser.cjs`.

Além deste guia, `README.md` e `md/README.md` receberam links de entrada. Arquivos com explicações já suficientes foram analisados e preservados; não houve adição de comentários por quantidade.
