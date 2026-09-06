/* Gera os avatares que o portal realmente carrega.

   Os retratos originais chegam como PNG/JPEG de câmera ou crachá — o maior
   tinha 4,4 MB. A grade da equipe desenha todos eles num círculo de 132 px
   (`.team-photo-wrapper` em css/equipe.css), então servir o arquivo de origem
   é entregar ~30x mais pixel do que a tela consome, em toda visita e dentro de
   cada instalador Windows.

   Este script resolve isso de uma vez e é repetível:

       Fotos/EQUIPE/originais/<nome>.<ext>   ← masters, versionados, nunca servidos
       Fotos/EQUIPE/<nome>.webp             ← o que o site carrega

   Rode depois de acrescentar qualquer foto nova:

       npm run fotos

   Não é build: o site continua abrindo por duplo clique, e o resultado é
   commitado como qualquer outro arquivo. Só o `.webp` precisa existir para o
   portal funcionar — `originais/` fica de fora do instalador
   (ver electron-builder.yml) e existe apenas para permitir regerar.

   Depende de ffmpeg no PATH, e de nada mais: nenhum pacote npm é instalado.
   O recorte quadrado central reproduz exatamente o que o CSS já fazia com
   `object-fit: cover; object-position: center`, então a diferença visual é
   nenhuma — a diferença é que o recorte deixa de ser feito depois do download. */

'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

/* 264 = 132 px do layout em 2x, o suficiente para tela retina. Subir isso é a
   maneira mais fácil de desfazer o ganho deste script sem perceber. */
const LADO = 264;
const QUALIDADE = 82;

const EXTENSOES = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const RAIZ = path.join(__dirname, '..');
const DIR_SERVIDO = path.join(RAIZ, 'Fotos', 'EQUIPE');
const DIR_ORIGINAIS = path.join(DIR_SERVIDO, 'originais');

function erro(mensagem){
  console.error(`\n  ${mensagem}\n`);
  process.exit(1);
}

function ehImagem(nome){
  return EXTENSOES.has(path.extname(nome).toLowerCase());
}

function kb(bytes){
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function exigirFfmpeg(){
  const teste = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (teste.error) {
    erro('ffmpeg não encontrado no PATH. Instale-o (winget install Gyan.FFmpeg) e rode de novo.');
  }
}

/* Primeira execução: os masters ainda estão soltos em Fotos/EQUIPE/. Move-os
   para originais/ antes de converter, para que a pasta servida passe a conter
   só os .webp. Idempotente — na segunda execução não há o que mover. */
function migrarMasters(){
  if (!fs.existsSync(DIR_SERVIDO)) erro(`Pasta não encontrada: ${DIR_SERVIDO}`);
  fs.mkdirSync(DIR_ORIGINAIS, { recursive: true });

  const soltos = fs.readdirSync(DIR_SERVIDO, { withFileTypes: true })
    .filter((entrada) => entrada.isFile() && ehImagem(entrada.name))
    .map((entrada) => entrada.name);

  let movidos = 0;
  for (const nome of soltos){
    const destino = path.join(DIR_ORIGINAIS, nome);
    // Um .webp já otimizado na pasta servida é resultado, não master: se já
    // existe um original com esse nome, o arquivo solto é descartável.
    if (fs.existsSync(destino)) continue;
    fs.renameSync(path.join(DIR_SERVIDO, nome), destino);
    movidos += 1;
  }

  if (movidos) console.log(`  ${movidos} original(is) movido(s) para Fotos/EQUIPE/originais/\n`);
}

function converter(master, destino){
  const resultado = spawnSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', master,
    // `increase` + `crop` = o mesmo recorte central do object-fit: cover.
    '-vf', `scale=${LADO}:${LADO}:force_original_aspect_ratio=increase,crop=${LADO}:${LADO}`,
    '-frames:v', '1',
    '-c:v', 'libwebp', '-preset', 'picture',
    '-quality', String(QUALIDADE), '-compression_level', '6',
    destino,
  ], { encoding: 'utf8' });

  if (resultado.status !== 0){
    throw new Error(resultado.stderr?.trim() || `ffmpeg saiu com código ${resultado.status}`);
  }
}

function main(){
  exigirFfmpeg();
  migrarMasters();

  const masters = fs.readdirSync(DIR_ORIGINAIS).filter(ehImagem).sort();
  if (!masters.length) erro(`Nenhuma imagem em ${DIR_ORIGINAIS}`);

  let bytesAntes = 0;
  let bytesDepois = 0;
  const falhas = [];

  for (const nome of masters){
    const master = path.join(DIR_ORIGINAIS, nome);
    const destino = path.join(DIR_SERVIDO, `${path.basename(nome, path.extname(nome))}.webp`);
    const antes = fs.statSync(master).size;

    try {
      converter(master, destino);
    } catch (e) {
      falhas.push(`${nome}: ${e.message}`);
      continue;
    }

    const depois = fs.statSync(destino).size;
    bytesAntes += antes;
    bytesDepois += depois;
    console.log(`  ${nome.padEnd(34)} ${kb(antes).padStart(9)} → ${kb(depois).padStart(8)}`);
  }

  const reducao = bytesAntes ? (1 - bytesDepois / bytesAntes) * 100 : 0;
  console.log(`\n  ${masters.length - falhas.length} foto(s): ${kb(bytesAntes)} → ${kb(bytesDepois)}  (−${reducao.toFixed(1)}%)`);

  if (falhas.length){
    console.error(`\n  ${falhas.length} falha(s):`);
    for (const falha of falhas) console.error(`   - ${falha}`);
    process.exit(1);
  }
}

main();
