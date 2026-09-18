/* Adapter falso, SÓ para testes (requisito 17: testes não consomem API paga) e
   para exercitar validação, geração e CANCELAMENTO de stream sem tocar a rede.
   Só entra no catálogo quando PAJB_IA_MOCK=1 (ver registro.js).

   Convenção de credencial no teste:
     'mock-ok…'        -> válida
     'mock-invalida…'  -> inválida (simula 401)
     qualquer outra    -> indisponível (simula rede fora) */
'use strict';

const { ErroDeUso } = require('../erros');

function classificar(chave){
  const c = String(chave || '');
  if (c.startsWith('mock-ok')) return 'valida';
  if (c.startsWith('mock-invalida')) return 'invalida';
  return 'indisponivel';
}

async function listarModelos(chave){
  const tipo = classificar(chave);
  if (tipo === 'invalida') throw new ErroDeUso('Credencial recusada pelo provedor.', 401);
  if (tipo === 'indisponivel') throw new ErroDeUso('O provedor de IA está indisponível no momento.', 503);
  return [{ id: 'mock-rapido' }, { id: 'mock-esperto' }];
}

async function validarCredencial(chave){
  const tipo = classificar(chave);
  return tipo === 'valida' ? { status: 'valida' }
    : tipo === 'invalida' ? { status: 'invalida', mensagem: 'Credencial recusada pelo provedor.' }
    : { status: 'indisponivel', mensagem: 'Não foi possível validar agora.' };
}

async function gerarTexto({ chave, modelo, mensagens }){
  if (classificar(chave) !== 'valida') throw new ErroDeUso('Credencial recusada pelo provedor.', 401);
  const ultima = mensagens.filter((m) => m.papel === 'user').slice(-1)[0];
  return { texto: `mock(${modelo}): ${ultima ? ultima.texto : ''}`, modelo };
}

// Stream cancelável: respeita o AbortSignal entre pedaços (requisito 15).
async function* streamTexto({ chave, modelo, mensagens, sinal }){
  if (classificar(chave) !== 'valida') throw new ErroDeUso('Credencial recusada pelo provedor.', 401);
  const ultima = mensagens.filter((m) => m.papel === 'user').slice(-1)[0];
  const pedacos = `mock(${modelo}): ${ultima ? ultima.texto : ''}`.split(' ');
  for (const p of pedacos){
    if (sinal && sinal.aborted){ const e = new Error('cancelado'); e.name = 'AbortError'; throw e; }
    yield p + ' ';
    await new Promise((r) => setTimeout(r, 5));
  }
}

module.exports = { validarCredencial, listarModelos, gerarTexto, streamTexto };
