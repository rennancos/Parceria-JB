/* Estado do servidor e operações de documentos, sem dependência do DOM.
   A cópia para PAGINAS é uma projeção para leitura; o item completo preenche
   o editor. Nenhuma resposta inválida deve substituir o conteúdo existente. */
(function(){
  'use strict';
  const { blocosDaSecao } = window.Portal.paginasModelo;
  // DEPENDÊNCIA: espelha EXTENSOES de servidor/dados.js. Ao ampliar formatos,
  // revisar também ABRIVEIS em app/principal.js e chips em js/paginas.js.
  const ACEITOS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';

  /** @typedef {{id: string, bloco: string, titulo: string, href: string,
   * descricao?: string, formato?: string, ordem?: number}} Documento */
  /** @typedef {{tipo: string, titulo: string, descricao: string, bloco: string,
   * href: string, arquivo?: File, substituir: boolean}} Rascunho */

  function validarItem(item){
    if (!item || ['id', 'bloco', 'titulo', 'href'].some((campo) => typeof item[campo] !== 'string')
      || ['descricao', 'formato'].some((campo) => item[campo] != null && typeof item[campo] !== 'string')
      || !item.id || !item.bloco){
      throw new Error('O servidor retornou um documento inválido.');
    }
    return item;
  }

  function criar(api, paginas){
    let itens = [];
    let blocos = [];
    let revisao = 0;

    function projetar(){
      Object.values(paginas).forEach((pagina) => {
        (pagina.secoes || []).forEach((secao) => {
          blocosDaSecao(secao).forEach((bloco) => {
            if (bloco.tipo !== 'links' || !bloco.chave) return;
            bloco.itens = itens.filter((item) => item.bloco === bloco.chave)
              .map(({ id, titulo, descricao, href, formato }) => ({ id, titulo, descricao, href, formato }));
          });
        });
      });
    }

    async function carregar(){
      const pedido = ++revisao;
      const dados = await api.pedir('/documentos');
      if (pedido !== revisao) return;
      if (!Array.isArray(dados.itens) || !Array.isArray(dados.blocos)
        || dados.blocos.some((b) => !b || typeof b.chave !== 'string' || typeof b.rotulo !== 'string')){
        throw new Error('O servidor retornou um acervo inválido.');
      }
      dados.itens.forEach(validarItem);
      blocos = dados.blocos;
      itens = dados.itens;
      projetar(); // Inclui lista vazia: não recupera a semente após exclusão.
    }

    /**
     * Envia o arquivo, se houver, e depois os metadados; projeta a confirmação
     * em PAGINAS para router e busca. Não depende de um GET posterior.
     * CONTRATO: upload retorna {href}; POST/PUT retorna {item} completo.
     * As duas escritas não são transacionais: falha nos metadados pode deixar
     * arquivo órfão ou uma substituição já aplicada em docs/.
     * @param {Rascunho} valores Snapshot fornecido por formularios.js.
     * @param {Documento|null} item Item anterior; null inclui um novo.
     * @returns {Promise<Documento>} Confirmação validada; rejeita em erro da API.
     */
    async function salvar(valores, item){
      // Snapshot antes do primeiro await: nem DOM nem objetos mutáveis externos
      // são consultados depois que o upload começou.
      const { tipo, titulo, descricao, bloco, arquivo, substituir } = valores;
      const id = item?.id;
      const hrefAnterior = item?.href || '';
      let href = tipo === 'link' ? valores.href.trim() : '';
      if (tipo === 'arquivo'){
        if (arquivo){
          const resposta = await api.pedir(
            `/arquivos?nome=${encodeURIComponent(arquivo.name)}${substituir ? '&substituir=1' : ''}`,
            { method: 'POST', body: arquivo });
          if (typeof resposta.href !== 'string' || !resposta.href.startsWith('docs/')){
            throw new Error('O servidor não confirmou o destino do arquivo.');
          }
          href = resposta.href;
        } else if (hrefAnterior.startsWith('docs/')) href = hrefAnterior;
      }

      const formato = tipo === 'link' && !/\.(pdf|docx?|xlsx?|pptx?)(?:[?#]|$)/i.test(href) ? 'link' : '';
      const resposta = await api.enviarJson(id ? `/documentos/${encodeURIComponent(id)}` : '/documentos',
        id ? 'PUT' : 'POST', { titulo, descricao, bloco, href, formato });
      const salvo = validarItem(resposta.item);
      ++revisao; // Uma leitura antiga não pode desfazer esta confirmação.
      itens = [...itens.filter((atual) => atual.id !== salvo.id), salvo]
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      projetar();
      return salvo;
    }

    async function excluir(id){
      await api.pedir(`/documentos/${encodeURIComponent(id)}`, { method: 'DELETE' });
      ++revisao;
      itens = itens.filter((item) => item.id !== id);
      projetar();
    }

    return { carregar, salvar, excluir, itemPorId: (id) => itens.find((item) => item.id === id) || null,
      get blocos(){ return blocos; }, get itens(){ return itens; } };
  }

  window.Portal.documentosAcervo = { criar, ACEITOS };
})();
