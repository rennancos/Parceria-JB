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
          titulo: 'Portal Solucionador',
          descricao: 'Intranet, comunicados e serviços internos',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://globoservice.service-now.com/now/nav/ui/classic/params/target/home_splash.do%3Fsysparm_direct%3Dtrue'
        },
        {
          titulo: 'Acesso Globo',
          descricao: 'Solicitação e revisão de permissões',
          categoria: 'Acessos',
          icone: 'pessoas',
          href: 'https://acesso.g.globo'
        },
        {
          titulo: 'Portal Solicitante Globo',
          descricao: 'Registro e acompanhamento de solicitações',
          categoria: 'Solicitação',
          icone: 'chamado',
          href: 'https://globoservice.service-now.com/gse'
        },
        {
          titulo: 'Sharepoint ParceriaJB',
          descricao: 'Nossos documentos e arquivos compartilhados',
          categoria: 'Documentos',
          icone: 'documento',
          href: 'https://tvglobocorp.sharepoint.com/sites/SAEM477/SitePages/Home.aspx'
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
      titulo: 'Alguns links para facilitar o nosso dia a dia',
      texto: 'Os links do nosso linktree, reunidos aqui para não precisar sair do portal.',
      tipo: 'atalhos',
      itens: [
        {
          titulo: 'Confluence',
          descricao: 'Documentos e arquivos da nossa base de conhecimento',
          categoria: 'Documentos',
          icone: 'documento',
          href: 'https://globo.atlassian.net/wiki/spaces/PARCERIAJB'
        },
        {
          titulo: 'ILHAS JB',
          descricao: 'Máquinas do nosso ambiente',
          categoria: 'Planilha',
          icone: 'planilha',
          href: 'https://tvglobocorp.sharepoint.com/:x:/r/sites/SAEM477/Documentos%20Compartilhados/MAM%20-%20DOCUMENTA%C3%87%C3%83O%20E%20ARQUIVOS/Ilhas%20de%20Edi%C3%A7%C3%A3o%20JB%2002_2023.xlsx?d=wc87a77133740486eaac67ce2e66f45a5&csf=1&web=1&e=RN0iMb'
        },
        {
          titulo: 'iGlobo - MACS Manager',
          descricao: 'Visualizador do JAMF',
          categoria: 'Monitoramento',
          icone: 'monitoramento',
          href: 'https://proud-bay-06cd27f0f.7.azurestaticapps.net/login'
        },
        {
          titulo: 'Conecta',
          descricao: 'Plataforma de conectividade',
          categoria: 'Acessos',
          icone: 'externo',
          href: 'https://idcs-a95530a8629e4343a5d761ca781d7bbc.identity.oraclecloud.com/ui/v1/error?errorCtx=nrXi5dn67rO%2BUJ9MoR7NaGu7%2BN4Ilmi7ax93LacGWX6NxOb7r12xCI5HSGckK8%2BehJt97cQ6ZRX%2Bu2mnK%2FC0FHnS3adlMQARalsu8mrrlDSBS9J%2BiSKxrPYTGEXVaHAGq742jehTk2tWhxOkd7bUXRg0ZStYx%2FkC29bI0C%2B4Z39ufGf3793da77Gp2Jkm0jyOtzDmhtUwf4HsLFaUvkdVPloWdvZdw4f4yc4eHia%2BTM%3D&signature=lPDOAM6kW6h%2Bb%2BwcWeSo%2F%2BxZWSKukKTDVMO30X26UIEa41LeWpbBU5VcHA2BocTecYK4oA06duYcGolKxB4rsU%2F7LX11xYVFQLJGRjTV9%2BN3mxjX3J27NHZtExi97mUCOOd6027InefUMm16iGU2n0WJKHJxm3wnb6P0rtg9awOoN1u%2FTf%2FkeuVXY%2BMebOqtm9FI6vbGgidQheiPeq6Nyia6v7sUU5gY4l6bitJNtubpd6z4eaZcoDIx6uO5ZrRPorp9Ah1y1huKw4OysX3Qys%2BfvU9GBo05EX7UUpxyGFyJiyaDDb8nKPyJjIbEq43VIBAHvf2FYj0H8%2BNLM0zmEA%3D%3D'
        },
        {
          titulo: 'Keeper',
          descricao: 'Gerenciador de senhas',
          categoria: 'Segurança',
          icone: 'escudo',
          href: 'https://keepersecurity.com/vault/#'
        },
        {
          titulo: 'SPLASHTOP',
          descricao: 'Acesso ao dash do SPLASHTOP, acessa via VPN',
          categoria: 'Dashboard',
          icone: 'dashboard',
          href: 'http://10.3.44.126:8888/'
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
          titulo: 'Viz',
          descricao: 'PAM ION',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://viz1.corpg.i.globo/auth/realms/Vizrt/protocol/openid-connect/auth?client_id=VizOneStudio&redirect_uri=https%3A%2F%2Fviz1.corpg.i.globo%2Fstudio%2F&response_type=code&scope=openid&state=d1e5bdff760d4a8b919d5142188710e4&code_challenge=UlEScpiR0FDXvTdHWZu0QD-xqBFOS3yGEdoWmINzCEU&code_challenge_method=S256&response_mode=fragment'
        },
        {
          titulo: 'NewsHUB',
          descricao: 'NewsHUB V2',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://newshub.apps.g.globo/login'
        },
        {
          titulo: 'Crawl G1',
          descricao: 'Tarjas Gnews',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://crawl-g1.apps.g.globo/login'
        },
        {
          titulo: 'Busca Almoxarifado GLOBO',
          descricao: 'Catálogo de Materiais Globo',
          categoria: 'Catálogo',
          icone: 'catalogo',
          href: 'https://apps.powerapps.com/play/e/default-a7cdc447-3b29-4b41-b73e-8a2cb54b06c6/a/fe6a7ede-4fc3-4664-88e7-c5ee6cf27df3?tenantId=a7cdc447-3b29-4b41-b73e-8a2cb54b06c6&source=portal&screenColor=rgba(251%2C%20101%2C%2060%2C%201)'
        },
        {
          titulo: 'Acesso ao Splashtop',
          descricao: 'Acesso remoto a computadores',
          categoria: 'Sistema',
          icone: 'sistema',
          href: 'https://www.splashtop.com/pt-br/downloads'
        },
        {
          titulo: 'EF',
          descricao: 'Acesso remoto a computadores',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://ef-gcp.globoi.com'
        },
        {
          titulo: 'Aplicativo Acervo',
          descricao: 'Chamados p/ squad Acervo',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://apps.powerapps.com/play/e/default-a7cdc447-3b29-4b41-b73e-8a2cb54b06c6/a/77fb377f-085a-4416-b540-15db381da248?tenantId=a7cdc447-3b29-4b41-b73e-8a2cb54b06c6&amp;hint=27202b3e-1ad2-487b-b850-3ce68ecde62c&amp;sourcetime=1710769000697&amp;source=portal&source=teamsLinkUnfurling'
        },
        {
          titulo: 'Grafana - Dash de Publicação na EF',
          descricao: 'Dash de Publicação na EF',
          categoria: 'Dashboard',
          icone: 'dashboard',
          href: 'https://www.splashtop.com/pt-br/downloads'
        },
        {
          titulo: 'Fluxo de Publicação na EF',
          descricao: 'Publicação na EF',
          categoria: 'Fluxo',
          icone: 'fluxo',
          href: 'https://tvglobocorp.sharepoint.com/:p:/s/SAEM477/EeXj9MRZ7atBtwIaX4wpyNwBR-4FMzPkl2srLYm4_H1DDw?e=eEKgT1&nav=eyJzSWQiOjI1NywiY0lkIjowfQ'
        },
        {
          titulo: 'Vcenter MAM',
          descricao: 'Máquinas Virtuais Jornalismo',
          categoria: 'VM',
          icone: 'vm',
          href: 'https://vcentermj.servicos.corp.tvglobo.com.br/websso/SAML2/SSO/vsphere.local?SAMLRequest=zVRdb9MwFP0rkd8Tu243mNV0GisTkzZWloIQL8hxb1qjxA6%2BTtL9e5y0hWqCqXvjMc69x%2BcrmV5uqzJqwaG2JiWjhJEIjLIrbdYp%2Bby8id%2BSy9kUZVXW4qrxG%2FMIPxtAH4U9g2J4kZLGGWElahRGVoDCK5Fd3d8JnjBRO%2ButsiWJrhDB%2BXDRtTXYVOAycK1WcGtWsE1JuHoekLWRfiCz8b5GQWmrwHhw1Y8Eh3mLibKuTny7Lm1uw0OV5I52kCNa2t%2FLaZY90BbrDThISqtkuP3GOgWDhJQUskQg0e08Jd%2BVAlmcjQrFeC5VwS7O4Lzg48mIg%2BLnF3kYw4VE1C38WURsAm300viUcMbPY8ZjzpaciTET7E0yHrFvJFrstb%2FTZufoS0bluyEUH5bLRbx4yJYDQKtX4D6G6ZSc5oSYTMYk%2BnLINECTQ4IDb3d6dvKQGJm9Mo1G0x7%2FkEoFXq6kl1N6TGRHi9eil3c7X9hSq6cjdvz0apWl7a4dSB9s8q6BIe9K%2BpcB%2BhO9iothVNS9ZeiDPhJli57Tp0aWutDgXt3Gf%2BgndK9ZhG9gpXtr8VjwyXE8R9mDtGFlx7WnWnUy9D8woqg2UEmk0nsXD8CUsxGnbELfb4PivipI9iBb1L8xuq5Lun'
        },
        {
          titulo: 'RRD',
          descricao: 'Acervo Globo',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://rrd.acervo.globoi.com'
        },
        {
          titulo: 'PCD',
          descricao: 'Acervo Globo',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://pcd.acervo.globoi.com/Index.htm'
        },
        {
          titulo: 'Decupador',
          descricao: 'Acervo Globo',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://decupador.globoi.com'
        },
        {
          titulo: 'JIRA',
          descricao: 'Cards da Parceria JB',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://globo.atlassian.net/jira/software/c/projects/PJ/boards/2908'
        },
        {
          titulo: 'PORTAL RDS',
          descricao: 'Plataforma de conectividade',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://portalrds.corp.tvglobo.com.br/RDWeb/Pages/en-US/Default.aspx'
        },
        {
          titulo: '',
          descricao: 'Plataforma de conectividade',
          categoria: 'Portal',
          icone: 'portal',
          href: 'https://portalrds.corp.tvglobo.com.br/RDWeb/Pages/en-US/Default.aspx'
        },
        {}
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
