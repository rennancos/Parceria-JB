/* Página "Inteligência Artificial" — aberta em index.html#configuracoes-ia.

   Aqui só mora a CASCA da página (título, descrição, avisos): o router a
   renderiza como qualquer outra a partir de PAGINAS. A parte interativa (form
   de provedor/credencial/modelo, testar, salvar, chat) é montada por
   js/configuracoes-ia.js quando esta página aparece — mesma divisão de
   Documentação (dados aqui, edição em js/documentos.js).

   Sem `secoes`: o conteúdo é dinâmico e depende do servidor (BYOK), então
   js/configuracoes-ia.js injeta o form dentro de #view-pagina no evento
   pagina:render. Sem servidor (file:// ou API fora), a página mostra só o aviso
   de que a configuração precisa do servidor. */
window.PAGINAS['configuracoes-ia'] = {
  eyebrow: 'Configurações',
  titulo: 'Inteligência Artificial',
  descricao: 'Conecte a sua própria conta de IA (OpenAI, Anthropic Claude ou Google Gemini). '
    + 'A credencial é sua: o consumo é cobrado pela sua conta no provedor, e ela fica cifrada '
    + 'no servidor — nunca no seu navegador.',
  secoes: []
};
