/* Edição dos documentos e manuais pela própria página.

   O que este arquivo faz, em uma frase: troca os itens de semente dos blocos
   `tipo: 'links'` pelos do servidor e, para quem entrou com usuário, desenha os
   botões de incluir, editar e excluir em cima do HTML que js/paginas.js gerou.

   TRÊS COISAS QUE NÃO PODEM SER ESQUECIDAS AO MEXER AQUI

   1. Sem servidor, este arquivo não faz nada. Aberto por duplo clique (file://)
      ou servido por `pnpm start` (que não tem a API), a primeira requisição
      falha, `estado.disponivel` continua false e a página segue exatamente como
      sempre foi, com a semente de js/paginas/documentacao.js. Esse silêncio é
      requisito, não descuido — ver md/09-edicao-pela-pagina.md.

   2. Esconder o botão de excluir NÃO é a regra de permissão. Quem recusa é
      servidor/auth.js; aqui é só conforto visual. Qualquer pessoa monta a
      requisição na mão pelo DevTools — e recebe 403.

   3. IIFE e script clássico, como paginas.js: equipe.js já ocupa nomes no
      escopo global e dois `const` de mesmo nome derrubam a página inteira.
      Nada de `type="module"` nem `import`, que quebram em file://.

   Carrega DEPOIS de js/router.js: depende de PAGINAS, de renderizarPagina e de
   window.redesenharPagina já existirem. */
(function(){
  'use strict';

  // Em file:// nem vale tentar: o fetch seria recusado pelo navegador e ainda
  // sujaria o console de quem abriu o portal do disco.
  if (location.protocol === 'file:') return;

  const API = '/api';

  // Espelha EXTENSOES de servidor/dados.js. Aqui é só o filtro da janela de
  // "escolher arquivo"; quem decide de fato o que entra no disco é o servidor.
  const ACEITOS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';

  const estado = {
    disponivel: false,               // a API respondeu ao menos uma vez
    sessao: { autenticado: false },
    blocos: [],                      // [{ chave, rotulo }] — vem do servidor
    itens: []                        // acervo cru, para preencher o formulário
  };

  /* ---------- Conversa com a API ---------- */

  async function pedir(caminho, opcoes){
    const res = await fetch(API + caminho, Object.assign({ credentials: 'same-origin' }, opcoes));

    /* Toda rota da API responde JSON. Se veio outra coisa, do outro lado não
       está servidor/servidor.js — é o `pnpm start`, que devolve 404 (ou até a
       própria index.html, com status 200) para /api. Tratar isso como acervo
       daria um erro estranho lá na frente; aqui vira só "API indisponível". */
    const ehJson = (res.headers.get('content-type') || '').indexOf('application/json') > -1;
    if (!ehJson){
      const erro = new Error('A API de edição não está respondendo nesta origem.');
      erro.status = res.status;
      throw erro;
    }

    const corpo = await res.json();

    if (!res.ok){
      const erro = new Error(corpo.erro || 'Não foi possível falar com o servidor.');
      erro.status = res.status;
      throw erro;
    }
    return corpo;
  }

  function enviarJson(caminho, metodo, dados){
    return pedir(caminho, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
  }

  /* ---------- Acervo ---------- */

  // Todo bloco que declarou `chave`, em qualquer página. Hoje são os três de
  // documentacao.js; a busca é genérica para um bloco novo não exigir mexer aqui.
  function blocosComChave(){
    const achados = [];
    Object.keys(window.PAGINAS || {}).forEach((nome) => {
      ((window.PAGINAS[nome] || {}).secoes || []).forEach((secao) => {
        (Array.isArray(secao.blocos) ? secao.blocos : [secao]).forEach((bloco) => {
          if (bloco && bloco.chave) achados.push(bloco);
        });
      });
    });
    return achados;
  }

  /* Os itens do servidor SUBSTITUEM os do bloco — inclusive quando a lista volta
     vazia. Se aqui tivesse um "só troca se vier alguma coisa", o último item
     excluído reapareceria como semente na próxima carga. */
  async function carregarAcervo(){
    const dados = await pedir('/documentos');
    estado.blocos = dados.blocos || [];
    estado.itens = dados.itens || [];

    blocosComChave().forEach((bloco) => {
      bloco.itens = estado.itens
        .filter((item) => item.bloco === bloco.chave)
        .map((item) => ({
          id: item.id,
          titulo: item.titulo,
          descricao: item.descricao,
          href: item.href,
          formato: item.formato
        }));
    });
  }

  function itemPorId(id){
    return estado.itens.filter((item) => item.id === id)[0] || null;
  }

  function redesenhar(){
    if (typeof window.redesenharPagina === 'function') window.redesenharPagina();
  }

  /* ---------- Ícones ---------- */
  // Mesmo traço do resto do portal (Feather: stroke currentColor, sem fill).

  function svg(d){
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  }

  const ICONE_MAIS    = svg('<path d="M12 5v14M5 12h14"/>');
  const ICONE_LAPIS   = svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>');
  const ICONE_LIXO    = svg('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>');
  const ICONE_FECHAR  = svg('<path d="M18 6 6 18M6 6l12 12"/>');

  function botao(classe, rotulo, icone){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ed-btn ' + classe;
    b.innerHTML = icone;                              // markup fixo daqui, não dado
    b.appendChild(document.createTextNode(rotulo));
    return b;
  }

  /* ---------- Botões em cima da página desenhada ---------- */

  /* Roda a cada `pagina:render`. O HTML foi refeito do zero pelo router, então
     não há botão antigo para limpar — só pendurar os novos. */
  function decorar(){
    const view = document.getElementById('view-pagina');
    if (!view || view.hidden) return;
    if (!estado.disponivel || !estado.sessao.autenticado) return;

    const podeExcluir = estado.sessao.papel === 'dev';

    view.querySelectorAll('ul.link-list[data-bloco]').forEach((lista) => {
      const chave = lista.dataset.bloco;

      lista.querySelectorAll('li[data-item-id]').forEach((li) => {
        const id = li.dataset.itemId;
        const acoes = document.createElement('div');
        acoes.className = 'ed-acoes';

        const editar = botao('ed-neutro', 'Editar', ICONE_LAPIS);
        editar.addEventListener('click', () => abrirItem(id, chave));
        acoes.appendChild(editar);

        if (podeExcluir){
          const excluir = botao('ed-perigo', 'Excluir', ICONE_LIXO);
          excluir.addEventListener('click', () => excluirItem(id));
          acoes.appendChild(excluir);
        }

        li.classList.add('com-acoes');
        li.appendChild(acoes);
      });

      const barra = document.createElement('div');
      barra.className = 'ed-barra';
      const incluir = botao('ed-neutro', 'Incluir nesta lista', ICONE_MAIS);
      incluir.addEventListener('click', () => abrirItem(null, chave));
      barra.appendChild(incluir);
      lista.insertAdjacentElement('afterend', barra);
    });
  }

  /* ---------- A janela (uma só, reaproveitada) ---------- */

  let janela = null;      // <dialog>
  let formulario = null;
  let campos = null;      // <div> onde cada tela põe os seus campos
  let alerta = null;      // <p role="alert">
  let titulo = null;
  let confirmar = null;   // botão de submit
  let aoEnviar = null;    // o que a tela aberta faz no submit

  function montarJanela(){
    if (janela) return;

    janela = document.createElement('dialog');
    janela.className = 'ed-janela';
    janela.innerHTML =
      '<form class="ed-form" novalidate>' +
        '<div class="ed-cabecalho">' +
          '<h2 class="ed-titulo"></h2>' +
          '<button type="button" class="ed-fechar" aria-label="Fechar">' + ICONE_FECHAR + '</button>' +
        '</div>' +
        '<div class="ed-campos"></div>' +
        '<p class="ed-erro" role="alert" hidden></p>' +
        '<div class="ed-rodape">' +
          '<button type="button" class="ed-btn ed-neutro ed-cancelar">Cancelar</button>' +
          '<button type="submit" class="ed-btn ed-primario"></button>' +
        '</div>' +
      '</form>';

    document.body.appendChild(janela);

    formulario = janela.querySelector('.ed-form');
    campos     = janela.querySelector('.ed-campos');
    alerta     = janela.querySelector('.ed-erro');
    titulo     = janela.querySelector('.ed-titulo');
    confirmar  = janela.querySelector('.ed-primario');

    janela.querySelector('.ed-fechar').addEventListener('click', fechar);
    janela.querySelector('.ed-cancelar').addEventListener('click', fechar);

    // Esc fecha sozinho pelo <dialog>; o handler não passa por fechar(), então
    // é aqui que a tela anterior deixa de valer.
    janela.addEventListener('close', () => { aoEnviar = null; });

    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      if (!aoEnviar) return;

      const rotulo = confirmar.textContent;
      confirmar.disabled = true;
      confirmar.textContent = 'Aguarde…';
      esconderErro();

      try {
        await aoEnviar();
      } catch (erro) {
        mostrarErro(erro.message);
      } finally {
        confirmar.disabled = false;
        confirmar.textContent = rotulo;
      }
    });
  }

  function abrir(tituloTexto, rotuloConfirmar, html, enviar){
    montarJanela();
    titulo.textContent = tituloTexto;
    confirmar.textContent = rotuloConfirmar;
    confirmar.hidden = !rotuloConfirmar;
    campos.innerHTML = html;               // markup fixo; valor vai por .value

    // Sem botão de confirmar (a tela de perfil), "Cancelar" não cancela nada.
    janela.querySelector('.ed-cancelar').textContent = rotuloConfirmar ? 'Cancelar' : 'Fechar';
    aoEnviar = enviar;
    esconderErro();

    // showModal dá foco preso e Esc de graça. O fallback existe para navegador
    // antigo: a janela abre igual, só sem essas duas comodidades.
    if (typeof janela.showModal === 'function') janela.showModal();
    else janela.setAttribute('open', '');

    const primeiro = campos.querySelector('input, select, textarea');
    if (primeiro) primeiro.focus();
  }

  function fechar(){
    if (!janela) return;
    aoEnviar = null;
    if (typeof janela.close === 'function' && janela.open) janela.close();
    else janela.removeAttribute('open');
  }

  function mostrarErro(mensagem){
    if (!alerta) return;
    alerta.textContent = mensagem;
    alerta.hidden = false;
  }

  function esconderErro(){
    if (!alerta) return;
    alerta.textContent = '';
    alerta.hidden = true;
  }

  function campo(nome){
    return formulario.elements[nome];
  }

  /* ---------- Entrar e sair ---------- */

  function abrirLogin(){
    abrir('Entrar', 'Entrar',
      '<label class="ed-campo">' +
        '<span>Usuário</span>' +
        '<input name="login" type="text" autocomplete="username" autocapitalize="off" spellcheck="false">' +
      '</label>' +
      '<label class="ed-campo">' +
        '<span>Senha</span>' +
        '<input name="senha" type="password" autocomplete="current-password">' +
      '</label>' +
      '<p class="ed-dica">Quem inclui e edita os documentos tem usuário cadastrado. Não existe tela de criar conta — peça a quem administra o portal.</p>',
      async function(){
        estado.sessao = await enviarJson('/sessao', 'POST', {
          login: campo('login').value,
          senha: campo('senha').value
        });
        sincronizarPerfil();
        fechar();
        redesenhar();
      });
  }

  function abrirPerfil(){
    const papel = estado.sessao.papel === 'dev'
      ? 'Desenvolvedor — inclui, edita e exclui'
      : 'Equipe — inclui e edita';

    abrir('Seu acesso', '',
      '<dl class="ed-ficha">' +
        '<div><dt>Nome</dt><dd class="ed-nome"></dd></div>' +
        '<div><dt>Usuário</dt><dd class="ed-login"></dd></div>' +
        '<div><dt>Perfil</dt><dd class="ed-papel"></dd></div>' +
      '</dl>' +
      '<button type="button" class="ed-btn ed-neutro ed-sair">Sair</button>',
      null);

    // textContent, não innerHTML: nome vem do cadastro, mas o hábito é o que
    // impede o dia em que vier de outro lugar.
    campos.querySelector('.ed-nome').textContent  = estado.sessao.nome || '—';
    campos.querySelector('.ed-login').textContent = estado.sessao.login || '—';
    campos.querySelector('.ed-papel').textContent = papel;

    campos.querySelector('.ed-sair').addEventListener('click', async () => {
      try {
        await pedir('/sessao', { method: 'DELETE' });
      } catch (erro) {
        // Falhou o aviso ao servidor, mas a sessão local não serve mais de nada:
        // seguir como deslogado é mais honesto do que deixar botão que dá 401.
      }
      estado.sessao = { autenticado: false };
      sincronizarPerfil();
      fechar();
      redesenhar();
    });
  }

  /* Os dois botões "Perfil" do cabeçalho (o ícone e o do menu em telas
     estreitas) eram decorativos — ver md/07-pendencias.md. Ganham função só
     quando a API respondeu; sem servidor, continuam como estavam. */
  function ligarPerfil(){
    document.querySelectorAll('[data-perfil]').forEach((botaoPerfil) => {
      botaoPerfil.addEventListener('click', () => {
        if (estado.sessao.autenticado) abrirPerfil();
        else abrirLogin();
      });
    });
  }

  function sincronizarPerfil(){
    const dentro = !!estado.sessao.autenticado;
    document.querySelectorAll('[data-perfil]').forEach((botaoPerfil) => {
      botaoPerfil.classList.toggle('perfil-ativo', dentro);
      if (botaoPerfil.hasAttribute('aria-label')){
        botaoPerfil.setAttribute('aria-label', dentro ? `Perfil — ${estado.sessao.nome}` : 'Perfil');
      }
    });
  }

  /* ---------- Incluir e editar um item ---------- */

  // Extensão conhecida no fim do endereço já rende o chip certo (PDF, DOC…).
  // Só quando não há extensão nenhuma o item ganha `formato: 'link'`, que é o
  // que desenha o chip "Link" — mesma regra descrita em md/09.
  function formatoPara(tipo, href){
    if (tipo !== 'link') return '';
    return /\.(pdf|docx?|xlsx?|pptx?)(?:[?#]|$)/i.test(href) ? '' : 'link';
  }

  function opcoesDeBloco(){
    return estado.blocos.map((bloco) =>
      `<option value="${bloco.chave}">${bloco.rotulo}</option>`).join('');
  }

  function abrirItem(id, chavePadrao){
    const item = id ? itemPorId(id) : null;
    if (id && !item) return;

    const ehArquivo = !!(item && item.href && item.href.indexOf('docs/') === 0);

    abrir(item ? 'Editar documento' : 'Incluir documento', 'Salvar',
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
      async function(){
        const tipo = campo('tipo').value;
        let href = '';

        if (tipo === 'link'){
          href = campo('href').value.trim();
        } else {
          const arquivo = campo('arquivo').files[0];
          if (arquivo){
            // Corpo = bytes do arquivo, nome na query. Sem multipart, de
            // propósito — ver servidor/servidor.js.
            const substituir = campo('substituir').checked ? '&substituir=1' : '';
            const enviado = await pedir(
              `/arquivos?nome=${encodeURIComponent(arquivo.name)}${substituir}`,
              { method: 'POST', body: arquivo });
            href = enviado.href;
          } else if (item && ehArquivo){
            href = item.href;              // editou o texto, manteve o arquivo
          }
        }

        const corpo = {
          bloco: campo('bloco').value,
          titulo: campo('titulo').value,
          descricao: campo('descricao').value,
          href,
          formato: formatoPara(tipo, href)
        };

        if (item) await enviarJson(`/documentos/${encodeURIComponent(item.id)}`, 'PUT', corpo);
        else await enviarJson('/documentos', 'POST', corpo);

        await carregarAcervo();
        fechar();
        redesenhar();
      });

    /* Valores. Vão depois do markup porque o campo precisa existir — e por
       .value, nunca interpolados no HTML. */
    campo('bloco').value = (item && item.bloco) || chavePadrao || '';
    if (item){
      campo('titulo').value = item.titulo || '';
      campo('descricao').value = item.descricao || '';
      if (!ehArquivo) campo('href').value = item.href || '';
      if (ehArquivo){
        const atual = campos.querySelector('.ed-atual');
        atual.textContent = `Hoje: ${item.href}`;
        atual.hidden = false;
      }
    }

    const tipoInicial = ehArquivo ? 'arquivo' : 'link';
    formulario.querySelectorAll('input[name="tipo"]').forEach((radio) => {
      radio.checked = radio.value === tipoInicial;
      radio.addEventListener('change', mostrarCamposDoTipo);
    });
    mostrarCamposDoTipo();

    campo('titulo').focus();
  }

  function mostrarCamposDoTipo(){
    const tipo = campo('tipo').value;
    campos.querySelectorAll('[data-quando]').forEach((bloco) => {
      bloco.hidden = bloco.dataset.quando !== tipo;
    });
  }

  /* ---------- Excluir ---------- */

  /* confirm() nativo de propósito: é destrutivo, e o aviso do navegador não tem
     como ser clicado por engano nem estilizado a ponto de passar despercebido.
     E, de novo: quem garante que só dev exclui é o servidor. */
  async function excluirItem(id){
    const item = itemPorId(id);
    if (!item) return;

    const aviso = `Excluir “${item.titulo}” da lista?\n\n` +
      'O item sai da página. Um arquivo em docs/, se houver, continua no servidor.';
    if (!window.confirm(aviso)) return;

    try {
      await pedir(`/documentos/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await carregarAcervo();
      redesenhar();
    } catch (erro) {
      window.alert(erro.message);
    }
  }

  /* ---------- Início ---------- */

  document.addEventListener('pagina:render', decorar);

  (async function iniciar(){
    try {
      await carregarAcervo();
    } catch (erro) {
      return;    // sem API: a semente do .js continua valendo e ninguém percebe
    }

    estado.disponivel = true;

    // Sessão é secundária: sem ela o portal ainda mostra o acervo do servidor,
    // só não mostra botão nenhum.
    try {
      estado.sessao = await pedir('/sessao');
    } catch (erro) {
      estado.sessao = { autenticado: false };
    }

    ligarPerfil();
    sincronizarPerfil();
    redesenhar();     // já com os itens do servidor no lugar da semente
  })();
})();
