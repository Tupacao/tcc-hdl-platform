# Design (Figma) - RF02

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-).

- [1.4 · Destaque de sintaxe Verilog (RF02)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=89-2)
  (pagina "1 · Fundamentos") - paleta de tokens de sintaxe nos dois temas,
  com o Monaco em tema customizado (consolidado em
  `docs/design-system-fundamentos.md`, secao 8).
- [1.3 · Tipografia, densidade e glossário](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=38-2) -
  JetBrains Mono 13px, altura de linha 22px.
- [3.2 · Abas do editor e estados de carga (RF02)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=106-2)
  (pagina "3 · Editor de código") fecha o restante:
  - **Seis estados da aba**: ativa, inativa, hover, foco por teclado, com
    erro (ponto vermelho) e nao salva (ponto laranja). **Decisao de design**:
    o ponto substitui o `✕` em vez de conviver com ele — dois alvos de 7px
    lado a lado numa aba de 38px seria erro de clique garantido; o `✕`
    volta no hover, que e quando fechar vira intencao.
  - **Editor vazio**: "Comece escrevendo o modulo…", com indicacao "arquivo
    vazio".
  - **Editor carregando**: esqueleto com linhas de larguras diferentes
    imitando a forma do codigo (nao uma barra de progresso, que diria
    "espere" sem dizer o que vem) — cobre a espera pelo Monaco em conexao de
    laboratorio.

Restricoes ja fechadas: cores exclusivamente por tokens de tema com
contraste AA (RNF09); componentes shadcn/ui, estilo `new-york`; largura
minima util de 1024px (RNF03 — ainda sem frame proprio).
