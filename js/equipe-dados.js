/* Dados da equipe e identidade compartilhada com a busca. */
(function(){
  'use strict';

  const equipe = [
    { nome: "Gabriel Reis", cargo: "Analista de Soluções de Midias II", area: "Grafismo", foto: "Fotos/EQUIPE/Gabrielzinho.webp", email: "gabriel.reis@g.globo", perfil: "#", destaque: "Idealizador e desenvolvedor" },
    { nome: "Laura Geraldo", cargo: "Analista de Soluções de Midias I", area: "MAM", foto: "Fotos/EQUIPE/Laura.webp", email: "laura.geraldo@g.globo", perfil: "#", destaque: "Idealizadora e desenvolvedora" },
    { nome: "Rennan Silva", cargo: "Analista de Soluções de Midias I", area: "JCORP", foto: "Fotos/EQUIPE/rennan.webp", email: "rennan.silva_savanacomunicacoes@prestador.globo", perfil: "#", destaque: "Idealizador e desenvolvedor" },
    { nome: "Thiago Barreiros", cargo: "COORD SOLUCOES MIDIAS", area: "Gestão", foto: "Fotos/EQUIPE/barreiros.webp", email: "thiago.barreiros@g.globo", perfil: "#" },
    { nome: "Natan Alvin", cargo: "PRODUCT OWNER III", area: "Gestão",  foto: "Fotos/EQUIPE/natan.webp", email: "natan.alvim@g.globo", perfil: "#" },
    { nome: "Nazareth", cargo: "ESPEC SOLUCOES MIDIAS II", area: "Gestão",  foto: "Fotos/EQUIPE/nazareth.webp", email: "nazareth@g.globo", perfil: "#" },
    { nome: "Giovana Souza", cargo: "Analista de Soluções de Midias II", area: "Captação",  foto: "Fotos/EQUIPE/giovana.webp", email: "giovana.souza@g.globo", perfil: "#" },
    { nome: "Everton Fernandes", cargo: "Analista de Soluções de Midias II", area: "JCORP", foto: "Fotos/EQUIPE/everton fernandes.webp", email: "everton.fernandes@g.globo", perfil: "#" },
    { nome: "Bruno Cabral", cargo: "Analista de Soluções de Midias III ", area: "Captação",   foto: "Fotos/EQUIPE/cabral.webp", email: "cabral.bruno@g.globo", perfil: "#" },
    { nome: "Washington Machado", cargo: "Analista de Soluções de Midias II", area: "Grafismo", foto: "Fotos/EQUIPE/washington machado.webp", email: "washington.machado@g.globo", perfil: "#" },
    { nome: "Rafaela Miranda", cargo: "Analista de Soluções de Midias I", area: "MAM",  foto: "Fotos/EQUIPE/rafaela.webp", email: "rafaela.miranda@g.globo", perfil: "#" },
    { nome: "Jonatha Jorge", cargo: "Analista de Soluções de Midias I", area: "Grafismo",    foto: "Fotos/EQUIPE/jonatha jorge.webp", email: "jonatha.jorge@g.globo", perfil: "#" },
    { nome: "Agatha Ferreira", cargo: "Analista de Soluções de Midias II", area: "Captação",  foto: "Fotos/EQUIPE/agatha ferreira.webp", email: "agatha.ferreira@g.globo", perfil: "#" },
    { nome: "Andre Roman", cargo: "Analista de Soluções de Midias III", area: "MAM",   foto: "Fotos/EQUIPE/andre roman.webp", email: "andre.roman@g.globo", perfil: "#" },
    { nome: "Claudio Borges", cargo: "Especialista de Soluções de Midias III", area: "Captação",  foto: "Fotos/EQUIPE/claudio borges.webp", email: "claudio.borges@g.globo", perfil: "#" },
    { nome: "Marcelo Alves", cargo: "Especialista de Soluções de Midias I", area: "Captação",  foto: "Fotos/EQUIPE/marcelo alves.webp", email: "marcelo.alves@g.globo", perfil: "#" },
    { nome: "Cledson Romano", cargo: "Analista de Soluções de Midias I", area: "Grafismo",  foto: "Fotos/EQUIPE/cledson romano.webp", email: "cledson.romano@g.globo", perfil: "#" },
    { nome: "Bruno Sá", cargo: "Analista de Soluções de Midias II", area: "Captação",        foto: "Fotos/EQUIPE/bruno sá.webp", email: "bruno.sa_cis@prestador.globo", perfil: "#" },
    { nome: "Elisa Zhang", cargo: "Analista de Soluções de Midias I", area: "MAM",     foto: "Fotos/EQUIPE/elisa zhang.webp", email: "elisa.zhang@g.globo", perfil: "#" },
    { nome: "Juliana Cristina", cargo: "Analista de Soluções de Midias II", area: "Captação",  foto: "Fotos/EQUIPE/juliana cristina.webp", email: "julianacristina.teixeira@g.globo", perfil: "#" },
    { nome: "Luiz Barcellar", cargo: "Analista de Soluções de Midias II", area: "Captação",  foto: "Fotos/EQUIPE/luiz barcellar.webp", email: "luiz.bacellar@g.globo", perfil: "#" },
    { nome: "Pedro Santos", cargo: "Analista de Soluções de Midias III", area: "MAM",    foto: "Fotos/EQUIPE/pedro santos.webp", email: "pedro.santos@g.globo", perfil: "#" },
    { nome: "Paul Makito", cargo: "Analista de Soluções de Midias III", area: "MAM",   foto: "Fotos/EQUIPE/paul makito.webp", email: "paul.makito@g.globo", perfil: "#" },
    { nome: "Paulo Abel", cargo: "Analista de Soluções de Midias II", area: "Captação",  foto: "Fotos/EQUIPE/paulo abel.webp", email: "paulo.abel@g.globo", perfil: "#" },
    { nome: "Murilo Santos", cargo: "Analista de Soluções de Midias I", area: "IP",    foto: "Fotos/EQUIPE/murilo costa.webp", email: "murilo.santos.costa@g.globo", perfil: "#" },
    { nome: "Tiago Lemos", cargo: "Analista de Soluções de Midias II", area: "MAM",        foto: "Fotos/EQUIPE/tiago lemos.webp", email: "tiago.lemos@g.globo", perfil: "#" },
    { nome: "Victor Rodrigues", cargo: "Analista de Soluções de Midias I", area: "INEWS",     foto: "Fotos/EQUIPE/victor rodrigues.webp", email: "victor.rodrigues_addigital@prestador.globo", perfil: "#" },
    { nome: "Rodrigo Pereira", cargo: "Analista de Soluções de Midias II", area: "INEWS",  foto: "Fotos/EQUIPE/rodrigo pereira.webp", email: "rodrigo.pereira@g.globo", perfil: "#" },
    { nome: "Victor Luiz", cargo: "Analista de Soluções de Midias I", area: "Captação", foto: "Fotos/EQUIPE/victor luiz.webp", email: "victor.luiz_addigital@prestador.globo", perfil: "#" },
    { nome: "Antonio Gomes (Adilson)", cargo: "Analista de Soluções de Midias III", area: "Captação", foto: "Fotos/EQUIPE/antonio gomes.webp", email: "gomes@g.globo", perfil: "#" },
    { nome: "Damiana Jussara", cargo: "Estagiária", area: "Captação",        foto: "Fotos/EQUIPE/damiana jussara.webp", email: "damiana.jussara@g.globo", perfil: "#" },
    { nome: "Carlos Machado", cargo: "Analista de Soluções de Midias III", area: "Integração",           foto: "Fotos/EQUIPE/carlos machado.webp", email: "carlos.machado@g.globo", perfil: "#" },
    { nome: "Darlon Martins", cargo: "Analista de Soluções de Midias II", area: "Integração",        foto: "Fotos/EQUIPE/darlon martins.webp", email: "darlon.martins@g.globo", perfil: "#" },
    { nome: "Marcelo Silva", cargo: "Analista de Broadcast", area: "Integração",     foto: "Fotos/EQUIPE/marcelo silva.webp", email: "marcelo.silva_centauro@prestador.globo", perfil: "#" },
    { nome: "Eduardo Souza", cargo: "Analista de Broadcast", area: "Integração",  foto: "Fotos/EQUIPE/eduardo braga.webp", email: "eduardo.bsouza_centauro@prestador.globo", perfil: "#" },
    { nome: "Vinicius Ribeiro", cargo: "Analista de Broadcast", area: "Integração", foto: "Fotos/EQUIPE/vinicius ribeiro.webp", email: "vinicius.ribeiro_youcast@prestador.globo", perfil: "#" },
   ];
  // CONTRATO: equipe.js usa este id no DOM e busca/indice.js em alvoId.
  // Renomear uma pessoa muda sua âncora; nomes que normalizem para o mesmo
  // valor colidem. tests/unit/conteudo.test.cjs verifica unicidade no cadastro.

  function idDaPessoa(nome){
    return 'pessoa-' + String(nome ?? '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  window.Portal.equipe = { pessoas: equipe, idDaPessoa };
})();
