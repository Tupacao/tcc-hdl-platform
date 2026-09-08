# Design (Figma) - RNF06

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

RNF06 e majoritariamente backend, mas produz estados de interface que precisam
ser desenhados:

- Sessao necessaria: o que aparece quando o usuario tenta acessar a lista de
  projetos sem estar autenticado. Precisa convidar a entrar, sem parecer que a
  plataforma inteira exige login (RF01).
- Sessao expirada durante o uso, com o trabalho preservado na tela.
- Projeto nao encontrado: o mesmo estado serve para projeto inexistente e para
  projeto de outra pessoa - deliberadamente indistinguiveis, para nao revelar a
  existencia de projetos alheios.
- Acao indisponivel: como compartilhar (RF15) e exportar (RF08) se apresentam
  quando o usuario nao e o dono.

Os frames de login em si pertencem a RF14 - ver
`docs/requisitos/funcional/RF14/figma/WILL-BE-DONE.md`.

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames.
