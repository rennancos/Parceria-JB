/* Fonte do conteúdo: md/jotbird-document.md ("Guia de Primeiros Passos").
   Ao atualizar o guia, atualize os dois: não há geração automática a partir do
   markdown. Formato dos campos: ver o cabeçalho de js/paginas.js. */
const FABRICANTES_DA_PLANILHA = [{"nome":"Sistemas AVID, Glookast e Object Matrix","fabricante":"AVID\nGlookast\nObject Matrix","contatoFabricante":"","representante":"CIS","contatoRepresentante":"Rafael Rolando\nRafael Neves\nNuno Freitas\nAndré Moreira\n(21) 99511-0429\n(21) 99535-1679\n(21) 99550-8462\n(21) 98199-1000\nrafael.rolando@cisbrasil.tv\nrneves@cisbrasil.tv\nnuno@cisbrasil.tv\nandre@cisbrasil.tv\nsupport@cisbrasil.tv","site":"","idTicket":"Em casos de suporte a hardware, utilizar o SysID do equipamento.","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"Todos"},{"nome":"DELL","fabricante":"DELL","contatoFabricante":"","representante":"Unisys","contatoRepresentante":"Edson Cardoso\n(21) 91674-2241\nedson.cardoso@br.unisys.com","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"Todos"},{"nome":"Sistemas SONY","fabricante":"SONY","contatoFabricante":"","representante":"","contatoRepresentante":"Thiago Macahyba\nRicardo Silva\nAndré Durães Marque\nGustavo Lorena\n(21) 96922-0003\n(21) 98306-3017\n(21) 98219-4647\n+1 786 266-9751","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"MAM \u0026 Acervo\nFileBased\nSVID"},{"nome":"Vantage","fabricante":"Telestream","contatoFabricante":"877-257-6245 \nsupport@telestream.net","representante":"AD Digital","contatoRepresentante":"Tuanny Barros\nHugo Nascimento\n(11) 94967-0039/(11) 3123-3349\n(11) 98627-4432\n(11) 3123-3371\nsuporte@ad-digitaltecnologia.com.br","site":" http://ad-digitaltecnologia.com.br","idTicket":"CED (ID: 30321)\nCED (ID:33606)\nEG1 (ID: 33348 )\nJORNAL (ID: 36521)\nION EXIB (ID: 30455)\n ION VoD( ID:30477 )\n ION KIT (ID: 35896)\nCPP JB( ID: 30735)","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"MAM \u0026 Acervo\nFileBased"},{"nome":"Aspera","fabricante":"IBM","contatoFabricante":"aspera-support@ibm.com","representante":"Line Up","contatoRepresentante":"Ricardo Crispim\n(21) 99126-6099\nricardo.chrispim@lineup.com.br","site":"","idTicket":"0860746 - Rede Globo","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"Filebased"},{"nome":"Sistemas Adobe","fabricante":"Adobe","contatoFabricante":"80004-74558","representante":"","contatoRepresentante":"Luis Bechtold\n(11) 94238-2834/(11)2175-8495","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"Filebased"},{"nome":"Sistemas Autodesk - Exceto Flame","fabricante":"Autodesk","contatoFabricante":"Carlos Alejandro\nRodrigo Assaf\n\ncarlos.alejandro@autodesk.com\nrodassaf@gmail.com","representante":"MapData","contatoRepresentante":"(21) 3221-9350\nsuporte@mapdata.com.br","site":"https://knowledge.autodesk.com/contact-support/using-my-product","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"Filebased"},{"nome":"Sistemas Autodesk - Software Flame","fabricante":"Autodesk","contatoFabricante":"Marta Ezcurra\nBeau James\n\nme.support@autodesk.com\nMarta.Ezcurra@autodesk.com\nBeau.James@autodesk.com","representante":"MapData","contatoRepresentante":"(21) 3221-9350\nsuporte@mapdata.com.br","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"Filebased"},{"nome":"Sistemas Autodesk - Hardware Flame\n\nStorages QUANTUM: COMPS 1 a 7","fabricante":"Quantum","contatoFabricante":"","representante":"Seal Broadcast","contatoRepresentante":"sealbc@desk.ms","site":"","idTicket":"Números de série dos storages Quantum:\n\nComp 01\nchassi0  - QTMCHOU-171828D902\nchassi1 -  QTMCHOU-171828D850\nComp 02\nchassi0 - QTMCHOU-18023B1F12\nchassi1 - QTMCHOU-18023B15A4\nComp 03\nchassi0 - QTMCHOU-171828D11A\nchassi1 - QTMCHOU-171828D90F\nComp 04\nchassi0 - QTMCHOU-171828D8DB\nchassi1 - N/A\nComp 05\nchassi0 - QTMCHOU-171828D6B3\nchassi1 QTMCHOU-1718299D0C\nComp 06\nchassi0 - QTMCHOU-171828D985\nchassi1 - N/A\nComp 07\nchassi0 - QTMCHOU-18023B1628\nchassi1  - QTMCHOU-18023B16F5","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"Filebased"},{"nome":"Sistemas Autodesk - Hardware Flame\n\nCPU HP: COMPS 1 a 7","fabricante":"HP","contatoFabricante":"","representante":"","contatoRepresentante":"https://support.hp.com/us-em","site":"","idTicket":"Números de série CPU HP:\n\nCOMP01 - BRJ735J1LL\nCOMP02 - BRJ818R0PJ\nCOMP03 - BRJ735J1LM\nCOMP04 - BRJ735J1LP\nCOMP05 - BRJ735J1LN\nCOMP06 - BRJ735J1LQ\nCOMP07 - BRJ818R0PL","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"Filebased"},{"nome":"Sistemas Autodesk - Hardware Flame\n\nCPU + placas + storage Quantum:\nCOMP 12","fabricante":"Quantum","contatoFabricante":"","representante":"Seal Broadcast","contatoRepresentante":"sealbc@desk.ms","site":"","idTicket":"Número de série CPU HP:\n\nCOMP12 -  MXL9161TWT\n\nNúmeros de série storage Quantum:\n\n comp12\nchassi0 QTMCFGD-191244002B\n chassi1 QTMCHOU-18263C31BC","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"Filebased"},{"nome":"AWS","fabricante":"AWS","contatoFabricante":"","representante":"Claranet","contatoRepresentante":"Rodrigo Mattos\nPaula Medeiros\n\nrodrigo.mattos@br.clara.net\npaula.medeiros@br.clara.net","site":"https://www.claranet.pt/","idTicket":"Consultar equipe MAM \u0026 Acervo para verificar AWS Manager","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"MAM \u0026 Acervo"},{"nome":"Dalet","fabricante":"Dalet","contatoFabricante":"1- 212- 2269-6707\nsupport@dalet.com","representante":"","contatoRepresentante":"Pedro Tozato\n(21) 98833-2212","site":"https://portal.dalet.com/","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"MAM \u0026 Acervo"},{"nome":"MAM Esporte - Vizrt","fabricante":"Vizrt","contatoFabricante":"1 866 866 1836\nsupport@vizrt.com","representante":"TAC - Technical Account Coordinator","contatoRepresentante":"Wilson Torres\n\nwto@vizrt.com","site":"","idTicket":"C001136 - Globosat (ESI: 868100136000084, CSI: 20123496)  \nC001280 - Rede Globo (ESI: 9641002800000D9, CSI: 20291634)","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"MAM \u0026 Acervo"},{"nome":"DIVA","fabricante":"EcoDigital","contatoFabricante":"https://portal.goecodigital.com/","representante":"Line Up","contatoRepresentante":"Ricardo Crispim\n(21) 99126-6099\nricardo.chrispim@lineup.com.br","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"MAM \u0026 Acervo"},{"nome":"Quantum (Robóticas)","fabricante":"Quantum","contatoFabricante":"","representante":"AD Digital","contatoRepresentante":"Tuanny Barros\nHugo Nascimento\n(11) 94967-0039/(11) 3123-3349\n(11) 98627-4432\n(11) 3123-3371\n(11) 3123-3349\n(11) 3467-3353\nsuporte@ad-digitaltecnologia.com.br","site":" http://ad-digitaltecnologia.com.br","idTicket":"Seriais fitotecas: 263105107 e 263105110","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"MAM \u0026 Acervo"},{"nome":"Stornext","fabricante":"Quantum","contatoFabricante":"","representante":"AD Digital","contatoRepresentante":"Tuanny Barros\nHugo Nascimento\nFabio Honda\n(11) 94967-0039/(11) 3123-3349\n(11) 98627-4432\n(11) 3123-3371\n(11) 3123-3349\n(11) 3467-3353\nsuporte@ad-digitaltecnologia.com.br\nfabio.honda@ad-digitaltecnologia.com.br","site":" http://ad-digitaltecnologia.com.br","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"MAM \u0026 Acervo"},{"nome":"EVS","fabricante":"EVS","contatoFabricante":"Bruno Pessoa\n(11) 99498-8894\nb.pessoa@evs.com","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"MAM \u0026 Acervo"},{"nome":"Storages Hitatchi","fabricante":"Hitatchi","contatoFabricante":"Carlos Roballo\n(21) 99147-5361\n0800-7721044\ncarlos.roballo@HitachiVantara.com\nBrazil_CallCenter@hitachivantara.com","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"MAM \u0026 Acervo"},{"nome":"Automação Grid MG4","fabricante":"Telem / SEW","contatoFabricante":"Ricardo\n\nricardo.fraccao@telem.com.br","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SPEM"},{"nome":"Sistema Iluminação ETC","fabricante":"ETC","contatoFabricante":"Kirk\n\nkirk.starks@etcconect.com","representante":"Arte em Cena","contatoRepresentante":"Roseli\n(11) 2361-7592\nwww.atcena.com.br","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SPEM"},{"nome":"Sistema Iluminação GrandMA","fabricante":"MA Light","contatoFabricante":"","representante":"Ibits","contatoRepresentante":"Adriana ou Daniel\n(11) 99120-4755\ncontato@lbits.com.br","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SPEM"},{"nome":"Sistema de Automação MG1-3","fabricante":"Radix","contatoFabricante":"Thiago\n(21)979541402\nthiago.pineiro@radixeng.com.br","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SPEM"},{"nome":"Sistema Robóticos Telemetrics","fabricante":"Telemetrics","contatoFabricante":"Carlos Cordero\n+1 (201) 7233296\ncodero@telemetricsinc.com","representante":"Phase","contatoRepresentante":"Danillo \n(11) 998459880 \ndanillo@phase.com.br","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SPEM"},{"nome":"Sistemas Robóticos MRMC","fabricante":"MRMC","contatoFabricante":"Peter\n\npeter@mrmoco.com","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SPEM"},{"nome":"Braço Robóticos kuka","fabricante":"KUKA","contatoFabricante":"Patricia\n\npatricia.pinheiro@kuka.com","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SPEM"},{"nome":"Sisitema de Automoção filtro glass","fabricante":"TELEM","contatoFabricante":"Ricardo\n\nricardo.fraccao@telem.com.br","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SPEM"},{"nome":"Sistema de Automoção Estabili JN","fabricante":"ESTABILI","contatoFabricante":"Paulo Verri\n\npauloverri@estabili.com","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SPEM"},{"nome":"Sistema Automação Telão JN","fabricante":"NA","contatoFabricante":"William\n\nwilliam@naequipamentos.com","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SPEM"},{"nome":"Waves","fabricante":"Waves","contatoFabricante":"1-865-909-9200","representante":"","contatoRepresentante":"","site":"https://www.waves.com/account/get-waves-update-plan","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SAUD"},{"nome":"Minnetonka","fabricante":"Audio Tools","contatoFabricante":"","representante":"Tellos Alliance","contatoRepresentante":"Paulo Campos\n(21) 99432-0144\nsupport@linearacoustic.com","site":"https://www.telosalliance.com/MinnetonkaAudio","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SAUD"},{"nome":"Dante","fabricante":"Audinate","contatoFabricante":"Giuliano Quiqueto\n\ngiuliano.quiqueto@music.yamaha.com","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SAUD"},{"nome":"EHX System","fabricante":"Savana/Clearcom","contatoFabricante":"João Pedro Homem\n\njoaopedrohomem@savana-comunicacoes.com.br","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SAUD"},{"nome":"LAWO","fabricante":"LAWO","contatoFabricante":"João Paulo Dacal\n\njoao.dacal@ext.lawo.com","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SAUD"},{"nome":"Sennheiser","fabricante":"Sennheiser","contatoFabricante":"Daniel Reis\n\ndaniel.reis@sennheiser.com","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SAUD"},{"nome":"Shure","fabricante":"Shure","contatoFabricante":"Alexandre Medeiros\n(11)989546286\nmedeiros_alexandre@shure.com","representante":"Shure","contatoRepresentante":"Fernando Fortes\n(11)989574766\nfortes_fernando@shure.com","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SAUD"},{"nome":"Studer\nTC Eletronics\nRTW","fabricante":"Studer\nTC Eletronics\nRTW","contatoFabricante":"Henry Spong\n\nspong@libor.com.br","representante":"Libor","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SAUD"},{"nome":"Sistemas Panasonic","fabricante":"Panasonic","contatoFabricante":"","representante":"Panasonic","contatoRepresentante":"Renato Goya\n(11) 98186-5487\ngoya.renato@br.panasonic.com","site":"https://www.panasonic.com/global/home.html","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SVID"},{"nome":"Câmeras Ikegami","fabricante":"Ikegami","contatoFabricante":"Oscar Vaca               Alan Keil \n+1 (973) 393-2071\novaca@ikegami.com\nakeil@ikegami.com","representante":"Phase Engenharia","contatoRepresentante":"Danillo \n(11) 998459880 \ndanillo@phase.com.br","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SVID"},{"nome":"Sistemas GrassValley","fabricante":"GrassValley","contatoFabricante":"1 800 224 7882","representante":"","contatoRepresentante":"","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SVID"},{"nome":"Tally","fabricante":"Image Video","contatoFabricante":"David Russel\n(416)750-8872 230\ndrussell@imagevideo.com","representante":"","contatoRepresentante":"","site":"www.imagevideo.com","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"SVID"},{"nome":"Pool de GC","fabricante":"VIZRT","contatoFabricante":"Leandro Piñeiro\n-\nlpineiro@vizrt.com","representante":"-","contatoRepresentante":"","site":"https://www.vizrt.com/","idTicket":"","serviceDesk":"","plataforma":"https://community.vizrt.com/login?locale=us","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":""},{"nome":"Ncam","fabricante":"ZEISS","contatoFabricante":"Leandro Luraschi\n+54 9 11 6684-4381\nleandro.luraschi.ext@zeiss.com","representante":"NCAM","contatoRepresentante":"Leandro Luraschi\n+54 9 11 6684-4381\nleandro.luraschi.ext@zeiss.com","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":""},{"nome":"ZeroDensity","fabricante":"ZeroDensity","contatoFabricante":"Sergio Amuchastegui\n\nAbertura de ticket pelo site","representante":"ZeroDensity","contatoRepresentante":"Sergio Amuchastegui\n\nsergio.amuchastegui@zerodensity.tv","site":"","idTicket":"","serviceDesk":"","plataforma":"https://support.zerodensity.tv","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":""},{"nome":"Pixotope","fabricante":"Pixotope","contatoFabricante":"maciel@tektrade.net","representante":"Tektrade","contatoRepresentante":"Maciel\n\n+55 11 98952-9368","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":""},{"nome":"Linha de Atendimento iNews","fabricante":"CIS GROUP Brasil","contatoFabricante":"Ricardo Freitas\nUlisses Souza\n\nsupport@cisgroup.tv\nricardo.freitas@cisgroup.tv\nulisses.souza@cisgroup.tv","representante":"CIS GROUP Brasil","contatoRepresentante":"Ricardo Freitas\nUlisses Souza","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":"CIS"},{"nome":"SQUAD: Newsroom (#ISESC-SM-CORE-NEWSROOM)","fabricante":"NEWSROOM","contatoFabricante":"Tamiris Alfama\nMarcos Morais\n\ntamiris.alfama@g.globo","representante":"NEWSROOM","contatoRepresentante":"Tamiris Alfama\nMarcos Morais","site":"","idTicket":"","serviceDesk":"","plataforma":"","observacao":"","contrato":"","expiracao":"","cobertura":"","sla":"","prioridades":"","setor":""}];

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
          titulo: 'Lista de fabricantes',
          tipo: 'fabricantes',
          // Os campos em branco estão em branco no documento de origem. Cada um
          // aparece como "a definir" na página — preencha aqui quando o dado
          // real chegar, e não invente portal, e-mail ou telefone de suporte.
          itens: FABRICANTES_DA_PLANILHA
        }
      ]
    }
  ],

 /* aviso: 'Os contatos dos fabricantes ainda não foram preenchidos no guia de origem (md/jotbird-document.md), por isso aparecem como "a definir". Dois fabricantes também seguem sem nome.'*/
};
