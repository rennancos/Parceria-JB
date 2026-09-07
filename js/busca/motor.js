/* Funções puras da busca: normalização, ranking e destaque seguro de texto. */
(function(){
  'use strict';
  const escaparHtml = window.Portal.escaparHtml;
  function normalizar(texto){
    const origem = String(texto ?? '');
    let saida = '';
    const mapa = [];

    for (let i = 0; i < origem.length; i += 1){
      const limpo = origem[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      for (let j = 0; j < limpo.length; j += 1){
        saida += limpo[j];
        mapa.push(i);   // cada caractere normalizado aponta para sua origem
      }
    }

    return { texto: saida, mapa };
  }

  function normal(texto){
    return normalizar(texto).texto;
  }

  function termosDe(consulta){
    return normal(consulta).split(/\s+/).filter(Boolean);
  }

  /* ---------- Pontuação ----------

     Todo termo digitado precisa aparecer em algum campo (E, não OU): quem
     digita "vizrt portal" quer o que tem os dois, não a união. O peso do campo
     decide a ordem, e casar no começo de uma palavra vale o dobro de casar no
     meio — quem digita "mam" quer a área MAM antes de "Ca[mam]bu". */
  const PESOS = { nTitulo: 10, nSubtitulo: 4, nContexto: 2, nCorpo: 1 };
  const CAMPOS = ['nTitulo', 'nSubtitulo', 'nContexto', 'nCorpo'];

  function pontuarTermo(item, termo){
    let melhor = 0;

    for (const campo of CAMPOS){
      const alvo = item[campo];
      if (!alvo) continue;

      const posicao = alvo.indexOf(termo);
      if (posicao === -1) continue;

      let pontos = PESOS[campo];
      if (posicao === 0 || /[\s›\-/(.,]/.test(alvo[posicao - 1])) pontos *= 2;  // início de palavra
      if (alvo === termo) pontos *= 2;                                          // campo inteiro

      if (pontos > melhor) melhor = pontos;
    }

    return melhor;
  }

  function buscar(indice, consulta, limite = 30){
    const termos = termosDe(consulta);
    if (!termos.length) return [];

    const achados = [];

    for (const item of indice){
      let total = 0;
      let todos = true;

      for (const termo of termos){
        const pontos = pontuarTermo(item, termo);
        if (!pontos){ todos = false; break; }
        total += pontos;
      }

      if (todos) achados.push({ item, pontos: total });
    }

    // Empate resolvido pelo título mais curto: o mais específico costuma ser o
    // mais curto, e a ordem fica estável entre digitações.
    achados.sort((a, b) => b.pontos - a.pontos || a.item.titulo.length - b.item.titulo.length);
    return achados.slice(0, limite);
  }

  /* ---------- Destaque ----------

     Grifa no texto ORIGINAL (com acento e maiúscula) os trechos que casaram no
     texto normalizado, voltando pelo mapa de índices. */
  function destacar(texto, termos){
    const original = String(texto ?? '');
    if (!original) return '';

    const { texto: alvo, mapa } = normalizar(original);
    const faixas = [];

    for (const termo of termos){
      let de = alvo.indexOf(termo);
      while (de !== -1){
        const fim = de + termo.length;
        faixas.push([mapa[de], fim < mapa.length ? mapa[fim] : original.length]);
        de = alvo.indexOf(termo, fim);
      }
    }

    if (!faixas.length) return escaparHtml(original);

    // Termos que se sobrepõem ("mam" e "mamute") produziriam <mark> aninhado.
    faixas.sort((a, b) => a[0] - b[0]);
    const unidas = [faixas[0]];
    for (const faixa of faixas.slice(1)){
      const ultima = unidas[unidas.length - 1];
      if (faixa[0] <= ultima[1]) ultima[1] = Math.max(ultima[1], faixa[1]);
      else unidas.push(faixa);
    }

    let saida = '';
    let cursor = 0;
    for (const [inicio, fim] of unidas){
      saida += escaparHtml(original.slice(cursor, inicio));
      saida += `<mark>${escaparHtml(original.slice(inicio, fim))}</mark>`;
      cursor = fim;
    }
    return saida + escaparHtml(original.slice(cursor));
  }


  // `normalizar` fica de fora: só este arquivo precisa do mapa de índices que
  // ela devolve (é o que `destacar` usa para grifar no texto acentuado). Quem
  // está de fora quer `normal`, que é a versão que devolve só o texto.
  window.Portal.buscaMotor = { normal, termosDe, buscar, destacar };
})();
