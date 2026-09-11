# Design (Figma) - RF10

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-).

- **Paleta como fonte de verdade**: [1.1 · Tokens de cor e contraste verificado](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=34-2)
  (pagina "1 · Fundamentos") define cada token de `apps/web/src/index.css` nos
  dois modos, com contraste verificado. Consolidado em
  `docs/design-system-fundamentos.md`.
- **Controle de tema com os tres estados**: o `ControleTema` (segmentado, com
  as tres opcoes "Claro" / "Escuro" / "Sistema" sempre visiveis lado a lado,
  em texto — sem precisar de um terceiro icone) aparece identico em praticamente
  toda tela do arquivo: Home, Workspace, Meus projetos, Documentação, Projeto
  compartilhado. Ver, por exemplo, o no
  [95:13](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=95-13)
  na pagina "0 · Home".
- **Variantes claro/escuro lado a lado** confirmadas nas telas principais:
  Workspace ([2.1](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=41-2)
  /
  [2.2](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=47-2)),
  Meus projetos
  ([6.1](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=50-2)
  /
  [6.4](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=80-2)),
  Documentacao
  ([7.1](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=52-2)
  /
  [7.5](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=80-97)).
- **Tokens de forma de onda e de sintaxe** (necessarios para RF06 e RF02) —
  ver os `WILL-BE-DONE.md` desses requisitos.
- [10.3 · Preferências (RF10 · RF19 · RNF05)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=86-2)
  (pagina "10 · Avulsos") repete o controle de tema dentro do dialogo de
  preferencias e adiciona o seletor de tamanho do texto do editor
  (12/13/14px) como preferencia persistida no navegador.

**Falta apenas:** estados de hover e foco por teclado de cada opcao do
controle segmentado (a metadata do Figma so expõe o estado de repouso).
