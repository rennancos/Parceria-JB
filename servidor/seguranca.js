'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { ErroDeUso } = require('./erros');

// Em proxy HTTPS, configure explicitamente a origem pública. Não confiar em
// X-Forwarded-* enviado pelo cliente para autorizar origens ou proteger cookies.
const ORIGEM_PUBLICA = process.env.PAJB_ORIGEM_PUBLICA || '';
if (ORIGEM_PUBLICA){
  const url = new URL(ORIGEM_PUBLICA);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== ORIGEM_PUBLICA)
    throw new Error('PAJB_ORIGEM_PUBLICA deve conter somente a origem http(s), sem caminho ou barra final.');
}

function protegerResposta(res){
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
}

function exigirOrigem(req){
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  const origem = ORIGEM_PUBLICA || `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}`;
  if (req.headers['x-portal-request'] !== '1'
    || (req.headers.origin && req.headers.origin !== origem)
    || (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])))
    throw new ErroDeUso('Origem da requisição não permitida.', 403);
}

// Um caminho textual dentro da raiz ainda pode atravessar uma junction ou
// symlink. Recusamos esses componentes tanto para leitura quanto para upload.
// Isso não substitui permissões de filesystem contra usuários locais hostis.
function semLinks(raiz, alvo){
  const relativo = path.relative(raiz, alvo);
  if (relativo.startsWith('..') || path.isAbsolute(relativo)) return false;
  let atual = raiz;
  for (const parte of relativo.split(path.sep).filter(Boolean)){
    atual = path.join(atual, parte);
    try { if (fs.lstatSync(atual).isSymbolicLink()) return false; }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return true;
}

const origens = new Map();
function limitarLogin(req){
  const agora = Date.now();
  for (const [ip, limite] of origens) if (limite.ate <= agora) origens.delete(ip);
  const ip = req.socket.remoteAddress || 'local';
  if (!origens.has(ip)){
    if (origens.size >= 10000) throw new ErroDeUso('Muitas tentativas. Tente mais tarde.', 429);
    origens.set(ip, { tentativas: 0, ate: agora + 5 * 60 * 1000 });
  }
  const limite = origens.get(ip);
  if (++limite.tentativas > 20) throw new ErroDeUso('Muitas tentativas. Tente em 5 min.', 429);
}

module.exports = { ORIGEM_PUBLICA, protegerResposta, exigirOrigem, semLinks, limitarLogin };
