# Design (Figma) - RNF02

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "10 · Avulsos".

[10.4 · Aviso de navegador não suportado (RNF02)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=103-2)
cobre:

- **Faixa de aviso** no topo, dispensavel: "Este navegador pode nao exibir
  tudo corretamente. Testado em Chrome, Firefox, Edge e Safari recentes.",
  com acao "Ver navegadores testados" e fechar (✕, nao volta na mesma
  sessao). A faixa empurra o conteudo para baixo, nunca sobrepoe — o botao
  Executar nao pode ficar atras de nada.
- **Lista de navegadores testados**: Chrome 120+, Firefox 121+, Edge 120+,
  Safari 17+. Deteccao por recurso (o que o Monaco e o visualizador de ondas
  precisam), nao pela string do agente.
- **Decisao fechada e documentada no proprio frame**: o aviso **nunca
  bloqueia** o uso. Bloquear contrariaria RF01 — "instale outro navegador"
  seria a mesma barreira de "instale o Vivado" com outra roupa. Em
  laboratorio de universidade, quem tem navegador desatualizado normalmente
  nao pode atualiza-lo, e e exatamente essa pessoa que a plataforma existe
  para atender.

Alem disso, o design precisa estar ciente de que o resultado sera conferido
nos quatro motores: diferencas de renderizacao de fonte, espessura de borda e
sombra entre WebKit e Chromium podem exigir ajuste na especificacao.
