# Design (Figma) - RF08

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-).

RF08 nao tem tela propria; entra como acao dentro das superficies de RF07.

- [6.1](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=50-2) -
  "Exportar todos em .zip" no aviso de armazenamento local.
- [6.2](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=51-2) -
  "Exportar .zip" no menu de acoes; "Exportar .zip antes de excluir" no
  dialogo de exclusao.
- [10.2 · Confirmações e desfazer](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=74-2) -
  toast "somador4.zip baixado" (com o conteudo: circuito, testbench e
  `.vcd`), e toast de falha "Nao foi possivel exportar" com acao "Tentar de
  novo".
- [6.5 · Carga, falha de conexão e exportação (RF07 · RF08)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=108-2)
  fecha o restante:
  - **Gerando o .zip**: toast "Preparando somador4.zip… compactando
    circuito, testbench e .vcd", barra de progresso **com numero** (nao
    indeterminada — sem porcentagem o usuario clicaria em exportar de novo
    achando que nao pegou), acao "Cancelar".
  - **Exportar a partir do workspace aberto pergunta antes** (decisao que
    tapa um furo do fluxo original): o `.zip` inclui o `.vcd` da ultima
    execucao, entao exportar com codigo alterado e nao executado entregaria
    um pacote internamente inconsistente — codigo novo com onda velha.
    Dialogo "Exportar com as alteracoes nao salvas?" com as acoes "Exportar
    assim mesmo" / "Executar e depois exportar". Esse fluxo e diferente do
    de RF07 (exportar a partir da lista, ja salva) — o aviso "salve antes de
    exportar" so se aplica ao workspace aberto.
