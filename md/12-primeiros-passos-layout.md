# Primeiros passos — mudanças de layout

## Objetivo

A página `Primeiros passos` foi reorganizada para funcionar como uma central de onboarding e acessos, reduzindo a rolagem e facilitando a localização de sistemas, fabricantes, contatos e links.

## Arquivos modificados

- `index.html`
  - Inclui o comportamento específico da página `Primeiros passos`.
- `css/pagina.css`
  - Adiciona os estilos isolados da central de onboarding.
  - Não altera tokens globais nem estilos das outras páginas.
- `js/paginas.js`
  - Mantém o renderer existente.
  - Adiciona recursos condicionais apenas quando a página possui a classe `primeiros-passos`.
  - Mantém os `href`, links externos, `data-ficha` e contratos usados pelas integrações.
- `js/paginas/primeiros-passos.js`
  - Adiciona a classe específica `primeiros-passos` aos dados da página.
- `js/paginas/primeiros-passos-ui.js`
  - Implementa a busca local e a filtragem dos itens.
- `js/router.js`
  - Passa a reconhecer âncoras da página que já está aberta (ver abaixo).
- `tests/browser.cjs`
  - Cobre a navegação rápida, a barra lateral, a busca local, o contato no card e a ficha de fabricante.

## Mudanças visuais

- Navegação rápida para acessos, sistemas, fabricantes e documentação.
- Busca local por sistema, acesso, fabricante, grupo, serviço e contato.
- Steps de solicitação de acesso mantidos como lista numerada.
- Sistemas exibidos em grid compacto.
- Fabricantes agrupados por setor usando `<details>` e `<summary>`.
- Sidebar contextual sticky em desktop.
- Sidebar ocultada em telas menores.
- Grids reduzidos progressivamente em tablet e mobile.
- Estados `hover` e `focus-visible` preservados/adicionados.
- Uso dos tokens existentes de cor, espaçamento, tipografia e dark mode.

## Compatibilidade com integrações

Os dados continuam vindo de `js/paginas/primeiros-passos.js`. Nenhum dado foi movido para HTML estático.

Foram preservados:

- URLs existentes.
- Links externos e seus atributos `target` e `rel`.
- IDs de seções gerados pelo renderer.
- `data-ficha`, usado pela janela de fabricantes.
- `window.Portal.fabricantes`.
- Fluxo de renderização pelo router.
- Integrações de edição e acervo existentes.
- Contrato compartilhado de `PAGINAS` e `renderizarPagina`.

A busca apenas alterna a propriedade `hidden` dos itens já renderizados. Ela não altera os dados originais nem faz chamadas ao backend.

## Comportamento da busca

1. O usuário digita no campo de busca.
2. O texto é normalizado para ignorar diferenças de maiúsculas e acentos.
3. Os itens são comparados usando os dados já existentes.
4. Fabricantes encontrados abrem automaticamente o grupo correspondente.
5. Contêiner que ficou sem nenhum item visível sai da tela — seção, bloco e grupo de setor.
6. Fabricante encontrado mostra representante, e-mail e telefone no próprio card.
7. O resultado aparece em uma região com `aria-live`.

Com o campo vazio a página volta inteira: todos os grupos e seções reaparecem e o contato some do card.

## Validação realizada

- Testes unitários: 84 aprovados.
- Testes de navegador: 13 aprovados.
- Verificação de sintaxe JavaScript realizada com `node --check`.
- Verificação de espaços inválidos realizada com `git diff --check`.
- Verificação de overflow responsivo incluída na suíte de navegador.

## Correção: âncoras internas x roteamento por hash

O layout novo quebrou a navegação da página, e a causa não era seletor.

O portal roteia por hash (`js/router.js`): `index.html#documentacao` abre a página `documentacao`, e **qualquer hash que não seja uma chave conhecida de `PAGINAS` cai na home**. A navegação rápida e a barra lateral apontam para âncoras da própria página (`#secao-0`, `#secao-1`, `#secao-2`), então cada clique disparava `hashchange`, o router resolvia "página desconhecida" e executava o retorno à home — esvaziando `#view-pagina`. Na prática: clicar em "Sistemas" apagava a página e voltava ao portal.

A correção está em `js/router.js`. No `hashchange`, antes de decidir a página, o router pergunta ao DOM se o hash corresponde a um `id` existente dentro da página já desenhada. Se corresponder, ele apenas rola até o elemento e não redesenha nada. Chave de página continua tendo prioridade sobre âncora, então `#documentacao` segue navegando.

Efeitos:

- Vale para qualquer página interna, não só esta.
- O conteúdo que só existe no DOM (texto digitado na busca, `<details>` aberto) sobrevive ao pulo, porque não há redesenho.
- Hash malformado (`#%`) e hash desconhecido que não é âncora daqui continuam caindo na home, como antes.
- `scroll-margin-top` nos títulos mantém a seção fora de baixo do cabeçalho grudado.

## Correção: busca por contato não devolvia contato

A busca casava com representante, e-mail e telefone (estão todos em `data-search`), mas o card só desenhava o nome do sistema e a primeira linha do fabricante. Procurar por "Rafael Rolando" escondia 102 dos 103 itens e devolvia um card escrito "Sistemas AVID, Glookast e Object Matrix" — o nome procurado não aparecia em lugar nenhum, e o telefone continuava atrás de um clique na janela.

Somava-se a isso o fato de a busca esconder apenas os itens: os contêineres continuavam desenhados. Sobravam na tela sete `<summary>` de setor vazios e duas seções sem nada dentro. Daí a impressão de que a busca "só retira as box".

O que mudou:

- `js/paginas.js` ganhou `contatoFabricante()`, que monta representante, e-mail e telefone reaproveitando `valorFabricante` — mesmos `mailto:` e mesma quebra por linha da janela. O bloco entra como **irmão** do `<button>`, nunca dentro: `<button>` não pode conter `<a>`.
- O bloco fica no HTML desde o início e escondido no CSS. Escondido não ocupa rolagem nem entra na ordem de tabulação, então a razão de a janela existir (48 fornecedores numa página só) continua de pé.
- `js/paginas/primeiros-passos-ui.js` liga a classe `buscando` na página enquanto há texto, e esconde os contêineres que ficaram sem item visível. Bloco sem nenhum item (um bloco de notas, por exemplo) fica de fora dessa regra: é texto da página, não resultado.
- `css/pagina.css`: a regra do `hidden` passou a valer para a página toda (`.primeiros-passos [hidden]`). A regra do navegador para `[hidden]` é fraca demais — qualquer `display` de autor, como o grid de `.sys-list` ou o flex do `<summary>`, ganharia dela.

Um detalhe de layout que veio junto: `.fab-item` usava `height: 100%`, o que só funcionava enquanto o `<li>` tinha um filho só. Com o `<dl>` irmão, os 100% passaram a valer a altura de botão + contato; o card inchava e o contato vazava para fora da caixa. O card virou uma coluna flex e o botão passou a crescer com `flex: 1 1 auto`.

## Observação sobre integrações

As demais integrações foram verificadas no navegador e continuam funcionando: `data-ficha` e a janela de fabricantes, a busca global, a edição pela página e o índice de busca. A nova estrutura adiciona wrappers visuais (`.pagina-conteudo`, `.onboarding-group`), mas preserva os seletores funcionais existentes — `data-ficha`, `.fab-item`, `.sys-list`, `.steps` e `.link-list` — e todos os consumidores usam seletor de descendente, não de filho direto.

Não foram adicionadas chamadas de API nem dependências novas.
