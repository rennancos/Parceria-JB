/* Telas da edição: valores ficam no DOM de cada abertura, sem estado global. */
(function(){
  'use strict';
  const esc = window.Portal.escaparHtml;
  const { ACEITOS } = window.Portal.documentosAcervo;

  function criar({ api, acervo, estado, aoSessao, aoAlterar }){
    const { pedir, enviarJson } = api;
    const dialogo = window.Portal.documentosDialogo.criar();
    function abrirLogin(){
      dialogo.abrir('Entrar', 'Entrar',
        '<label class="ed-campo">' +
          '<span>Usuário</span>' +
          '<input name="login" type="text" autocomplete="username" autocapitalize="off" spellcheck="false">' +
        '</label>' +
        '<label class="ed-campo">' +
          '<span>Senha</span>' +
          '<input name="senha" type="password" autocomplete="current-password">' +
        '</label>' +
        '<p class="ed-dica">Quem inclui e edita os documentos tem usuário cadastrado. Não existe tela de criar conta — peça a quem administra o portal.</p>',
        async function(tela){
          const sessao = await enviarJson('/sessao', 'POST', {
            login: tela.campo('login').value,
            senha: tela.campo('senha').value
          });
          aoSessao(api.validarSessao(sessao));
          tela.fechar();
          aoAlterar();
        });
    }

    function abrirPerfil(){
      const papel = estado.sessao.papel === 'dev'
        ? 'Desenvolvedor — inclui, edita e exclui'
        : 'Equipe — inclui e edita';

      const tela = dialogo.abrir('Seu acesso', '',
        '<dl class="ed-ficha">' +
          '<div><dt>Nome</dt><dd class="ed-nome"></dd></div>' +
          '<div><dt>Usuário</dt><dd class="ed-login"></dd></div>' +
          '<div><dt>Perfil</dt><dd class="ed-papel"></dd></div>' +
        '</dl>' +
        '<button type="button" class="ed-btn ed-neutro ed-sair">Sair</button>',
        null);

      // textContent, não innerHTML: nome vem do cadastro, mas o hábito é o que
      // impede o dia em que vier de outro lugar.
      tela.campos.querySelector('.ed-nome').textContent  = estado.sessao.nome || '—';
      tela.campos.querySelector('.ed-login').textContent = estado.sessao.login || '—';
      tela.campos.querySelector('.ed-papel').textContent = papel;

      tela.campos.querySelector('.ed-sair').addEventListener('click', async () => {
        try {
          await pedir('/sessao', { method: 'DELETE' });
        } catch (erro) {
          tela.mostrarErro(erro.message);
          return;
        }
        aoSessao({ autenticado: false });
        tela.fechar();
        aoAlterar();
      });
    }

    /* ---------- Incluir e editar um item ---------- */

    function opcoesDeBloco(){
      return acervo.blocos.map((bloco) =>
        `<option value="${esc(bloco.chave)}">${esc(bloco.rotulo)}</option>`).join('');
    }

    // DEPENDÊNCIA: os name dos campos são lidos por tela.campo e formam o
    // Rascunho de acervo.js. maxlength espelha LIMITES de servidor/dados.js;
    // novalidate no diálogo não dispensa a validação obrigatória do servidor.
    function abrirItem(id, chavePadrao){
      const item = id ? acervo.itemPorId(id) : null;
      if (id && !item) return;

      const ehArquivo = !!(item && item.href && item.href.indexOf('docs/') === 0);

      const tela = dialogo.abrir(item ? 'Editar documento' : 'Incluir documento', 'Salvar',
        '<label class="ed-campo">' +
          '<span>Título</span>' +
          '<input name="titulo" type="text" maxlength="120" autocomplete="off">' +
        '</label>' +
        '<label class="ed-campo">' +
          '<span>Descrição <em>opcional</em></span>' +
          '<input name="descricao" type="text" maxlength="200" autocomplete="off">' +
        '</label>' +
        '<label class="ed-campo">' +
          '<span>Em qual lista entra</span>' +
          `<select name="bloco">${opcoesDeBloco()}</select>` +
        '</label>' +
        '<fieldset class="ed-campo ed-tipo">' +
          '<legend>O documento é…</legend>' +
          '<label><input type="radio" name="tipo" value="link"> um endereço (portal, SharePoint, intranet)</label>' +
          '<label><input type="radio" name="tipo" value="arquivo"> um arquivo para baixar (DOC, PDF, planilha)</label>' +
        '</fieldset>' +
        '<label class="ed-campo" data-quando="link">' +
          '<span>Endereço</span>' +
          '<input name="href" type="text" maxlength="500" placeholder="https://…" autocomplete="off" spellcheck="false">' +
        '</label>' +
        '<div class="ed-campo" data-quando="arquivo">' +
          '<span>Arquivo</span>' +
          '<p class="ed-atual" hidden></p>' +
          `<input name="arquivo" type="file" accept="${ACEITOS}">` +
          '<label class="ed-check"><input type="checkbox" name="substituir"> Substituir o arquivo de mesmo nome (troca de versão)</label>' +
        '</div>' +
        '<p class="ed-dica">Sem endereço nem arquivo, o item aparece na lista como “a definir” — no lugar certo, sem fingir que já abre.</p>',
        async function(tela){
          const rascunho = {
            tipo: tela.campo('tipo').value,
            titulo: tela.campo('titulo').value,
            descricao: tela.campo('descricao').value,
            bloco: tela.campo('bloco').value,
            href: tela.campo('href').value,
            arquivo: tela.campo('arquivo').files[0],
            substituir: tela.campo('substituir').checked
          };
          await acervo.salvar(rascunho, item);
          aoAlterar();
          tela.fechar();
        });

      /* Valores. Vão depois do markup porque o campo precisa existir — e por
         .value, nunca interpolados no HTML. */
      tela.campo('bloco').value = (item && item.bloco) || chavePadrao || '';
      if (item){
        tela.campo('titulo').value = item.titulo || '';
        tela.campo('descricao').value = item.descricao || '';
        if (!ehArquivo) tela.campo('href').value = item.href || '';
        if (ehArquivo){
          const atual = tela.campos.querySelector('.ed-atual');
          atual.textContent = `Hoje: ${item.href}`;
          atual.hidden = false;
        }
      }

      const tipoInicial = ehArquivo ? 'arquivo' : 'link';
      tela.formulario.querySelectorAll('input[name="tipo"]').forEach((radio) => {
        radio.checked = radio.value === tipoInicial;
        radio.addEventListener('change', () => mostrarCamposDoTipo(tela));
      });
      mostrarCamposDoTipo(tela);

      tela.campo('titulo').focus();
    }

    function mostrarCamposDoTipo(tela){
      const tipo = tela.campo('tipo').value;
      tela.campos.querySelectorAll('[data-quando]').forEach((bloco) => {
        bloco.hidden = bloco.dataset.quando !== tipo;
      });
    }


    return { abrirLogin, abrirPerfil, abrirItem };
  }
  window.Portal.documentosFormularios = { criar };
})();
