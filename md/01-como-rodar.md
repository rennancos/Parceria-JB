[← Índice](README.md)

# Como rodar

**A raiz do projeto é a pasta `PA_JB/`** — é ali que ficam o `.git` e o `package.json`. A pasta acima (`DEV PAJB/`) não é repositório: é só um guarda-chuva que contém este projeto e o `Tally/`, que tem o próprio `package.json`. Rodar `pnpm dev` de lá dá `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`.

```bash
cd PA_JB       # <- a partir de DEV PAJB
pnpm install   # só na primeira vez
pnpm dev       # http://localhost:8000
```

Também dá para abrir `index.html` direto no navegador (duplo clique). As duas formas funcionam — a diferença está abaixo.

> **Se a porta 8000 estiver ocupada**, o `serve` não reclama: ele escolhe outra porta livre em silêncio. Confira sempre a linha `Accepting connections at http://localhost:XXXX` que ele imprime, em vez de assumir 8000.

## O pnpm não transforma isto num projeto com build

Vale deixar claro, porque a premissa do projeto é justamente não ter build: **o `package.json` não muda nada do que é entregue.** Não há bundler, transpilador nem passo de compilação. O site continua sendo `index.html` + `css/` + `js/` lidos direto pelo navegador; a única dependência é o `serve`, e ela é `devDependencies` — serve para levantar um servidor HTTP local e nada mais. Se você apagar `node_modules/` e o `package.json`, o site continua funcionando por duplo clique.

Por isso o servidor escolhido é um estático burro (`serve`) e não o Vite. O Vite injetaria o próprio client na página e resolveria `import` de módulos ES — o que **mascararia** duas restrições reais deste projeto: nada aqui pode usar `type="module"` nem `fetch()` de arquivo local, porque precisa continuar abrindo em `file://`. Um servidor que transforma o código esconderia esse tipo de quebra até a hora errada.

## Quando usar cada uma

| | Duplo clique (`file://`) | `pnpm dev` (`http://`) |
|---|---|---|
| Ver a página, mexer em CSS/HTML | funciona | funciona |
| Persistência do tema (`localStorage`) | pode ser bloqueada pelo navegador | funciona sempre |
| Testar num celular na mesma rede | não dá | dá |
| Fidelidade ao que o usuário final verá | aproximada | igual |

Na prática: para ajuste rápido de layout, duplo clique resolve. Para testar o comportamento de verdade — principalmente o black mode sobrevivendo ao F5 — use `pnpm dev`.

**Ao mexer em CSS ou JS, recarregue com `Ctrl+Shift+R`.** O `serve` responde com `ETag`, e um F5 comum pode entregar a versão em cache; mais de uma "correção que não funcionou" foi só cache.

## Sem instalar nada

Se preferir não ter `node_modules/` na pasta, dá para servir sem instalação — ainda de dentro de `PA_JB/`:

```bash
pnpm dlx serve --listen 8000 .
```

O `python -m http.server 8000` também continua servindo, se o Python estiver à mão.

## Com a edição pela própria página

`pnpm dev` serve só os arquivos. Para ter também a API pela qual a equipe inclui e edita documentos sem abrir código:

```bash
pnpm servidor        # http://localhost:8000 — site E API, sem dependência nenhuma
pnpm usuarios        # cadastro de quem edita
```

É o mesmo portal, com botões a mais para quem entrou com usuário. Os dois modos convivem: escolha `pnpm dev` para mexer em CSS, `pnpm servidor` para mexer na edição. O passo a passo completo está em [09-edicao-pela-pagina.md](09-edicao-pela-pagina.md).

## O que entra no git

`package.json` e `pnpm-lock.yaml` são versionados (o lock garante que todo mundo levante o mesmo servidor). `node_modules/` já está no `.gitignore`. O `package.json` tem `"private": true` para evitar publicação acidental no npm — este é um portal interno.

`servidor/dados/` **fica de fora**: é o acervo que a equipe edita e o arquivo de usuários, com hash de senha. Ver [09-edicao-pela-pagina.md](09-edicao-pela-pagina.md).

Antes de publicar o repositório em qualquer lugar, leia [02-seguranca.md](02-seguranca.md).

## Isto aqui é desenvolvimento, não produção

O `pnpm dev` levanta um servidor preso ao terminal: fecha a janela, cai o servidor. Serve para trabalhar, não para hospedar.

Em produção o portal vai rodar numa VM da Parceria JB, com `node servidor/servidor.js --porta 80` subindo no boot como serviço. Continua não havendo build — o deploy é `git pull` —, mas a VM roda Node por causa da edição pela própria página: sem servidor não dá para garantir que só quem desenvolveu exclui. O passo a passo está em [08-futuros-passos.md](08-futuros-passos.md) §2.
