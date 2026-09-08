# Documentação — Parceria JB

Comece pelo [Guia de Manutenção](../docs/manutencao.md) para localizar contratos entre módulos, limitações atuais e testes necessários antes de alterar o código.

Índice desta pasta. É para cá que aponta o `[← Índice]` no topo de cada
documento. Para subir o projeto e ver a estrutura de pastas, o ponto de
partida é o [README da raiz](../README.md).

Nada aqui é lido pelo site: `md/` é documentação para quem mexe no código —
e desde que o servidor passou a usar lista de permitidos, esta pasta também
**não é servida por HTTP**. Não aponte link do portal para cá.

## Um documento por parte

| Documento | Para quê |
|---|---|
| [01-como-rodar.md](01-como-rodar.md) | Subir o projeto, `file://` vs `http://`, o que o pnpm faz (e não faz) aqui |
| [02-seguranca.md](02-seguranca.md) | O que não pode vazar. **Leia antes de publicar em qualquer lugar.** |
| [03-home.md](03-home.md) | A página inicial: header, grade de cards, as duas *views* |
| [04-paginas-internas.md](04-paginas-internas.md) | Como as páginas do menu funcionam e como editar o conteúdo delas |
| [05-equipe.md](05-equipe.md) | A seção "Nossa equipe": array, fotos, destaques |
| [06-estilos-e-tema.md](06-estilos-e-tema.md) | Tokens do tema atual, responsivo, drawer, acessibilidade |
| [07-pendencias.md](07-pendencias.md) | O que está inacabado ou merece atenção |
| [08-futuros-passos.md](08-futuros-passos.md) | Roteiro: subir na VM, conteúdo real, busca — e o que **não** fazer |
| [09-edicao-pela-pagina.md](09-edicao-pela-pagina.md) | A equipe editando documentos pela própria página: uso, administração e o servidor por trás |
| [10-aplicativo-windows.md](10-aplicativo-windows.md) | O portal como `.exe`: gerar o instalador, versionar, publicar atualização |
| [11-busca.md](11-busca.md) | A busca do portal: o que indexa, como ordena e as armadilhas do componente |
| [12-arquitetura-integracao-ia.md](12-arquitetura-integracao-ia.md) | Onde a futura IA se encaixa: contrato, rota, variáveis e o passo a passo de quem for integrá-la |

Para mexer em conteúdo, **04** e **05** bastam. Para aparência, **06**.

## Auditorias de estrutura

Fora da numeração de propósito: são fotografias de um momento, não guias de
uso. Envelhecem — confira contra o código antes de agir sobre elas.

| Documento | Para quê |
|---|---|
| [auditoria-estrutura-backend.md](auditoria-estrutura-backend.md) | `servidor/`: achados, plano P0-P3 e **por que a arquitetura não foi refatorada**. Leia antes de propor camadas novas |
| [auditoria-estrutura-frontend.md](auditoria-estrutura-frontend.md) | A divisão de `js/` em módulos e o que os testes passaram a cobrir |
| [auditoria-seguranca.md](auditoria-seguranca.md) | Teste de segurança do projeto inteiro: achados, o que foi corrigido e o que segue aberto |

## Fora daqui

- [jotbird-document.md](jotbird-document.md) — material de apoio, não é
  documentação do portal.
- `.claude/skills/run-pa-jb-portal/SKILL.md` — como subir e **dirigir** o
  portal (HTTP, `file://` e o aplicativo Windows), com as armadilhas que só
  aparecem ao rodar.
