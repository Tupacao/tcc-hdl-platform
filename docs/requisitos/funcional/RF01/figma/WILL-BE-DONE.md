# Design (Figma) - RF01

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "2 · Workspace".

RF01 nao possui tela propria: e um requisito de distribuicao. Os tres frames de
apoio que o requisito pedia estao prontos:

- [2.5 · Primeiro acesso · projeto vazio](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=55-2) -
  o que a tela mostra antes de qualquer execucao: "Escreva o seu primeiro
  circuito", botao Executar desabilitado so quando o circuito esta vazio
  (nunca por erro de sintaxe - quem decide o que e erro e o compilador).
- [2.6 · Carregamento inicial · antes de a SPA montar](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=56-2) -
  "Carregando o ambiente…". Decisao de implementacao registrada no proprio
  frame: esta tela e desenhada pelo `index.html`, antes do React montar - nao
  usa componente do shadcn nem o `ThemeProvider`, por isso precisa vir sempre
  no tema correto (ver RF10-I02, anti-flash).
- [2.7 · Servidor de execução indisponível](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=56-13) -
  faixa "Servidor indisponivel" com "Nao foi possivel falar com o servidor de
  execucao". Nao bloqueia: "seu codigo continua salvo e voce pode seguir
  escrevendo - a execucao volta assim que a conexao for restabelecida". O
  botao Executar fica no estado "Executor indisponivel".

A pagina "0 · Home" (landing de divulgacao do TCC) tambem existe, mas e
material de marketing complementar - a cobertura funcional de RF01 esta nos
tres frames acima.

**Implementada** em `apps/web/src/features/home/` (`HomePage`), fora da quebra
em issues de RF01 - ver nota em [../feature.md](../feature.md#5-estado-atual-no-repositorio).
