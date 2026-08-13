[← Índice](README.md)

# O que não pode vazar

## `.env` e segredos

O repositório é versionado com git. `.env` fica de fora (`.gitignore`); o modelo com as chaves esperadas é o `.env.example`, esse sim versionado. Para começar: `cp .env.example .env` e preencha.

**O `.env` não é lido por nada hoje.** O projeto é estático — o navegador abre `index.html` e acabou; não há servidor nem build consumindo variáveis. Ele só passa a valer se entrar um build ou um script de deploy. E mesmo então, tudo que for embutido no JS entregue ao navegador é público, legível no DevTools: segredo de verdade (client secret, token, senha) precisa ficar num backend.

## O risco real aqui é outro: dado pessoal

O que já está no repositório e não deveria circular fora de quem tem acesso à parceria:

- **`js/equipe.js`** — nomes reais e e-mails corporativos. É um arquivo obrigatório para o site, então não dá para ignorá-lo: a proteção é o repositório ser privado.
- **`Fotos/EQUIPE/`** — fotos de pessoas reais. Há uma linha comentada no `.gitignore` para excluir a pasta; a página degrada sozinha para as iniciais quando o arquivo não existe (ver [05-equipe.md](05-equipe.md)).
- **`Fotos/LOGOS/TVGLOBO_LOGO.png`** — marca corporativa, não redistribuível.

Consequência prática: **mantenha o repositório privado.** Se ele for para um host público (GitHub público, GitHub Pages), esses três itens vazam junto — e apagar depois não resolve, porque o histórico do git guarda as versões anteriores.

## A hospedagem na VM não substitui isso

O portal vai rodar numa VM da Parceria JB, na rede interna. Isso protege **o site**, não **o repositório** — são duas coisas separadas, e é fácil confundir:

- A VM controla quem **acessa a página**. Quem não está na rede não abre.
- O repositório controla quem **lê o código**. E o código *é* o conteúdo: `js/equipe.js` tem os nomes e e-mails, `js/paginas/` tem os sistemas e perfis de acesso da operação. Um repositório público entrega tudo isso mesmo com a VM trancada.

Então as duas travas continuam valendo, cada uma no seu lugar.

**Nada de segredo no `js/`.** Tudo que a VM entrega ao navegador é legível no DevTools de qualquer pessoa que acesse a página — inclusive quem tem acesso à rede mas não deveria ver aquele dado. A VM não muda isso: servidor estático entrega arquivo, não filtra conteúdo por usuário.

Os detalhes de montagem da VM estão em [08-futuros-passos.md](08-futuros-passos.md).

## Conteúdo interno nas páginas

O mesmo vale para o que entra em `js/paginas/`. O guia de "Primeiros passos", por exemplo, cita categorias de chamado, nomes de sistemas e perfis de acesso da operação — informação que descreve a infraestrutura interna. Não é segredo criptográfico, mas é material que só faz sentido dentro da parceria.

Ao preencher contatos de fabricante, vale a regra inversa da anterior: **não invente dado que você não tem.** Campo vazio aparece como "a definir" na página de propósito — telefone ou portal de suporte errado custa caro numa operação ao vivo. Ver [04-paginas-internas.md](04-paginas-internas.md).
