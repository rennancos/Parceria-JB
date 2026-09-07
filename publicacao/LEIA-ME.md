# publicacao/

Aqui fica a **parte do manifesto de atualização que se escreve à mão**, e só ela.

`versao.json` desta pasta tem dois campos:

- **`notas`** — o que mudou nesta versão, uma frase por item. É o que a equipe lê na barra "Atualizar agora", então escreva para quem usa o portal, não para quem programa. Até 6 itens; o que passar disso é ignorado.
- **`pagina`** — endereço da página oficial de download. É a saída quando o download automático falha (antivírus, proxy, permissão). Vazio, o botão "Baixar pelo navegador" simplesmente não aparece.

**Não escreva versão, tamanho nem SHA-256 aqui.** Esses saem do instalador real:

```bash
npm run app:build       # gera dist/Parceria-JB-Setup-<versão>.exe
npm run app:manifesto   # lê este arquivo + o .exe e grava dist/versao.json
```

O `dist/versao.json` é o que vai para o servidor — este daqui nunca é publicado.

Passo a passo completo em [md/10-aplicativo-windows.md](../md/10-aplicativo-windows.md).
