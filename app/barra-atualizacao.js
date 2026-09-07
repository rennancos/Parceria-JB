/* A barra "Atualizar agora" — o único pedaço do aplicativo que aparece na tela.

   Roda como `preload` do Electron, e isso é a escolha central deste arquivo:
   o preload enxerga o DOM da página e o IPC do aplicativo, mas roda num mundo
   isolado do JavaScript do portal. Consequências, todas desejadas:

   1. `index.html` NÃO PRECISA MUDAR. Nenhuma tag, nenhum `<script>`, nenhuma
      classe. A barra existe dentro do executável e em lugar nenhum mais — quem
      abre o portal pelo navegador ou por duplo clique não vê nem carrega nada
      disto. O site continua sendo exatamente o que era.

   2. Nada é exposto para a página. Não há `contextBridge`, não há
      `window.algumaCoisa`: o JavaScript do portal não tem como chamar o
      download nem descobrir que o aplicativo existe. A superfície é zero.

   3. Estilo pelos tokens do css/styles.css (`--card`, `--ink`, `--accent`…),
      não por cor fixa. É o que faz a barra acompanhar o black mode sozinha —
      mesma regra do resto do projeto, ver md/06-estilos-e-tema.md.

   O texto que vem do servidor (versão e notas) entra por `textContent`, nunca
   por `innerHTML`. O manifesto já é validado em app/atualizacao.js; isto aqui
   é a segunda tranca da mesma porta. */
'use strict';

const { ipcRenderer } = require('electron');

/* SOBRE OS VALORES DE RESERVA DO `var()`

   Nenhum é hexadecimal. Um `var(--card, #FAF9F4)` traria para cá uma cópia da
   paleta, que envelheceria calada na primeira vez que ela mudasse — e ela
   muda (ver md/06-estilos-e-tema.md). A reserva é uma **cor de sistema** do
   CSS: `Canvas`, `CanvasText`, `AccentColor`, `GrayText`. Elas vêm do tema do
   Windows, acertam claro e escuro sozinhas, e nunca ficam desatualizadas.

   Na prática elas nunca entram em uso — os tokens do portal sempre existem.
   São a rede para o caso de a barra desenhar antes do css/styles.css. */
const ESTILO = `
.pajb-att{
  position: fixed;
  left: 16px; right: 16px; bottom: 16px;
  z-index: 9999;
  margin: 0 auto;
  max-width: 720px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 16px 20px;
  border: 1px solid var(--line-strong, ButtonBorder);
  border-radius: var(--radius-sm, 8px);
  background: var(--card, Canvas);
  color: var(--ink, CanvasText);
  box-shadow: var(--shadow-card-lg, 0 20px 44px rgba(0,0,0,0.16));
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.45;
  animation: pajb-att-entra 220ms ease-out;
}
@keyframes pajb-att-entra{
  from{ opacity: 0; transform: translateY(12px); }
  to{ opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce){
  .pajb-att{ animation: none; }
}

.pajb-att-texto{ flex: 1 1 240px; min-width: 0; }
.pajb-att-titulo{ margin: 0; font-weight: 650; }
.pajb-att-notas{
  margin: 6px 0 0;
  padding-left: 18px;
  color: var(--ink-soft, GrayText);
  font-size: 0.88rem;
}
.pajb-att-notas li{ margin: 2px 0; }
.pajb-att-detalhe{
  margin: 6px 0 0;
  color: var(--ink-soft, GrayText);
  font-size: 0.88rem;
}

.pajb-att-acoes{ display: flex; gap: 8px; flex-wrap: wrap; }
.pajb-att button{
  font: inherit;
  cursor: pointer;
  border-radius: var(--radius-pill, 999px);
  border: 1px solid var(--line-strong, ButtonBorder);
  background: transparent;
  color: var(--ink, CanvasText);
  padding: 9px 18px;
  transition: background-color 140ms ease, border-color 140ms ease;
}
.pajb-att button:hover{ background: var(--bg-2, ButtonFace); }
.pajb-att button:focus-visible{
  outline: 2px solid var(--accent-1, AccentColor);
  outline-offset: 2px;
}
.pajb-att button[disabled]{ opacity: 0.6; cursor: default; }
.pajb-att .pajb-att-primario{
  background: var(--accent, AccentColor);
  border-color: var(--accent, AccentColor);
  color: var(--on-accent, AccentColorText);
  font-weight: 650;
}
.pajb-att .pajb-att-primario:hover{ background: var(--accent-soft, AccentColor); }

.pajb-att-barra{
  flex: 1 1 100%;
  height: 6px;
  border-radius: 999px;
  background: var(--bg-2, ButtonFace);
  overflow: hidden;
}
.pajb-att-barra > i{
  display: block;
  height: 100%;
  width: 0;
  background: var(--accent, AccentColor);
  transition: width 200ms ease;
}
.pajb-att-barra.indeterminada > i{
  width: 40%;
  animation: pajb-att-desliza 1.1s ease-in-out infinite;
}
@keyframes pajb-att-desliza{
  0%{ margin-left: -40%; }
  100%{ margin-left: 100%; }
}
@media (prefers-reduced-motion: reduce){
  .pajb-att-barra.indeterminada > i{ animation: none; width: 100%; }
  .pajb-att-barra > i{ transition: none; }
}

.pajb-att-erro{
  flex: 1 1 100%;
  margin: 0;
  color: var(--ink, CanvasText);
  background: var(--bg-2, ButtonFace);
  border-radius: var(--radius-xs, 6px);
  padding: 10px 12px;
  font-size: 0.88rem;
}

/* Em tela estreita os botões ocupam a linha inteira: o portal é usado em
   monitor, mas a janela pode ser arrastada para meia tela. */
@media (max-width: 560px){
  .pajb-att{ left: 8px; right: 8px; bottom: 8px; padding: 14px 16px; }
  .pajb-att-acoes{ width: 100%; }
  .pajb-att-acoes button{ flex: 1 1 auto; }
}
`;

let barra = null;
let info = null;
let instalando = false;

/* ---------- Montagem ---------- */

function elemento(tag, classe, texto){
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto) el.textContent = texto;      // sempre texto, nunca markup
  return el;
}

function remover(){
  if (barra && barra.parentNode) barra.parentNode.removeChild(barra);
  barra = null;
}

function estilo(){
  if (document.getElementById('pajb-att-estilo')) return;
  const tag = document.createElement('style');
  tag.id = 'pajb-att-estilo';
  tag.textContent = ESTILO;
  document.head.appendChild(tag);
}

/* Desenha a barra do zero a cada estado. São três telas curtas (aviso,
   baixando, erro) e refazer é mais simples de ler do que esconder e mostrar
   pedaço — o mesmo raciocínio do js/router.js com as views. */
function desenhar(conteudo){
  estilo();
  remover();

  barra = elemento('div', 'pajb-att');
  barra.setAttribute('role', 'status');
  barra.setAttribute('aria-live', 'polite');
  conteudo(barra);
  document.body.appendChild(barra);
}

/* ---------- Tela 1: há versão nova ---------- */

function mostrarAviso(){
  desenhar((raiz) => {
    const texto = elemento('div', 'pajb-att-texto');
    texto.appendChild(elemento('p', 'pajb-att-titulo',
      `Versão ${info.versao} disponível — você está na ${info.atual}.`));

    if (info.notas && info.notas.length){
      const lista = elemento('ul', 'pajb-att-notas');
      info.notas.forEach((nota) => lista.appendChild(elemento('li', '', nota)));
      texto.appendChild(lista);
    } else if (info.publicadoEm){
      texto.appendChild(elemento('p', 'pajb-att-detalhe', `Publicada em ${info.publicadoEm}.`));
    }

    raiz.appendChild(texto);

    const acoes = elemento('div', 'pajb-att-acoes');

    const atualizar = elemento('button', 'pajb-att-primario', 'Atualizar agora');
    atualizar.type = 'button';
    atualizar.addEventListener('click', instalar);
    acoes.appendChild(atualizar);

    const depois = elemento('button', '', 'Agora não');
    depois.type = 'button';
    // Só some da tela. A atualização continua disponível em
    // Ajuda › Verificar atualizações, e volta a aparecer na próxima abertura.
    depois.addEventListener('click', remover);
    acoes.appendChild(depois);

    raiz.appendChild(acoes);
  });
}

/* ---------- Tela 2: baixando ---------- */

let preenchimento = null;
let trilho = null;

function mostrarProgresso(){
  desenhar((raiz) => {
    const texto = elemento('div', 'pajb-att-texto');
    texto.appendChild(elemento('p', 'pajb-att-titulo', `Baixando a versão ${info.versao}…`));
    texto.appendChild(elemento('p', 'pajb-att-detalhe',
      'O portal vai fechar sozinho para instalar e abrir de novo. Seus documentos e preferências continuam onde estão.'));
    raiz.appendChild(texto);

    trilho = elemento('div', 'pajb-att-barra indeterminada');
    preenchimento = elemento('i', '');
    trilho.appendChild(preenchimento);
    raiz.appendChild(trilho);
  });
}

function atualizarProgresso(pct){
  if (!trilho || !preenchimento) return;

  if (pct < 0){
    trilho.classList.add('indeterminada');
    return;
  }

  trilho.classList.remove('indeterminada');
  preenchimento.style.width = `${pct}%`;
  if (barra) barra.setAttribute('aria-label', `Baixando a atualização: ${pct}%`);
}

/* ---------- Tela 3: não deu ---------- */

function mostrarErro(mensagem){
  desenhar((raiz) => {
    const texto = elemento('div', 'pajb-att-texto');
    texto.appendChild(elemento('p', 'pajb-att-titulo', 'Não foi possível atualizar agora.'));
    raiz.appendChild(texto);

    raiz.appendChild(elemento('p', 'pajb-att-erro', mensagem));

    const acoes = elemento('div', 'pajb-att-acoes');

    const tentar = elemento('button', 'pajb-att-primario', 'Tentar de novo');
    tentar.type = 'button';
    tentar.addEventListener('click', instalar);
    acoes.appendChild(tentar);

    // A saída manual. Existe justamente para o dia em que o download automático
    // não funcionar — antivírus, proxy, permissão — e continuar havendo um
    // jeito de a pessoa se atualizar sem depender de suporte.
    if (info && info.pagina){
      const pagina = elemento('button', '', 'Baixar pelo navegador');
      pagina.type = 'button';
      pagina.addEventListener('click', () => ipcRenderer.invoke('atualizacao:abrir-pagina'));
      acoes.appendChild(pagina);
    }

    const fechar = elemento('button', '', 'Fechar');
    fechar.type = 'button';
    fechar.addEventListener('click', remover);
    acoes.appendChild(fechar);

    raiz.appendChild(acoes);
  });
}

/* ---------- Ação ---------- */

async function instalar(){
  if (instalando) return;        // clique duplo não baixa duas vezes
  instalando = true;
  mostrarProgresso();

  try {
    // O outro lado devolve `{ ok, mensagem }` e não lança — ver o comentário
    // do handler em app/principal.js.
    const resultado = await ipcRenderer.invoke('atualizacao:instalar');

    if (resultado && resultado.ok) return;
    // Deu certo: o aplicativo fecha em seguida, por conta do processo
    // principal. A barra fica no "baixando" até isso acontecer.

    instalando = false;
    mostrarErro((resultado && resultado.mensagem) || 'Não foi possível concluir a atualização.');
  } catch (erro) {
    // Só chega aqui se o próprio IPC falhar — janela fechando, por exemplo.
    instalando = false;
    mostrarErro('A atualização não pôde ser iniciada. Tente de novo.');
  }
}

/* ---------- Início ---------- */

function iniciar(){
  ipcRenderer.on('atualizacao:disponivel', (evento, novo) => {
    info = novo;
    if (!instalando) mostrarAviso();
  });

  ipcRenderer.on('atualizacao:progresso', (evento, pct) => atualizarProgresso(pct));

  // A página pode ter sido recarregada depois de a verificação já ter passado.
  ipcRenderer.invoke('atualizacao:pendente').then((pendente) => {
    if (!pendente) return;
    info = pendente;
    mostrarAviso();
  }).catch(() => { /* sem atualização pendente é o caso normal */ });
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}
