# Design (Figma) - RF07

**Status: will be done.** O arquivo de Figma ainda esta em desenvolvimento.

RF07 introduz a primeira superficie da plataforma fora do workspace. Frames
necessarios:

- Lista de projetos: cartao ou linha com nome, descricao, data de atualizacao e
  acoes. Definir se e pagina propria ou painel lateral sobre o workspace.
- Lista vazia (primeiro acesso): chamada para criar o primeiro projeto ou abrir um
  exemplo (RF20).
- Dialogo de criacao: nome, descricao, escolha entre projeto em branco e exemplo.
- Dialogo de renomear e editar descricao.
- Confirmacao de exclusao, com o nome do projeto no texto.
- Estado de carregamento da lista e estado de erro de conexao.
- Cabecalho do workspace com o projeto aberto: nome, indicador de alteracoes nao
  salvas, acao de salvar, acao de voltar para a lista.
- Aviso de alteracoes nao salvas ao trocar de projeto.

Todos os frames nos dois temas.

Decisao de navegacao que o design precisa resolver antes de RF07-I02: a lista
substitui o workspace na tela (rota propria) ou aparece sobre ele (dialogo)? A
escolha muda o roteamento do SPA e conversa diretamente com RF09 (interface
unica) e com RF11 (documentacao em rota propria).

Quando o arquivo estiver pronto, substituir este documento pelo link dos frames.
