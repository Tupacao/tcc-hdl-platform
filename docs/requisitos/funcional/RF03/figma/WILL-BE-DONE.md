# Design (Figma) - RF03

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

RF03 e um requisito de backend, sem tela dedicada, mas produz estados de
interface que precisam ser desenhados:

- Botao "Executar" em repouso, carregando e desabilitado.
- Estado "na fila" versus "compilando" (o job tem os dois).
- Mensagem de servico indisponivel (`503`, Redis fora do ar).
- Mensagem de limite de uso atingido (`429`).
- Mensagem de arquivo grande demais / entrada rejeitada (`400`).

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames.
