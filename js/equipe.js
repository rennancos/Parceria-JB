
const equipe = [
  { nome: "Gabriel Reis", cargo: "Analista de Soluções de Midias II", area: "Grafismo", foto: "Fotos/EQUIPE/Gabrielzinho.png", email: "gabriel.reis@g.globo", perfil: "#", destaque: "Idealizador e desenvolvedor" },
  { nome: "Laura Geraldo", cargo: "Analista de Soluções de Midias I", area: "MAM", foto: "Fotos/EQUIPE/Laura.jpeg", email: "pessoa02@empresa.com", perfil: "#", destaque: "Idealizadora e desenvolvedora" },
  { nome: "Rennan Silva", cargo: "Analista de Soluções de Midias I", area: "JCORP", foto: "Fotos/EQUIPE/rennan.jpeg", email: "rennan.silva_savanacomunicacoes@prestador.globo", perfil: "#", destaque: "Idealizador e desenvolvedor" },
  { nome: "Thiago Barreiros", cargo: "COORD SOLUCOES MIDIAS", area: "gestão", foto: "Fotos/EQUIPE/barreiros.png", email: "thiago.barreiros@g.globo", perfil: "#" },
  { nome: "Natan Alvin", cargo: "PRODUCT OWNER III", area: "gestão",  foto: "Fotos/EQUIPE/natan.png", email: "pessoa05@empresa.com", perfil: "#" },
  { nome: "Nazareth", cargo: "ESPEC SOLUCOES MIDIAS II", area: "GESTÃO",  foto: "Fotos/EQUIPE/nazareth.jpeg", email: "pessoa06@empresa.com", perfil: "#" },
  { nome: "Giovana Souza", cargo: "Analista de Soluções de Midias II", area: "CAPTAÇÃO",  foto: "Fotos/EQUIPE/giovana.jpeg", email: "giovana.souza@g.globo", perfil: "#" },
  { nome: "Everton Fernandes", cargo: "Analista de Soluções de Midias II", area: "jcorp", foto: "Fotos/EQUIPE/everton fernandes.png", email: "everton.fernandes@g.globo", perfil: "#" },
  { nome: "Bruno Cabral", cargo: "Analista de Soluções de Soluções de Midias III ", area: "CAPTAÇÃO",   foto: "Fotos/EQUIPE/cabral.png", email: "cabral.bruno@g.globo", perfil: "#" },
  { nome: "Washington Machado", cargo: "Analista de Soluções de Soluções de Midias II", area: "grafismo", foto: "Fotos/EQUIPE/washington machado.jpeg", email: "washington.machado@g.globo", perfil: "#" },
  { nome: "Rafaela Miranda", cargo: "Analista de Soluções de Soluções de Midias I", area: "MAM",  foto: "Fotos/EQUIPE/rafaela.jpeg", email: "rafaela.miranda@g.globo", perfil: "#" },
  { nome: "Jonatha Jorge", cargo: "Analista de Soluções de Soluções de Midias I", area: "Grafismo",    foto: "Fotos/EQUIPE/jonatha jorge.png", email: "jonathan.jorge@g.globo", perfil: "#" },
  { nome: "Agatha Ferreira", cargo: "Analista de Soluções de Soluções de Midias II", area: "CAPTAÇÃO",  foto: "Fotos/EQUIPE/agatha ferreira.png", email: "agatha.ferreira@g.globo", perfil: "#" },
  { nome: "Andre Roman", cargo: "Analista de Soluções de Soluções de Midias III", area: "MAM",   foto: "Fotos/EQUIPE/andre roman.png", email: "andre.roman@g.globo", perfil: "#" },
  { nome: "Claudio Borges", cargo: "Especialista de Soluções de Midias III", area: "captação",  foto: "Fotos/EQUIPE/claudio borges.png", email: "claudio.borges@g.globo", perfil: "#" },
  { nome: "Marcelo Alves", cargo: "Especialista de Soluções de Midias I", area: "captação",  foto: "Fotos/EQUIPE/marcelo alves.png", email: "marcelo.alves@g.globo", perfil: "#" },
  { nome: "Cledson Romano", cargo: "Analista de Soluções de Soluções de Midias I", area: "Grafismo",  foto: "Fotos/EQUIPE/cledson romano.png", email: "cledson.romano@g.globo", perfil: "#" },
  { nome: "Bruno Sá", cargo: "Analista de Soluções de Soluções de Midias II", area: "CAPTAÇÃO",        foto: "Fotos/EQUIPE/bruno sá.png", email: "bruno.sa_cis@prestador.globo", perfil: "#" },
  { nome: "Elisa Zhang", cargo: "Analista de Soluções de Soluções de Midias I", area: "MAM",     foto: "Fotos/EQUIPE/elisa zhang.png", email: "elisa.zhang@g.globo", perfil: "#" },
  { nome: "Juliana Cristina", cargo: "Analista de Soluções de Soluções de Midias II", area: "CAPTAÇÃO",  foto: "Fotos/EQUIPE/juliana cristina.png", email: "juliana.cristina@g.globo", perfil: "#" },
  { nome: "Luiz Barcellar", cargo: "Analista de Soluções de Soluções de Midias II", area: "CAPTAÇÃO",  foto: "Fotos/EQUIPE/luiz barcellar.png", email: "luiz.barcellar@g.globo", perfil: "#" },
  { nome: "Pedro Santos", cargo: "Analista de Soluções de Soluções de Midias III", area: "MAM",    foto: "Fotos/EQUIPE/pedro santos.png", email: "pedro.santos@g.globo", perfil: "#" },
  { nome: "Paul Makito", cargo: "Analista de Soluções de Soluções de Midias III", area: "MAM",   foto: "Fotos/EQUIPE/paul makito.png", email: "paul.makito@g.globo", perfil: "#" },
  { nome: "Paulo Abel", cargo: "Analista de Soluções de Soluções de Midias II", area: "CAPTAÇÃO",  foto: "Fotos/EQUIPE/paulo abel.png", email: "paulo.abel@g.globo", perfil: "#" },
  { nome: "Murilo Santos", cargo: "Analista de Soluções de Soluções de Midias I", area: "IP",    foto: "Fotos/EQUIPE/murilo costa.png", email: "murilo.santos@g.globo", perfil: "#" },
  { nome: "Tiago Lemos", cargo: "Analista de Soluções de Soluções de Midias II", area: "MAM",        foto: "Fotos/EQUIPE/tiago lemos.png", email: "tiago.lemos@g.globo", perfil: "#" },
  { nome: "Victor Rodrigues", cargo: "Analista de Soluções de Soluções de Midias I", area: "inews",     foto: "Fotos/EQUIPE/victor rodrigues.png", email: "victor.rodrigues_addigital@prestador.globo", perfil: "#" },
  { nome: "Rodrigo Pereira", cargo: "Analista de Soluções de Soluções de Midias II", area: "INEWS",  foto: "Fotos/EQUIPE/rodrigo pereira.png", email: "rodrigo.pereira@g.globo", perfil: "#" },
  { nome: "Victor Luiz", cargo: "Analista de Soluções de Soluções de Midias I", area: "CAPTAÇÃO", foto: "Fotos/EQUIPE/victor luiz.jpg", email: "victor.luiz_addigital@prestador.globo", perfil: "#" },
  { nome: "Antonio Gomes (Adilson)", cargo: "Analista de Soluções de Soluções de Midias III", area: "CAPTAÇÃO", foto: "Fotos/EQUIPE/antonio gomes.png", email: "gomes@g.globo", perfil: "#" },
  { nome: "Damiana Jussara", cargo: "Estagiária", area: "Captação",        foto: "Fotos/EQUIPE/damiana jussara.png", email: "damiana.jussara@g.globo", perfil: "#" },
  { nome: "Carlos Machado", cargo: "Analista de Soluções de Soluções de Midias III", area: "Integração",           foto: "Fotos/EQUIPE/carlos machado.png", email: "carlos.machado@g.globo", perfil: "#" },
  { nome: "Darlon Martins", cargo: "Analista de Soluções de Soluções de Midias II", area: "Integração",        foto: "Fotos/EQUIPE/darlon martins.png", email: "darlon.martins@g.globo", perfil: "#" },
  { nome: "Marcelo Silva", cargo: "Analista de Broadcast", area: "integração",     foto: "Fotos/EQUIPE/marcelo silva.jpeg", email: "marcelo.silva_centauro@prestador.globo", perfil: "#" },
  { nome: "Eduardo Souza", cargo: "Analista de Broadcast", area: "Comunicação",  foto: "Fotos/EQUIPE/eduardo braga.png", email: "eduardo.bsouza_centauro@prestador.globo", perfil: "#" },
  { nome: "Vinicius Ribeiro", cargo: "Analista de Broadcast", area: "Vídeo", foto: "Fotos/EQUIPE/vinicius ribeiro.jpeg", email: "vinicius.ribeiro_youcast@prestador.globo", perfil: "#" },
]
/* ---------- Renderização ---------- */

const teamGrid = document.getElementById('team-grid');
const teamCount = document.getElementById('team-count');
const teamFeatured = document.getElementById('team-featured');
const teamFeaturedGrid = document.getElementById('team-featured-grid');

// Nomes vêm de planilha/RH: podem trazer acento, hífen ou "de/da/dos".
// Pega a primeira e a última palavra "de verdade" para montar as iniciais.
function iniciais(nome){
  const particulas = ['de', 'da', 'do', 'das', 'dos', 'e'];
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((p) => !particulas.includes(p.toLowerCase()));

  if (!partes.length) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

// O array é editado à mão: escapa antes de jogar em innerHTML para que
// um "&" ou aspas num cargo não quebrem o markup.
function escapar(texto){
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

const ICONE_EMAIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`;
const ICONE_PERFIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/></svg>`;

function criarCard(pessoa){
  const card = document.createElement('article');
  card.className = pessoa.destaque ? 'team-card is-featured' : 'team-card';
  card.dataset.area = pessoa.area || '';

  const nome = escapar(pessoa.nome);
  const temPerfil = pessoa.perfil && pessoa.perfil !== '#';

  const linkPerfil = temPerfil
    ? `<a href="${escapar(pessoa.perfil)}" class="team-link" target="_blank" rel="noopener noreferrer" aria-label="Abrir perfil de ${nome}" title="Perfil">${ICONE_PERFIL}</a>`
    : `<span class="team-link is-disabled" aria-hidden="true" title="Perfil não cadastrado">${ICONE_PERFIL}</span>`;

  card.innerHTML = `
    <div class="team-photo-wrapper" data-initials="${escapar(iniciais(pessoa.nome))}">
      <img src="${escapar(pessoa.foto)}" alt="Foto de ${nome}" class="team-photo" loading="lazy">
    </div>

    <div class="team-info">
      ${pessoa.destaque ? `<p class="team-badge">${escapar(pessoa.destaque)}</p>` : ''}
      <h3>${nome}</h3>
      <p class="team-role">${escapar(pessoa.cargo)}</p>
      ${pessoa.area ? `<p class="team-area">${escapar(pessoa.area)}</p>` : ''}

      <div class="team-links">
        <a href="mailto:${escapar(pessoa.email)}" class="team-link" aria-label="Enviar e-mail para ${nome}" title="${escapar(pessoa.email)}">${ICONE_EMAIL}</a>
        ${linkPerfil}
      </div>
    </div>
  `;

  // As iniciais são o estado padrão do avatar (ver .team-photo-wrapper::after);
  // a foto só as cobre depois de carregar de fato. Assim nada pisca como
  // imagem quebrada, e cards ainda fora da tela (loading="lazy") já aparecem
  // apresentáveis antes de a imagem ser buscada.
  const wrapper = card.querySelector('.team-photo-wrapper');
  const foto = card.querySelector('.team-photo');

  foto.addEventListener('load', () => wrapper.classList.add('is-loaded'));
  foto.addEventListener('error', () => foto.remove());

  // Imagem vinda do cache pode já estar pronta antes do listener acima.
  if (foto.complete && foto.naturalWidth > 0) wrapper.classList.add('is-loaded');

  return card;
}

// Um fragment por grade: N cards, um reflow.
function preencher(container, pessoas){
  const fragment = document.createDocumentFragment();
  pessoas.forEach((pessoa) => fragment.appendChild(criarCard(pessoa)));
  container.appendChild(fragment);
}

const destaques = equipe.filter((pessoa) => pessoa.destaque);
const demais = equipe.filter((pessoa) => !pessoa.destaque);

// Sem ninguém marcado, a faixa inteira (incluindo o título) fica fora da página.
if (teamFeatured && teamFeaturedGrid && destaques.length){
  preencher(teamFeaturedGrid, destaques);
  teamFeatured.hidden = false;
}

if (teamGrid) preencher(teamGrid, demais);

// A contagem é da equipe toda: os destaques continuam sendo parte dela.
if (teamCount){
  teamCount.textContent = `${equipe.length} ${equipe.length === 1 ? 'pessoa' : 'pessoas'}`;
}
