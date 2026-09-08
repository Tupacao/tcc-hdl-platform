# RF09-I02 - Atalhos de teclado do fluxo principal

| Campo | Valor |
| --- | --- |
| Feature | [RF09](feature.md) |
| Branch | `feat/rf09-atalhos-teclado-fluxo` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF09-I01 |

## Contexto

Executar a simulacao hoje exige tirar a mao do teclado, mirar o botao no canto
superior direito e clicar. Como o ciclo escrever-executar-corrigir se repete
dezenas de vezes por sessao, esse trajeto e o gargalo ergonomico da ferramenta.
Toda IDE resolve isso com um atalho.

Ha tambem um requisito de acessibilidade por tras: quem navega so por teclado
precisa alcancar as acoes principais sem atravessar a ordem de tabulacao inteira,
que inclui o Monaco - um componente que captura quase tudo o que e digitado.

## Objetivo

Definir e implementar um conjunto pequeno e memorizavel de atalhos que cubra o
ciclo principal, com registro central e documentacao visivel.

## Escopo tecnico

- `apps/web/src/hooks/use-shortcuts.ts` (novo) - registro central
- `apps/web/src/features/workspace/workspace.tsx` - registro dos atalhos
- `apps/web/src/features/workspace/shortcuts-dialog.tsx` (novo) - ajuda
- `apps/web/src/features/workspace/code-editor.tsx` - integracao com o Monaco

## Passo a passo

1. Definir o conjunto minimo (ajustar conforme o design):
   - `Ctrl/Cmd + Enter` - executar a simulacao;
   - `Ctrl/Cmd + S` - salvar o projeto (RF07-I03);
   - `Ctrl/Cmd + 1` / `2` - alternar entre design e testbench;
   - `F8` / `Shift+F8` - proximo / anterior diagnostico (RF05-I02);
   - `Ctrl/Cmd + Shift + P` - focar o painel de ondas;
   - `?` - abrir a ajuda de atalhos;
   - `Esc` - sair do foco do editor para a ordem de tabulacao da pagina.
2. Criar `useShortcuts` como registro unico, com um mapa declarativo
   `{ combo, descricao, escopo, acao }` - a mesma fonte alimenta o dialogo de
   ajuda, evitando documentacao que envelhece.
3. Registrar os atalhos que precisam funcionar **dentro** do editor via
   `editor.addAction` do Monaco: um listener global no `document` nao recebe as
   teclas quando o Monaco tem o foco.
4. Normalizar `Ctrl` e `Cmd` conforme a plataforma e exibir o simbolo correto na
   ajuda.
5. Nao sequestrar atalhos do navegador que o usuario espera preservar
   (`Ctrl+T`, `Ctrl+W`, `Ctrl+L`); `Ctrl+S` e a excecao justificada, com
   `preventDefault`.
6. Construir o dialogo de ajuda a partir do registro, agrupado por escopo, aberto
   por `?` e por um item no cabecalho.
7. Garantir que todo atalho tenha equivalente clicavel - atalho e aceleracao,
   nunca o unico caminho.
8. Documentar a lista no `README.md` e reaproveitar no guia de RF11.

## Criterios de aceite

- [ ] `Ctrl/Cmd + Enter` executa a simulacao mesmo com o cursor dentro do editor.
- [ ] `Ctrl/Cmd + S` salva sem abrir o dialogo de salvar do navegador.
- [ ] Alternar arquivos por atalho preserva cursor e scroll (RF02-I03).
- [ ] `F8` percorre os diagnosticos em ordem, com retorno ao primeiro no fim.
- [ ] `?` abre a ajuda, gerada a partir do registro central.
- [ ] `Esc` devolve o foco a pagina, permitindo tabular ate os controles.
- [ ] Toda acao com atalho tem tambem um controle visivel.
- [ ] A ajuda mostra `Cmd` no macOS e `Ctrl` nas demais plataformas.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: percorrer o ciclo completo sem tocar no mouse, no Windows e, se possivel,
no macOS.

## Riscos

- O Monaco tem seu proprio conjunto de atalhos; colidir com `Ctrl+Shift+P`
  (paleta de comandos) confunde quem vem do VS Code. Verificar cada combinacao
  contra os padroes do editor antes de fixar.
- Listener global sem escopo dispara dentro de campos de texto de dialogos;
  respeitar o escopo declarado no registro.
