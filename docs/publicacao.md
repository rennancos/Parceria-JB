# Publicação segura do portal

## Diagnóstico

O portal não tem build web: `index.html`, `css/`, `js/` e `Fotos/` são lidos diretamente do disco por `servidor/servidor.js`. O servidor calcula `stat` e ETag a cada requisição. HTML, CSS, JavaScript e imagens usam `Cache-Control: no-cache`, portanto o navegador revalida e recebe a versão nova sem reiniciar o Node. Não há hot reload.

O backend é carregado pelo `require()` uma vez. Alterar `servidor/*.js`, `servidor/ia/`, `servidor/dados.js` ou `servidor/auth.js` exige reiniciar o processo. Sessões vivem em um `Map` em memória por até 12 horas; reiniciar invalida todas. Não há cache distribuído, fila ou conexão persistente no servidor.

## Serviço e rede

Em produção, configure um serviço Windows (por exemplo, o serviço corporativo aprovado ou NSSM, se permitido) para executar `node servidor/servidor.js`, com diretório de trabalho na raiz do projeto, `NODE_ENV=production`, `PAJB_HOST=127.0.0.1`, `PORTA=8000` e `PAJB_ORIGEM_PUBLICA=https://portal.seu-dominio`. Habilite início automático, recuperação após falha e redirecionamento de stdout/stderr para um diretório de logs com ACL restrita.

O IIS deve terminar TLS, redirecionar HTTP para HTTPS e fazer proxy para `http://127.0.0.1:8000`; use [infra/iis/web.config.example](../infra/iis/web.config.example) como modelo. Não publique a porta 8000 na rede corporativa nem remova as validações de produção do Node.

Comandos de diagnóstico, usando o nome real do serviço:

```powershell
Get-Service -Name ParceriaJB
Start-Service -Name ParceriaJB
Stop-Service -Name ParceriaJB
Get-Content C:\ProgramData\ParceriaJB\logs\portal.log -Wait
Invoke-WebRequest http://127.0.0.1:8000/api/saude
```

## Publicação

Faça backup de `servidor/dados/` e `docs/` antes de uma janela de manutenção. Valide a alteração e execute:

```powershell
npm test
pwsh -File .\publicacao\publicar.ps1 `
  -Source 'C:\staging\Parceria-JB-main' `
  -Target 'C:\Parceria-JB' `
  -ServiceName 'ParceriaJB'
```

O script cria um backup versionado ao lado do destino, publica apenas código/estáticos, preserva `servidor\dados` e não substitui os documentos enviados em `docs`. Com `-ServiceName`, para o serviço, copia o código, inicia-o e consulta `/api/saude`. Se a cópia ou a saúde falhar, restaura o backup e inicia o serviço novamente. Sem `-ServiceName`, use apenas para atualização estática enquanto o serviço existente continua atendendo.

A publicação não instala dependências, não altera o Windows e não faz `git pull`. Prepare a pasta de staging e a instalação do serviço separadamente, com autorização operacional.

## Rollback manual

O caminho do backup é impresso ao final da publicação. Pare o serviço, restaure os itens de código do backup com `robocopy`, inicie-o e valide a saúde:

```powershell
Stop-Service ParceriaJB
robocopy 'C:\.pajb-backups\20261016-120000' 'C:\Parceria-JB' /E /XD 'C:\.pajb-backups\20261016-120000\servidor\dados'
Start-Service ParceriaJB
Invoke-WebRequest http://127.0.0.1:8000/api/saude
```

Não restaure `servidor/dados/` ou `docs/` com o backup de código; esses são dados de produção e precisam do backup operacional próprio. Uma reinicialização encerra sessões abertas e exige novo login.

## Limitações

O fluxo não configura IIS, certificado, firewall, serviço ou permissões automaticamente. A verificação de saúde confirma apenas que o processo responde; validação funcional autenticada e teste pela rede devem ser feitos em ambiente autorizado após a publicação. A limpeza de arquivos antigos não é automática para evitar apagar conteúdo operacional.
