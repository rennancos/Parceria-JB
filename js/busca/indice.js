/* Adaptação do conteúdo do portal para entradas de busca, sem acessar o DOM. */
(function(){
  'use strict';
  const { normal } = window.Portal.buscaMotor;
  const { blocosDaSecao } = window.Portal.paginasModelo;
  const { idDaPessoa } = window.Portal.equipe;
  function entrada(dados){
    return {
      tipo: dados.tipo,
      titulo: dados.titulo || '',
      subtitulo: dados.subtitulo || '',
      contexto: dados.contexto || '',
      href: dados.href || '',
      alvoId: dados.alvoId || '',
      // Pré-normalizado: a comparação roda a cada tecla, a normalização não.
      nTitulo: normal(dados.titulo),
      nSubtitulo: normal(dados.subtitulo),
      nContexto: normal(dados.contexto),
      nCorpo: normal(dados.corpo),
    };
  }

  /* Cada tipo de bloco guarda o texto em campos diferentes. Um lugar só decide
     como cada um vira entrada — acrescentar um tipo de bloco em paginas.js
     significa acrescentar uma linha aqui, e nada mais. Tipo desconhecido é
     ignorado em silêncio: a busca perde aquele conteúdo, mas não quebra. */
  const ITEM_POR_TIPO = {
    paineis:     (i) => ({ titulo: i.titulo, subtitulo: i.texto, corpo: i.meta, href: i.href }),
    passos:      (i) => ({ titulo: i.titulo, subtitulo: i.texto, corpo: i.destaque, href: i.href }),
    links:       (i) => ({ titulo: i.titulo, subtitulo: i.descricao, corpo: i.formato, href: i.href }),
    sistemas:    (i) => ({ titulo: i.sistema, subtitulo: i.perfil ? `Perfil: ${i.perfil}` : '' }),
    fabricantes: (i) => ({ titulo: i.nome, subtitulo: i.portal || i.email || '',
                           corpo: [i.email, i.telefone, i.horario].filter(Boolean).join(' ') }),
    notas:       (i) => ({ titulo: typeof i === 'string' ? i : '' }),
  };

  function indexarPaginas(indice, paginas){
    Object.keys(paginas).forEach((chave) => {
      const pagina = paginas[chave] || {};
      const hrefPagina = `#${chave}`;

      indice.push(entrada({
        tipo: 'pagina',
        titulo: pagina.titulo,
        subtitulo: pagina.descricao,
        contexto: pagina.eyebrow,
        href: hrefPagina,
      }));

      (pagina.secoes || []).forEach((secao) => {
        const trilha = [pagina.titulo, secao.titulo].filter(Boolean).join(' › ');

        indice.push(entrada({
          tipo: 'secao',
          titulo: secao.titulo,
          subtitulo: secao.texto,
          contexto: pagina.titulo,
          href: hrefPagina,
        }));

        blocosDaSecao(secao).forEach((bloco) => {
          const comoItem = ITEM_POR_TIPO[bloco.tipo];
          if (!comoItem) return;

          (bloco.itens || []).forEach((item) => {
            const dados = comoItem(item);
            if (!dados.titulo) return;   // item sem rótulo não é achável

            indice.push(entrada({
              tipo: bloco.tipo,
              titulo: dados.titulo,
              subtitulo: dados.subtitulo,
              corpo: dados.corpo,
              contexto: bloco !== secao && bloco.titulo ? `${trilha} › ${bloco.titulo}` : trilha,
              // Item com destino próprio (portal, PDF) leva até ele; sem
              // destino, leva até a página onde ele está.
              href: dados.href || hrefPagina,
            }));
          });
        });
      });
    });
  }

  function indexarEquipe(indice, equipe){
    equipe.forEach((pessoa) => {
      indice.push(entrada({
        tipo: 'pessoa',
        titulo: pessoa.nome,
        subtitulo: pessoa.cargo,
        contexto: pessoa.area ? `Equipe › ${pessoa.area}` : 'Equipe',
        corpo: [pessoa.email, pessoa.destaque].filter(Boolean).join(' '),
        href: '#',
        alvoId: idDaPessoa(pessoa.nome),
      }));
    });
  }

  function montarIndice(paginas, equipe){
    const indice = [];
    indexarPaginas(indice, paginas);
    indexarEquipe(indice, equipe);
    return indice;
  }

  window.Portal.buscaIndice = { montar: montarIndice };
})();
