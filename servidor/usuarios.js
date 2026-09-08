/* Cadastro de quem pode editar — roda no terminal da VM, nunca pelo navegador.

   Não existe tela de "criar conta" no portal, e isso é proposital: quem entra
   na lista é decisão de quem administra, não de quem acessa. São poucas pessoas
   e muda raramente.

     node servidor/usuarios.js listar
     node servidor/usuarios.js incluir            (pergunta login, nome, papel e senha)
     node servidor/usuarios.js senha <login>      (troca a senha)
     node servidor/usuarios.js remover <login>

   PAPÉIS

     equipe  — inclui e edita documentos e manuais
     dev     — inclui, edita e EXCLUI

   A senha é digitada aqui e guardada como hash scrypt em
   servidor/dados/usuarios.json (fora do git). Ninguém, nem quem administra,
   consegue lê-la de volta — se alguém esquecer, use `senha` e defina outra. */
'use strict';

const readline = require('readline');
const auth = require('./auth');

function perguntar(rl, pergunta, { secreto = false } = {}){
  return new Promise((resolve) => {
    // O readline não tem modo senha: enquanto `escondendo` estiver ligado,
    // trocamos a escrita no terminal por "*" para a senha não ficar à mostra
    // na tela nem no histórico visual de quem estiver olhando junto.
    rl.escondendo = secreto;
    rl.question(pergunta, (resposta) => {
      rl.escondendo = false;
      if (secreto) process.stdout.write('\n');
      resolve(resposta.trim());
    });
  });
}

function abrirTerminal(){
  // WORKAROUND: _writeToOutput é API privada do readline. Ao mudar a versão
  // de Node, verificar ocultação da senha em terminal real; testes HTTP não
  // exercitam este caminho. Não registrar respostas para depuração.
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const escrever = rl._writeToOutput.bind(rl);
  rl._writeToOutput = (texto) => {
    if (rl.escondendo) return escrever('*');
    escrever(texto);
  };
  return rl;
}

async function pedirSenha(rl){
  const senha = await perguntar(rl, 'Senha (mínimo 8 caracteres): ', { secreto: true });
  const confirmacao = await perguntar(rl, 'Repita a senha: ', { secreto: true });
  if (senha !== confirmacao) throw new auth.ErroDeUso('As senhas não conferem.');
  return senha;
}

async function incluir(){
  const rl = abrirTerminal();
  try {
    const login = await perguntar(rl, 'Login (o que a pessoa vai digitar): ');
    const nome = await perguntar(rl, 'Nome que aparece na tela: ');
    const papel = await perguntar(rl, 'Papel [equipe/dev]: ');
    const senha = await pedirSenha(rl);

    const criado = auth.criarUsuario({ login, nome, papel, senha });
    console.log(`\nPronto: ${criado.nome} (${criado.login}) como ${criado.papel}.`);
    if (criado.papel === 'dev') console.log('Este perfil pode EXCLUIR documentos.');
  } finally {
    rl.close();
  }
}

async function trocarSenha(login){
  if (!login) throw new auth.ErroDeUso('Informe o login: node servidor/usuarios.js senha <login>');
  const rl = abrirTerminal();
  try {
    auth.trocarSenha(login, await pedirSenha(rl));
    console.log(`\nSenha de ${login} trocada. As sessões abertas continuam valendo até vencer.`);
  } finally {
    rl.close();
  }
}

function listar(){
  const usuarios = auth.listarUsuarios();
  if (!usuarios.length){
    console.log('Nenhum usuário cadastrado. Use: node servidor/usuarios.js incluir');
    return;
  }
  console.log('login'.padEnd(20) + 'papel'.padEnd(10) + 'nome');
  for (const u of usuarios) console.log(u.login.padEnd(20) + u.papel.padEnd(10) + u.nome);
}

function remover(login){
  if (!login) throw new auth.ErroDeUso('Informe o login: node servidor/usuarios.js remover <login>');
  auth.removerUsuario(login);
  console.log(`${login} removido. Se estava com sessão aberta, ela caiu junto.`);
}

async function principal(){
  const [comando, argumento] = process.argv.slice(2);

  switch (comando){
    case 'incluir': return incluir();
    case 'senha':   return trocarSenha(argumento);
    case 'listar':  return listar();
    case 'remover': return remover(argumento);
    default:
      console.log('Uso: node servidor/usuarios.js [listar|incluir|senha <login>|remover <login>]');
      process.exitCode = 1;
  }
}

principal().catch((erro) => {
  console.error(erro instanceof auth.ErroDeUso ? `\n${erro.message}` : erro);
  process.exitCode = 1;
});
