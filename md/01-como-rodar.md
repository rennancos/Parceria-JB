[← Índice](README.md)

# Como rodar

A raiz do projeto é `PA_JB/`, onde ficam `package.json` e `.git`. Use Node 22 ou
superior em uma linha LTS suportada. O servidor não precisa de pacotes npm:

```powershell
node servidor/servidor.js
# http://127.0.0.1:8000 — site e API
```

`pnpm dev`, `pnpm start` e `pnpm servidor` executam esse mesmo comando. A porta
ocupada gera erro, sem escolher outra silenciosamente. Para mudar a porta:

```powershell
node servidor/servidor.js --porta 8123
```

O backend usa uma lista de arquivos permitidos: não sirva a raiz com `serve .`
ou `python -m http.server`, pois esses comandos podem publicar `.env`, dados de
contas e código interno. `.gitignore` não é controle de acesso HTTP.

## Página e edição

Não há bundler nem transformação de HTML/CSS/JS. Recarregue com `Ctrl+Shift+R`
após editar assets. O backend envia ETag e pede revalidação do cache.

Duplo clique em `index.html` continua funcionando, com as limitações de
`localStorage` de cada navegador e sem API. Via HTTP local, o backend também
oferece a edição autenticada; cadastrar usuários usa `pnpm usuarios`.
Para testes, use uma cópia descartável e contas fictícias, preservando
`servidor/dados/` e os arquivos reais de `docs/`.

O bind padrão é `127.0.0.1`: outro computador/celular não acessa essa instância.
Para uma demonstração na LAN, prepare o proxy HTTPS descrito no
[guia de deploy](13-deploy-na-vm.md). Não envie credenciais reais por HTTP.

## Electron e dependências

Instale as dependências somente para trabalhar com o aplicativo Windows:

```powershell
pnpm install
npm run app
```

Electron 44 usa distribuições de 64 bits; o alvo Windows deste projeto é x64.
`pnpm audit` verifica a árvore local. O lockfile continua ignorado por decisão
do mantenedor: os overrides viajam no `package.json`, mas as versões transitivas
exatas podem variar entre instalações. Não publique instaladores sem auditar a
árvore e executar os testes correspondentes.

## Produção

O CLI exige `PAJB_ORIGEM_PUBLICA=https://...` quando `NODE_ENV=production` e
recusa bind fora de loopback nesse modo. O IIS local termina TLS e encaminha
para `127.0.0.1:8000`. `.env` não é carregado automaticamente: configure o
ambiente do serviço. Consulte [13-deploy-na-vm.md](13-deploy-na-vm.md).

`servidor/dados/` e uploads reais ficam fora do Git. O repositório contém um
diretório interno de pessoas; leia [02-seguranca.md](02-seguranca.md) antes de
compartilhá-lo.
