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
      titulo: '2. Acesso a sistemas',
      texto: 'Neste guia, você encontrará informações sobre como solicitar e utilizar o Globo Service.',
      blocos: [
        {
          titulo: 'Como acessar',
          tipo: 'passos',
          itens: [
            {
              titulo: 'Solicite os perfis da usuário',
              texto: 'Solicitar alteração do perfil de um usuário no Globo Service ou alterar os grupos.',
              href: 'https://globoservice.service-now.com/gse?id=sc_cat_item&sys_id=dd8dda0e1beb109094962170f54bcba8&table=sc_cat_item&searchTerm=perfil%20de%20usuario'
            },
            {
              titulo: 'Administração de Conta ADM',
              texto: 'Gerenciar criação, renovação ou bloqueio de conta ADM.',
              href: 'https://globoservice.service-now.com/gse?id=sc_cat_item&sys_id=33035b461b379c1094962170f54bcb59&table=sc_cat_item&searchTerm=Administra%C3%A7%C3%A3o%20de%20Conta%20ADM'
            },
            {
              titulo: 'Controle de Acesso de Pasta de Rede e Arquivos',
              texto: 'Acessar uma pasta de rede, remover.',
              href: 'https://globoservice.service-now.com/gse?id=sc_cat_item&sys_id=b09c0b5c1bee141094962170f54bcb16&table=sc_cat_item&searchTerm=Controle%20de%20Acesso%20de%20Pasta%20de%20Rede%20e%20Arquivos'
            },
            {
              titulo: 'Administração de AD',
              texto: 'Gerenciamento de contas',
              href: 'https://globoservice.service-now.com/gse?id=sc_cat_item&sys_id=38bf37511b12d01097c0dca0f54bcb36&table=sc_cat_item&searchTerm=Administra%C3%A7%C3%A3o%20de%20grupo',
              grupos: [
                { sistema: 'SAEM',                           perfil: '', href: '' },
                { sistema: 'SAEM_ADM',                       perfil: '', href: '' },
                { sistema: 'ADM_accounts',                   perfil: '', href: '' },
                { sistema: 'CLPADSR5R004r',                  perfil: '', href: '' },
                { sistema: 'CLPADSR5R005r',                  perfil: '', href: '' },
                { sistema: 'CLPADSR5R006r',                  perfil: '', href: '' },
                { sistema: 'CLPADSR5R007r',                  perfil: '', href: '' },
                { sistema: 'CMPAINFSR022r',                  perfil: '', href: '' },
                { sistema: 'CMPAINFSR062R',                  perfil: '', href: '' },
                { sistema: 'cmpamepsr001a',                  perfil: '', href: '' },
                { sistema: 'cmpamepsr002a',                  perfil: '', href: '' },
                { sistema: 'Domain Users',                   perfil: '', href: '' },
                { sistema: 'GSIUSRV_560A1',                  perfil: '', href: '' },
                { sistema: 'GSIUSRV_560B1',                  perfil: '', href: '' },
                { sistema: 'GSIUSRV_560C1',                  perfil: '', href: '' },
                { sistema: 'GSIUSRV_720A1',                  perfil: '', href: '' },
                { sistema: 'GSIUSRV_721',                    perfil: '', href: '' },
                { sistema: 'GSIUSRV_726',                    perfil: '', href: '' },
                { sistema: 'GSIUSRV_727',                    perfil: '', href: '' },
                { sistema: 'ibpainfsr073r',                  perfil: '', href: '' },
                { sistema: 'KeeperRotation_Users',           perfil: '', href: '' },
                { sistema: 'LQPAMOSSRS007a',                 perfil: '', href: '' },
                { sistema: 'LQPAMOSSRS008a',                 perfil: '', href: '' },
                { sistema: 'LQPAMOSSRS009a',                 perfil: '', href: '' },
                { sistema: 'LQPAMOSSRS010a',                 perfil: '', href: '' },
                { sistema: 'MCUX_HN_ADMIN',                  perfil: '', href: '' },
                { sistema: 'srvvmpapamdvc01r',               perfil: '', href: '' },
                { sistema: 'tech-infrasec-projetosmidia',    perfil: '', href: '' },
                { sistema: 'WirelessAccounts',               perfil: '', href: '' },
                { sistema: 'Wirelessaccounts_ISE_CONFIG.',   perfil: '', href: '' }
              ]
            },
            {
              titulo: 'Solicitação de Usuários e Acessos ',
              texto: 'Administração de usuários e acessos',
              href: 'https://globoservice.service-now.com/gse?id=sc_cat_item&sys_id=fa0873521b1ed01094962170f54bcbd1&table=sc_cat_item&searchTerm=perfil%20de%20usuario'
            },
            {
              titulo: 'Acesse ao Guia do Globo Service',
              texto: 'Entre no KB.',
              href: 'https://globoservice.service-now.com/gse?id=kb_article&sysparm_article=KB0106301&table=kb_knowledge&searchTerm=globoservice'
            },
            {
              titulo: 'Configurando VPN',
              texto: 'Acesse o KB.',
              href: 'https://globoservice.service-now.com/gse?id=kb_article_view&sys_kb_id=9b6e61103bcb4bd05c740237f4e45a0a'

            },
            {
              titulo: 'Como Solicitar acesso a Sistemas',
              texto: 'Acesse o KB.',
              href: 'https://globoservice.service-now.com/gse?id=kb_article_view&sys_kb_id=103a25903b474bd05c740237f4e45a6f'
            },
            {
              titulo: 'Como Solicitar uma CHG',
              texto: 'Acesse o KB.',
              href: 'https://globoservice.service-now.com/gse?id=kb_article&sysparm_article=KB0112927&topic_id=da7e2f7e87d31a509ad332a70cbb3579'
            },
          ]
        },
        {
          titulo: 'Sistemas mais utilizados',
          tipo: 'sistemas',
          itens: [
            { sistema: 'CONFLUENCE',   perfil: 'SOLICITAR CONFLUENCE | GOVERNANÇA E ESTRATÉGIA DE TECNOLOGIA', href: 'https://acesso.g.globo/accessRequest/accessRequest.jsf#/accessRequestSelf/add?quickLink=Request%20Access' },
            { sistema: 'COLABORATIVO',  perfil: 'SOLICITAR COLABORATIVO | RJO - RIO DE JANEIRO - RCJ', href: 'https://acesso.g.globo/accessRequest/accessRequest.jsf#/accessRequestSelf/add?quickLink=Request%20Access' },
            { sistema: 'UPLOADER', perfil: 'SOLICITAR COLABORATIVO | UPLOADER - TECNOLOGIA', href: 'https://acesso.g.globo/accessRequest/accessRequest.jsf#/accessRequestSelf/add?quickLink=Request%20Access' },
            { sistema: 'TELA INTERATIVA', perfil: 'SOLICITAR TELA INTERATIVA ADM PARA TODOS DA GNEWS E A PRAÇA DO RIO', href:'https://acesso.g.globo/accessRequest/accessRequest.jsf#/accessRequestSelf/add?quickLink=Request%20Access' },
            { sistema: 'CRAWL-G1',     perfil: 'SOLICITAR CRAWL-G1 | ADMINISTRAÇÃO', href: 'https://acesso.g.globo/accessRequest/accessRequest.jsf#/accessRequestSelf/add?quickLink=Request%20Access' },
            { sistema: 'POUPATEMPO',   perfil: 'SOLICITAR POUPATEMPO | ADMINISTRADOR', href: 'https://acesso.g.globo/accessRequest/accessRequest.jsf#/accessRequestSelf/add?quickLink=Request%20Access' },
            { sistema: 'SCOUT', perfil: 'SOLICITAR SCOUT | ADMINISTRAÇÃO E SCOUTWEB FUTEBOL | GC', href: 'https://acesso.g.globo/accessRequest/accessRequest.jsf#/accessRequestSelf/add?quickLink=Request%20Access' },
            { sistema: 'DANTE', perfil: 'CAP&CORE', href: '' },
            { sistema: 'MEDIA CENTRAL HN', perfil: 'MAM&PÓS', href: '' },
            { sistema: 'MEDIA CENTRAL MAG', perfil: 'MAM&PÓS', href: '' },
            { sistema: 'ADOBE',   perfil: 'MAM&PÓS', href: '' },
            { sistema: 'MEDIA SERVICE',     perfil: 'MAM&PÓS', href: '' },
            { sistema: 'MEDIA COMPOSER', perfil: 'MAM&PÓS', href: '' },
            { sistema: 'MEDIA PRODUCER',  perfil: 'MAM&PÓS', href: '' },
            { sistema: 'AVID INTERPLAY', perfil: 'MAM&PÓS', href: '' }
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
            },
            {  
              nome: 'Fabricante 4',
              portal: '',
              email: '',
              telefone: '',
              horario: ''
            },
            {
              nome: 'Fabricante 5',
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
