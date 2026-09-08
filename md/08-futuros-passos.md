[← Índice](README.md)

# Futuros passos

Este documento é sobre **para onde o projeto pode ir**. O que já está construído mas inacabado fica em [07-pendencias.md](07-pendencias.md) — lá é dívida, aqui é roteiro.

Nada abaixo está decidido. É material para conversa, com o custo e a dependência de cada item explicitados, para que a escolha seja informada e não por ordem de lembrança.

---

## 1. O que destrava o uso real

Enquanto estes pontos não fecharem, o portal não substitui o que a equipe usa hoje. **Nenhum deles é problema técnico** — todos dependem de conteúdo que só a equipe tem. Eram quatro; o dos dados da equipe já fechou.

### Conteúdo das três páginas restantes

Só "Primeiros passos" tem material real. Documentação (que agora abriga os manuais), Acessos Parceria e Sharepoint estão com esqueleto escrito a partir das descrições dos cards.

O caminho é o mesmo já percorrido: alguém escreve o guia em markdown (como o [jotbird-document.md](jotbird-document.md)), e ele é transposto para `js/paginas/<pagina>.js`. Os seis tipos de bloco existentes cobrem bastante coisa — ver [04-paginas-internas.md](04-paginas-internas.md). Se algum conteúdo não couber em nenhum, é sinal de que falta um tipo novo, não de que o conteúdo está errado.

**Ordem sugerida:** Acessos Parceria primeiro (é o que mais gente consulta no dia a dia), depois Documentação (manuais junto) e Sharepoint.

### Destinos reais dos documentos

Cada portal, sistema e biblioteca listado nas páginas aponta para `"#"`, e os itens de Documentação estão como "a definir". São dezenas. Vale levantar de uma vez, numa planilha, e preencher em bloco — é mais rápido que caçar um a um.

Na planilha, separe o que é **endereço** do que é **arquivo**: endereço vira `href` completo, arquivo vai para `docs/` e o `href` é o caminho relativo. O resto (ícone, chip de formato, abrir em outra aba) o renderizador resolve sozinho — ver [04-paginas-internas.md](04-paginas-internas.md).

### Contatos dos fabricantes

Vizrt sem portal/e-mail/telefone, e dois fabricantes ainda chamados "Fabricante 2" e "Fabricante 3". Aparecem como "a definir" na página de propósito. **Não preencha por aproximação** — ver [02-seguranca.md](02-seguranca.md).

### ~~Dados reais da equipe~~ — feito

**Saiu do roteiro.** `js/equipe-dados.js` tem 36 pessoas com nome, cargo, área, e-mail corporativo e foto — nenhum "Pessoa NN", nenhum `@empresa.com`, nenhuma foto faltando. A previsão se confirmou: a página não precisou de mudança nenhuma para absorver, o array mandou e a grade e a contagem se ajustaram sozinhas.

**O que ainda é `"#"` ali é o `perfil`** — o link de Teams/intranet de cada pessoa. Some do card quando não existe, então não é buraco visível; é campo por preencher.

---

## 2. Hospedagem — decidido: VM da Parceria JB

**O portal vai rodar numa máquina virtual de acesso pleno da Parceria JB.** Isso resolve a maior incógnita do projeto e é uma boa escolha: o controle de acesso passa a ser o da rede interna, não uma configuração de plataforma que alguém pode afrouxar sem perceber. Também elimina de vez as opções problemáticas — Sharepoint costuma servir HTML como download em vez de renderizar, e "privado" no GitHub Pages não é a mesma coisa que rede interna.

O que falta agora não é decidir *onde*, é montar. Na ordem:

### 2.1 O servidor da VM — decidido: `servidor/servidor.js`

> **Este item mudou.** Ele descrevia a escolha entre IIS, nginx e Node, porque o portal era só uma pasta de arquivos estáticos. Com a edição pela própria página ([09](09-edicao-pela-pagina.md)), deixou de ser: para "só quem desenvolveu pode excluir" valer de verdade, alguém precisa recusar do lado do servidor. **A VM roda Node.**

```bash
node servidor/servidor.js --porta 80
```

Um processo só serve **o site inteiro e a API de edição**. Não é o `serve` do `pnpm dev` (que é de desenvolvimento e morre com o terminal), nem precisa de IIS/nginx junto — nem de `pnpm install`, já que o servidor não usa nenhuma dependência externa.

O que isso exige da VM, e não exigia antes:

- **subir no boot**, com `nssm` (serviço do Windows) ou `systemd` (Linux). Preso a um terminal, o serviço cai quando a sessão fecha;
- **`servidor/dados/` no backup.** É onde ficam o acervo que a equipe edita e os usuários. Está fora do git de propósito — ver [09](09-edicao-pela-pagina.md);
- **Node ≥ 18 instalado** na VM.

IIS ou nginx continuam podendo entrar **na frente**, como proxy reverso, se a infra preferir concentrar porta 80 e um dia TLS num lugar só. Nesse caso, o cookie de sessão precisa ganhar `Secure` — ver [09](09-edicao-pela-pagina.md).

Se um dia a edição pela página for abandonada, o portal volta a ser uma pasta estática e qualquer um dos três serve sem alteração de código.

### 2.2 Porta 80 e nome

Sirva na porta 80, não na 8000, para que o endereço seja `http://portal-pajb/` e não `http://10.x.x.x:8000`. Isso exige:

- liberar a porta no firewall da VM;
- um registro de DNS interno apontando um nome para o IP da VM.

O nome é o que vai ser colado em e-mail e fixado no navegador de todo mundo. Vale escolher com calma, porque trocar depois quebra os links já espalhados.

### 2.3 Deploy por `git pull`

Como não há build, o deploy é literalmente copiar arquivos. O caminho mais simples e rastreável:

```bash
# na VM, uma vez
git clone <repo> /caminho/do/portal

# a cada atualização
git pull
```

Sem passo de compilação e sem `node_modules` em produção — nem para o servidor, que só usa o `node:` embutido. O histórico do git vira o histórico de deploy, e voltar atrás é um `git checkout`.

**O que o `git pull` não pode tocar:** `servidor/dados/` (o acervo que a equipe edita e os usuários) e os arquivos publicados em `docs/`. O acervo está no `.gitignore` justamente para isso; `docs/` é versionado, então **arquivo enviado pela página precisa ser commitado por quem desenvolve**, ou o `git pull` seguinte não o traz de volta caso a VM seja recriada. Ver [09](09-edicao-pela-pagina.md).

### 2.4 Verificar antes de anunciar

Na primeira subida, confira na VM: o `index.html` abre, o logo carrega, o menu troca de página, o black mode sobrevive ao F5 e o portal responde de **outra** máquina da rede — não só do `localhost` da própria VM. Esse último é o erro clássico: funciona na VM e não funciona para ninguém, por causa de firewall ou de o servidor estar ouvindo só em `127.0.0.1`.

### 2.5 O que a VM muda no projeto

Com servidor HTTP de verdade, a restrição de `file://` **deixa de ser obrigatória** — `fetch()` de arquivo local e `<script type="module">` passariam a funcionar. Isso destrava, entre outras coisas, mover os dados para `.json` de verdade.

**Recomendo não fazer isso agora.** A restrição custa pouco e paga dois benefícios que continuam valendo mesmo com a VM no ar: qualquer pessoa consegue copiar a pasta e abrir o portal sem depender de nada, e a VM sair do ar não impede ninguém de consultar o conteúdo. Se um dia for para abrir mão, que seja uma decisão registrada aqui — não um `import` que alguém escreveu porque funcionou na VM e quebrou no duplo clique.

### 2.6 Segurança da VM

Estar na rede interna é a proteção principal, mas duas coisas continuam valendo: o repositório segue privado (o conteúdo é o mesmo, e o histórico do git guarda tudo) e nada de segredo entra no `js/`, porque tudo que a VM entrega é legível no DevTools de quem acessa. Ver [02-seguranca.md](02-seguranca.md).

---

## 3. Funcionalidade

### ~~Busca~~ — feita

**Saiu do roteiro: existe e está em uso.** O botão "Buscar" do header e do drawer abre uma busca sobre todo o conteúdo do portal, e a previsão se confirmou — **a arquitetura entregou a busca quase de graça**: `PAGINAS` e `equipe` já estavam em memória, então não houve índice para construir, backend para consultar nem biblioteca para instalar. Continua funcionando com o portal aberto por duplo clique.

Documentação em [11-busca.md](11-busca.md). O que ficou de fora está listado lá, no fim.

### Filtro por área na equipe

`data-area` já está em cada card, exatamente para isso. Com 36 pessoas a grade já é longa; com filtro por Captação / MAM / Integração / Grafismo / Gestão / INEWS / JCORP fica navegável.

**Duas coisas que faltavam já entraram:** os dados reais da equipe e a grafia única das áreas (a mesma área vinha escrita de até três formas, o que teria gerado 11 grupos onde há 7 — ver [05-equipe.md](05-equipe.md)). A busca também já acha pessoa por área; o que falta é o filtro na própria grade, que é outro gesto: varrer versus reduzir.

### Notificações e Perfil

Notificações continua decorativo; Perfil ganhou função com a edição pela página. Diferente do que foi a busca, **estes precisam de decisão antes de código**: notificação de quê, vinda de onde? Perfil de quem, com que login? Sem backend nem autenticação, provavelmente não têm resposta hoje. A alternativa honesta é removê-los até que tenham — botão que não faz nada ensina o usuário a não clicar.

### Tema seguindo o sistema

Na primeira visita o portal sempre abre claro, mesmo para quem usa o Windows em modo escuro. Respeitar `prefers-color-scheme` quando não houver nada salvo em `localStorage` é uma mudança pequena e localizada em `js/script.js` e no script inline do `index.html`.

---

## 4. Sustentação

Itens que não aparecem para o usuário, mas evitam retrabalho.

### Backend e empacotamento — quatro itens da auditoria

**Registrados, sem implementação.** Detalhe e linha de código em [auditoria-estrutura-backend.md](auditoria-estrutura-backend.md#recomendações-futuras); o resumo em uma linha está em [07-pendencias.md](07-pendencias.md).

1. ~~**Corrigir o lançamento do build.**~~ **Feito** — `app/empacotar.js` chama o CLI pelo `process.execPath`, sem shell; `npm run app:build` volta a gerar instalador.
2. ~~**Revogar sessões entre processos.**~~ **Feito** — `sessaoDe` compara o salt do disco com o do login, então trocar a senha ou remover o usuário pela CLI derruba a sessão na requisição seguinte.
3. ~~**Ampliar os testes reais do backend.**~~ **Feito** — `tests/unit/backend.test.cjs`, 7 cenários contra uma raiz falsa em `%TEMP%`. Fica de fora o upload/edição/exclusão pela API e a CLI `usuarios.js`.
4. **Revisar proteção de arquivos e atualizações.** ~~Estático~~ (virou lista de permitidos) e ~~arquivo órfão em `docs/`~~ (já documentado) fechados. **Falta o `ORIGEM`**, que casa com a subida da VM (seção 2) porque depende de decidir HTTPS ou assinatura.

**Restou uma decisão sua, não uma tarefa:** HTTPS ou assinatura de código, para o `ORIGEM` poder ser preenchido.

### Um `pnpm check`

Duas fragilidades conhecidas não dão erro no console quando quebram:

1. A ordem dos `<script>` em `index.html` (`paginas.js` → `js/paginas/*.js` → `router.js`). Fora de ordem, a página some do menu em silêncio.
2. Um arquivo criado em `js/paginas/` e esquecido no `index.html` — mesmo sintoma.

Um script que rode `node --check` em todos os `.js` e confira se cada arquivo de `js/paginas/` aparece no `index.html` na posição certa resolve os dois. É pequeno, roda offline e **não vira build** — só um verificador que a pessoa chama quando quer.

### Sincronia entre o markdown e o `.js`

Hoje `jotbird-document.md` e `primeiros-passos.js` são cópias manuais um do outro, e nada avisa quando divergem. Duas saídas:

- **Aceitar e documentar** (situação atual). Simples, mas confia em disciplina.
- **Gerar o `.js` a partir do `.md`** com um script offline. Elimina a divergência, mas exige um dialeto restrito de markdown que mapeie nos tipos de bloco — e passa a ser mais uma peça para manter. Só vale se o número de páginas com fonte em markdown crescer.

Com uma página, o custo do gerador não se paga. Com quatro ou cinco, provavelmente sim.

### Fonte Inter

Hoje declarada mas nunca carregada — na prática todo mundo vê Segoe UI, e os pesos 650 arredondam para 700. Para valer, é preciso versionar o arquivo da fonte no projeto e declarar um `@font-face` local. CDN não serve: quebra em `file://` e depende de rede externa.

### Auditoria de acessibilidade com leitor de tela

O projeto segue as práticas certas — `aria-current`, foco no `<h1>` a cada troca de página, foco preso no drawer, `prefers-reduced-motion`. Mas nada disso foi testado com NVDA ou Narrador de verdade. A troca de view sem recarregar o documento é justamente o caso em que a teoria mais costuma divergir da prática.

---

## 5. O que não fazer

Restrições que sustentam as decisões já tomadas. Quebrar qualquer uma exige decisão consciente, não descuido:

- **Não usar `<script type="module">` nem `fetch()` de arquivo local.** Os dois são bloqueados em `file://`, e é por isso que os dados são `.js` e não `.json`.
- **Não introduzir framework ou bundler** sem antes decidir que `file://` deixou de importar. Ver a seção 2.
- **Não desfazer as regras `:nth-child` dos cards num breakpoint menor.** Não funciona — `:nth-child` tem especificidade maior e media query não conta. Ver [03-home.md](03-home.md).
- **Não inventar contato de fabricante nem dado de pessoa.** Vazio é informação; errado é armadilha.
- **Não tornar o repositório público.** Ver [02-seguranca.md](02-seguranca.md).
- **Não espalhar cor fixa pelo CSS.** Tudo passa pelos tokens, senão some num dos dois temas. Ver [06-estilos-e-tema.md](06-estilos-e-tema.md).

---

## Como priorizar

Com a VM definida e a busca feita, o caminho fica: **subir a VM (2) → conteúdo real (1) → filtro por área (3) → sustentação (4)**.

A VM primeiro porque é rápida — não há build, é `git clone` e apontar um servidor estático para a pasta — e porque muda o projeto de "roda na minha máquina" para "tem endereço". Um portal com endereço e conteúdo pela metade já é útil e já rende correção de quem usa; um portal completo que ninguém consegue abrir não rende nada.

Conteúdo em seguida, porque é o gargalo real e não depende de mais nenhuma decisão técnica — e agora rende o dobro: cada item preenchido passa a ser achável pela busca no mesmo instante, sem nenhum passo a mais. E a sustentação vem por último não por ser menos importante, mas porque protege um investimento que ainda não foi feito.
