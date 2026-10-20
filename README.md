# Portal Parceria JB

Portal interno da operação Parceria JB. Reúne atalhos, orientações, documentos e informações da equipe em um único lugar.

Este guia explica como obter uma cópia do projeto e abrir o portal no computador. As instruções de desenvolvimento e administração estão na documentação indicada ao final.

## Antes de começar

Você precisa ter:

- Acesso ao projeto no GitLab. Se não conseguir abrir o endereço, solicite permissão ao responsável pelo repositório.
- Git instalado no computador. Para conferir, abra o PowerShell ou o terminal e execute `git --version`.

O repositório é privado e contém nomes, e-mails, fotos e materiais internos. Mantenha os arquivos apenas nos locais autorizados pelo setor. Consulte [Orientações de segurança](md/02-seguranca.md) antes de publicar ou compartilhar qualquer conteúdo.

## Clonar o projeto

Clonar significa baixar uma cópia do projeto para o seu computador. A cópia mantém o histórico do Git e pode ser atualizada depois.

1. Acesse o [projeto no GitLab](https://gitlab.globoi.com/platprod-sustentacao/parceriajb/portal-parceriajb).
2. Selecione **Code** (ou **Clone**) e copie o endereço HTTPS do repositório.
3. Abra o PowerShell ou um terminal na pasta onde deseja guardar o projeto.
4. Execute os comandos abaixo. Se o Git pedir autenticação, use o método de acesso configurado pela Globo; não compartilhe sua senha ou token.

```powershell
git clone https://gitlab.globoi.com/platprod-sustentacao/parceriajb/portal-parceriajb.git
cd portal-parceriajb
```

Ao terminar, a pasta `portal-parceriajb` conterá os arquivos do projeto.

### Erros comuns ao clonar

- **Project not found** ou **repository not found**: confirme que está conectado à rede/VPN necessária e que sua conta tem acesso ao projeto.
- **Authentication failed**: siga o método de autenticação corporativo do GitLab. Se usar token, nunca o coloque no endereço do repositório nem o envie a outra pessoa.
- **`git` não é reconhecido**: instale o Git ou peça suporte à equipe responsável pelo computador.

## Abrir o portal

Para apenas visualizar o portal, abra o arquivo `index.html` dentro da pasta clonada. Também é possível iniciar o servidor local para testar o portal pelo navegador:

1. Instale Node.js 22 ou superior e habilite o `pnpm`, caso ainda não estejam disponíveis.
2. No terminal, dentro da pasta `portal-parceriajb`, execute:

```powershell
pnpm install
pnpm dev
```

3. Acesse `http://localhost:8000` no navegador.
4. Para encerrar o servidor, volte ao terminal e pressione `Ctrl+C`.

O portal pode ser visualizado sem o servidor, mas alguns recursos de edição dependem dele. O servidor local é para desenvolvimento e teste; não o exponha na rede sem orientação da equipe responsável.

## Atualizar sua cópia

Para baixar as atualizações publicadas no GitLab, abra o terminal dentro da pasta do projeto e execute:

```powershell
git pull
```

Se você tiver alterado arquivos localmente, o Git pode pedir que resolva as alterações antes de atualizar. Nesse caso, guarde seu trabalho e peça apoio à equipe responsável pelo projeto.

## Documentação do projeto

- [Índice da documentação](md/README.md)
- [Como executar e testar](md/01-como-rodar.md)
- [Segurança e compartilhamento](md/02-seguranca.md)
- [Guia de manutenção](docs/manutencao.md)
- [Publicação, backup e rollback](docs/publicacao.md)

O portal é feito com HTML, CSS e JavaScript, sem etapa de compilação. A estrutura de pastas deve ser mantida para que os caminhos e recursos continuem funcionando.
