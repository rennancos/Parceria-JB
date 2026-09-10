/* Comportamento da grade de acesso rápido (blocos `tipo: 'atalhos'`).

   O markup vem de js/paginas.js e é refeito do zero a cada troca de página — e
   de novo a cada item salvo pela edição. Por isso tudo aqui é delegado no
   `document`: nada precisa ser religado depois de um redesenho e não fica
   ouvinte pendurado em elemento que já saiu do DOM.

   O que atravessa visitas fica no localStorage: os favoritos e o formato de
   exibição, que são preferência de quem usa. O texto da busca e o "Mostrar
   mais" não — são estado de uma consulta, e reabrir a página com metade dos
   cards escondidos por uma busca de ontem seria pior do que recomeçar.

   Carrega depois de router.js (ver index.html), porque a primeira página já
   está desenhada quando este arquivo roda. Sem ele a grade continua completa e
   legível: é só a barra que deixa de responder.

   Scripts clássicos encapsulados preservam a abertura por file://. */

(function(){
  'use strict';

  const CHAVE_FAVORITOS = 'parceria:favoritos';
  const CHAVE_VISTA = 'parceria:atalhos-vista';
  const VISTAS = ['grade', 'lista'];

  /* A mesma normalização da busca do portal: "solicitacao" acha "Solicitação".

     A consulta é feita a cada chamada, e não uma vez na carga: js/busca/motor.js
     carrega depois deste arquivo, e guardar a referência aqui em cima congelava
     o atalho de emergência abaixo — o filtro passava a ignorar acento, achando
     nada em "solicitacao". Sem o motor (ordem trocada, arquivo ausente) a
     comparação cai para minúsculas: perde o acento, não a função. */
  function normal(texto){
    const motor = window.Portal && window.Portal.buscaMotor;
    if (motor && motor.normal) return motor.normal(texto);
    return String(texto == null ? '' : texto).toLowerCase();
  }

  /* localStorage pode não existir (file:// em alguns navegadores), estar
     bloqueado ou estourar a cota. Nesses casos o portal segue sem memória, em
     vez de a grade inteira parar num erro. */
  function ler(chave, padrao){
    try {
      const bruto = localStorage.getItem(chave);
      return bruto === null ? padrao : bruto;
    } catch (erro){ return padrao; }
  }

  function gravar(chave, valor){
    try { localStorage.setItem(chave, valor); } catch (erro){ /* sem memória, segue */ }
  }

  function favoritos(){
    try {
      const lista = JSON.parse(ler(CHAVE_FAVORITOS, '[]'));
      return new Set(Array.isArray(lista) ? lista : []);
    } catch (erro){ return new Set(); }
  }

  function gravarFavoritos(marcados){
    gravar(CHAVE_FAVORITOS, JSON.stringify(Array.from(marcados)));
  }

  // Valor estranho no armazenamento (mão alheia, versão antiga) cai na grade.
  function vistaGuardada(){
    const vista = ler(CHAVE_VISTA, 'grade');
    return VISTAS.indexOf(vista) === -1 ? 'grade' : vista;
  }

  function blocos(){
    return document.querySelectorAll('[data-atalhos]');
  }

  /* ---------- Estado desenhado ---------- */

  // O formato é preferência da pessoa, não da seção: vale para todas as grades
  // da página de uma vez.
  function aplicarVista(bloco, vista){
    const grade = bloco.querySelector('.atalhos-grade');
    if (grade) grade.setAttribute('data-vista', vista);

    bloco.querySelectorAll('.atalhos-vista button').forEach((botao) => {
      botao.setAttribute('aria-pressed', String(botao.dataset.vista === vista));
    });
  }

  function aplicarFavoritos(bloco, marcados){
    bloco.querySelectorAll('.atalho-fav').forEach((botao) => {
      const nome = botao.dataset.fav || '';
      const ativo = marcados.has(nome);
      botao.setAttribute('aria-pressed', String(ativo));
      botao.setAttribute('aria-label', ativo ? `Remover ${nome} dos favoritos` : `Favoritar ${nome}`);
    });
  }

  /* Uma passada só decide o que aparece: primeiro o filtro do campo, depois o
     limite de cards.

     Buscando, o limite não vale: quem digitou já reduziu a lista, e esconder
     resultado atrás de "Mostrar mais" seria devolver a pergunta. Por isso o
     botão também some enquanto há texto no campo. */
  function aplicarFiltro(bloco){
    const campo = bloco.querySelector('.atalhos-campo input');
    const termos = normal(campo ? campo.value : '').split(/\s+/).filter(Boolean);
    const limite = Number(bloco.dataset.limite) || 0;
    const expandido = bloco.dataset.expandido === 'sim';

    let achados = 0;

    bloco.querySelectorAll('.atalho').forEach((card) => {
      const alvo = normal(card.dataset.termos || '');
      // Todo termo precisa casar (E, não OU) — a mesma regra da busca do portal.
      const casa = termos.every((termo) => alvo.indexOf(termo) !== -1);
      if (casa) achados += 1;

      const passouDoLimite = !termos.length && !expandido && limite > 0 && achados > limite;
      card.hidden = !casa || passouDoLimite;
    });

    const vazio = bloco.querySelector('.atalhos-vazio');
    if (vazio) vazio.hidden = achados > 0;

    const mais = bloco.querySelector('.atalhos-mais');
    if (mais){
      mais.hidden = Boolean(termos.length) || limite <= 0 || achados <= limite;
      mais.textContent = expandido ? 'Mostrar menos' : 'Mostrar Mais';
      mais.setAttribute('aria-expanded', String(expandido));
    }
  }

  // Roda na carga e a cada redesenho: o DOM é outro, o estado guardado é o mesmo.
  function sincronizar(){
    const marcados = favoritos();
    const vista = vistaGuardada();

    blocos().forEach((bloco) => {
      aplicarVista(bloco, vista);
      aplicarFavoritos(bloco, marcados);
      aplicarFiltro(bloco);
    });
  }

  /* ---------- Eventos ---------- */

  document.addEventListener('pagina:render', sincronizar);

  document.addEventListener('input', (evento) => {
    const campo = evento.target.closest && evento.target.closest('.atalhos-campo input');
    if (!campo) return;
    const bloco = campo.closest('[data-atalhos]');
    if (bloco) aplicarFiltro(bloco);
  });

  // Esc esvazia o campo e devolve a lista inteira sem tirar o cursor de lá.
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    const campo = evento.target.closest && evento.target.closest('.atalhos-campo input');
    if (!campo || !campo.value) return;

    evento.stopPropagation();   // não é para fechar o menu por causa disto
    campo.value = '';
    const bloco = campo.closest('[data-atalhos]');
    if (bloco) aplicarFiltro(bloco);
  });

  document.addEventListener('click', (evento) => {
    const alvo = evento.target;
    if (!alvo.closest) return;

    const bloco = alvo.closest('[data-atalhos]');
    if (!bloco) return;

    const vista = alvo.closest('.atalhos-vista button');
    if (vista){
      gravar(CHAVE_VISTA, vista.dataset.vista);
      blocos().forEach((outro) => aplicarVista(outro, vistaGuardada()));
      return;
    }

    /* O coração está por cima do <a> que cobre o card (ver css/pagina.css) e
       fora dele no markup, então marcar um favorito não navega para lugar
       nenhum — não há link ancestral para o clique subir. */
    const favorito = alvo.closest('.atalho-fav');
    if (favorito){
      const nome = favorito.dataset.fav || '';
      const marcados = favoritos();
      if (marcados.has(nome)) marcados.delete(nome);
      else marcados.add(nome);

      gravarFavoritos(marcados);
      blocos().forEach((outro) => aplicarFavoritos(outro, marcados));
      return;
    }

    const mais = alvo.closest('.atalhos-mais');
    if (mais){
      bloco.dataset.expandido = bloco.dataset.expandido === 'sim' ? 'nao' : 'sim';
      aplicarFiltro(bloco);
      return;
    }

    // A lupa não filtra (o filtro é a cada tecla); ela leva o cursor ao campo,
    // que é o que se espera de quem clicou nela sem ter digitado nada.
    if (alvo.closest('.atalhos-lupa')){
      const campo = bloco.querySelector('.atalhos-campo input');
      if (campo) campo.focus();
    }
  });

  sincronizar();
})();
