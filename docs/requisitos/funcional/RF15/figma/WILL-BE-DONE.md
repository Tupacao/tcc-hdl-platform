# Design (Figma) - RF15

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "8 · Contas e acesso".

- [8.1 · Conta e compartilhamento (RF14 · RF15)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=63-2) -
  dialogo de compartilhamento (interruptor de ativar/revogar, URL + copiar,
  aviso de que o link nao expira), e "Entre para gerar o link" (convite,
  nunca bloqueio).
- [8.2 · Projeto compartilhado · somente leitura (RF15)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=73-2) -
  workspace em modo leitura, "Duplicar para editar" no lugar de Executar.
  **Decisao fechada**: o editor fica bloqueado (somente leitura); duplicar e
  a unica forma de editar.
- [8.3 · Link compartilhado indisponível (RF15)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=85-2) -
  mesma tela para link revogado, inexistente e mal digitado, deliberadamente
  indistinguiveis.
- [8.5 · Autorização e limites de acesso (RNF06 · RF15)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=105-2)
  fecha o ultimo item: **duplicar sem conta nenhuma** — fluxo "antes/depois"
  mostrando que clicar "Duplicar para editar" nao pede login, e-mail nem
  dialogo no meio; toast "Copia criada neste navegador" confirma o
  resultado. **Decisao fechada**: duplicar nao exige conta; compartilhar
  exige — um link publico precisa de dono para poder ser revogado depois, e
  uma copia no navegador de quem clicou nao precisa de nada. Pedir cadastro
  ali seria no ponto de menor paciencia do funil.
- [10.2 · Confirmações e desfazer](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=74-2) -
  toast "Link copiado" com a URL por extenso.
