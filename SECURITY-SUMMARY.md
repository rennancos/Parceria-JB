# Resumo executivo de segurança

Data: 2026-09-18. Escopo: código e testes locais do PA_JB; nenhuma VM, produção ou integração externa foi atacada.

**Correções autorizadas concluídas:** o acervo público deixou de expor autoria; o boot avisa quando não há origem HTTPS configurada; o guia de implantação exige proxy HTTPS e isolamento da porta do backend. Dados reais, regras de autenticação e IA foram preservados. Por pedido posterior, o novo teste de inicialização foi incluído no `.gitignore`; permanece disponível somente na cópia local.

**Validação:** 53 testes unitários e 12 testes de navegador aprovados. As sondagens HTTP confirmaram a correção de autoria. Um timeout artificial da suíte de atualização foi ajustado apenas no teste; o atualizador não mudou.

| Situação | Risco | Decisão necessária |
|---|---|---|
| Pendente — alta | `dev/start` usam `serve .` e entregam arquivos internos; demonstrado com `.env` e usuários sintéticos | Trocar o servidor/raiz pública antes de disponibilizar a terceiros |
| Corrigida — baixa | GET anônimo do acervo expunha identificadores de autores | Implantar a correção no fluxo normal autorizado |
| Mitigação parcial — média | HTTP direto não protege senha/sessão no transporte | Configurar e validar proxy HTTPS; aviso não substitui TLS |
| Pendente — cadeia de suprimentos | Audit encontrou três avisos altos em extract-zip e js-yaml transitivos | Atualizar/mitigar a cadeia de build; exploração pelo portal não foi demonstrada |
| Condicional — IA | Redirect 307 reenviou consulta sintética para segunda origem | Revisar antes de ativar a integração; nenhuma mudança feita na IA |

A janela Electron permanece isolada e o backend bloqueou os principais cenários de escrita sem sessão, exclusão sem perfil, CSRF e acesso a arquivos internos. Isso não cobre o servidor estático alternativo de `dev/start`.

O lockfile continua fora do Git por decisão existente. Recomenda-se versioná-lo mediante aprovação e planejar migração do Electron para uma linha suportada. Há detalhes e fontes no [relatório técnico](PENTEST-REPORT.md) e critérios de aceite no [backlog](SECURITY-BACKLOG.md).

Não houve deploy, atualização de dependências, execução de instalador ou alteração dos dados reais. A configuração efetiva de produção continua sem avaliação.
