/* Cards da equipe. Dados e identidade ficam em equipe-dados.js. */
(function(){
  'use strict';
  const { pessoas: equipe, idDaPessoa } = window.Portal.equipe;
  const escapar = window.Portal.escaparHtml;
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

  const ICONE_EMAIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`;
  const ICONE_PERFIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/></svg>`;

  function criarCard(pessoa){
    const card = document.createElement('article');
    card.className = pessoa.destaque ? 'team-card is-featured' : 'team-card';
    card.dataset.area = pessoa.area || '';
    card.id = idDaPessoa(pessoa.nome);

    const nome = escapar(pessoa.nome);
    const temPerfil = pessoa.perfil && pessoa.perfil !== '#';

    const linkPerfil = temPerfil
      ? `<a href="${escapar(pessoa.perfil)}" class="team-link" target="_blank" rel="noopener noreferrer" aria-label="Abrir perfil de ${nome}" title="Perfil">${ICONE_PERFIL}</a>`
      : `<span class="team-link is-disabled" aria-hidden="true" title="Perfil não cadastrado">${ICONE_PERFIL}</span>`;

    card.innerHTML = `
      <div class="team-photo-wrapper" data-initials="${escapar(iniciais(pessoa.nome))}">
        <img src="${escapar(pessoa.foto)}" alt="Foto de ${nome}" class="team-photo"
             width="264" height="264" loading="lazy" decoding="async">
      </div>

      <div class="team-info">
        ${pessoa.destaque ? `<p class="team-badge">${escapar(pessoa.destaque)}</p>` : ''}
        <h3>${nome}</h3>
        <p class="team-role">${escapar(pessoa.cargo)}</p>
        ${pessoa.area ? `<p class="team-area">${escapar(pessoa.area)}</p>` : ''}

        <div class="team-links">
          <a href="mailto:${escapar(pessoa.email)}" class="team-link" data-email="${escapar(pessoa.email)}" aria-label="Enviar e-mail para ${nome}" title="${escapar(pessoa.email)}">${ICONE_EMAIL}</a>
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

  /* ---------- Saída de emergência do mailto: ----------

     O `mailto:` continua sendo o link, e é o que respeita o cliente de e-mail
     de cada pessoa. O problema é o silêncio quando não há cliente nenhum
     registrado no sistema: o clique não faz absolutamente nada — nem erro, nem
     aviso. Acontece bastante no Windows desde que a Microsoft aposentou o app
     "Correio" e o registro continuou apontando para ele.

     Detecção pelo foco: quando um cliente assume o mailto, ele abre e a aba
     PERDE o foco. Se depois de ESPERA_CLIENTE a aba ainda está com foco,
     ninguém assumiu — e aí o endereço vai para a área de transferência com um
     aviso, em vez de o clique morrer calado. */

  const ESPERA_CLIENTE = 1200;
  const AVISO_MS = 5000;

  async function copiar(texto){
    /* `navigator.clipboard` só existe em contexto seguro, e o portal roda em
       HTTP puro na VM — exatamente onde isto precisa funcionar. Por isso o
       caminho antigo (textarea + execCommand) fica como reserva, mesmo
       depreciado: é o único que responde em http://. */
    try {
      if (navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(texto);
        return true;
      }
    } catch (e) { /* permissão negada: cai para o execCommand */ }

    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    campo.style.cssText = 'position:fixed;top:-999px;opacity:0';
    document.body.appendChild(campo);
    campo.select();

    let copiou = false;
    try { copiou = document.execCommand('copy'); } catch (e) { copiou = false; }
    campo.remove();
    return copiou;
  }

  let avisoAberto = null;

  function avisar(texto){
    avisoAberto?.remove();

    // role="status" para quem usa leitor de tela receber o aviso sem que o
    // foco saia de onde estava.
    const aviso = document.createElement('p');
    aviso.className = 'team-aviso';
    aviso.setAttribute('role', 'status');
    aviso.textContent = texto;

    document.body.appendChild(aviso);
    avisoAberto = aviso;

    window.setTimeout(() => {
      aviso.remove();
      if (avisoAberto === aviso) avisoAberto = null;
    }, AVISO_MS);
  }

  // Delegação no document: os cards são criados em dois containers e podem ser
  // redesenhados; um ouvinte só cobre todos.
  document.addEventListener('click', (evento) => {
    const link = evento.target.closest?.('.team-card a[href^="mailto:"]');
    if (!link) return;

    const email = link.dataset.email || link.getAttribute('href').slice(7);

    let assumido = false;
    const marcar = () => { assumido = true; };

    window.addEventListener('blur', marcar, { once: true });
    document.addEventListener('visibilitychange', marcar, { once: true });

    window.setTimeout(async () => {
      window.removeEventListener('blur', marcar);
      document.removeEventListener('visibilitychange', marcar);
      if (assumido || !document.hasFocus()) return;

      avisar(await copiar(email)
        ? `Sem app de e-mail configurado neste computador — ${email} copiado.`
        : `Sem app de e-mail configurado neste computador. Endereço: ${email}`);
    }, ESPERA_CLIENTE);
  });

})();
