/* Página "Documentação" — aberta em index.html#documentacao.
   Formato dos campos: ver o cabeçalho de js/paginas.js.

   Os manuais moram aqui dentro (não têm mais página própria): quem procura
   "como se faz" e quem procura "qual é a regra" chega pelo mesmo lugar.

   Os três blocos `tipo: 'links'` têm uma `chave`. Ela existe para a edição pela
   própria página (servidor/ — em construção, ver md/09-edicao-pela-pagina.md):
   é o que vai ligar um item ao bloco onde ele aparece. Enquanto isso não estiver
   ligado, os itens são editados aqui mesmo, à mão.

   Formato de um item de lista:

     { titulo: 'Política de acesso', href: 'https://...', formato: 'link' }
     { titulo: 'Manual de Vídeo', href: 'docs/manual-video.pdf' }

   Com `href` de arquivo o formato sai da extensão — não precisa declarar. Item
   sem `href` aparece na lista como "a definir". */
PAGINAS['documentacao'] = {
  titulo: 'Documentação',
  eyebrow: 'Central de conteúdo',
  descricao: 'Processos, políticas, materiais de referência e os manuais das áreas, parte por link e parte em arquivo para baixar.',

  secoes: [
    {
      titulo: 'Categorias',
      texto: 'O acervo é organizado nos blocos abaixo. Cada bloco reúne os documentos vigentes do tema.',
      tipo: 'paineis',
      itens: [
        {
          titulo: 'Processos operacionais',
          texto: 'Como cada rotina da parceria acontece: responsáveis, etapas e pontos de controle.',
          meta: 'Operação'
        },
        {
          titulo: 'Políticas e normas',
          texto: 'Regras internas, conduta e o que precisa ser observado em cada tipo de demanda.',
          meta: 'Governança'
        },
        {
          titulo: 'Fluxos de atendimento',
          texto: 'Caminho de abertura, triagem e encerramento das solicitações recebidas.',
          meta: 'Atendimento'
        },
        {
          titulo: 'Padrões técnicos',
          texto: 'Convenções de vídeo, áudio, IP e grafismo adotadas pelas equipes da parceria.',
          meta: 'Técnico'
        },
        {
          titulo: 'Modelos e formulários',
          texto: 'Documentos-base prontos para preencher, evitando retrabalho e formatos divergentes.',
          meta: 'Modelos'
        },
        {
          titulo: 'Manuais',
          texto: 'Passo a passo das ferramentas e operações, organizado por área, mais abaixo nesta página.',
          meta: 'Passo a passo'
        },
        {
          titulo: 'Glossário',
          texto: 'Termos, siglas e abreviações usados no dia a dia, com o significado adotado aqui.',
          meta: 'Referência'
        }
      ]
    },

    {
      titulo: 'Documentos',
      texto: 'Cada item abre no formato em que é mantido: endereço do portal quando o conteúdo vive lá, arquivo quando é um documento fechado.',
      blocos: [
        {
          tipo: 'links',
          chave: 'processos-politicas',
          titulo: 'Processos e políticas',
          itens: [
            { titulo: 'Processos operacionais da parceria', descricao: 'Rotinas, responsáveis e pontos de controle' },
            { titulo: 'Políticas e normas internas', descricao: 'Conduta e regras por tipo de demanda' },
            { titulo: 'Fluxo de atendimento', descricao: 'Abertura, triagem e encerramento de solicitações' }
          ]
        },
        {
          tipo: 'links',
          chave: 'padroes-modelos',
          titulo: 'Padrões, modelos e referência',
          itens: [
            { titulo: 'Padrões técnicos', descricao: 'Vídeo, áudio, IP e grafismo' },
            { titulo: 'Modelos e formulários', descricao: 'Documentos-base prontos para preencher' },
            { titulo: 'Glossário da parceria', descricao: 'Termos, siglas e abreviações' }
          ]
        }
      ]
    },

    {
      titulo: 'Manuais por área',
      texto: 'Cada área mantém os próprios manuais, com o passo a passo das ferramentas que opera.',
      blocos: [
        {
          tipo: 'paineis',
          itens: [
            {
              titulo: 'Vídeo',
              texto: 'Roteamento, monitoração e configuração dos equipamentos e sistemas de vídeo.',
              meta: 'Vídeo'
            },
            {
              titulo: 'Áudio',
              texto: 'Cadeia de áudio, mesas, embarque, desembarque e verificação de níveis.',
              meta: 'Áudio'
            },
            {
              titulo: 'IP',
              texto: 'Transporte sobre IP, endereçamento, fluxos e checagens de rede da operação.',
              meta: 'IP'
            },
            {
              titulo: 'Grafismo',
              texto: 'Geração de caracteres, inserção de arte e integração com a operação no ar.',
              meta: 'Grafismo'
            },
            {
              titulo: 'Comunicação',
              texto: 'Intercom, canais de contato e procedimentos de comunicação durante a operação.',
              meta: 'Comunicação'
            },
            {
              titulo: 'Tally',
              texto: 'Instalação, configuração e uso do TallyFlow na operação da parceria.',
              meta: 'Ferramenta'
            }
          ]
        },
        {
          tipo: 'links',
          chave: 'manuais',
          titulo: 'Manuais publicados',
          itens: [
            { titulo: 'Manual de Vídeo', descricao: 'Roteamento, monitoração e configuração' },
            { titulo: 'Manual de Áudio', descricao: 'Cadeia, mesas e verificação de níveis' },
            { titulo: 'Manual de IP', descricao: 'Endereçamento, fluxos e checagens de rede' },
            { titulo: 'Manual de Grafismo', descricao: 'Caracteres, arte e integração com o ar' },
            { titulo: 'Manual de Comunicação', descricao: 'Intercom e canais de contato' },
            { titulo: 'TallyFlow', descricao: 'Instalação, configuração e uso' }
          ]
        }
      ]
    },

    {
      titulo: 'Como usar um manual',
      texto: 'Toda instrução daqui segue o mesmo formato, para que dê para executar sem depender de quem escreveu.',
      tipo: 'passos',
      itens: [
        {
          titulo: 'Confirme a versão',
          texto: 'Cada manual traz a data da última revisão. Se estiver desatualizado, avise a pessoa responsável pela área.'
        },
        {
          titulo: 'Cheque os pré-requisitos',
          texto: 'Acessos, equipamentos e permissões necessários vêm listados antes do primeiro passo.'
        },
        {
          titulo: 'Siga na ordem',
          texto: 'Os passos pressupõem o estado deixado pelo anterior; pular etapas é a causa mais comum de erro.'
        },
        {
          titulo: 'Reporte divergências',
          texto: 'Se a realidade não bater com o manual, registre: é assim que a documentação se mantém confiável.'
        }
      ]
    }
  ],

  /* aviso: 'Conteúdo em construção: os itens marcados como "a definir" já estão no lugar certo, faltando só o destino — o endereço do portal, quando o conteúdo vive lá, ou o arquivo DOC/PDF, quando é documento fechado.' */
};
