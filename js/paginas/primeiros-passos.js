/* Fonte do conteúdo: md/jotbird-document.md ("Guia de Primeiros Passos").
   Ao atualizar o guia, atualize os dois: não há geração automática a partir do
   markdown. Formato dos campos: ver o cabeçalho de js/paginas.js. */
PAGINAS['primeiros-passos'] = {
  titulo: 'Primeiros passos',
  classe: 'primeiros-passos',
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
              titulo: 'Solicitação de Administração de Máquina de Usuário',
              texto: 'Conceder acesso de administrador à máquina do usuário',
              href: 'https://globoservice.service-now.com/gse?id=sc_cat_item&sys_id=8471f39387654a90e7faa6c60cbb3550&table=sc_cat_item&searchTerm=acesso%20a%20maquina'
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
              grupoRotulo: 'Contas e grupos',
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
                { sistema: 'GSIUSRV_560A1',                  perfil: '', href: '' },
                { sistema: 'GSIUSRV_560B1',                  perfil: '', href: '' },
                { sistema: 'GSIUSRV_560C1',                  perfil: '', href: '' },
                { sistema: 'GSIUSRV_720A1',                  perfil: '', href: '' },
                { sistema: 'GSIUSRV_721',                    perfil: '', href: '' },
                { sistema: 'GSIUSRV_726',                    perfil: '', href: '' },
                { sistema: 'GSIUSRV_727',                    perfil: '', href: '' },
                { sistema: 'ibpainfsr073r',                  perfil: '', href: '' },
                { sistema: 'LQPAMOSSRS007a',                 perfil: '', href: '' },
                { sistema: 'LQPAMOSSRS008a',                 perfil: '', href: '' },
                { sistema: 'LQPAMOSSRS009a',                 perfil: '', href: '' },
                { sistema: 'LQPAMOSSRS010a',                 perfil: '', href: '' },
                { sistema: 'MCUX_HN_ADMIN',                  perfil: '', href: '' },
                { sistema: 'MCUX_MAG_ADMIN',                  perfil: '', href: '' },
                { sistema: 'srvvmpapamdvc01r',               perfil: '', href: '' },
                { sistema: 'tech-infrasec-projetosmidia',    perfil: '', href: '' }
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
          titulo: 'Todos os setores',
          tipo: 'fabricantes',
          itens: [
            {
              sistema: 'Sistemas AVID, Glookast e Object Matrix',
              fabricante: 'AVID / Glookast / Object Matrix',
              representante: 'CIS — Rafael Rolando, Rafael Neves, Nuno Freitas, André Moreira',
              email: 'support@cisbrasil.tv\nrafael.rolando@cisbrasil.tv\nrneves@cisbrasil.tv\nnuno@cisbrasil.tv\nandre@cisbrasil.tv',
              telefone: '(21) 99511-0429\n(21) 99535-1679\n(21) 99550-8462\n(21) 98199-1000',
              observacao: 'Em casos de suporte a hardware, utilizar o SysID do equipamento.'
            },
            {
              sistema: 'DELL',
              fabricante: 'DELL',
              representante: 'Unisys — Edson Cardoso',
              email: 'edson.cardoso@br.unisys.com',
              telefone: '(21) 91674-2241'
            }
          ]
        },

        {
          titulo: 'MAM & Acervo',
          tipo: 'fabricantes',
          itens: [
            {
              sistema: 'Sistemas SONY',
              fabricante: 'SONY',
              representante: 'Thiago Macahyba, Ricardo Silva, André Durães Marque, Gustavo Lorena',
              telefone: '(21) 96922-0003\n(21) 98306-3017\n(21) 98219-4647\n+1 786 266-9751',
              observacao: 'Atende também FileBased e SVID.'
            },
            {
              sistema: 'AWS',
              fabricante: 'AWS',
              representante: 'Claranet — Rodrigo Mattos, Paula Medeiros',
              email: 'rodrigo.mattos@br.clara.net\npaula.medeiros@br.clara.net',
              site: 'https://www.claranet.pt/',
              observacao: 'Consultar equipe MAM & Acervo para verificar AWS Manager.'
            },
            {
              sistema: 'Dalet',
              fabricante: 'Dalet',
              representante: 'Pedro Tozato',
              email: 'support@dalet.com',
              telefone: '1-212-2269-6707\n(21) 98833-2212',
              site: 'https://portal.dalet.com/'
            },
            {
              sistema: 'MAM Esporte — Vizrt',
              fabricante: 'Vizrt',
              representante: 'TAC (Technical Account Coordinator) — Wilson Torres',
              email: 'support@vizrt.com\nwto@vizrt.com',
              telefone: '1 866 866 1836',
              contrato: 'C001136 — Globosat (ESI: 868100136000084, CSI: 20123496)\nC001280 — Rede Globo (ESI: 9641002800000D9, CSI: 20291634)'
            },
            {
              sistema: 'DIVA',
              fabricante: 'EcoDigital',
              representante: 'Line Up — Ricardo Crispim',
              email: 'ricardo.chrispim@lineup.com.br',
              telefone: '(21) 99126-6099',
              site: 'https://portal.goecodigital.com/'
            },
            {
              sistema: 'Quantum (Robóticas)',
              fabricante: 'Quantum',
              representante: 'AD Digital — Tuanny Barros, Hugo Nascimento',
              email: 'suporte@ad-digitaltecnologia.com.br',
              telefone: '(11) 94967-0039\n(11) 98627-4432\n(11) 3123-3371\n(11) 3123-3349\n(11) 3467-3353',
              site: 'http://ad-digitaltecnologia.com.br',
              observacao: 'Seriais fitotecas: 263105107 e 263105110.'
            },
            {
              sistema: 'Stornext',
              fabricante: 'Quantum',
              representante: 'AD Digital — Tuanny Barros, Hugo Nascimento, Fabio Honda',
              email: 'suporte@ad-digitaltecnologia.com.br\nfabio.honda@ad-digitaltecnologia.com.br',
              telefone: '(11) 94967-0039\n(11) 98627-4432\n(11) 3123-3371\n(11) 3123-3349\n(11) 3467-3353',
              site: 'http://ad-digitaltecnologia.com.br'
            },
            {
              sistema: 'EVS',
              fabricante: 'EVS — Bruno Pessoa',
              email: 'b.pessoa@evs.com',
              telefone: '(11) 99498-8894'
            },
            {
              sistema: 'Storages Hitachi',
              fabricante: 'Hitachi — Carlos Roballo',
              email: 'carlos.roballo@HitachiVantara.com\nBrazil_CallCenter@hitachivantara.com',
              telefone: '(21) 99147-5361\n0800-772-1044'
            }
          ]
        },

        {
          titulo: 'FileBased',
          tipo: 'fabricantes',
          itens: [
            {
              sistema: 'Vantage',
              fabricante: 'Telestream',
              representante: 'AD Digital — Tuanny Barros, Hugo Nascimento',
              email: 'support@telestream.net\nsuporte@ad-digitaltecnologia.com.br',
              telefone: '877-257-6245\n(11) 94967-0039\n(11) 98627-4432\n(11) 3123-3371\n(11) 3123-3349',
              site: 'http://ad-digitaltecnologia.com.br',
              contrato: 'CED (ID: 30321)\nCED (ID: 33606)\nEG1 (ID: 33348)\nJORNAL (ID: 36521)\nION EXIB (ID: 30455)\nION VoD (ID: 30477)\nION KIT (ID: 35896)\nCPP JB (ID: 30735)',
              observacao: 'Atende também MAM & Acervo.'
            },
            {
              sistema: 'Aspera',
              fabricante: 'IBM',
              representante: 'Line Up — Ricardo Crispim',
              email: 'aspera-support@ibm.com\nricardo.chrispim@lineup.com.br',
              telefone: '(21) 99126-6099',
              contrato: '0860746 — Rede Globo'
            },
            {
              sistema: 'Sistemas Adobe',
              fabricante: 'Adobe — 80004-74558',
              representante: 'Luis Bechtold',
              telefone: '(11) 94238-2834\n(11) 2175-8495'
            },
            {
              sistema: 'Sistemas Autodesk — exceto Flame',
              fabricante: 'Autodesk — Carlos Alejandro, Rodrigo Assaf',
              representante: 'MapData',
              email: 'carlos.alejandro@autodesk.com\nrodassaf@gmail.com\nsuporte@mapdata.com.br',
              telefone: '(21) 3221-9350',
              site: 'https://knowledge.autodesk.com/contact-support/using-my-product'
            },
            {
              sistema: 'Sistemas Autodesk — software Flame',
              fabricante: 'Autodesk — Marta Ezcurra, Beau James',
              representante: 'MapData',
              email: 'me.support@autodesk.com\nMarta.Ezcurra@autodesk.com\nBeau.James@autodesk.com\nsuporte@mapdata.com.br',
              telefone: '(21) 3221-9350'
            },
            {
              sistema: 'Autodesk Flame — storages Quantum (COMPS 1 a 7)',
              fabricante: 'Quantum',
              representante: 'Seal Broadcast',
              email: 'sealbc@desk.ms',
              observacao: 'Números de série dos storages Quantum:\nComp 01 — chassi0 QTMCHOU-171828D902 / chassi1 QTMCHOU-171828D850\nComp 02 — chassi0 QTMCHOU-18023B1F12 / chassi1 QTMCHOU-18023B15A4\nComp 03 — chassi0 QTMCHOU-171828D11A / chassi1 QTMCHOU-171828D90F\nComp 04 — chassi0 QTMCHOU-171828D8DB / chassi1 N/A\nComp 05 — chassi0 QTMCHOU-171828D6B3 / chassi1 QTMCHOU-1718299D0C\nComp 06 — chassi0 QTMCHOU-171828D985 / chassi1 N/A\nComp 07 — chassi0 QTMCHOU-18023B1628 / chassi1 QTMCHOU-18023B16F5'
            },
            {
              sistema: 'Autodesk Flame — CPU HP (COMPS 1 a 7)',
              fabricante: 'HP',
              site: 'https://support.hp.com/us-em',
              observacao: 'Números de série CPU HP:\nCOMP01 — BRJ735J1LL\nCOMP02 — BRJ818R0PJ\nCOMP03 — BRJ735J1LM\nCOMP04 — BRJ735J1LP\nCOMP05 — BRJ735J1LN\nCOMP06 — BRJ735J1LQ\nCOMP07 — BRJ818R0PL'
            },
            {
              sistema: 'Autodesk Flame — CPU, placas e storage Quantum (COMP 12)',
              fabricante: 'Quantum',
              representante: 'Seal Broadcast',
              email: 'sealbc@desk.ms',
              observacao: 'Número de série CPU HP:\nCOMP12 — MXL9161TWT\n\nNúmeros de série storage Quantum (comp12):\nchassi0 QTMCFGD-191244002B\nchassi1 QTMCHOU-18263C31BC'
            }
          ]
        },

        {
          titulo: 'SVID',
          tipo: 'fabricantes',
          itens: [
            {
              sistema: 'Sistemas Panasonic',
              fabricante: 'Panasonic',
              representante: 'Panasonic — Renato Goya',
              email: 'goya.renato@br.panasonic.com',
              telefone: '(11) 98186-5487',
              site: 'https://www.panasonic.com/global/home.html'
            },
            {
              sistema: 'Câmeras Ikegami',
              fabricante: 'Ikegami — Oscar Vaca, Alan Keil',
              representante: 'Phase Engenharia — Danillo',
              email: 'ovaca@ikegami.com\nakeil@ikegami.com\ndanillo@phase.com.br',
              telefone: '+1 (973) 393-2071\n(11) 99845-9880'
            },
            {
              sistema: 'Sistemas GrassValley',
              fabricante: 'GrassValley',
              telefone: '1 800 224 7882'
            },
            {
              sistema: 'Tally',
              fabricante: 'Image Video — David Russel',
              email: 'drussell@imagevideo.com',
              telefone: '(416) 750-8872 ramal 230',
              site: 'www.imagevideo.com'
            }
          ]
        },

        {
          titulo: 'SPEM',
          tipo: 'fabricantes',
          itens: [
            {
              sistema: 'Automação Grid MG4',
              fabricante: 'Telem / SEW — Ricardo',
              email: 'ricardo.fraccao@telem.com.br'
            },
            {
              sistema: 'Sistema de Iluminação ETC',
              fabricante: 'ETC — Kirk',
              representante: 'Arte em Cena — Roseli',
              email: 'kirk.starks@etcconect.com',
              telefone: '(11) 2361-7592',
              site: 'www.atcena.com.br'
            },
            {
              sistema: 'Sistema de Iluminação GrandMA',
              fabricante: 'MA Light',
              representante: 'Ibits — Adriana ou Daniel',
              email: 'contato@lbits.com.br',
              telefone: '(11) 99120-4755'
            },
            {
              sistema: 'Sistema de Automação MG1-3',
              fabricante: 'Radix — Thiago',
              email: 'thiago.pineiro@radixeng.com.br',
              telefone: '(21) 97954-1402'
            },
            {
              sistema: 'Sistemas Robóticos Telemetrics',
              fabricante: 'Telemetrics — Carlos Cordero',
              representante: 'Phase — Danillo',
              email: 'codero@telemetricsinc.com\ndanillo@phase.com.br',
              telefone: '+1 (201) 723-3296\n(11) 99845-9880'
            },
            {
              sistema: 'Sistemas Robóticos MRMC',
              fabricante: 'MRMC — Peter',
              email: 'peter@mrmoco.com'
            },
            {
              sistema: 'Braços Robóticos KUKA',
              fabricante: 'KUKA — Patricia',
              email: 'patricia.pinheiro@kuka.com'
            },
            {
              sistema: 'Sistema de Automação filtro glass',
              fabricante: 'TELEM — Ricardo',
              email: 'ricardo.fraccao@telem.com.br'
            },
            {
              sistema: 'Sistema de Automação Estabili JN',
              fabricante: 'ESTABILI — Paulo Verri',
              email: 'pauloverri@estabili.com'
            },
            {
              sistema: 'Sistema de Automação Telão JN',
              fabricante: 'NA — William',
              email: 'william@naequipamentos.com'
            }
          ]
        },

        {
          titulo: 'SAUD',
          tipo: 'fabricantes',
          itens: [
            {
              sistema: 'Waves',
              fabricante: 'Waves',
              telefone: '1-865-909-9200',
              site: 'https://www.waves.com/account/get-waves-update-plan'
            },
            {
              sistema: 'Minnetonka',
              fabricante: 'Audio Tools',
              representante: 'Telos Alliance — Paulo Campos',
              email: 'support@linearacoustic.com',
              telefone: '(21) 99432-0144',
              site: 'https://www.telosalliance.com/MinnetonkaAudio'
            },
            {
              sistema: 'Dante',
              fabricante: 'Audinate — Giuliano Quiqueto',
              email: 'giuliano.quiqueto@music.yamaha.com'
            },
            {
              sistema: 'EHX System',
              fabricante: 'Savana / Clearcom — João Pedro Homem',
              email: 'joaopedrohomem@savana-comunicacoes.com.br'
            },
            {
              sistema: 'LAWO',
              fabricante: 'LAWO — João Paulo Dacal',
              email: 'joao.dacal@ext.lawo.com'
            },
            {
              sistema: 'Sennheiser',
              fabricante: 'Sennheiser — Daniel Reis',
              email: 'daniel.reis@sennheiser.com'
            },
            {
              sistema: 'Shure',
              fabricante: 'Shure — Alexandre Medeiros',
              representante: 'Shure — Fernando Fortes',
              email: 'medeiros_alexandre@shure.com\nfortes_fernando@shure.com',
              telefone: '(11) 98954-6286\n(11) 98957-4766'
            },
            {
              sistema: 'Studer, TC Electronics e RTW',
              fabricante: 'Studer / TC Electronics / RTW — Henry Spong',
              representante: 'Libor',
              email: 'spong@libor.com.br'
            }
          ]
        },

        {
          titulo: 'CIS e Newsroom',
          tipo: 'fabricantes',
          itens: [
            {
              sistema: 'Linha de Atendimento iNews',
              fabricante: 'CIS GROUP Brasil — Ricardo Freitas, Ulisses Souza',
              email: 'support@cisgroup.tv\nricardo.freitas@cisgroup.tv\nulisses.souza@cisgroup.tv',
              telefone: '(21) 96770-2278\n(21) 99511-0429'
            },
            {
              sistema: 'Linha de Atendimento AVID',
              fabricante: 'CIS GROUP Brasil — Ricardo Freitas, Luis Eduardo',
              email: 'support@cisgroup.tv\nricardo.freitas@cisgroup.tv\nluis.eduardo@cisgroup.tv',
              telefone: '(21) 96770-2278\n(21) 99904-4589'
            },
            {
              sistema: 'SQUAD Newsroom (#ISESC-SM-CORE-NEWSROOM)',
              fabricante: 'NEWSROOM — Tamiris Alfama, Marcos Morais',
              email: 'tamiris.alfama@g.globo'
            }
          ]
        },

        {
          // A planilha de origem não traz setor para estes quatro.
          titulo: 'Sem setor definido na planilha',
          tipo: 'fabricantes',
          itens: [
            {
              sistema: 'Pool de GC',
              fabricante: 'VIZRT — Leandro Piñeiro',
              email: 'lpineiro@vizrt.com',
              site: 'https://www.vizrt.com/\nhttps://community.vizrt.com/login?locale=us'
            },
            {
              sistema: 'Ncam',
              fabricante: 'ZEISS — Leandro Luraschi',
              representante: 'NCAM — Leandro Luraschi',
              email: 'leandro.luraschi.ext@zeiss.com',
              telefone: '+54 9 11 6684-4381'
            },
            {
              sistema: 'ZeroDensity',
              fabricante: 'ZeroDensity — Sergio Amuchastegui',
              representante: 'ZeroDensity — Sergio Amuchastegui',
              email: 'sergio.amuchastegui@zerodensity.tv',
              site: 'https://support.zerodensity.tv',
              observacao: 'Abertura de ticket pelo site.'
            },
            {
              sistema: 'Pixotope',
              fabricante: 'Pixotope',
              representante: 'Tektrade — Maciel',
              email: 'maciel@tektrade.net',
              telefone: '+55 11 98952-9368'
            }
          ]
        }
      ]
    }
  ],

 /* aviso: 'Os contatos dos fabricantes ainda não foram preenchidos no guia de origem (md/jotbird-document.md), por isso aparecem como "a definir". Dois fabricantes também seguem sem nome.'*/
};
