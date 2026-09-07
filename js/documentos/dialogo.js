/* Janela específica da edição. Cada abertura possui DOM e submissão próprios.
   Fechar permite continuar usando o portal; não cancela uma gravação já enviada. */
(function(){
  'use strict';
  let sequencia = 0;

  function criar(){
    let atual = null;

    function abrir(titulo, rotulo, html, enviar){
      if (atual) atual.fechar();
      const janela = document.createElement('dialog');
      const tituloId = `ed-titulo-${++sequencia}`;
      janela.className = 'ed-janela';
      janela.setAttribute('aria-labelledby', tituloId);
      janela.innerHTML = `<form class="ed-form" novalidate>
        <div class="ed-cabecalho"><h2 class="ed-titulo" id="${tituloId}"></h2>
          <button type="button" class="ed-fechar" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button></div>
        <div class="ed-campos"></div><p class="ed-erro" role="alert" hidden></p>
        <div class="ed-rodape"><button type="button" class="ed-btn ed-neutro ed-cancelar"></button>
          <button type="submit" class="ed-btn ed-primario"></button></div></form>`;
      const formulario = janela.querySelector('.ed-form');
      const campos = janela.querySelector('.ed-campos');
      const alerta = janela.querySelector('.ed-erro');
      const confirmar = janela.querySelector('.ed-primario');
      const cancelar = janela.querySelector('.ed-cancelar');
      let enviando = false;
      let encerrada = false;
      janela.querySelector('.ed-titulo').textContent = titulo;
      campos.innerHTML = html; // Somente templates locais; dados usam value/textContent/escape.
      confirmar.textContent = rotulo;
      confirmar.hidden = !rotulo;
      cancelar.textContent = rotulo ? 'Cancelar' : 'Fechar';

      function limpar(){
        encerrada = true;
        janela.remove();
        if (atual === tela) atual = null;
      }
      function fechar(){
        if (encerrada) return;
        if (janela.open && typeof janela.close === 'function') janela.close();
        limpar();
      }
      function mostrarErro(mensagem){
        if (encerrada) return;
        alerta.textContent = mensagem;
        alerta.hidden = false;
      }
      const tela = { campos, formulario, campo: (nome) => formulario.elements[nome], fechar, mostrarErro,
        ativa: () => !encerrada && atual === tela };
      atual = tela;

      janela.querySelector('.ed-fechar').addEventListener('click', fechar);
      cancelar.addEventListener('click', fechar);
      janela.addEventListener('cancel', (evento) => { evento.preventDefault(); fechar(); });
      janela.addEventListener('close', limpar);
      formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (!enviar || enviando || encerrada) return;
        enviando = true;
        confirmar.disabled = true;
        confirmar.textContent = 'Aguarde…';
        cancelar.textContent = 'Fechar';
        alerta.hidden = true;
        try { await enviar(tela); }
        catch (erro) { mostrarErro(erro.message); }
        finally {
          enviando = false;
          if (tela.ativa()){
            confirmar.disabled = false;
            confirmar.textContent = rotulo;
            cancelar.textContent = 'Cancelar';
          }
        }
      });

      document.body.appendChild(janela);
      if (typeof janela.showModal === 'function') janela.showModal();
      else janela.setAttribute('open', '');
      campos.querySelector('input, select, textarea')?.focus();
      return tela;
    }
    return { abrir };
  }

  window.Portal.documentosDialogo = { criar };
})();
