/* Gera o `versao.json` que vai para o servidor, a partir do instalador que o
   electron-builder acabou de produzir.

     node app/manifesto.js                  # acha o instalador sozinho em dist/
     node app/manifesto.js caminho/do.exe   # ou receba o caminho na mão

   POR QUE ESTE SCRIPT EXISTE

   O manifesto tem cinco campos que ninguém acerta digitando: a versão precisa
   bater com a do instalador, o tamanho precisa bater com o byte, e o SHA-256
   tem 64 caracteres. Errar qualquer um faz o aplicativo de todo mundo recusar
   a atualização — com a mensagem certa, mas recusar. Então nenhum deles é
   escrito à mão: saem do arquivo real, aqui.

   O que é escrito à mão fica em `publicacao/versao.json`, que é versionado no
   git: as notas da versão e o endereço da página oficial de download. Este
   script lê aquele arquivo, carimba os cinco campos e grava o resultado em
   `dist/versao.json` — pronto para ser copiado para o servidor junto com o
   instalador.

   Sem dependência nenhuma: `crypto` e `fs` do próprio Node, como servidor/. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.join(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const MODELO = path.join(RAIZ, 'publicacao', 'versao.json');
const SAIDA = path.join(DIST, 'versao.json');

function desistir(mensagem){
  console.error(`\n  ${mensagem}\n`);
  process.exit(1);
}

/* ---------- Achar o instalador ---------- */

function acharInstalador(){
  const informado = process.argv[2];
  if (informado){
    const alvo = path.resolve(informado);
    if (!fs.existsSync(alvo)) desistir(`Não achei o arquivo: ${alvo}`);
    return alvo;
  }

  if (!fs.existsSync(DIST)){
    desistir('A pasta dist/ não existe. Rode `npm run app:build` primeiro.');
  }

  // Sobra de build anterior é o erro clássico aqui: publicar o manifesto da
  // versão nova apontando para o .exe da antiga. Pegar o mais recente resolve
  // o caso comum; mais de um candidato vira aviso, não escolha silenciosa.
  const candidatos = fs.readdirSync(DIST)
    .filter((nome) => /\.exe$/i.test(nome))
    .map((nome) => {
      const completo = path.join(DIST, nome);
      return { completo, nome, mtime: fs.statSync(completo).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (!candidatos.length){
    desistir('Nenhum .exe em dist/. Rode `npm run app:build` primeiro.');
  }

  if (candidatos.length > 1){
    console.log('  Aviso: há mais de um instalador em dist/. Usando o mais recente.');
    candidatos.forEach((c, i) => console.log(`    ${i === 0 ? '→' : ' '} ${c.nome}`));
  }

  return candidatos[0].completo;
}

/* ---------- Conferir se bate com o package.json ---------- */

function versaoDoProjeto(){
  // CONTRATO: mesmo formato numérico aceito por atualizacao.validarManifesto.
  // Pré-releases semver exigem revisar ambos e comparar(); não basta mudar
  // version em package.json. O nome do .exe sozinho não prova sua versão interna.
  const pacote = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
  const versao = String(pacote.version || '');
  if (!/^\d+(\.\d+){0,3}$/.test(versao)){
    desistir(`A versão em package.json ("${versao}") não é um número de versão válido.`);
  }
  return versao;
}

/* ---------- Modelo editado à mão ---------- */

function lerModelo(){
  if (!fs.existsSync(MODELO)){
    desistir(`Não achei ${path.relative(RAIZ, MODELO)}. Ver md/10-aplicativo-windows.md.`);
  }

  try {
    return JSON.parse(fs.readFileSync(MODELO, 'utf8'));
  } catch (e) {
    desistir(`${path.relative(RAIZ, MODELO)} não é um JSON válido: ${e.message}`);
  }
}

/* ---------- Gerar ---------- */

const instalador = acharInstalador();
const versao = versaoDoProjeto();
const modelo = lerModelo();

// O instalador do electron-builder tem a versão no nome. Se ela não bate com a
// do package.json, o build é de outra rodada — e publicar assim entrega para a
// equipe um instalador que não é o que o manifesto anuncia.
const nome = path.basename(instalador);
if (nome.indexOf(versao) === -1){
  desistir(
    `O instalador "${nome}" não parece ser da versão ${versao} do package.json.\n` +
    '  Rode `npm run app:build` de novo, ou apague os builds antigos de dist/.'
  );
}

const conteudo = fs.readFileSync(instalador);

const manifesto = {
  versao,
  // Relativo de propósito: o aplicativo resolve contra o endereço de onde
  // baixou o próprio versao.json. Assim trocar o servidor de lugar não exige
  // mexer no manifesto — e o download nunca sai da origem do manifesto.
  arquivo: nome,
  sha256: crypto.createHash('sha256').update(conteudo).digest('hex'),
  tamanho: conteudo.length,
  publicadoEm: new Date().toISOString().slice(0, 10),
  notas: Array.isArray(modelo.notas) ? modelo.notas.filter(Boolean) : [],
  pagina: String(modelo.pagina || '')
};

fs.writeFileSync(SAIDA, JSON.stringify(manifesto, null, 2) + '\n', 'utf8');

const mb = (manifesto.tamanho / 1024 / 1024).toFixed(1);

console.log(`
  Manifesto gerado: ${path.relative(RAIZ, SAIDA)}

    versão     ${manifesto.versao}
    instalador ${manifesto.arquivo}  (${mb} MB)
    sha-256    ${manifesto.sha256}
    notas      ${manifesto.notas.length ? `${manifesto.notas.length} item(ns)` : 'NENHUMA — edite publicacao/versao.json e rode de novo'}
    página     ${manifesto.pagina || 'NENHUMA — sem ela, "Baixar pelo navegador" não aparece'}

  Para publicar, copie OS DOIS arquivos para a pasta de atualização do servidor,
  o instalador PRIMEIRO:

    1. ${manifesto.arquivo}
    2. versao.json

  Nessa ordem: o versao.json é o que faz o aplicativo de todo mundo começar a
  baixar. Publicado antes do instalador, anuncia um arquivo que ainda não existe.
`);
