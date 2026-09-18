/* Interface das Configurações de IA (BYOK). Monta o form dentro da página
   #configuracoes-ia quando ela é renderizada. A casca vem de
   js/paginas/configuracoes-ia.js; aqui é o comportamento.

   SEGURANÇA DE INTERFACE (requisitos do pedido):
   - a credencial só existe no campo enquanto a pessoa digita; nunca é
     preenchida de volta com o segredo guardado (o servidor nunca o devolve);
   - o campo é type="password" com um botão "mostrar" que só age no que está no
     form agora;
   - só uma identificação mascarada (hint) aparece depois de salva;
   - toda saída dinâmica (hint, modelos, erros, RESPOSTA DA IA) entra por
     textContent — nunca innerHTML. É o que impede XSS por Markdown/HTML vindo
     da IA (a resposta é tratada como texto puro, de propósito);
   - custos/limites pertencem à conta do usuário: dito na tela.

   Autorização real é do servidor (servidor/ia/*). Aqui é conveniência. */
(function(){
  'use strict';

  const api = window.Portal && window.Portal.documentosApi;
  const CHAVE_PAGINA = 'configuracoes-ia';

  const estado = {
    providers: [],
    config: null,
    modelos: null,          // modelos do último teste bem-sucedido
    provedorSel: null,      // provedor escolhido no <select>
    sessao: { autenticado: false },
    carregando: false,
    erroInicial: ''
  };

  /* ---------- Helpers de DOM (sem innerHTML para dado) ---------- */

  function el(tag, classe, texto){
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function campo(rotulo, controle, dica){
    const label = el('label', 'ed-campo');
    const span = el('span', null, rotulo);
    if (dica){ const em = el('em', null, ` ${dica}`); span.appendChild(em); }
    label.appendChild(span);
    label.appendChild(controle);
    return label;
  }

  function nota(texto, classe){
    return el('p', classe || 'ia-nota', texto);
  }

  /* ---------- Transporte ---------- */

  function providerAtual(){
    return estado.providers.find((p) => p.id === estado.provedorSel) || null;
  }

  async function carregar(){
    estado.carregando = true;
    try {
      estado.sessao = await api.sessao();
    } catch (e) {
      estado.sessao = { autenticado: false };
    }
    if (estado.sessao.autenticado){
      try {
        const r = await api.pedir('/ai/settings');
        estado.providers = Array.isArray(r.provedores) ? r.provedores : [];
        estado.config = r.configuracao || null;
        estado.provedorSel = (estado.config && estado.config.provider)
          || (estado.providers[0] && estado.providers[0].id) || null;
      } catch (e) {
        estado.erroInicial = e.message || 'Não foi possível falar com o servidor.';
      }
    }
    estado.carregando = false;
    montar();
  }

  /* ---------- Render ---------- */

  function containerDe(){
    const view = document.getElementById('view-pagina');
    if (!view || view.hidden) return null;
    let box = view.querySelector('.ia-config');
    if (!box){ box = el('div', 'ia-config'); view.appendChild(box); }
    box.textContent = '';
    return box;
  }

  function montar(){
    const box = containerDe();
    if (!box) return;

    if (location.protocol === 'file:'){
      box.appendChild(nota('Abra o portal pelo servidor (não por arquivo) para configurar a IA.', 'notice'));
      return;
    }
    if (estado.carregando){ box.appendChild(nota('Carregando…')); return; }
    if (!estado.sessao.autenticado){
      box.appendChild(nota('Entre com o seu usuário (botão “Perfil”, no topo) para configurar a IA.', 'notice'));
      return;
    }
    if (estado.erroInicial){ box.appendChild(nota(estado.erroInicial, 'notice')); return; }

    box.appendChild(renderStatus());
    box.appendChild(renderForm());
    box.appendChild(renderChat());
  }

  function renderStatus(){
    const bloco = el('div', 'ia-status');
    const cfg = estado.config;
    if (!cfg){
      bloco.appendChild(nota('Nenhum provedor configurado ainda.'));
      return bloco;
    }
    const prov = estado.providers.find((p) => p.id === cfg.provider);
    bloco.appendChild(el('strong', null, `Configurado: ${prov ? prov.rotulo : cfg.provider}`));
    const linha = el('p', 'ia-status-linha');
    linha.appendChild(el('span', 'ia-chip', cfg.hint || '••••••'));
    linha.appendChild(el('span', null, ` · modelo ${cfg.selectedModel}`));
    linha.appendChild(el('span', null, ` · ${cfg.enabled ? 'ativo' : 'desabilitado'}`));
    if (cfg.lastValidatedAt){
      const d = new Date(cfg.lastValidatedAt);
      linha.appendChild(el('span', null, ` · último teste ${isNaN(d) ? '' : d.toLocaleString('pt-BR')}`));
    }
    bloco.appendChild(linha);
    return bloco;
  }

  function renderForm(){
    const form = el('form', 'ed-form ia-form');
    form.setAttribute('novalidate', '');
    const campos = el('div', 'ed-campos');

    // Provedor
    const sel = el('select');
    estado.providers.forEach((p) => {
      const o = el('option', null, p.rotulo); o.value = p.id;
      if (p.id === estado.provedorSel) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => { estado.provedorSel = sel.value; estado.modelos = null; montar(); });
    campos.appendChild(campo('Provedor', sel));

    // Link oficial para obter a credencial
    const prov = providerAtual();
    if (prov && prov.instrucoesUrl){
      const p = el('p', 'ia-ajuda');
      p.appendChild(document.createTextNode('Não tem uma chave? '));
      const a = el('a', null, 'Crie no site oficial do provedor');
      a.href = prov.instrucoesUrl; a.target = '_blank'; a.rel = 'noopener noreferrer';
      p.appendChild(a);
      campos.appendChild(p);
    }

    // Credencial (password) + mostrar
    const inp = el('input');
    inp.type = 'password'; inp.autocomplete = 'off'; inp.spellcheck = false;
    inp.placeholder = estado.config ? 'Deixe em branco para manter a credencial atual' : 'Cole aqui a sua chave';
    inp.className = 'ia-cred';
    const mostrar = el('button', 'ed-btn', 'Mostrar'); mostrar.type = 'button';
    mostrar.addEventListener('click', () => {
      inp.type = inp.type === 'password' ? 'text' : 'password';
      mostrar.textContent = inp.type === 'password' ? 'Mostrar' : 'Ocultar';
    });
    const linhaCred = el('div', 'ia-cred-linha');
    linhaCred.appendChild(inp); linhaCred.appendChild(mostrar);
    const campoCred = campo('Credencial', linhaCred, estado.config ? '(só se for trocar)' : '');
    campos.appendChild(campoCred);

    // Modelo
    const selModelo = el('select');
    const opcoes = estado.modelos
      || (estado.config && estado.config.provider === estado.provedorSel ? [estado.config.selectedModel] : (prov ? prov.modelos : []));
    (opcoes || []).forEach((id) => {
      const o = el('option', null, id); o.value = id;
      if (estado.config && id === estado.config.selectedModel) o.selected = true;
      selModelo.appendChild(o);
    });
    campos.appendChild(campo('Modelo', selModelo));

    form.appendChild(campos);

    // Avisos de custo/privacidade
    form.appendChild(nota('A credencial é sua e o consumo é cobrado pela sua conta no provedor. '
      + 'O portal não controla saldo nem garante acesso a modelos específicos — isso depende da sua conta. '
      + 'Sua pergunta é enviada ao provedor externo pelo servidor do portal; evite dados sensíveis.', 'ia-nota'));

    // Ações
    const acoes = el('div', 'ia-acoes');
    const msg = el('p', 'ia-msg'); msg.setAttribute('role', 'status');

    const btnTestar = el('button', 'ed-btn', 'Testar conexão'); btnTestar.type = 'button';
    btnTestar.addEventListener('click', () => testar(inp, selModelo, msg));

    const btnSalvar = el('button', 'ed-btn ed-primario', 'Salvar configuração'); btnSalvar.type = 'submit';

    acoes.appendChild(btnTestar);
    acoes.appendChild(btnSalvar);

    if (estado.config){
      const btnToggle = el('button', 'ed-btn', estado.config.enabled ? 'Desabilitar' : 'Habilitar');
      btnToggle.type = 'button';
      btnToggle.addEventListener('click', () => alternarAtivo(selModelo, msg));
      acoes.appendChild(btnToggle);

      const btnRemover = el('button', 'ed-btn ed-perigo', 'Remover credencial'); btnRemover.type = 'button';
      btnRemover.addEventListener('click', () => remover(msg));
      acoes.appendChild(btnRemover);
    }

    form.appendChild(acoes);
    form.appendChild(msg);

    form.addEventListener('submit', (ev) => { ev.preventDefault(); salvar(inp, selModelo, msg); });
    return form;
  }

  function renderChat(){
    const cfg = estado.config;
    const bloco = el('section', 'ia-chat');
    bloco.appendChild(el('h2', null, 'Conversar'));
    if (!cfg || !cfg.enabled){
      bloco.appendChild(nota('Configure e habilite um provedor para conversar.'));
      return bloco;
    }
    const ta = el('textarea', 'ia-chat-in'); ta.rows = 3; ta.placeholder = 'Escreva sua pergunta…';
    const btn = el('button', 'ed-btn ed-primario', 'Perguntar'); btn.type = 'button';
    const saida = el('div', 'ia-chat-out'); saida.setAttribute('aria-live', 'polite');
    btn.addEventListener('click', async () => {
      const texto = ta.value.trim();
      if (!texto) return;
      btn.disabled = true; saida.textContent = 'Pensando…';
      try {
        const r = await api.enviarJson('/ai/chat', 'POST', { mensagens: [{ papel: 'user', texto }] });
        saida.textContent = String(r.resposta || '');   // textContent: nunca renderiza HTML da IA
      } catch (e) {
        saida.textContent = e.message || 'Não foi possível responder agora.';
      } finally {
        btn.disabled = false;
      }
    });
    bloco.appendChild(ta);
    bloco.appendChild(btn);
    bloco.appendChild(saida);
    return bloco;
  }

  /* ---------- Ações ---------- */

  async function testar(inp, selModelo, msg){
    const chave = inp.value.trim();
    if (!chave){ msg.textContent = 'Cole a credencial para testar.'; return; }
    msg.textContent = 'Testando…';
    try {
      const r = await api.enviarJson('/ai/settings/test', 'POST', { provider: estado.provedorSel, chave });
      if (r.status === 'valida'){
        estado.modelos = Array.isArray(r.modelos) ? r.modelos : [];
        msg.textContent = estado.modelos.length
          ? 'Credencial válida. Escolha o modelo e salve.'
          : 'Credencial válida, mas nenhum modelo permitido está disponível nesta conta.';
        montar();
      } else if (r.status === 'invalida'){
        msg.textContent = 'Credencial recusada pelo provedor.';
      } else {
        msg.textContent = 'Não foi possível validar agora. Tente de novo.';
      }
    } catch (e) {
      msg.textContent = e.message || 'Falha ao testar.';
    }
  }

  async function salvar(inp, selModelo, msg){
    const corpo = { provider: estado.provedorSel, selectedModel: selModelo.value };
    const chave = inp.value.trim();
    if (chave) corpo.chave = chave;
    msg.textContent = 'Salvando…';
    try {
      const r = await api.enviarJson('/ai/settings', 'PUT', corpo);
      estado.config = r.configuracao;
      estado.modelos = null;
      inp.value = '';                 // nunca deixa o segredo no form depois de salvar
      msg.textContent = 'Configuração salva.';
      montar();
    } catch (e) {
      msg.textContent = e.message || 'Não foi possível salvar.';
    }
  }

  async function alternarAtivo(selModelo, msg){
    try {
      const r = await api.enviarJson('/ai/settings', 'PUT', {
        provider: estado.config.provider,
        selectedModel: estado.config.selectedModel,
        enabled: !estado.config.enabled
      });
      estado.config = r.configuracao;
      montar();
    } catch (e) {
      msg.textContent = e.message || 'Não foi possível alterar.';
    }
  }

  async function remover(msg){
    if (!window.confirm('Remover a sua credencial de IA? Você precisará cadastrá-la de novo para usar.')) return;
    try {
      await api.pedir('/ai/settings/credential', { method: 'DELETE' });
      estado.config = null; estado.modelos = null;
      montar();
    } catch (e) {
      msg.textContent = e.message || 'Não foi possível remover.';
    }
  }

  /* ---------- Ligação com o router ---------- */

  if (!api) return;   // sem transporte (não deveria ocorrer): página fica só com a casca

  let carregouUmaVez = false;
  document.addEventListener('pagina:render', (ev) => {
    if (!ev.detail || ev.detail.chave !== CHAVE_PAGINA) return;
    if (!carregouUmaVez && location.protocol !== 'file:'){ carregouUmaVez = true; carregar(); }
    else montar();
  });
  document.addEventListener('sessao:expirada', () => { estado.sessao = { autenticado: false }; estado.config = null; montar(); });
})();
