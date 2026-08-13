/* Tema (black mode).
   A classe `dark-mode` já pode ter sido aplicada pelo script inline no topo do
   <body> — ele lê o localStorage antes da página pintar, para não piscar branco
   ao navegar entre páginas. Aqui só sincronizamos o botão com esse estado. */
const TEMA_KEY = 'pajb-tema';
const themeToggle = document.querySelector('.theme-toggle');

function sincronizarBotaoTema(escuro){
  themeToggle.setAttribute('aria-pressed', String(escuro));
  themeToggle.setAttribute('aria-label', escuro ? 'Desativar black mode' : 'Ativar black mode');
}

sincronizarBotaoTema(document.body.classList.contains('dark-mode'));

themeToggle.addEventListener('click', () => {
  const nextState = themeToggle.getAttribute('aria-pressed') !== 'true';
  document.body.classList.toggle('dark-mode', nextState);
  sincronizarBotaoTema(nextState);
  // localStorage pode estourar em file:// com storage bloqueado — o tema
  // continua funcionando na página atual, só não sobrevive à navegação.
  try {
    localStorage.setItem(TEMA_KEY, nextState ? 'dark' : 'light');
  } catch (e) {}
});

/* Menu mobile (drawer) */
const menuToggle = document.querySelector('.menu-toggle');
const menuPanel = document.querySelector('.menu-panel');
const menuClose = document.querySelector('.menu-close');
const scrim = document.querySelector('.scrim');
const desktopQuery = window.matchMedia('(min-width: 901px)');

function isMenuOpen(){
  return document.body.classList.contains('menu-open');
}

function openMenu(){
  document.body.classList.add('menu-open');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'Fechar menu');
  // O painel só recebe foco depois da transição de visibility.
  requestAnimationFrame(() => {
    const first = menuPanel.querySelector('a, button');
    if (first) first.focus();
  });
}

function closeMenu({ restoreFocus = true } = {}){
  if (!isMenuOpen()) return;
  document.body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menu');
  if (restoreFocus) menuToggle.focus();
}

menuToggle.addEventListener('click', () => {
  if (isMenuOpen()) closeMenu();
  else openMenu();
});

menuClose.addEventListener('click', () => closeMenu());
scrim.addEventListener('click', () => closeMenu());

// Clicar num link do menu navega e fecha o drawer.
menuPanel.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => closeMenu({ restoreFocus: false }));
});

document.addEventListener('keydown', (event) => {
  if (!isMenuOpen()) return;

  if (event.key === 'Escape'){
    closeMenu();
    return;
  }

  // Mantém o Tab preso dentro do drawer enquanto ele estiver aberto.
  if (event.key === 'Tab'){
    const focusables = menuPanel.querySelectorAll('a[href], button:not([disabled])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first){
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last){
      event.preventDefault();
      first.focus();
    }
  }
});

// Voltando ao desktop, o drawer não faz mais sentido: destrava o scroll.
desktopQuery.addEventListener('change', (event) => {
  if (event.matches) closeMenu({ restoreFocus: false });
});
