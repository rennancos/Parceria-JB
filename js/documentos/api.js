/* Transporte da edição. Carregar este script não inicia requests. */
(function(){
  'use strict';

  /**
   * Transporte na mesma origem de servidor/servidor.js; retorna o objeto JSON.
   * CONTRATO: erros HTTP usam {erro: string} e são lançados com erro.status.
   * Um 401 invalida a interface via documentos.js mesmo no login; 403 apenas
   * recusa a ação. Não converter ambos em logout (tests/unit/documentos.test.cjs).
   * @param {string} caminho Rota sem o prefixo /api.
   * @param {RequestInit} [opcoes]
   * @returns {Promise<object>}
   */
  async function pedir(caminho, opcoes){
    // Header não simples: uma página externa precisa de preflight, que o
    // servidor não autoriza. seguranca.js também confere Origin/Fetch Metadata.
    const res = await fetch('/api' + caminho, { credentials: 'same-origin', ...opcoes,
      headers: { ...opcoes?.headers, 'X-Portal-Request': '1' } });
    if (res.status === 401){
      document.dispatchEvent(new CustomEvent('sessao:expirada'));
    }

    if (!(res.headers.get('content-type') || '').includes('application/json')){
      const erro = new Error('A API de edição não está respondendo nesta origem.');
      erro.status = res.status;
      throw erro;
    }

    const corpo = await res.json();
    if (!res.ok){
      const erro = new Error(typeof corpo?.erro === 'string'
        ? corpo.erro : 'Não foi possível falar com o servidor.');
      erro.status = res.status;
      throw erro;
    }
    if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)){
      throw new Error('O servidor retornou uma resposta inválida.');
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

  /** @returns {Promise<{autenticado: boolean, nome?: string, login?: string, papel?: string}>} */
  async function sessao(){
    return validarSessao(await pedir('/sessao'));
  }

  function validarSessao(dados){
    if (typeof dados?.autenticado !== 'boolean'
      || (dados.autenticado && (!['equipe', 'dev'].includes(dados.papel)
        || typeof dados.nome !== 'string' || typeof dados.login !== 'string'))){
      throw new Error('O servidor retornou uma sessão inválida.');
    }
    return dados;
  }

  window.Portal.documentosApi = { pedir, enviarJson, sessao, validarSessao };
})();
