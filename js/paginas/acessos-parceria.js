/* Página "Acessos Parceria" — aberta em index.html#acessos-parceria.
   Formato dos campos: ver o cabeçalho de js/paginas.js.

   "Portais e sistemas" usa `tipo: 'atalhos'` — a grade de cards com busca,
   grade/lista, favorito e "Mostrar mais": ali se procura um destino no meio de
   vários, e não se lê a lista de cabo a rabo. `categoria` é o rótulo curto do
   topo do card. "Alguns links para facilitar o nosso dia a dia" traz o nosso
   linktree e usa o MESMO `tipo: 'atalhos'`: são destinos da mesma natureza dos
   de cima, e duas grades iguais se leem como uma continuação — busca e favorito
   valem para as duas. "Materiais prioritários" segue em `paineis`: são três
   itens ainda por definir, e uma barra de busca sobre três cards não ajuda
   ninguém. */
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
          titulo: 'Abertura de GMM',
          descricao: 'Solicitação de GMM',
          categoria: 'Solicitação',
          icone: 'chamado',
          href: 'https://globoservice.service-now.com/gmm'
        },
        {
          titulo: 'Acesso Globo',
          descricao: 'Solicitação e revisão de permissões',
          categoria: 'Acessos',
          icone: 'pessoas',
          href: 'https://acesso.g.globo'
        },
        {
          titulo: 'ParcerIA',
          descricao: 'Documentos e arquivos compartilhados',
          categoria: 'Documentos',
          icone: 'parceria',
          href: 'https://tvglobocorp.sharepoint.com/sites/SAEM477/Documentos%20Compartilhados/Forms/AllItems.aspx'
        },
        {
          titulo: 'Portal Solicitante Globo',
          descricao: 'Registro e acompanhamento de solicitações',
          categoria: 'Solicitação',
          icone: 'chamado',
          href: 'https://globoservice.service-now.com/gse'
        },
        {
          titulo: 'Portal Solucionador',
          descricao: 'Intranet, comunicados e serviços internos',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://globoservice.service-now.com/now/nav/ui/classic/params/target/home_splash.do%3Fsysparm_direct%3Dtrue'
        },
        {
          titulo: 'Sharepoint ParceriaJB',
          descricao: 'Nossos documentos e arquivos compartilhados',
          categoria: 'Documentos',
          icone: 'documento',
          href: 'https://tvglobocorp.sharepoint.com/sites/SAEM477/SitePages/Home.aspx'
        },
        {
          titulo: 'Transporte Noturno',
          descricao: 'Solicitação de transporte',
          categoria: 'Solicitação',
          icone: 'chamado',
          href: 'https://maistransportes.g.globo/#/login'
        }
      ]
    },
    {
      titulo: 'Alguns links para facilitar o nosso dia a dia',
      texto: 'Os links do nosso linktree, reunidos aqui para não precisar sair do portal.',
      tipo: 'atalhos',
      itens: [
        {
          titulo: 'Acesso ao Splashtop',
          descricao: 'Acesso remoto a computadores',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://www.splashtop.com/pt-br/downloads'
        },
        {
          titulo: 'Actus Media Platform',
          descricao: 'Monitoramento de canais',
          categoria: 'Monitoramento',
          icone: 'monitoramento',
          href: 'https://mediamonitor.rj.g.globo/actus5/channels'
        },
        {
          titulo: 'Aplicativo Acervo',
          descricao: 'Chamados p/ squad Acervo',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://apps.powerapps.com/play/e/default-a7cdc447-3b29-4b41-b73e-8a2cb54b06c6/a/77fb377f-085a-4416-b540-15db381da248?tenantId=a7cdc447-3b29-4b41-b73e-8a2cb54b06c6&amp;hint=27202b3e-1ad2-487b-b850-3ce68ecde62c&amp;sourcetime=1710769000697&amp;source=portal&source=teamsLinkUnfurling'
        },
        {
          titulo: 'Aspera Console',
          descricao: 'Console do Aspera',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://console.hdc.globoi.com/aspera/console'
        },
        {
          titulo: 'Aspera Shares',
          descricao: 'Transferência de arquivos',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://share.hdc.globoi.com/login'
        },
        {
          titulo: 'Busca Almoxarifado GLOBO',
          descricao: 'Catálogo de Materiais Globo',
          categoria: 'Catálogo',
          icone: 'catalogo',
          href: 'https://apps.powerapps.com/play/e/default-a7cdc447-3b29-4b41-b73e-8a2cb54b06c6/a/fe6a7ede-4fc3-4664-88e7-c5ee6cf27df3?tenantId=a7cdc447-3b29-4b41-b73e-8a2cb54b06c6&source=portal&screenColor=rgba(251%2C%20101%2C%2060%2C%201)'
        },
        {
          titulo: 'Câmera Conectada Clust 1',
          descricao: 'Cluster 1',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://bit.ly/3SlDeC4'
        },
        {
          titulo: 'Câmera Conectada Clust 2',
          descricao: 'Cluster 2',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://bit.ly/3QepSFL'
        },
        {
          titulo: 'Colaborativo',
          descricao: 'Material colaborativo',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://novo.colaborativo.apps.g.globo/'
        },
        {
          titulo: 'Conecta',
          descricao: 'Plataforma de conectividade',
          categoria: 'Acessos',
          icone: 'externo',
          href: 'https://idcs-a95530a8629e4343a5d761ca781d7bbc.identity.oraclecloud.com/ui/v1/error?errorCtx=nrXi5dn67rO%2BUJ9MoR7NaGu7%2BN4Ilmi7ax93LacGWX6NxOb7r12xCI5HSGckK8%2BehJt97cQ6ZRX%2Bu2mnK%2FC0FHnS3adlMQARalsu8mrrlDSBS9J%2BiSKxrPYTGEXVaHAGq742jehTk2tWhxOkd7bUXRg0ZStYx%2FkC29bI0C%2B4Z39ufGf3793da77Gp2Jkm0jyOtzDmhtUwf4HsLFaUvkdVPloWdvZdw4f4yc4eHia%2BTM%3D&signature=lPDOAM6kW6h%2Bb%2BwcWeSo%2F%2BxZWSKukKTDVMO30X26UIEa41LeWpbBU5VcHA2BocTecYK4oA06duYcGolKxB4rsU%2F7LX11xYVFQLJGRjTV9%2BN3mxjX3J27NHZtExi97mUCOOd6027InefUMm16iGU2n0WJKHJxm3wnb6P0rtg9awOoN1u%2FTf%2FkeuVXY%2BMebOqtm9FI6vbGgidQheiPeq6Nyia6v7sUU5gY4l6bitJNtubpd6z4eaZcoDIx6uO5ZrRPorp9Ah1y1huKw4OysX3Qys%2BfvU9GBo05EX7UUpxyGFyJiyaDDb8nKPyJjIbEq43VIBAHvf2FYj0H8%2BNLM0zmEA%3D%3D'
        },
        {
          titulo: 'Confluence',
          descricao: 'Documentos e arquivos da nossa base de conhecimento',
          categoria: 'Documentos',
          icone: 'documento',
          href: 'https://globo.atlassian.net/wiki/spaces/PARCERIAJB'
        },
        {
          titulo: 'Control Center',
          descricao: 'Serviços do MAM',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://srvvmpamamcor01.servicos.corp.tvglobo.com.br:9911/controlcenter/web/#services'
        },
        {
          titulo: 'Crawl G1',
          descricao: 'Tarjas Gnews',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://crawl-g1.apps.g.globo/login'
        },
        {
          titulo: 'Criar GMM',
          descricao: 'Abertura de GMM pelo gmm.g.globo',
          categoria: 'Solicitação',
          icone: 'chamado',
          href: 'https://gmm.g.globo/'
        },
        {
          titulo: 'Cronograma Restart Servidores MAM',
          descricao: 'Restarts periódicos dos servidores do MAM',
          categoria: 'Planilha',
          icone: 'planilha',
          href: 'https://tvglobocorp.sharepoint.com/:x:/r/sites/SAEM477/Documentos%20Compartilhados/MAM%20-%20DOCUMENTA%C3%87%C3%83O%20E%20ARQUIVOS/RESTARTS%20PERI%C3%93DICOS/Cronograma%20Restart%20Servidores%20MAM%20JORN%202023.xlsx?d=w124359abc1ec4f3e83cf4fba9f373f97'
        },
        {
          titulo: 'Dash - De onde é esse IP?',
          descricao: 'Consulta de IP da rede',
          categoria: 'Dashboard',
          icone: 'dashboard',
          href: 'https://ipsm.servicos.corp.tvglobo.com.br'
        },
        {
          titulo: 'Dashboard Status das Ilhas',
          descricao: 'Ilhas do Jornalismo no Grafana',
          categoria: 'Dashboard',
          icone: 'dashboard',
          href: 'https://10.181.53.230:3000/d/QvW5TERVk/ilhas-jornalismo-novo?orgId=1&refresh=10s'
        },
        {
          titulo: 'Decupador',
          descricao: 'Acervo Globo',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://decupador.globoi.com'
        },
        {
          titulo: 'EF',
          descricao: 'Acesso remoto a computadores',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://ef-gcp.globoi.com'
        },
        {
          titulo: 'Fluxo de Publicação na EF',
          descricao: 'Publicação na EF',
          categoria: 'Fluxo',
          icone: 'fluxo',
          href: 'https://tvglobocorp.sharepoint.com/:p:/s/SAEM477/EeXj9MRZ7atBtwIaX4wpyNwBR-4FMzPkl2srLYm4_H1DDw?e=eEKgT1&nav=eyJzSWQiOjI1NywiY0lkIjowfQ'
        },
        {
          titulo: 'Globo Service',
          descricao: 'Painel de chamados no ServiceNow',
          categoria: 'Dashboard',
          icone: 'dashboard',
          href: 'https://globoservice.service-now.com/nav_to.do?uri=%2F$pa_dashboard.do%3Fsysparm_dashboard%3D093c679f1b9e981094962170f54bcb5c'
        },
        {
          titulo: 'GMUSIC',
          descricao: 'Biblioteca de música',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://app.gmusic.g.globo/GMUSIC'
        },
        {
          titulo: 'Grafana - Dash de Publicação na EF',
          descricao: 'Dash de Publicação na EF',
          categoria: 'Dashboard',
          icone: 'dashboard',
          href: 'https://www.splashtop.com/pt-br/downloads'
        },
        {
          titulo: 'iGlobo - MACS Manager',
          descricao: 'Visualizador do JAMF',
          categoria: 'Monitoramento',
          icone: 'monitoramento',
          href: 'https://proud-bay-06cd27f0f.7.azurestaticapps.net/login'
        },
        {
          titulo: 'ILHAS JB',
          descricao: 'Máquinas do nosso ambiente',
          categoria: 'Planilha',
          icone: 'planilha',
          href: 'https://tvglobocorp.sharepoint.com/:x:/r/sites/SAEM477/Documentos%20Compartilhados/MAM%20-%20DOCUMENTA%C3%87%C3%83O%20E%20ARQUIVOS/Ilhas%20de%20Edi%C3%A7%C3%A3o%20JB%2002_2023.xlsx?d=wc87a77133740486eaac67ce2e66f45a5&csf=1&web=1&e=RN0iMb'
        },
        {
          titulo: 'JIRA',
          descricao: 'Cards da Parceria JB',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://globo.atlassian.net/jira/software/c/projects/PJ/boards/2908'
        },
        {
          titulo: 'Keeper',
          descricao: 'Gerenciador de senhas',
          categoria: 'Segurança',
          icone: 'escudo',
          href: 'https://keepersecurity.com/vault/#'
        },
        {
          titulo: 'Kubernetes',
          descricao: 'Painel do cluster',
          categoria: 'VM',
          icone: 'vm',
          href: 'https://srvvmpapamcmx01.servicos.corp.tvglobo.com.br:30143/#!/login'
        },
        {
          titulo: 'Losys Web',
          descricao: 'Losys',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://losys-rj.tvg.tv.br/login'
        },
        {
          titulo: 'MAM',
          descricao: 'Visualizador do MAM',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://srvvmpamamcor05.servicos.corp.tvglobo.com.br:9901/WSMViewerWS/WSM.aspx'
        },
        {
          titulo: 'Manual de Ramais, Contatos, Serviços e Sistemas',
          descricao: 'Ramais e responsáveis por serviço',
          categoria: 'Planilha',
          icone: 'planilha',
          href: 'https://tvglobocorp.sharepoint.com/:x:/r/sites/SAEM477/_layouts/15/Doc.aspx?sourcedoc=%7BB1002CA6-F228-442A-8460-EB251998A21E%7D&file=Manual%20de%20Ramais%20Contatos%2C%20Servi%C3%A7os%20e%20Sistemas%20(1).xlsx&action=default&mobileredirect=true'
        },
        {
          titulo: 'Mapeamento das Ilhas Parque JB',
          descricao: 'Ilhas do Parque, por sala e equipamento',
          categoria: 'Planilha',
          icone: 'planilha',
          href: 'https://tvglobocorp.sharepoint.com/:x:/s/SAEM477/ERN3eshAN25IqsZ84uZvRaUBZu5HLjZWiEBKuO-InitjcQ'
        },
        {
          titulo: 'Mapeamento virtual - ZERO DENSITY / NCAM',
          descricao: 'Equipamentos e rede do virtual',
          categoria: 'Planilha',
          icone: 'planilha',
          href: 'https://tvglobocorp-my.sharepoint.com/:x:/r/personal/washington_machado_g_globo/Documents/Microsoft%20Teams%20Chat%20Files/EQUIPAMENTO+REDE%20VIRTUAL%20ZD_NCAM.xlsx?d=we46806619e644671922d3de11d5a8ed1&csf=1&web=1&e=eHP7s7'
        },
        {
          titulo: 'Media Central BSA',
          descricao: 'Praça de Brasília',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://mcs-bsa.servicos.corp.tvglobo.com.br/'
        },
        {
          titulo: 'Media Central Hardnews',
          descricao: 'HN',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://mcs-hardnews-jb.servicos.corp.tvglobo.com.br'
        },
        {
          titulo: 'Media Central Magazine',
          descricao: 'MAG',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://mcs-magazine-jb.servicos.corp.tvglobo.com.br'
        },
        {
          titulo: 'Media Central SP',
          descricao: 'Praça de São Paulo',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://mcs-sp.servicos.corp.tvglobo.com.br/'
        },
        {
          titulo: 'Media Producer',
          descricao: 'Ingest de mídia',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://srvvmpamammp01.servicos.corp.tvglobo.com.br/media-producer#!ingest'
        },
        {
          titulo: 'Media Recife',
          descricao: 'Praça do Recife',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://mcs-recife.servicos.corp.tvglobo.com.br/'
        },
        {
          titulo: 'Media Services',
          descricao: 'Fila de processamento (Master Queue)',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://srvvmpamamms01.servicos.corp.tvglobo.com.br/#!Master%20Queue'
        },
        {
          titulo: 'NewsHUB',
          descricao: 'NewsHUB V2',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://newshub.apps.g.globo/login'
        },
        {
          titulo: 'PCD',
          descricao: 'Acervo Globo',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://pcd.acervo.globoi.com/Index.htm'
        },
        {
          titulo: 'PORTAL RDS',
          descricao: 'Plataforma de conectividade',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://portalrds.corp.tvglobo.com.br/RDWeb/Pages/en-US/Default.aspx'
        },
        {
          titulo: 'Poupa Tempo',
          descricao: 'Serviços internos',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://poupatempo.apps.g.globo/'
        },
        {
          titulo: 'RRD',
          descricao: 'Acervo Globo',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://rrd.acervo.globoi.com'
        },
        {
          titulo: 'Scheduler',
          descricao: 'Agendamentos do MAM',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'http://srvvmpamamscv.servicos.corp.tvglobo.com.br/'
        },
        {
          titulo: 'Sharepoint CDESIGN',
          descricao: 'Documentos do CDesign e do GC',
          categoria: 'Documentos',
          icone: 'documento',
          href: 'https://tvglobocorp.sharepoint.com/sites/SuporteCDesign/Documentos%20Compartilhados/Forms/AllItems.aspx?id=%2Fsites%2FSuporteCDesign%2FDocumentos%20Compartilhados%2FGeneral'
        },
        {
          titulo: 'SPLASHTOP',
          descricao: 'Acesso ao dash do SPLASHTOP, acessa via VPN',
          categoria: 'Dashboard',
          icone: 'dashboard',
          href: 'http://10.3.44.126:8888/'
        },
        {
          titulo: 'Switches & IPs Virtual Production',
          descricao: 'Lista de IPs dos switches',
          categoria: 'Planilha',
          icone: 'planilha',
          href: 'https://tvglobocorp.sharepoint.com/:x:/r/sites/PSM-EquipeRodrigoFerreira/_layouts/15/Doc.aspx?sourcedoc=%7B85941D97-FBD5-47BB-89D4-741C3078D02C%7D&file=SWITCHES%20(Lista%20de%20IPS)%20-%20ATUALIZADO_04-08.xlsx&action=default&mobileredirect=true'
        },
        {
          titulo: 'Troca de senha Corp',
          descricao: 'Troca da senha de rede',
          categoria: 'Segurança',
          icone: 'escudo',
          href: 'https://acesso.g.globo/plugins/pluginPage.jsf?pn=pluginTrocaSenha'
        },
        {
          titulo: 'Uploader',
          descricao: 'Envio de material',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://uploader.apps.g.globo/landing'
        },
        {
          titulo: 'Vantage - JOB STATUS',
          descricao: 'Status dos jobs do Vantage',
          categoria: 'Dashboard',
          icone: 'dashboard',
          href: 'http://10.181.53.20/Vantage/'
        },
        {
          titulo: 'Vcenter MAM',
          descricao: 'Máquinas Virtuais Jornalismo',
          categoria: 'VM',
          icone: 'vm',
          href: 'https://vcentermj.servicos.corp.tvglobo.com.br/websso/SAML2/SSO/vsphere.local?SAMLRequest=zVRdb9MwFP0rkd8Tu243mNV0GisTkzZWloIQL8hxb1qjxA6%2BTtL9e5y0hWqCqXvjMc69x%2BcrmV5uqzJqwaG2JiWjhJEIjLIrbdYp%2Bby8id%2BSy9kUZVXW4qrxG%2FMIPxtAH4U9g2J4kZLGGWElahRGVoDCK5Fd3d8JnjBRO%2ButsiWJrhDB%2BXDRtTXYVOAycK1WcGtWsE1JuHoekLWRfiCz8b5GQWmrwHhw1Y8Eh3mLibKuTny7Lm1uw0OV5I52kCNa2t%2FLaZY90BbrDThISqtkuP3GOgWDhJQUskQg0e08Jd%2BVAlmcjQrFeC5VwS7O4Lzg48mIg%2BLnF3kYw4VE1C38WURsAm300viUcMbPY8ZjzpaciTET7E0yHrFvJFrstb%2FTZufoS0bluyEUH5bLRbx4yJYDQKtX4D6G6ZSc5oSYTMYk%2BnLINECTQ4IDb3d6dvKQGJm9Mo1G0x7%2FkEoFXq6kl1N6TGRHi9eil3c7X9hSq6cjdvz0apWl7a4dSB9s8q6BIe9K%2BpcB%2BhO9iothVNS9ZeiDPhJli57Tp0aWutDgXt3Gf%2BgndK9ZhG9gpXtr8VjwyXE8R9mDtGFlx7WnWnUy9D8woqg2UEmk0nsXD8CUsxGnbELfb4PivipI9iBb1L8xuq5Lun'
        },
        {
          titulo: 'Viz',
          descricao: 'PAM ION',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://viz1.corpg.i.globo/auth/realms/Vizrt/protocol/openid-connect/auth?client_id=VizOneStudio&redirect_uri=https%3A%2F%2Fviz1.corpg.i.globo%2Fstudio%2F&response_type=code&scope=openid&state=d1e5bdff760d4a8b919d5142188710e4&code_challenge=UlEScpiR0FDXvTdHWZu0QD-xqBFOS3yGEdoWmINzCEU&code_challenge_method=S256&response_mode=fragment'
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
