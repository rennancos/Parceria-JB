# Publicar o portal na VM (10.181.40.13)

Escrito para este repositório, não para o modelo genérico de monorepo.
O que muda em relação a um deploy Node comum:

- **Não há build.** O site é estático e o servidor entrega os mesmos arquivos do repo.
- **Não há front e back separados.** `servidor/servidor.js` serve o site *e* a API na
  mesma origem — o cookie de sessão depende disso. Proxy reverso, se houver, encaminha
  `/` inteiro, nunca só `/api/*`.
- **Não há dependência de runtime.** `servidor/` usa só módulos nativos do Node
  (`http`, `fs`, `path`, `crypto`, `readline`). `pnpm install` só faz falta para
  testes e para empacotar o app Electron — nada disso roda na VM.
- **Não há Entra ID / Azure AD.** Quem edita é cadastrado por CLI
  (`servidor/usuarios.js`, scrypt, sessão em memória). Não há Redirect URI a ajustar.
- **A variável de porta é `PORTA`**, não `PORT`. Não existe `HOST`: o servidor escuta
  em todas as interfaces.

## 1. Preparo da VM

```powershell
node -v                    # precisa ser >= 18 (engines do package.json)
(Get-Command node).Source  # anote: é este caminho que vai no NSSM
```

Sem pnpm e sem build — mas **o Node não vem na imagem padrão da VM**. Se o `node -v`
falhar com `CommandNotFoundException`, descarte primeiro o PATH desatualizado, que é o
caso mais comum quando a instalação foi feita em outra sessão:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
            [Environment]::GetEnvironmentVariable('Path','User')
node -v
```

Se continuar faltando, instale. Prefira o winget: deixa o Node no PATH da máquina e
num caminho previsível.

```powershell
winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
# resultado: C:\Program Files\nodejs\node.exe
```

Sem winget na imagem, use o ZIP portátil. Não exige MSI nem instalador, e serve igual
para o NSSM, que aponta para o `node.exe` de qualquer forma:

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$dist = Invoke-RestMethod 'https://nodejs.org/dist/index.json' -UseBasicParsing
$lts  = ($dist | Where-Object { $_.lts -ne $false } | Select-Object -First 1).version

Invoke-WebRequest "https://nodejs.org/dist/$lts/node-$lts-win-x64.zip" `
  -OutFile "$env:TEMP\node.zip" -UseBasicParsing
Expand-Archive "$env:TEMP\node.zip" -DestinationPath C:\apps -Force
Rename-Item "C:\apps\node-$lts-win-x64" C:\apps\nodejs
# resultado: C:\apps\nodejs\node.exe
```

Download que falha com erro de conexão ou 407 é bloqueio de proxy corporativo, não
erro de comando: baixe o ZIP da sua estação e copie pela sessão RDP, ou peça o Node no
mesmo chamado da infra do passo 7.

**Anote o caminho do `node.exe`** — `C:\Program Files\nodejs\` pelo winget,
`C:\apps\nodejs\` pelo ZIP. É ele que vai no `nssm install` do passo 5.

## 2. Trazer o código

```powershell
mkdir C:\apps\parceriajb
cd C:\apps\parceriajb
git clone https://github.com/rennancos/Parceria-JB.git .
```

Repo privado: use deploy key ou PAT **read-only** criado para esta máquina, não a sua
credencial pessoal.

## 3. Subir na mão e conferir

```powershell
node servidor/servidor.js --porta 8000
# outro terminal:
curl http://127.0.0.1:8000/api/sessao     # 200 {"autenticado":false}
```

Não existe `/api/health`; `GET /api/sessao` faz esse papel e não exige login.

## 4. Cadastrar quem edita

```powershell
node servidor/usuarios.js incluir      # papel: equipe (edita) ou dev (edita e exclui)
```

Leitura do acervo é aberta a quem alcança o portal. Login só é exigido para escrever.
Reiniciar o serviço desloga todo mundo — sessões vivem em memória, é só entrar de novo.

## 5. Serviço do Windows (NSSM)

O Chocolatey costuma faltar na imagem pelo mesmo motivo que o Node. Se `choco` não
existir, baixe o NSSM avulso — é um `.exe` solto, sem instalador:

```powershell
choco install nssm -y      # se o choco existir na imagem

# senão, NSSM avulso:
Invoke-WebRequest https://nssm.cc/release/nssm-2.24.zip -OutFile "$env:TEMP\nssm.zip" -UseBasicParsing
Expand-Archive "$env:TEMP\nssm.zip" -DestinationPath C:\apps -Force
Set-Alias nssm C:\apps\nssm-2.24\win64\nssm.exe   # vale só nesta sessão
```

O alias morre com o terminal; num terminal novo, chame o caminho completo ou refaça o
`Set-Alias`. O serviço, uma vez criado, não depende disso.

Agora o serviço, com o caminho do `node.exe` que você anotou no passo 1:

```powershell
nssm install ParceriaJB "C:\Program Files\nodejs\node.exe" "servidor\servidor.js"
nssm set ParceriaJB AppDirectory "C:\apps\parceriajb"
nssm set ParceriaJB AppEnvironmentExtra PORTA=8000
nssm set ParceriaJB AppExit Default Restart
nssm start ParceriaJB

Get-Service ParceriaJB
```

Aponte para `node.exe` direto, não para `pnpm.cmd`: o wrapper `.cmd` cria um processo
filho que o NSSM não consegue parar nem reiniciar direito. E `pnpm start` aqui roda
`serve` (site estático **sem** API) — não é o que você quer no serviço.

## 6. Como o time acessa

**Opção A — direto, funciona hoje:**

```powershell
New-NetFirewallRule -DisplayName "Portal PAJB" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

Time acessa `http://10.181.40.13:8000`. Sem TLS, sem hostname, sem chamado. Rede
interna, portal interno — é uma escolha defensável enquanto o resto não sai.

**Teste da estação de alguém do time antes de anunciar o link**, não só da VM:

```powershell
Test-NetConnection 10.181.40.13 -Port 8000    # TcpTestSucceeded precisa ser True
```

Em 12/09/2026, de uma estação de desenvolvimento, a VM não respondia a ping nem em
3389, 80, 443 ou 8000. Se esse teste falhar com o serviço de pé e a regra de firewall
criada, o bloqueio é de rede, entre segmentos — e aí o chamado para a infra não é só
DNS e certificado, é liberação de rota e porta até o 10.181.40.13.

**Opção B — IIS na frente, para ter HTTPS e hostname:**

```powershell
Install-WindowsFeature -Name Web-Server, Web-Http-Redirect
# instalar manualmente: Application Request Routing (ARR) + URL Rewrite
```

No IIS Manager: habilite o proxy em *Server → Application Request Routing Cache →
Server Proxy Settings → Enable proxy*. Crie um site com binding 443 no hostname e
uma regra de URL Rewrite que encaminhe **`.*`** para `http://127.0.0.1:8000/{R:1}`.
Não crie regra de firewall para a 8000: o Windows já bloqueia entrada sem regra, e é
assim que a porta fica só para o proxy local.

Com HTTPS no ar, adicione a origem pública ao serviço:

```powershell
nssm set ParceriaJB AppEnvironmentExtra PORTA=8000 PAJB_ORIGEM_PUBLICA=https://parceriajb.<zona-interna>
nssm restart ParceriaJB
```

Só a origem, sem caminho e sem barra final — o servidor recusa subir se vier
diferente. É ela que valida o `Origin` das escritas e dá o atributo `Secure` ao
cookie de sessão; atrás de proxy o `Host` sozinho não serve, porque vem do cliente.

## 7. DNS e certificado (chamado para a infra)

Registro A `parceriajb.<zona-interna>` → `10.181.40.13`, mais certificado da CA
interna para esse nome. É o passo mais demorado e não depende de você — abra junto,
no mesmo chamado. Autoassinado só serve para teste seu; o navegador reclama para
todo mundo.

## 8. Backup (obrigatório)

`servidor/dados/` (acervo e usuários) e `docs/` (DOC/PDF enviados pela página) são
dados de produção e estão no `.gitignore` — não vêm do clone e não voltam de um
`git pull`. Agende cópia dos dois.

## 9. Atualizar depois

```powershell
cd C:\apps\parceriajb
git pull
nssm restart ParceriaJB
```

Sem build e sem install. `servidor/dados/` e `docs/` não são tocados.
