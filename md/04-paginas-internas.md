[← Índice](README.md)

# Páginas internas

**Não existe um HTML por página.** Há um `index.html` só. Cada item do menu tem um arquivo de **dados** em `js/paginas/`, e o conteúdo é montado na hora dentro de `#view-pagina`:

| Item do menu | Endereço | Arquivo de conteúdo |
|---|---|---|
| Primeiros passos | `index.html#primeiros-passos` | `js/paginas/primeiros-passos.js` |
| Documentação | `index.html#documentacao` | `js/paginas/documentacao.js` |
| Acessos Parceria | `index.html#acessos-parceria` | `js/paginas/acessos-parceria.js` |
| Sharepoint | `index.html#sharepoint` | `js/paginas/sharepoint.js` |

**Manuais não é mais uma página.** O conteúdo virou as seções "Manuais por área" e "Como usar um manual" dentro de Documentação: quem procura "como se faz" e quem procura "qual é a regra" chegam pelo mesmo lugar. `index.html#manuais` continua funcionando — `router.js` tem um mapa de `APELIDOS` que traduz o hash antigo para `documentacao`, para que link já compartilhado não caia na home sem explicação.

**Por que assim, e não um HTML por página.** Sem build não existe include de HTML: um arquivo por página significaria uma cópia do header em cada, e qualquer ajuste no menu teria de ser repetido em todas. Aqui o header existe uma vez só. É a mesma escolha já feita no `equipe.js` — conteúdo em `.js`, layout em um lugar só — estendida para o resto do portal.

**Por que hash e não `/documentacao`.** A página é aberta direto do disco (`file://`) e não há servidor para responder por uma rota. Com hash, o link continua colável, o botão voltar do navegador funciona e nada disso depende de configuração.

## Como funciona

Ordem de carregamento no fim do `index.html` — **importa**:

```html
<script src="js/compartilhado/html.js"></script>
<script src="js/compartilhado/paginas-modelo.js"></script>
<script src="js/paginas.js"></script>          <!-- cria PAGINAS e o renderizador -->
<script src="js/paginas/primeiros-passos.js"></script>   <!-- cada um se registra -->
<!-- ...demais páginas... -->
<script src="js/router.js"></script>           <!-- só então lê o hash e desenha -->
```

- **`js/paginas.js`** — cria `PAGINAS`, guarda os ícones e converte os dados em markup. Roda dentro de uma IIFE e reutiliza o escape HTML e o contrato de seções em `js/compartilhado/`. Só `PAGINAS` e `renderizarPagina` saem de lá.
- **`js/paginas/*.js`** — só dados. Um objeto por arquivo, nenhuma linha de HTML.
- **`js/router.js`** — lê `location.hash`, troca as views, marca o item ativo com `aria-current="page"`, atualiza o título da aba e joga o foco no `<h1>` da página nova (sem recarregar o documento, o leitor de tela não perceberia a troca). Hash desconhecido ou malformado cai na home, sem interromper a navegação.

## Como editar uma página

Abra o arquivo dela em `js/paginas/` e mexa só nos dados. A página inteira é um objeto:

```js
PAGINAS['documentacao'] = {
  titulo:    'Documentação',           // <h1> e título da aba
  eyebrow:   'Central de conteúdo',    // rótulo pequeno acima do <h1>
  descricao: 'Consulte processos...',  // parágrafo de abertura
  secoes:    [ /* ... */ ],
  aviso:     'Conteúdo em construção'  // OPCIONAL, bloco tracejado no fim
};
```

Cada seção tem `titulo`, `texto` opcional e um ou mais blocos de conteúdo.

Com **um bloco só**, declare `tipo` e `itens` direto na seção:

```js
{ titulo: 'Categorias', tipo: 'paineis', itens: [ ... ] }
```

Com **vários**, use `blocos` — cada um pode ter `titulo` próprio, que vira um rótulo em caixa alta (não um heading, para não abrir um nível entre o `h2` da seção e os `h3` dos itens):

```js
{ titulo: '2. Acesso a sistemas', blocos: [
    { tipo: 'passos',   itens: [ ... ] },
    { tipo: 'sistemas', titulo: 'Sistemas mais utilizados', itens: [ ... ] },
    { tipo: 'notas',    titulo: 'Informações importantes',  itens: [ ... ] }
]}
```

## Tipos de bloco

| `tipo` | Campos de cada item | Vira |
|---|---|---|
| `paineis` | `titulo`, `texto`, `meta?`, `href?` | Grade de blocos. Com `href` o bloco vira card clicável; sem, fica estático. |
| `passos` | `titulo`, `texto`, `destaque?` | Lista numerada — a numeração é do CSS, não digite "1.". `destaque` desenha a faixa azul dentro do passo (caminho de menu, nome de categoria). |
| `links` | `titulo`, `descricao?`, `href?`, `formato?`, `icone?` | Lista com ícone à esquerda e seta à direita. Serve tanto para endereço quanto para arquivo DOC/PDF — ver abaixo. |
| `atalhos` | `titulo`, `descricao?`, `href?`, `icone?`, `categoria?` | Os mesmos itens de `links` em grade de cards, com busca, grade/lista, favorito e "Mostrar mais" — ver abaixo. |
| `notas` | strings simples, não objetos | Lista com marcador, para observações e regras curtas. |
| `sistemas` | `sistema`, `perfil` | Grade compacta de sistema + perfil de acesso. |
| `fabricantes` | `nome`, `portal?`, `email?`, `telefone?`, `horario?` | Ficha de contato. Os quatro rótulos e a ordem ficam no renderizador, não nos dados — nenhuma ficha sai fora do padrão. |

**Campo de fabricante em branco vira "a definir" em itálico**, visível como pendência. Isso é deliberado: contato de suporte errado custa caro, então o vazio aparece como vazio em vez de sumir da tela. `email` e `portal` só viram link quando preenchidos.

### Grade de acesso rápido (`atalhos`)

É o layout da página **Acessos Parceria**: os mesmos itens de `links`, desenhados em cards, com campo de busca, alternância entre grade e lista, coração de favorito e botão "Mostrar mais".

```js
{ titulo: 'Portais e sistemas', tipo: 'atalhos', limite: 8, itens: [
    { titulo: 'Portal corporativo', descricao: 'Intranet e serviços internos',
      categoria: 'Portal', icone: 'portal', href: 'https://...' },
    { titulo: 'Contatos de plantão', descricao: 'Quem acionar fora do horário',
      categoria: 'Emergência', icone: 'pessoas' }        // sem href: pendência
]}
```

- **É o mesmo item de `links`**, com `categoria` a mais. Trocar o `tipo` do bloco troca o layout sem reescrever nenhum item — e o contrário também vale.
- **`categoria`** é o rótulo curto no topo do card (no formato de lista ele vira o chip da direita). Sem ele entra o `formato` ("Link", "PDF"); sem formato, "Acesso".
- **`limite`** é quantos cards aparecem antes do botão "Mostrar mais" — 8 por padrão. `limite: 0` mostra a lista inteira e o botão não aparece.
- **Item sem `href`** não vira link, igual em `links`: fica no lugar dele, com borda tracejada e "a definir".
- **Busca, favorito, formato e "Mostrar mais" são de `js/atalhos.js`.** O filtro compara título, descrição e categoria, ignorando acento (é a normalização da busca do portal). O formato escolhido e os favoritos ficam no `localStorage` de quem está usando: são preferência de uma pessoa naquele navegador, não conteúdo da página, e não mudam o que os outros veem. Sem esse arquivo a grade aparece inteira e legível — só a barra deixa de responder.
- **Não aceita `chave`**: a edição pela própria página continua só em `links` (ver [09-edicao-pela-pagina.md](09-edicao-pela-pagina.md)).

### Link ou arquivo, na mesma lista

Parte da documentação mora em portal e parte é um DOC/PDF fechado. O bloco `links` aceita os dois, e o que muda é só o `href`:

```js
{ tipo: 'links', itens: [
    { titulo: 'Política de acesso', href: 'https://portal/...', formato: 'link' },  // endereço
    { titulo: 'Manual de Vídeo',    href: 'docs/manual-video.pdf' },                // arquivo
    { titulo: 'Manual de Áudio' }                                                   // ainda não publicado
]}
```

- **`formato`** desenha o chip cinza à direita (`pdf`, `doc`/`docx`, `xls`/`xlsx`, `ppt`/`pptx`, `link`) e escolhe o ícone. Omitido, sai da **extensão do `href`** — arquivo não precisa declarar nada. `href` sem extensão conhecida e sem `formato` não ganha chip: as listas de Acessos e Sharepoint continuam exatamente como eram.
- **Destino que não é hash abre em outra aba** (`target="_blank"`), para não tirar a pessoa do portal. `href: '#documentacao'` navega na mesma aba.
- **Item sem `href`** não vira link: aparece na lista com borda tracejada e "a definir", pelo mesmo motivo dos campos de fabricante — pendência visível é melhor que item ausente, e um `href="#"` jogaria o leitor de volta para a home.

Os arquivos ficam em `docs/`, ao lado do `index.html` (ver [docs/LEIA-ME.md](../docs/LEIA-ME.md)). Caminho relativo funciona tanto no `file://` quanto servido.

**Bloco de `links` com `chave`** — é o caso dos três de Documentação — deixa de ser editado aqui: os `itens` do arquivo viram semente, e quem manda passa a ser o acervo do servidor, editado pela própria página. A `chave` sai como `data-bloco` no `<ul>` e precisa existir também em `BLOCOS`, no topo de `servidor/dados.js`. Ver [09-edicao-pela-pagina.md](09-edicao-pela-pagina.md). Sem o serviço no ar, a semente daqui é o que aparece.

`icone` é uma chave da tabela `ICONES` em `paginas.js` (`portal`, `chamado`, `agenda`, `parceria`, `pessoas`, `pasta`, `mapa`, `arquivo`, `planilha`, `imagem`, `escudo`, `documento`, `pdf`, `externo`, `sistema`, `monitoramento`, `dashboard`, `catalogo`, `fluxo`, `vm`) e sobrepõe o ícone do formato. Chave inválida ou ausente cai no ícone do formato e, sem formato, no de arquivo — sem quebrar nada. Para linkar outra página interna, use o hash dela: `href: '#documentacao'`.

O campo opcional `aviso` desenha o bloco tracejado no fim da página — remova quando o conteúdo real entrar.

Todo texto passa por `escapar()` antes de ir para `innerHTML`: um "&" num título não quebra o markup. Como consequência, **não dá para colocar HTML nos dados** — é proposital.

## Como acrescentar uma página nova

1. Crie `js/paginas/nome-da-pagina.js` com `PAGINAS['nome-da-pagina'] = { ... }`.
2. Inclua o `<script>` dela em `index.html`, **entre** `paginas.js` e `router.js`.
3. Se ela for para o menu, acrescente `<a href="#nome-da-pagina" data-pagina="nome-da-pagina">` no `<nav>`.

O `data-pagina` é o que o router usa para marcar o item ativo — sem ele o link funciona, mas não fica destacado.

## Estilos

`css/pagina.css` guarda as classes que o renderizador emite: `.back-link`, `.page-eyebrow`, `.page-section`, `.block-title`, `.panel-grid`/`.panel`, `.steps`, `.callout`, `.notes`, `.sys-list`, `.field-list`, `.link-list`, a família `.atalhos*`/`.atalho*` e `.notice`. Como esse markup não existe no HTML, ao renomear um seletor lá é preciso ajustar `js/paginas.js` junto — e, no caso de `.link-list`, também `js/documentos.js` e `css/edicao.css`, que penduram os botões de edição nele. Os seletores de `.atalhos` são lidos por `js/atalhos.js`, que filtra, marca favorito e aplica o limite em cima do que o renderizador desenhou.

## De onde vem o conteúdo

`js/paginas/primeiros-passos.js` contém o conteúdo da página diretamente. Não há geração automática.

As outras três continuam com um esqueleto plausível, escrito a partir das descrições dos cards. Em Documentação os itens previstos já estão listados como "a definir", faltando só o `href`.
