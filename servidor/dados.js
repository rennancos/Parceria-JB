/* Acervo de documentos e manuais — leitura, validação e escrita do JSON.

   Esta é a única porta de entrada para `servidor/dados/documentos.json`. Nada
   fora daqui abre esse arquivo: assim toda gravação passa pela mesma validação
   e pelo mesmo jeito de escrever (arquivo temporário + rename), que evita o
   JSON truncado se a máquina cair no meio da escrita.

   Por que JSON e não banco: são algumas dezenas de itens, editados de vez em
   quando, por meia dúzia de pessoas. Um arquivo texto é legível, versionável,
   e o backup é um `copy`. Banco entraria se isso virasse milhares de registros
   ou escrita concorrente de verdade — não é o caso.

   IO síncrono de propósito: o Node é single-thread e cada gravação é de poucos
   KB, então `writeFileSync` funciona como um lock natural — duas pessoas
   salvando ao mesmo tempo entram em fila, e nenhuma leitura pega o arquivo pela
   metade. Assíncrono aqui só traria condição de corrida sem ganho nenhum. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PASTA_DADOS = path.join(__dirname, 'dados');
const ARQUIVO = path.join(PASTA_DADOS, 'documentos.json');

/* Os blocos existentes. Precisa bater com as `chave` dos blocos `tipo: 'links'`
   em js/paginas/documentacao.js — é o que liga um item ao lugar onde ele
   aparece na página. Bloco novo: acrescente nos dois lugares. */
const BLOCOS = [
  { chave: 'processos-politicas', rotulo: 'Processos e políticas' },
  { chave: 'padroes-modelos',     rotulo: 'Padrões, modelos e referência' },
  { chave: 'manuais',             rotulo: 'Manuais publicados' }
];

// Extensões aceitas em docs/. Lista fechada: é o que decide o que pode ser
// gravado no disco da VM, então nada de "qualquer coisa que o navegador mandar".
const EXTENSOES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

const LIMITES = { titulo: 120, descricao: 200, href: 500 };

/* Erro de uso vira 4xx na API; qualquer outro vira 500. Ter um tipo próprio
   evita devolver mensagem de erro interno para a tela de quem está editando. */
class ErroDeUso extends Error {
  constructor(mensagem, status = 400){
    super(mensagem);
    this.name = 'ErroDeUso';
    this.status = status;
  }
}

/* ---------- Leitura e escrita ---------- */

function ler(){
  try {
    const bruto = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
    return Array.isArray(bruto.itens) ? bruto.itens : [];
  } catch (e) {
    if (e.code === 'ENOENT') return [];   // primeira execução: acervo vazio
    throw e;
  }
}

function gravar(itens){
  fs.mkdirSync(PASTA_DADOS, { recursive: true });
  const temporario = `${ARQUIVO}.tmp`;
  fs.writeFileSync(temporario, JSON.stringify({ itens }, null, 2) + '\n', 'utf8');
  fs.renameSync(temporario, ARQUIVO);   // rename é atômico: ou vale o antigo, ou o novo
}

/* ---------- Validação ---------- */

function texto(valor, campo, { obrigatorio = false, limite = 200 } = {}){
  const limpo = String(valor ?? '').trim().replace(/\s+/g, ' ');
  if (!limpo){
    if (obrigatorio) throw new ErroDeUso(`Preencha o campo "${campo}".`);
    return '';
  }
  if (limpo.length > limite) throw new ErroDeUso(`O campo "${campo}" passa de ${limite} caracteres.`);
  return limpo;
}

/* O href é o único campo que vira atributo de link na página. Lista de permitidos
   em vez de lista de proibidos: só endereço http(s) ou arquivo dentro de docs/.
   É o que barra `javascript:`, `data:` e caminho para fora da pasta — o
   renderizador escapa o texto, mas um href continua sendo executável. */
function validarHref(valor){
  const href = String(valor ?? '').trim();
  if (!href) return '';
  if (href.length > LIMITES.href) throw new ErroDeUso('O endereço é longo demais.');
  if (/^docs\/[A-Za-z0-9._-]+$/.test(href)) return href;
  if (/^https?:\/\/[^\s<>"']+$/i.test(href)) return href;
  throw new ErroDeUso('Endereço inválido: use um link começando com http:// ou https://, ou envie um arquivo.');
}

function validarBloco(valor){
  const chave = String(valor ?? '').trim();
  if (!BLOCOS.some((b) => b.chave === chave)){
    throw new ErroDeUso('Escolha em qual lista o item entra.');
  }
  return chave;
}

// Formato vazio é o normal: o renderizador deduz da extensão do href. Só faz
// falta quando o item é um endereço e a pessoa quer o chip "Link".
function validarFormato(valor){
  const formato = String(valor ?? '').trim().toLowerCase();
  if (!formato) return '';
  if (formato !== 'link' && !EXTENSOES.includes(formato)){
    throw new ErroDeUso('Formato desconhecido.');
  }
  return formato;
}

/* ---------- Operações ---------- */

function listar(){
  // Ordem: como está no arquivo, dentro de cada bloco. `ordem` existe para o
  // dia em que a página tiver arrastar-e-soltar; hoje é a ordem de inclusão.
  return ler().sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

function proximaOrdem(itens, bloco){
  const doBloco = itens.filter((item) => item.bloco === bloco);
  return doBloco.reduce((maior, item) => Math.max(maior, item.ordem ?? 0), 0) + 1;
}

function incluir(dados, autor){
  const itens = ler();
  const bloco = validarBloco(dados.bloco);

  const item = {
    id: crypto.randomUUID(),
    bloco,
    titulo: texto(dados.titulo, 'Título', { obrigatorio: true, limite: LIMITES.titulo }),
    descricao: texto(dados.descricao, 'Descrição', { limite: LIMITES.descricao }),
    href: validarHref(dados.href),
    formato: validarFormato(dados.formato),
    ordem: proximaOrdem(itens, bloco),
    criadoPor: autor,
    criadoEm: new Date().toISOString(),
    atualizadoPor: autor,
    atualizadoEm: new Date().toISOString()
  };

  itens.push(item);
  gravar(itens);
  return item;
}

function editar(id, dados, autor){
  const itens = ler();
  const alvo = itens.find((item) => item.id === id);
  if (!alvo) throw new ErroDeUso('Este item não existe mais — recarregue a página.', 404);

  const bloco = validarBloco(dados.bloco);

  Object.assign(alvo, {
    bloco,
    titulo: texto(dados.titulo, 'Título', { obrigatorio: true, limite: LIMITES.titulo }),
    descricao: texto(dados.descricao, 'Descrição', { limite: LIMITES.descricao }),
    href: validarHref(dados.href),
    formato: validarFormato(dados.formato),
    ordem: alvo.bloco === bloco ? alvo.ordem : proximaOrdem(itens, bloco),
    atualizadoPor: autor,
    atualizadoEm: new Date().toISOString()
  });

  gravar(itens);
  return alvo;
}

/* Excluir só apaga a linha do acervo. O arquivo em docs/, se houver, fica no
   disco de propósito: outro item pode apontar para ele, e apagar arquivo por
   engano custa mais caro do que um PDF órfão. Limpeza é manual, na VM. */
function excluir(id){
  const itens = ler();
  const restantes = itens.filter((item) => item.id !== id);
  if (restantes.length === itens.length){
    throw new ErroDeUso('Este item não existe mais — recarregue a página.', 404);
  }
  gravar(restantes);
}

/* ---------- Arquivos em docs/ ---------- */

/* Nome vindo do navegador é dado de fora: pode trazer caminho ("../../"),
   acento, espaço e extensão qualquer. Aqui ele vira um nome plano, minúsculo e
   com extensão da lista — o mesmo padrão que docs/LEIA-ME.md pede à mão. */
function nomeSeguro(nomeOriginal){
  const base = path.basename(String(nomeOriginal ?? '').replace(/\\/g, '/'));
  const extensao = path.extname(base).slice(1).toLowerCase();

  if (!EXTENSOES.includes(extensao)){
    throw new ErroDeUso(`Tipo de arquivo não aceito. Envie ${EXTENSOES.join(', ')}.`);
  }

  const semExtensao = base.slice(0, base.length - extensao.length - 1);
  const apelido = semExtensao
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // tira acento
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return `${apelido || 'documento'}.${extensao}`;
}

/* EXTENSOES e LIMITES são exportados sem consumidor hoje, de propósito: são o
   contrato que o formulário de edição precisa espelhar (`accept` e `maxlength`
   em js/documentos/), e hoje o front repete os valores à mão. O caminho para
   acabar com essa duplicação é servi-los junto de BLOCOS em
   `GET /api/documentos`, como já é feito com os blocos — ver a seção
   "Simplificação da arquitetura do backend" em
   md/auditoria-estrutura-backend.md. */
module.exports = {
  BLOCOS, EXTENSOES, LIMITES, ErroDeUso,
  listar, incluir, editar, excluir,
  nomeSeguro
};
