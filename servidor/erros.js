/* O único tipo de erro que o servidor mostra para quem está usando o portal.

   `ErroDeUso` vira 4xx com a própria mensagem; qualquer outro erro vira 500
   com texto genérico, porque mensagem de erro interno não é assunto de quem
   está editando um documento (ver responderErro em servidor.js).

   Mora aqui, e não em auth.js ou dados.js, porque os dois precisam dele e
   nenhum dos dois manda no outro. `instanceof` só é confiável com uma
   definição — com duas classes idênticas, cada `require` produzia um tipo
   diferente e o servidor tinha que testar os dois. */
'use strict';

class ErroDeUso extends Error {
  constructor(mensagem, status = 400){
    super(mensagem);
    this.name = 'ErroDeUso';
    this.status = status;
  }
}

module.exports = { ErroDeUso };
