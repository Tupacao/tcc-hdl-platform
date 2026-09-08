# RF09-I03 - Semantica das abas, divisores e barra de estado

| Campo | Valor |
| --- | --- |
| Feature | [RF09](feature.md) |
| Branch | `feat/rf09-semantica-e-barra-de-estado` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF09-I02 |

## Contexto

Duas lacunas na interface unica.

**Semantica.** As abas em `workspace.tsx` usam `role="tablist"` e `role="tab"`
com `aria-selected`, mas falta o resto do padrao: nao ha `aria-controls`, nao ha
elemento com `role="tabpanel"`, e a navegacao por setas nao existe (todas as abas
entram na ordem de tabulacao, em vez de uma so com as setas movendo o foco). Os
`PanelResizeHandle` nao tem rotulo acessivel, entao um leitor de tela anuncia um
separador sem nome.

**Coerencia.** O desfecho de uma execucao aparece so no console. Quem esta
olhando as formas de onda nao ve quantos erros houve; quem esta no editor precisa
descer os olhos ate o painel de baixo. Falta um lugar unico e sempre visivel para
o estado da ultima execucao.

## Objetivo

Corrigir a semantica dos controles compostos e introduzir uma barra de estado que
sirva a tela inteira.

## Escopo tecnico

- `apps/web/src/features/workspace/workspace.tsx`
- `apps/web/src/features/workspace/file-tabs.tsx` (novo) - extrair as abas
- `apps/web/src/features/workspace/status-bar.tsx` (novo)

## Passo a passo

1. Extrair as abas para um componente proprio implementando o padrao ARIA
   completo: apenas a aba ativa com `tabIndex={0}`, setas esquerda/direita
   movendo o foco e a selecao, `Home`/`End`, `aria-controls` apontando para o
   painel e o container do editor com `role="tabpanel"` e `aria-labelledby`.
2. Marcar visualmente e semanticamente a aba de um arquivo que tem erro
   (RF05) e a que tem alteracao nao salva (RF07-I03), sem depender so de cor.
3. Dar rotulo aos divisores: `aria-label` descritivo ("Ajustar largura entre
   editor e formas de onda"). Confirmar que `react-resizable-panels` ja aplica
   `role="separator"` e os atributos `aria-valuenow`/`min`/`max`; se aplicar,
   validar que o ajuste por setas funciona quando o divisor tem foco.
4. Criar a barra de estado no rodape com: desfecho da ultima execucao (sucesso,
   erro de compilacao, timeout), duracao, contagem de erros e avisos, e o estado
   do projeto (salvo / nao salvo). Clicar em um contador foca o console.
5. Usar `aria-live="polite"` na barra para anunciar o desfecho de cada execucao -
   um unico ponto de anuncio, evitando que console e toast falem ao mesmo tempo.
6. Substituir os `h-[calc(100%-1.75rem)]` por layout em flex, para que a barra de
   estado e os cabecalhos de painel nao exijam altura codificada em varios
   lugares.
7. Rodar a skill `a11y-audit` sobre o workspace e corrigir as violacoes de nivel
   A e AA encontradas.

## Criterios de aceite

- [ ] As abas seguem o padrao ARIA de tabs: uma parada de tabulacao, navegacao
      por setas, `tabpanel` associado.
- [ ] Aba com erro e aba com alteracao nao salva sao distinguiveis sem cor.
- [ ] Os divisores tem rotulo e sao ajustaveis por teclado.
- [ ] A barra de estado mostra o desfecho da ultima execucao de qualquer painel.
- [ ] Clicar nos contadores de erro leva ao console.
- [ ] O desfecho e anunciado uma unica vez por leitor de tela.
- [ ] Nenhuma altura de painel depende de valor codificado em mais de um lugar.
- [ ] A auditoria de acessibilidade nao acusa violacao de nivel A ou AA no
      workspace.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: navegar as abas so com setas; dar foco a um divisor e ajustar com setas;
executar uma simulacao com erro e conferir o anuncio unico.

## Riscos

- Trocar `calc()` por flex pode mexer no dimensionamento do Monaco, que usa
  `automaticLayout`; validar o redimensionamento apos a mudanca.
- Excesso de regioes `aria-live` gera anuncio duplicado com o `sonner`; decidir
  aqui que a barra de estado e a fonte unica e ajustar os toasts.
