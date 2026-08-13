
const equipe = [
  { nome: "Gabriel Reis", cargo: "Analista de Soluções de Midias II", area: "Grafismo", foto: "Fotos/EQUIPE/Gabrielzinho.png", email: "gabriel.reis@g.globo", perfil: "#", destaque: "Idealizador e desenvolvedor" },
  { nome: "Laura Geraldo", cargo: "Analista de Soluções de Midias I", area: "MAM & PóS",           foto: "Fotos/EQUIPE/Laura.jpeg", email: "pessoa02@empresa.com", perfil: "#", destaque: "Idealizadora e desenvolvedora" },
  { nome: "Rennan Silva", cargo: "Analista de Soluções de Midias I", area: "JCORP",        foto: "Fotos/EQUIPE/rennan.jpeg", email: "rennan.silva_savanacomunicacoes@prestador.globo", perfil: "#", destaque: "Idealizador e desenvolvedor" },
  { nome: "Thiago Barreiros", cargo: "", area: "COORD SOLUCOES MIDIAS",     foto: "Fotos/EQUIPE/barreiros.png", email: "thiago.barreiros@g.globo", perfil: "#" },
  { nome: "Natan Alvin", cargo: "", area: "PRODUCT OWNER III",  foto: "Fotos/EQUIPE/natan.png", email: "pessoa05@empresa.com", perfil: "#" },
  { nome: "Nazareth", cargo: "", area: "ESPEC SOLUCOES MIDIAS II",        foto: "Fotos/EQUIPE/nazareth.jpeg", email: "pessoa06@empresa.com", perfil: "#" },
  { nome: "Giovana Souza", cargo: "Analista de Soluções de Midias II", area: "CAPTAÇÃO",           foto: "Fotos/EQUIPE/giovana.jpeg", email: "giovana.souza@g.globo", perfil: "#" },
  { nome: "Everton Fernandes", cargo: "Analista de Soluções de Midias II", area: "jcorp",        foto: "Fotos/EQUIPE/pessoa-08.jpg", email: "everton.fernandes@g.globo", perfil: "#" },
  { nome: "Pessoa 09", cargo: "Analista de Soluções", area: "Grafismo",     foto: "Fotos/EQUIPE/pessoa-09.jpg", email: "pessoa09@empresa.com", perfil: "#" },
  { nome: "Pessoa 10", cargo: "Analista de Soluções", area: "Comunicação",  foto: "Fotos/EQUIPE/pessoa-10.jpg", email: "pessoa10@empresa.com", perfil: "#" },
  { nome: "Pessoa 11", cargo: "Analista de Soluções", area: "Vídeo",        foto: "Fotos/EQUIPE/pessoa-11.jpg", email: "pessoa11@empresa.com", perfil: "#" },
  { nome: "Pessoa 12", cargo: "Analista de Soluções", area: "IP",           foto: "Fotos/EQUIPE/pessoa-12.jpg", email: "pessoa12@empresa.com", perfil: "#" },
  { nome: "Pessoa 13", cargo: "Analista de Soluções", area: "Áudio",        foto: "Fotos/EQUIPE/pessoa-13.jpg", email: "pessoa13@empresa.com", perfil: "#" },
  { nome: "Pessoa 14", cargo: "Analista de Soluções", area: "Grafismo",     foto: "Fotos/EQUIPE/pessoa-14.jpg", email: "pessoa14@empresa.com", perfil: "#" },
  { nome: "Pessoa 15", cargo: "Analista de Soluções", area: "Comunicação",  foto: "Fotos/EQUIPE/pessoa-15.jpg", email: "pessoa15@empresa.com", perfil: "#" },
  { nome: "Pessoa 16", cargo: "Analista de Soluções", area: "Vídeo",        foto: "Fotos/EQUIPE/pessoa-16.jpg", email: "pessoa16@empresa.com", perfil: "#" },
  { nome: "Pessoa 17", cargo: "Analista de Soluções", area: "IP",           foto: "Fotos/EQUIPE/pessoa-17.jpg", email: "pessoa17@empresa.com", perfil: "#" },
  { nome: "Pessoa 18", cargo: "Analista de Soluções", area: "Áudio",        foto: "Fotos/EQUIPE/pessoa-18.jpg", email: "pessoa18@empresa.com", perfil: "#" },
  { nome: "Pessoa 19", cargo: "Analista de Soluções", area: "Grafismo",     foto: "Fotos/EQUIPE/pessoa-19.jpg", email: "pessoa19@empresa.com", perfil: "#" },
  { nome: "Pessoa 20", cargo: "Analista de Soluções", area: "Comunicação",  foto: "Fotos/EQUIPE/pessoa-20.jpg", email: "pessoa20@empresa.com", perfil: "#" },
  { nome: "Pessoa 21", cargo: "Analista de Soluções", area: "Vídeo",        foto: "Fotos/EQUIPE/pessoa-21.jpg", email: "pessoa21@empresa.com", perfil: "#" },
  { nome: "Pessoa 22", cargo: "Analista de Soluções", area: "IP",           foto: "Fotos/EQUIPE/pessoa-22.jpg", email: "pessoa22@empresa.com", perfil: "#" },
  { nome: "Pessoa 23", cargo: "Analista de Soluções", area: "Áudio",        foto: "Fotos/EQUIPE/pessoa-23.jpg", email: "pessoa23@empresa.com", perfil: "#" },
  { nome: "Pessoa 24", cargo: "Analista de Soluções", area: "Grafismo",     foto: "Fotos/EQUIPE/pessoa-24.jpg", email: "pessoa24@empresa.com", perfil: "#" },
  { nome: "Pessoa 25", cargo: "Analista de Soluções", area: "Comunicação",  foto: "Fotos/EQUIPE/pessoa-25.jpg", email: "pessoa25@empresa.com", perfil: "#" },
  { nome: "Pessoa 26", cargo: "Analista de Soluções", area: "Vídeo",        foto: "Fotos/EQUIPE/pessoa-26.jpg", email: "pessoa26@empresa.com", perfil: "#" },
  { nome: "Pessoa 27", cargo: "Analista de Soluções", area: "IP",           foto: "Fotos/EQUIPE/pessoa-27.jpg", email: "pessoa27@empresa.com", perfil: "#" },
  { nome: "Pessoa 28", cargo: "Analista de Soluções", area: "Áudio",        foto: "Fotos/EQUIPE/pessoa-28.jpg", email: "pessoa28@empresa.com", perfil: "#" },
  { nome: "Pessoa 29", cargo: "Analista de Soluções", area: "Grafismo",     foto: "Fotos/EQUIPE/pessoa-29.jpg", email: "pessoa29@empresa.com", perfil: "#" },
  { nome: "Pessoa 30", cargo: "Analista de Soluções", area: "Comunicação",  foto: "Fotos/EQUIPE/pessoa-30.jpg", email: "pessoa30@empresa.com", perfil: "#" },
  { nome: "Pessoa 31", cargo: "Analista de Soluções", area: "Vídeo",        foto: "Fotos/EQUIPE/pessoa-31.jpg", email: "pessoa31@empresa.com", perfil: "#" },
  { nome: "Pessoa 32", cargo: "Analista de Soluções", area: "IP",           foto: "Fotos/EQUIPE/pessoa-32.jpg", email: "pessoa32@empresa.com", perfil: "#" },
  { nome: "Pessoa 33", cargo: "Analista de Soluções", area: "Áudio",        foto: "Fotos/EQUIPE/pessoa-33.jpg", email: "pessoa33@empresa.com", perfil: "#" },
  { nome: "Pessoa 34", cargo: "Analista de Soluções", area: "Grafismo",     foto: "Fotos/EQUIPE/pessoa-34.jpg", email: "pessoa34@empresa.com", perfil: "#" },
  { nome: "Pessoa 35", cargo: "Analista de Soluções", area: "Comunicação",  foto: "Fotos/EQUIPE/pessoa-35.jpg", email: "pessoa35@empresa.com", perfil: "#" },
  { nome: "Pessoa 36", cargo: "Analista de Soluções", area: "Vídeo",        foto: "Fotos/EQUIPE/pessoa-36.jpg", email: "pessoa36@empresa.com", perfil: "#" }, 
  { nome: "Pessoa 37", cargo: "Analista de Soluções", area: "IP",           foto: "Fotos/EQUIPE/pessoa-37.jpg", email: "pessoa37@empresa.com", perfil: "#" }
];

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
