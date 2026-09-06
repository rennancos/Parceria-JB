/* Processo principal do aplicativo Windows.

   O que este arquivo é: uma janela que abre o `index.html` do portal — o mesmo
   arquivo que abre por duplo clique no navegador, sem uma linha de diferença.
   O Electron carrega a página por `file://`, exatamente o cenário que o
   projeto já suporta desde o começo (ver md/01-como-rodar.md).

   O QUE ISSO PRESERVA, E O QUE NÃO

   Preserva: home, páginas do menu, equipe, black mode, rodapé, navegação por
   hash — tudo. `js/documentos.js` desiste sozinho em `file://` (é a primeira
   linha dele), então o aplicativo mostra a semente dos `.js`, sem botões de
   edição. É o mesmo comportamento do duplo clique de hoje.

   Não preserva: a edição pela própria página. Ela depende da API, e a API vive
   na VM — junto com o acervo, que precisa ser um só para todo mundo. Se cada
   aplicativo instalado tivesse o seu `documentos.json` local, o acervo da
   equipe se partiria em dezenas de cópias divergentes. Quem edita continua
   editando pelo navegador, no endereço da VM. Ver md/10-aplicativo-windows.md.

   Nada aqui é lido pelo site nem pelo servidor: `app/` só existe dentro do
   executável. Removendo esta pasta, o projeto volta a ser exatamente o que era. */
'use strict';

const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');

const atualizacao = require('./atualizacao');

const RAIZ = path.join(__dirname, '..');
const PAGINA = path.join(RAIZ, 'index.html');

// Agrupa a janela na barra de tarefas e dá identidade às notificações do
// Windows. Precisa bater com o `appId` do electron-builder.yml.
app.setAppUserModelId('br.com.parceriajb.portal');

let janela = null;

/* ---------- Janela ---------- */

function criarJanela(){
  janela = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,          // o portal é responsivo até bem estreito
    minHeight: 480,
    show: false,
    // Vale só até a página carregar: daí o <title> do index.html (e o que o
    // js/router.js escreve a cada troca de página) assume. Por isso é o nome
    // do produto, e não uma cópia do título da home.
    title: 'Parceria JB',
    // O executável instalado já carrega este ícone (electron-builder o embute no
    // .exe), mas `npm run app` roda pelo electron.exe: sem esta linha a janela de
    // desenvolvimento aparece com o átomo do Electron, e não com a marca.
    icon: path.join(__dirname, 'icone.ico'),
    webPreferences: {
      // Os três juntos são o que mantém a página sem acesso a Node. A página é
      // nossa, mas ela também renderiza conteúdo que a equipe edita — não custa
      // nada tratá-la como se fosse de fora.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'barra-atualizacao.js')
    }
  });

  // Só mostra depois de pronta: abrir vazia e pintar depois parece travamento.
  janela.once('ready-to-show', () => janela.show());

  janela.loadFile(PAGINA);

  /* A cor de fundo da JANELA (a faixa que aparece por um quadro ao redimensionar)
     não é CSS e não aceita `var()`. Copiar o hexadecimal para cá criaria uma cor
     fixa fora dos tokens, que é justamente o que md/06-estilos-e-tema.md proíbe —
     e ela ficaria para trás na primeira vez que a paleta mudasse. Então ela é
     perguntada à própria página.

     Trocar o black mode com a janela aberta não a atualiza — só a próxima
     abertura. É uma faixa de um quadro ao redimensionar; não vale um observador
     de classe no preload para acertar. */
  janela.webContents.on('did-finish-load', sincronizarFundo);

  /* Nenhum link abre DENTRO da janela. Endereço externo vai para o navegador
     do sistema (numa janela do Electron não haveria barra de endereço, e sem
     ela ninguém confere para onde foi); documento de docs/ vai para o programa
     que o Windows já usa para PDF e Word.

     Os dois caminhos existem porque js/paginas.js marca todo link que não é
     hash com `target="_blank"` — esse cai no `setWindowOpenHandler`; e o que
     escapar disso cai no `will-navigate`. */
  janela.webContents.setWindowOpenHandler(({ url }) => {
    abrirDestino(url);
    return { action: 'deny' };
  });

  janela.webContents.on('will-navigate', (evento, url) => {
    // Troca de página do portal é por hash e não passa por aqui (o Chromium
    // trata como navegação na mesma página). Então `will-navigate` com file://
    // é link para arquivo — e arquivo se abre no programa do Windows, não
    // dentro da janela, de onde não haveria como voltar.
    evento.preventDefault();
    abrirDestino(url);
  });

  janela.on('closed', () => { janela = null; });
}

async function sincronizarFundo(){
  if (!janela || janela.isDestroyed()) return;

  try {
    const cor = await janela.webContents.executeJavaScript(
      'getComputedStyle(document.body).getPropertyValue("--bg").trim()'
    );
    if (/^#[0-9a-f]{3,8}$/i.test(cor)) janela.setBackgroundColor(cor);
  } catch (e) {
    // Página sem o token, ou janela fechando no meio: fica o branco padrão.
  }
}

// Espelha EXTENSOES de servidor/dados.js: é a mesma lista do que a equipe pode
// publicar em docs/. Lista de permitidos, e não de proibidos, pelo motivo de
// sempre — aqui um `href` inesperado significaria abrir um programa.
const ABRIVEIS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

function abrirDestino(url){
  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)){
    shell.openExternal(url);
    return;
  }

  if (!url.startsWith('file://')) return;

  let alvo;
  try {
    alvo = path.resolve(decodeURIComponent(new URL(url).pathname).replace(/^\//, ''));
  } catch (e) {
    return;
  }

  // Só o que está dentro da pasta do aplicativo, e só o que é documento.
  if (alvo !== RAIZ && !alvo.startsWith(RAIZ + path.sep)) return;
  if (!ABRIVEIS.includes(path.extname(alvo).slice(1).toLowerCase())) return;

  shell.openPath(alvo);
}

/* ---------- Menu ---------- */

function montarMenu(){
  const menu = Menu.buildFromTemplate([
    {
      label: 'Portal',
      submenu: [
        { label: 'Início', accelerator: 'Alt+Home', click: () => janela && janela.loadFile(PAGINA) },
        { label: 'Recarregar', role: 'reload' },
        { type: 'separator' },
        { label: 'Sair', role: 'quit' }
      ]
    },
    {
      label: 'Exibir',
      submenu: [
        { label: 'Aumentar', role: 'zoomIn' },
        { label: 'Diminuir', role: 'zoomOut' },
        { label: 'Tamanho normal', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Tela cheia', role: 'togglefullscreen' },
        ...(app.isPackaged ? [] : [{ label: 'Ferramentas do desenvolvedor', role: 'toggleDevTools' }])
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        { label: 'Verificar atualizações…', click: verificarManualmente },
        { label: 'Sobre', click: sobre }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

function sobre(){
  dialog.showMessageBox(janela, {
    type: 'info',
    title: 'Sobre',
    message: 'Portal Parceria JB',
    detail: `Versão ${atualizacao.versaoAtual()}\nUso interno Soluções de Mídias.`,
    buttons: ['Fechar']
  });
}

/* A verificação pelo menu é a barulhenta: quem clicou está esperando resposta,
   inclusive "não deu". A do início (mais abaixo) é a silenciosa. */
async function verificarManualmente(){
  if (!janela) return;

  try {
    const info = await atualizacao.verificar();

    if (!info.configurado){
      return dialog.showMessageBox(janela, {
        type: 'info',
        title: 'Atualizações',
        message: 'A verificação de atualização não está configurada nesta instalação.',
        detail: 'Quem cuida do portal precisa publicar o endereço de atualização. Ver md/10-aplicativo-windows.md.',
        buttons: ['Fechar']
      });
    }

    if (!info.ha){
      return dialog.showMessageBox(janela, {
        type: 'info',
        title: 'Atualizações',
        message: 'O portal já está na versão mais recente.',
        detail: `Versão instalada: ${info.atual}`,
        buttons: ['Fechar']
      });
    }

    // Tem versão nova: quem mostra é a barra na página, para não haver dois
    // caminhos diferentes de atualizar dependendo de por onde a pessoa entrou.
    anunciar(info);
  } catch (erro) {
    dialog.showMessageBox(janela, {
      type: 'warning',
      title: 'Atualizações',
      message: 'Não foi possível verificar se há atualização.',
      detail: erro.message,
      buttons: ['Fechar']
    });
  }
}

/* ---------- Ponte com a página ---------- */

let disponivel = null;    // o manifesto da última verificação com versão nova

/* Guardar e avisar são a mesma coisa, sempre: se a barra aparecesse sem que
   `disponivel` estivesse preenchido, o botão dela daria erro ao ser clicado. */
function anunciar(info){
  disponivel = info;
  if (janela && !janela.isDestroyed()) janela.webContents.send('atualizacao:disponivel', info);
}

// A barra pergunta isto ao carregar — é o caso de a página ter sido recarregada
// depois de a verificação já ter terminado. Sem nada pendente devolve null e a
// barra não aparece; ela também escuta `atualizacao:disponivel`, para o caso
// contrário (a verificação termina com a página já aberta).
ipcMain.handle('atualizacao:pendente', () => disponivel);

/* Devolve `{ ok }` em vez de lançar. Erro que atravessa um `ipcMain.handle`
   chega do outro lado embrulhado ("Error invoking remote method '…': …"), e a
   barra teria de desembrulhar a mensagem no grito para mostrar algo legível.
   Aqui a mensagem sai pronta — e erro inesperado vira uma frase em vez de um
   stack trace na tela de quem só queria atualizar. */
ipcMain.handle('atualizacao:instalar', async (evento) => {
  if (!disponivel) return { ok: false, mensagem: 'Não há atualização para instalar.' };

  const enviar = (pct) => {
    if (!evento.sender.isDestroyed()) evento.sender.send('atualizacao:progresso', pct);
  };

  try {
    const caminho = await atualizacao.baixar(disponivel, enviar);
    await atualizacao.instalar(caminho);
    return { ok: true };
  } catch (erro) {
    if (erro instanceof atualizacao.ErroDeAtualizacao){
      return { ok: false, mensagem: erro.message };
    }
    console.error('[atualizacao]', erro);
    return { ok: false, mensagem: 'Algo deu errado ao atualizar. Tente pela página oficial de download.' };
  }
});

ipcMain.handle('atualizacao:abrir-pagina', () => {
  if (disponivel && disponivel.pagina) abrirDestino(disponivel.pagina);
});

/* ---------- Início ---------- */

// Uma instância só: duas janelas sobre o mesmo portal não servem para nada, e
// duas verificações de atualização em paralelo servem menos ainda.
if (!app.requestSingleInstanceLock()){
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!janela) return;
    if (janela.isMinimized()) janela.restore();
    janela.focus();
  });

  app.whenReady().then(() => {
    montarMenu();
    criarJanela();
    atualizacao.limparTemporarios();

    /* A verificação do início é silenciosa: sem rede, sem VPN, servidor fora
       do ar — nada disso pode virar caixa de erro na cara de quem só queria
       consultar um documento. Falhou, o portal abre como sempre.

       O atraso deixa a página desenhar primeiro; a barra chegando junto com o
       conteúdo faria a página pular. */
    setTimeout(async () => {
      try {
        const info = await atualizacao.verificar();
        if (info.ha) anunciar(info);
      } catch (erro) {
        // De propósito. Quem quiser saber por que usa Ajuda › Verificar.
      }
    }, 2500);
  });

  app.on('window-all-closed', () => app.quit());
}
