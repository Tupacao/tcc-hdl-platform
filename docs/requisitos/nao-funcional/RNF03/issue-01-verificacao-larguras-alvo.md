# RNF03-I01 - Verificacao e ajuste nas larguras alvo

| Campo | Valor |
| --- | --- |
| Feature | [RNF03](feature.md) |
| Branch | `chore/rnf03-verificacao-larguras-alvo` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF09-I01 |

## Contexto

O layout do workspace nunca foi verificado em nenhuma largura especifica. Os
percentuais (`defaultSize={58}` e `42` na horizontal, `70` e `30` na vertical) e
os minimos (`minSize={30}`, `15`, `20`) foram escolhidos sem confronto com o
conteudo real.

Em 1024px, 42% do painel de ondas dao cerca de 430 pixels - descontando a coluna
de nomes de sinais de RF06, sobra pouco para a onda. Em 1920px, 58% dao 1100
pixels de editor, mais do que uma linha de Verilog costuma ocupar.

## Objetivo

Verificar o layout nas tres larguras alvo e ajustar proporcoes e minimos com base
no conteudo real.

## Escopo tecnico

- `apps/web/src/features/workspace/workspace.tsx` - proporcoes e minimos
- `apps/web/src/lib/layout.ts` - constantes (criado em RF09-I01)
- `docs/COMPATIBILIDADE.md` - registro dos resultados
- Ajustes pontuais nos paineis

## Passo a passo

1. Preparar o cenario real: um projeto com codigo representativo, uma simulacao
   com diagnosticos e um `.vcd` com varios sinais. Layout so se avalia com
   conteudo dentro.
2. Verificar em 1024, 1366 e 1920 px, cobrindo:
   - o editor mostra uma linha tipica de Verilog sem quebra indesejada;
   - o console mostra um diagnostico completo (`arquivo:linha` mais mensagem) sem
     truncar;
   - o painel de ondas mostra a coluna de nomes e um trecho util de tempo;
   - o cabecalho nao sobrepoe elementos;
   - nao ha rolagem horizontal em nenhuma das tres.
3. Ajustar as proporcoes padrao conforme o design de RNF03, mantendo-as nas
   constantes unicas de RF09-I01.
4. Converter os minimos de percentual para pixel quando fizer sentido: 30% em
   1024px e 20% em 1920px sao larguras completamente diferentes, e o conteudo
   minimo nao muda com a tela. `react-resizable-panels` aceita `minSizePixels`.
5. Verificar o comportamento ao redimensionar a janela continuamente - o Monaco
   com `automaticLayout` e o canvas com `ResizeObserver` precisam acompanhar sem
   travar.
6. Conferir que o layout salvo por RF09-I01 continua valido quando o usuario
   troca de monitor: tamanhos percentuais se adaptam, pixels nao.
7. Registrar os resultados por largura em `docs/COMPATIBILIDADE.md`, junto com a
   matriz de RNF02.

## Criterios de aceite

- [ ] Nas tres larguras alvo nao ha rolagem horizontal.
- [ ] Uma linha tipica de Verilog cabe no editor em 1024px.
- [ ] Um diagnostico completo cabe no console em 1024px.
- [ ] O painel de ondas mostra nomes e trecho util em 1024px.
- [ ] Os minimos estao expressos na unidade adequada e justificados.
- [ ] Redimensionar continuamente nao trava nem distorce.
- [ ] Trocar de monitor com layout salvo nao quebra o resultado.
- [ ] Os resultados estao registrados.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
pnpm --filter @tplab/web preview
```

Manual: com o modo responsivo do navegador, fixar 1024, 1366 e 1920 e percorrer o
roteiro. O MCP `chrome-devtools` do projeto ajuda a automatizar as capturas.

## Riscos

- Avaliar com a tela vazia esconde o problema: e o conteudo real que expoe a
  falta de espaco.
- Minimo em pixel evita painel inutilizavel e pode impedir o usuario de esconder
  um painel de proposito; se a soma dos minimos nao couber em 1024px, a feature
  precisa reduzir os minimos ou mudar o layout.
