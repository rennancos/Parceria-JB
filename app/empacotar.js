/* Gera o instalador Windows.  `npm run app:build`

   POR QUE NÃO É SÓ `electron-builder --win`

   Porque este projeto mora dentro do OneDrive, e o electron-builder não
   consegue montar o aplicativo lá. Ele cria uma pasta de trabalho com ~340 MB
   e milhares de arquivos, renomeia a pasta inteira no fim, e o OneDrive abre
   cada arquivo para sincronizar enquanto isso acontece. O resultado é sempre o
   mesmo, e não é intermitente:

     ⨯ EBUSY: resource busy or locked, unlink '…\dist\win-unpacked.tmp\…'
     ⨯ EPERM: operation not permitted, rename '…\dist\win-unpacked.tmp' → '…'

   Então a montagem acontece em %TEMP%, fora do alcance do OneDrive, e só o
   instalador pronto — um arquivo, uma cópia, sem renomear nada — volta para
   `dist/`. Quem chama não precisa saber de nada disso.

   `dist/` está no .gitignore, mas o OneDrive ainda vai subir os ~105 MB do
   instalador. Depois de publicar no servidor, pode apagar a pasta.

   Sem dependência: só `child_process` e `fs`. */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const OFICINA = path.join(os.tmpdir(), 'pajb-build');

const builder = path.join(RAIZ, 'node_modules', '.bin', process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder');

if (!fs.existsSync(builder)){
  console.error('\n  Falta instalar as dependências. Rode `pnpm install` (ou `npm install`) primeiro.\n');
  process.exit(1);
}

console.log(`\n  Montando em ${OFICINA}\n  (fora do OneDrive — ver o comentário no topo de app/empacotar.js)\n`);

fs.rmSync(OFICINA, { recursive: true, force: true });

const resultado = spawnSync(
  builder,
  ['--win', `-c.directories.output=${OFICINA}`].concat(process.argv.slice(2)),
  { cwd: RAIZ, stdio: 'inherit', shell: process.platform === 'win32' }
);

if (resultado.status !== 0){
  console.error('\n  O electron-builder falhou. A saída dele está acima.\n');
  process.exit(resultado.status || 1);
}

/* Só o instalador volta. `win-unpacked/` (340 MB) fica na oficina: serve para
   conferir o que entrou no pacote, e não tem por que ser sincronizado. */
const instaladores = fs.readdirSync(OFICINA).filter((nome) => /\.exe$/i.test(nome));

if (!instaladores.length){
  console.error(`\n  O build terminou sem gerar .exe. Veja ${OFICINA}\n`);
  process.exit(1);
}

fs.mkdirSync(DIST, { recursive: true });

for (const nome of instaladores){
  fs.copyFileSync(path.join(OFICINA, nome), path.join(DIST, nome));
  const mb = (fs.statSync(path.join(DIST, nome)).size / 1024 / 1024).toFixed(1);
  console.log(`\n  Instalador: dist/${nome}  (${mb} MB)`);
}

console.log(`
  Pasta solta, para conferir o que entrou no pacote:
    ${path.join(OFICINA, 'win-unpacked')}

  Próximo passo:  npm run app:manifesto
`);
