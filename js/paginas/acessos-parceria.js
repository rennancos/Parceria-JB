/* Página "Acessos Parceria" — aberta em index.html#acessos-parceria.
   Formato dos campos: ver o cabeçalho de js/paginas.js.

   "Portais e sistemas" usa `tipo: 'atalhos'` — a grade de cards com busca,
   grade/lista, favorito e "Mostrar mais": ali se procura um destino no meio de
   vários, e não se lê a lista de cabo a rabo. `categoria` é o rótulo curto do
   topo do card. "Materiais prioritários" segue em `paineis`: são três itens
   ainda por definir, e uma barra de busca sobre três cards não ajuda ninguém. */
PAGINAS['acessos-parceria'] = {
  titulo: 'Acessos Parceria',
  eyebrow: 'Acessos rápidos',
  descricao: 'Links estratégicos, portais e materiais prioritários para uso frequente.',

  secoes: [
    {
      titulo: 'Portais e sistemas',
      texto: 'Os destinos usados com mais frequência na operação, reunidos para não depender de favorito de navegador.',
      tipo: 'atalhos',
      itens: [
        {
          titulo: 'Portal corporativo',
          descricao: 'Intranet, comunicados e serviços internos',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://globoservice.service-now.com/now/nav/ui/classic/params/target/home_splash.do%3Fsysparm_direct%3Dtrue'
        },
        {
          titulo: 'Gestão de acessos',
          descricao: 'Solicitação e revisão de permissões',
          categoria: 'Acessos',
          icone: 'pessoas',
          href: 'https://acesso.g.globo'
        },
        {
          titulo: 'Abertura de chamados',
          descricao: 'Registro e acompanhamento de solicitações',
          categoria: 'Solicitação',
          icone: 'chamado',
          href: 'https://globoservice.service-now.com/gse'
        },
        {
          titulo: 'Abertura de GMM',
          descricao: 'Solicitação de GMM',
          categoria: 'Solicitação',
          icone: 'chamado',
          href: 'https://globoservice.service-now.com/gmm'
        },
        {
          titulo: 'ParcerIA da parceria',
          descricao: 'Documentos e arquivos compartilhados',
          categoria: 'Documentos',
          icone: 'parceria',
          href: 'https://tvglobocorp.sharepoint.com/sites/SAEM477/Documentos%20Compartilhados/Forms/AllItems.aspx'
        }
      ]
    },
    {
      titulo: 'Materiais prioritários',
      texto: 'Conteúdos consultados com frequência, fora do fluxo de documentação formal.',
      tipo: 'paineis',
      itens: [
        {
          titulo: 'Contatos de plantão',
          texto: 'Quem acionar fora do horário comercial e em situações de indisponibilidade.',
          meta: 'Emergência'
        },
        {
          titulo: 'Mapa de equipamentos',
          texto: 'Localização física e identificação dos equipamentos sob responsabilidade da parceria.',
          meta: 'Infraestrutura'
        },
        {
          titulo: 'Checklists de operação',
          texto: 'Verificações de início e fim de turno, prontas para imprimir ou preencher.',
          meta: 'Rotina'
        }
      ]
    }
  ],

  /* aviso: 'Conteúdo em construção: os itens acima são a estrutura definida para a página. As URLs reais ainda serão preenchidas no lugar dos "#".' */
};
