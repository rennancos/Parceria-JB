# Backlog de segurança

Data: 2026-09-18. Referência: [relatório técnico](PENTEST-REPORT.md). A ordem de serviço em `md/CODEX-SECURITY-TASKS.md` autorizou apenas as correções pontuais descritas abaixo; os demais itens são propostas, não alterações autorizadas.

Por pedido posterior, `.gitignore` ignora o novo `tests/unit/inicializacao.test.cjs`; ele continua executável localmente, mas não estará em novos clones. Os testes já rastreados continuam versionados e a regra de exclusão do lockfile permanece igual.

| ID | Prioridade | Severidade/estado | Responsável sugerido | Ação e critério de aceite |
|---|---|---|---|---|
| SEC-01 / F-01 | P0 antes de compartilhar serviço | Alta, pendente | Mantenedor | Substituir `serve .` ou usar raiz pública mínima. O servidor escolhido por dev/start deve retornar 403/404 para `.env`, dados de contas e código interno numa fixture, preservando assets públicos. Restringir bind de desenvolvimento. |
| SEC-02 / F-02 | P0 da ordem de serviço | Baixa, concluída localmente | Backend | Projeção sem criadoPor/atualizadoPor/criadoEm/atualizadoEm para visitante e cookie inválido; equipe/dev e persistência preservados. Teste em `seguranca.test.cjs` aprovado; falta somente implantação autorizada. |
| SEC-03 / F-03 | P1 antes de uso com contas reais | Média, parcialmente mitigada | Infraestrutura | Aviso e documentação prontos. Validar certificado, HTTPS público, origem pública correta e cookie Secure; porta Node inacessível diretamente aos clientes. Não mudar auth nem terminar TLS no Node. |
| SEC-04 | P1 antes de novo instalador | Alta publicada, exploração local não demonstrada | Build | Resolver js-yaml >=4.3.2, preservar overrides e validar compatibilidade. Repetir audit e build em ambiente isolado. Não executar PoC de consumo de CPU. |
| SEC-05 | P1 antes de novo instalador | Alta publicada, sem patch no audit | Build | Acompanhar correção de extract-zip e upstream Electron; não assumir que PR equivale a release. Usar artefatos confiáveis, build isolado e registro da mitigação. Aceite definitivo: versão/fork auditado e testes de contenção de symlinks. |
| SEC-06 | P1 | Preventiva, pendente | Desktop | Migrar Electron 39 para linha suportada, verificar mudanças de API e repetir testes de atualização/navegação/instalação em ambiente autorizado. Não prometer correção das transitivas sem novo audit. |
| SEC-07 / S-01/S-02 | P1 antes de ativar IA | Potencial média, pendente | Integração | Rejeitar redirecionamentos ou fixar destino validado, exigir transporte apropriado, limitar bytes e projetar metadados. Teste 307 deve provar zero chamadas ao destino secundário; testar resposta excessiva com limite pequeno de fixture. IA atual não alterada. |
| SEC-08 / S-03 | P1 antes do proxy | Condicional, documentada | Infraestrutura/backend | Validar limite compartilhado e topologia. Não confiar em XFF sem proxy conhecido, sobrescrita do header e bloqueio de acesso direto. Não implementada a env de confiança. |
| SEC-09 | P1 de deploy | Potencial, não validada | Infraestrutura | Confirmar conta de serviço com menor privilégio, ACLs de dados/logs, backups e restauração. Não inferir conta real a partir do manual. |
| SEC-10 | P2 | Baixa, decisão pendente | Mantenedor | Aprovar versionamento do pnpm-lock.yaml e instalação congelada. Se recusado, manter audit/why e inventário da árvore em cada build. `.gitignore` não alterado. |
| SEC-11 | P2 conforme exposição | Preventiva | Backend/operação | Avaliar cotas agregadas e limites por operação quando houver crescimento ou acesso além da LAN. Manter limites atuais; sem implementação antecipada. |
| SEC-12 | P2 conforme audiência | Informativa | Dono do produto | Confirmar que diretório/fotos podem ser acessados por toda a audiência da rede. Migrar para leitura autenticada apenas se política mudar. |
| SEC-13 | P2 | Preventiva | Build/desktop | Verificar assinatura do publicador, proteger manifesto/binários e evitar corrida de atualização. Testar assinatura inválida sem executar binário. |
| SEC-14 | P2 | Preventiva | Mantenedor | Declarar Node LTS suportado em engines/documentação; checar runtime real no futuro escopo de homologação. |
| SEC-15 | P2 condicionado a escala | Preventiva | Backend | Antes de múltiplas instâncias, substituir ou sincronizar persistência JSON; testes de concorrência em fixture devem preservar ambas as alterações. |

## Trabalho concluído e evidências

- `servidor/servidor.js`: filtro de autoria anônima e aviso de TLS no boot.
- `tests/unit/seguranca.test.cjs`: regressão de projeção pública, sessões válidas/invalidas e persistência.
- `tests/unit/inicializacao.test.cjs`: quatro configurações de boot, sem listener real.
- `tests/unit/atualizacao-seguranca.test.cjs`: timeout reduzido restrito ao cenário lento; mantém prova de timeout e cache adulterado.
- `md/13-deploy-na-vm.md`: orientação HTTPS, backend isolado e decisões sobre proxy/limites.
- `npm test`: 53/53; navegador na cópia com dados sintéticos: 12/12; sondagem repetida não encontrou autoria pública.

## Próxima validação após novas autorizações

Executar testes antes/depois de cada correção, repetir a reprodução específica, revisar diff e atualizar os estados deste backlog. Separar validação de configuração local de validação efetiva no proxy/VM. Não fechar F-03 apenas por existir WARN, nem fechar avisos de dependência sem revisar a árvore resolvida.

Nenhum item pendente implica autorização para alterar produção, contas reais, ACLs, dependências, `.gitignore` ou a integração de IA.
