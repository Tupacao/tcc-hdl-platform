# Design (Figma) - RF09

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

RF09 e a tela principal da plataforma: o frame mestre do qual os demais
requisitos sao recortes. Frames necessarios:

- Workspace completo, tema claro e tema escuro, em 1024, 1366 e 1920 px de
  largura.
- Cabecalho: identidade, projeto aberto e indicador de nao salvo (RF07-I03),
  acao de executar em cada estado (RF04-I03), alternador de tema, acesso a
  documentacao (RF11) e a lista de projetos (RF07).
- Barra de estado no rodape: desfecho da ultima execucao, duracao, contagem de
  erros e avisos.
- Divisores: repouso, hover, arraste e foco por teclado.
- Abas de arquivo: ativa, inativa, com erro, com alteracao nao salva.
- Painel de atalhos de teclado (dialogo).
- Layout logo apos o primeiro acesso, antes de qualquer execucao.

Decisoes que o design precisa fixar:

- proporcao padrao dos tres paineis e limites minimos de cada um;
- altura do cabecalho e da barra de estado (hoje o codigo usa
  `h-[calc(100%-1.75rem)]`, acoplado a uma altura fixa que o design deve
  confirmar ou substituir);
- onde a documentacao (RF11) e a lista de projetos (RF07) entram sem quebrar a
  promessa de interface unica.

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames.
