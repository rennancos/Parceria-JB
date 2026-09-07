/* Menu lateral (drawer). Vale em qualquer largura: o mesmo botão
   hambúrguer abre o painel no celular e no desktop. */
const menuToggle = document.querySelector('.menu-toggle');
const menuPanel = document.querySelector('.menu-panel');
const menuClose = document.querySelector('.menu-close');
const scrim = document.querySelector('.scrim');

function isMenuOpen(){
  return document.body.classList.contains('menu-open');
}

function openMenu(){
  document.body.classList.add('menu-open');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'Fechar menu');
  // Enquanto o painel está com visibility: hidden nada lá dentro aceita foco,
  // e um requestAnimationFrame só chega cedo demais: no primeiro quadro a
  // transição ainda não começou e o focus() cai no vazio. Daí o segundo.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const primeiro = menuPanel.querySelector('a, button');
      if (primeiro) primeiro.focus();
    });
  });
}

function closeMenu({ restoreFocus = true } = {}){
  if (!isMenuOpen()) return;
  document.body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menu');
  if (restoreFocus) menuToggle.focus();
}

menuToggle?.addEventListener('click', () => {
  if (isMenuOpen()) closeMenu();
  else openMenu();
});

menuClose?.addEventListener('click', () => closeMenu());
scrim?.addEventListener('click', () => closeMenu());

// Clicar num link do menu navega e fecha o drawer.
menuPanel?.querySelectorAll('a').forEach((link) => {
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
    const focusables = menuPanel?.querySelectorAll('a[href], button:not([disabled])') || [];
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
