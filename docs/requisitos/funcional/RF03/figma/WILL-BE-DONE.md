# Design (Figma) - RF03

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-).

RF03 e um requisito de backend sem tela dedicada, mas todos os estados de
interface que ele produz estao desenhados:

- [2.4 · Progressão do botão Executar e da barra de estado](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=54-2)
  (pagina "2 · Workspace") - repouso, "Na fila · aguardando um executor
  livre", "Compilando…", "Simulando…", desabilitado.
- [4.1 · Console e diagnósticos — estados](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=78-2) -
  "Execução em andamento" com as duas fases em fluxo, mais "Cancelar".
- [2.7 · Servidor de execução indisponível](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=56-13) -
  `503`, Redis fora do ar, nao bloqueia a edicao.
- [4.2 · Limites, rejeições e diagnóstico sem linha (RF03 · RF04 · RF05)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=107-2)
  (pagina "4 · Console e diagnósticos") fecha o restante:
  - **Limite de uso atingido (`429`)**: "Muitas execucoes em pouco tempo.
    Espere 24s e tente de novo.", com contagem regressiva no proprio rotulo
    do botao Executar — desabilitar sem dizer quando volta transformaria um
    limite temporario em falha permanente aos olhos de quem espera.
  - **Entrada rejeitada (`400`)**: "O projeto nao pode ser enviado. Motivo: o
    arquivo passa de 256 KB. Nada foi executado no servidor." Fica fora do
    painel Problemas de proposito — e erro do cliente, nao do compilador.
- [10.3 · Preferências](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=86-2)
  mostra os limites de tempo (10s) e memoria (128MB), fixos e apenas
  consultaveis.
