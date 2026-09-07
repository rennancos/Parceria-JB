/* Fonte do conteúdo: md/jotbird-document.md ("Guia de Primeiros Passos").
   Ao atualizar o guia, atualize os dois: não há geração automática a partir do
   markdown. Formato dos campos: ver o cabeçalho de js/paginas.js. */
PAGINAS['primeiros-passos'] = {
  titulo: 'Primeiros passos',
  eyebrow: 'Comece por aqui',
  descricao: 'Seja bem-vindo(a)! Este guia foi criado para ajudá-lo(a) a obter rapidamente todos os acessos e contatos necessários para iniciar suas atividades.',

  secoes: [
    {
      titulo: '1. Solicitação de acesso a ambientes restritos',
      texto: 'Algumas atividades exigem acesso a ambientes restritos, utilizados para administração, suporte, monitoramento e integração de soluções.',
      blocos: [
        {
          titulo: 'Como solicitar',
          tipo: 'passos',
          itens: [
            {
              titulo: 'Acesse o portal do solicitante',
              texto: 'Entre no portal do solicitante do Globo Service.'
            },
            {
              titulo: 'Abra um chamado na categoria correta',
              texto: 'A categoria a ser usada é:',
              destaque: 'Finanças, Jurídico e Infraestrutura > Acessos a Áreas e Ambientes', 
              href: 'https://globoservice.service-now.com/gse?id=sc_cat_item&table=sc_cat_item&sys_id=5e7309411b031c1097c0dca0f54bcbeb'
            },
            {
              titulo: 'Preencha as informações solicitadas',
              texto: 'Em caso de dúvida, peça auxílio a alguém da equipe.'
            }
          ]
        },
        {
          titulo: 'Informações importantes',
          tipo: 'notas',
          itens: [
            'Todo acesso a ambientes restritos exige aprovação prévia do gestor responsável.',
            'O acesso será concedido de acordo com a função e a necessidade do colaborador.',
            'O uso dos acessos é monitorado e deve seguir as diretrizes corporativas.'
          ]
        }
      ]
    },

    {
      titulo: '2. Solicitação de acesso a sistemas',
      texto: 'Para utilizar os sistemas corporativos, é necessário solicitar os perfis de acesso adequados.',
      blocos: [
        {
          titulo: 'Como solicitar',
          tipo: 'passos',
          itens: [
            {
              titulo: 'Acesse o portal de atendimento',
              texto: 'Entre no Acesso Globo.'
            },
            {
              titulo: 'Solicite os perfis da equipe',
              texto: 'Peça os acessos aos sistemas utilizados pela equipe. A lista abaixo cobre os mais frequentes.'
            }
          ]
        },
        {
          titulo: 'Sistemas mais utilizados',
          tipo: 'sistemas',
          itens: [
            { sistema: 'COLABORATIVO', perfil: 'UPLOADER – TECNOLOGIA' },
            { sistema: 'CONFLUENCE',   perfil: 'PLATAFORMAS DE PRODUÇÃO' },
            { sistema: 'CRAWL-G1',     perfil: 'ADMINISTRADOR – IT' },
            { sistema: 'CRAWL-GE',     perfil: 'ADMINISTRADOR' },
            { sistema: 'iNEWS',        perfil: 'GBSAT - SUPERUSUARIO – IT' },
            { sistema: 'iNEWS',        perfil: 'RIO - GRUPO AD – IT' },
            { sistema: 'iNEWS',        perfil: 'RIO - SUPERUSUARIO – IT' },
            { sistema: 'iNEWS',        perfil: 'SP - SUPERUSUARIO – IT' },
            { sistema: 'MAM',          perfil: 'ACERVO ION RJ - SUPORTE AVANÇADO JB (N1)' },
            { sistema: 'MIDIA LAKE',   perfil: 'PARCERIA JB – IT' },
            { sistema: 'PAM',          perfil: 'HARDNEWS - RJ – ADMINISTRADOR' },
            { sistema: 'PAM',          perfil: 'BELO HORIZONTE – TECNOLOGIA' },
            { sistema: 'PAM',          perfil: 'MAGAZINE - RJ – ADMINISTRADOR' },
            { sistema: 'POUPATEMPO',   perfil: 'ADMINISTRADOR' }
          ]
        },
        {
          titulo: 'Informações importantes',
          tipo: 'notas',
          itens: [
            'O acesso somente será liberado após aprovação do gestor responsável.',
            'Em caso de dúvida sobre o perfil correto, consulte o time.'
          ]
        }
      ]
    },

    {
      titulo: '3. Contato com fabricantes',
      texto: 'Determinados incidentes ou solicitações exigem interação direta com fabricantes.',
      blocos: [
        {
          titulo: 'Quando acionar um fabricante',
          tipo: 'notas',
          itens: [
            'Problemas identificados no produto.',
            'Abertura de chamados de suporte.',
            'Dúvidas sobre funcionalidades.',
            'Solicitação de patches ou atualizações.'
          ]
        },
        {
          titulo: 'Lista de fabricantes',
          tipo: 'fabricantes',
          // Os campos em branco estão em branco no documento de origem. Cada um
          // aparece como "a definir" na página — preencha aqui quando o dado
          // real chegar, e não invente portal, e-mail ou telefone de suporte.
          itens: [
            {
              nome: 'Vizrt',
              portal: '',
              email: '',
              telefone: '',
              horario: ''
            },
            {
              nome: 'Fabricante 2',
              portal: '',
              email: '',
              telefone: '',
              horario: '24x7'
            },
            {
              nome: 'Fabricante 3',
              portal: '',
              email: '',
              telefone: '',
              horario: ''
            }
          ]
        }
      ]
    }
  ],

 /* aviso: 'Os contatos dos fabricantes ainda não foram preenchidos no guia de origem (md/jotbird-document.md), por isso aparecem como "a definir". Dois fabricantes também seguem sem nome.'*/
};
