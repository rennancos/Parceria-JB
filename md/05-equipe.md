[← Índice](README.md)

# A equipe

A seção "Nossa equipe" (`.team-section`) fica no fim da home. Tem cabeçalho centralizado — tag, título, subtítulo e um chip com a contagem de pessoas, que vem de `equipe.length` e por isso nunca desatualiza — e uma grade de cards de pessoa (3 colunas no desktop), cada um com foto sobreposta ao topo, nome, cargo, chip de área e os botões de e-mail e perfil.

Os dados ficam em `js/equipe.js`, no array `equipe` — separados do layout. Para incluir, remover ou editar alguém, mexa só nesse array; a grade e a contagem se ajustam sozinhas.

```js
{
  nome: "Rennan Silva",
  cargo: "Analista de Soluções de Mídia",
  area: "Vídeo",                          // Vídeo | Áudio | IP | Grafismo | Comunicação
  foto: "Fotos/EQUIPE/rennan-silva.jpg",
  email: "rennan@empresa.com",
  perfil: "#"                             // link do Teams/intranet
}
```

> Este arquivo tem nomes reais e e-mails corporativos. Ver [02-seguranca.md](02-seguranca.md).

**Por que `.js` e não `.json`.** A página é aberta direto do disco (`file://`), e nesse protocolo `fetch()` de um arquivo local é bloqueado por CORS — um `data/equipe.json` deixaria a seção vazia fora de um servidor HTTP. O array em `.js` dá a mesma separação dados/layout sem essa dependência. Vale igual para `js/paginas/`: mesmo motivo, mesma solução. (Pela mesma razão, nada aqui usa `<script type="module">` — módulos ES também são bloqueados em `file://`.)

## Fotos

Vão em `Fotos/EQUIPE/`, recortadas em proporção quadrada (o CSS usa `object-fit: cover`; ~300×300px já basta). O nome do arquivo é livre — o que vale é o caminho em `foto`.

**Avatar de fallback.** As iniciais do nome (`.team-photo-wrapper::after`, via `data-initials`) são o estado padrão do avatar; a foto só as cobre depois de carregar, quando o JS marca `.is-loaded` no wrapper. Consequências:

- Enquanto as fotos não forem enviadas, os cards mostram iniciais em vez de imagem quebrada.
- Se um arquivo específico faltar ou tiver o nome errado, só aquele card cai para as iniciais — o `<img>` é removido no evento `error`.
- Como as imagens usam `loading="lazy"`, as de baixo da dobra só carregam ao rolar. Ter as iniciais como base (e não como fallback aplicado no erro) evita que esses cards fiquem com um quadrado vazio até chegarem à tela.

`iniciais()` ignora partículas (`de`, `da`, `do`, `das`, `dos`, `e`) e usa a primeira e a última palavra restantes: "Maria da Silva Souza" → **MS**.

## Destaques

O campo opcional `destaque` tira a pessoa da grade principal e a coloca na faixa "Idealizadores e desenvolvedores", no topo da seção. O texto do campo vira o rótulo colorido do card, então dá para variar por pessoa (`"Idealizador e desenvolvedor"`, `"Idealizadora e desenvolvedora"`, só `"Desenvolvedor"`…).

```js
{ nome: "...", cargo: "...", /* ... */ destaque: "Idealizador e desenvolvedor" }
```

Os cards em destaque ganham `.is-featured` (borda e anel da foto em `--accent-1`). Não há número fixo de destaques: a grade se ajusta, e se ninguém tiver o campo a faixa inteira — incluindo o título — sai da página. O chip de contagem continua somando a equipe toda, destaques inclusos.

## Detalhes

**Perfil sem link.** Com `perfil: "#"` o botão vira um `<span>` inativo (`.is-disabled`) em vez de um link que só pula para o topo da página.

**Escape.** O array é editado à mão e entra via `innerHTML`, então `escapar()` trata `& < > " '` — um "&" num cargo não quebra o markup.

**`area` ainda não filtra nada.** O campo é espelhado em `data-area` no card, pronto para uma busca ou filtro futuro, mas não há nenhum hoje.
