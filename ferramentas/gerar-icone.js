/* Gera o ícone do executável Windows.

       Fotos/LOGOS/TVGLOBO_LOGO.png   ← a marca, como veio (é um JPEG, ver abaixo)
       app/icone.ico                  ← o que o electron-builder embute no .exe

   Rode se a marca mudar:

       npm run icone

   Depende de ffmpeg no PATH, como `npm run fotos`, e de nada mais.

   O arquivo de origem tem extensão .png mas é um JPEG de 148x148 — dá para
   conferir com `head -c4`, que mostra `ff d8 ff e0` em vez da assinatura PNG.
   Isso não atrapalha aqui: quem lê é o ffmpeg, que decide pelo conteúdo, não
   pelo nome. O que atrapalhava era mandar o arquivo direto para o
   electron-builder, que confia na extensão e recusa.

   Por que 148 vira 256: o Windows pede 256x256 no ícone de aplicativo (é o
   tamanho que a lista de programas e o Alt+Tab usam). Ampliar perde um pouco
   de nitidez, e é o melhor possível com a arte que existe — se algum dia
   aparecer a marca em vetor ou num PNG maior, troque o arquivo de origem e
   rode de novo, que os seis tamanhos saem melhores de graça.

   Sobre o formato: um .ico é um contêiner de várias imagens, e cada uma pode
   ser PNG ou BMP. Aqui o 256 vai como PNG (é o que o Windows espera nesse
   tamanho, e economiza 256 KB) e os menores vão como BMP de 32 bits, que é o
   que qualquer versão do Windows lê sem hesitar. */

'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const ORIGEM = path.join(RAIZ, 'Fotos', 'LOGOS', 'TVGLOBO_LOGO.png');
const DESTINO = path.join(RAIZ, 'app', 'icone.ico');

// Do maior para o menor: é a ordem em que o Windows costuma listar, e deixa o
// 256 (o único PNG) no começo do arquivo.
const TAMANHOS = [256, 128, 64, 48, 32, 16];

function ffmpeg(args, oQue){
  const r = spawnSync('ffmpeg', args, { maxBuffer: 64 * 1024 * 1024 });
  if (r.error && r.error.code === 'ENOENT'){
    console.error('ffmpeg não encontrado no PATH. Instale-o e rode de novo.');
    process.exit(1);
  }
  if (r.status !== 0){
    console.error(`ffmpeg falhou ao ${oQue}:`);
    console.error(String(r.stderr));
    process.exit(1);
  }
  return r.stdout;
}

/* A marca sai do ffmpeg em BGRA, que já é a ordem de canais que tanto o BMP
   quanto o ICO usam — nenhuma conversão de pixel acontece neste arquivo. */
function pixels(lado){
  const bruto = ffmpeg([
    '-v', 'error', '-i', ORIGEM,
    '-vf', `scale=${lado}:${lado}:flags=lanczos`,
    '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-'
  ], `redimensionar para ${lado}px`);

  if (bruto.length !== lado * lado * 4){
    console.error(`ffmpeg devolveu ${bruto.length} bytes para ${lado}px, esperados ${lado * lado * 4}.`);
    process.exit(1);
  }
  return bruto;
}

function png(lado){
  return ffmpeg([
    '-v', 'error', '-i', ORIGEM,
    '-vf', `scale=${lado}:${lado}:flags=lanczos`,
    '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-'
  ], `gerar o PNG de ${lado}px`);
}

/* BMP dentro de .ico tem duas particularidades que não são erro de digitação:
   a altura no cabeçalho é o dobro da real (a metade de baixo é a máscara de
   transparência do tempo dos ícones de 16 cores) e as linhas ficam de baixo
   para cima. A máscara vai zerada — a marca é opaca em todo o quadrado. */
function bmp(lado, bgra){
  const cabecalho = Buffer.alloc(40);
  cabecalho.writeUInt32LE(40, 0);          // tamanho do BITMAPINFOHEADER
  cabecalho.writeInt32LE(lado, 4);         // largura
  cabecalho.writeInt32LE(lado * 2, 8);     // altura: imagem + máscara
  cabecalho.writeUInt16LE(1, 12);          // planos
  cabecalho.writeUInt16LE(32, 14);         // bits por pixel
  cabecalho.writeUInt32LE(0, 16);          // sem compressão

  const invertido = Buffer.alloc(bgra.length);
  const linha = lado * 4;
  for (let y = 0; y < lado; y++){
    bgra.copy(invertido, (lado - 1 - y) * linha, y * linha, (y + 1) * linha);
  }

  const bytesPorLinhaDaMascara = Math.ceil(lado / 32) * 4;
  const mascara = Buffer.alloc(bytesPorLinhaDaMascara * lado);

  return Buffer.concat([cabecalho, invertido, mascara]);
}

const imagens = TAMANHOS.map((lado) => ({
  lado,
  dados: lado === 256 ? png(lado) : bmp(lado, pixels(lado))
}));

const CABECALHO = 6;
const ENTRADA = 16;

const diretorio = Buffer.alloc(CABECALHO + ENTRADA * imagens.length);
diretorio.writeUInt16LE(0, 0);                 // reservado
diretorio.writeUInt16LE(1, 2);                 // 1 = ícone (2 seria cursor)
diretorio.writeUInt16LE(imagens.length, 4);

let deslocamento = diretorio.length;
imagens.forEach((img, i) => {
  const p = CABECALHO + ENTRADA * i;
  // 256 se escreve como 0: o campo tem um byte, e 256 não cabe nele.
  diretorio.writeUInt8(img.lado === 256 ? 0 : img.lado, p);
  diretorio.writeUInt8(img.lado === 256 ? 0 : img.lado, p + 1);
  diretorio.writeUInt8(0, p + 2);              // cores da paleta: nenhuma
  diretorio.writeUInt8(0, p + 3);              // reservado
  diretorio.writeUInt16LE(1, p + 4);           // planos
  diretorio.writeUInt16LE(32, p + 6);          // bits por pixel
  diretorio.writeUInt32LE(img.dados.length, p + 8);
  diretorio.writeUInt32LE(deslocamento, p + 12);
  deslocamento += img.dados.length;
});

const ico = Buffer.concat([diretorio, ...imagens.map((i) => i.dados)]);
fs.writeFileSync(DESTINO, ico);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`app/icone.ico  ${TAMANHOS.join(', ')} px  ${kb(ico.length)}`);
