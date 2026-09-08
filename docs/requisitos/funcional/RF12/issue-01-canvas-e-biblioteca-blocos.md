# RF12-I01 - Canvas React Flow e biblioteca de blocos logicos

| Campo | Valor |
| --- | --- |
| Feature | [RF12](feature.md) |
| Branch | `feat/rf12-canvas-e-biblioteca-blocos` |
| Tamanho | G (aprox. 2 dias) |
| Depende de | - |

## Contexto

Nenhuma parte do editor visual existe. Esta issue estabelece a fundacao: a
dependencia, o modelo de bloco e o canvas com adicionar, mover e remover. As
conexoes ficam em RF12-I02, deliberadamente - misturar as duas coisas produz uma
issue grande demais para revisar.

React Flow e a escolha registrada em `docs/PROJECT_CONTEXT.md`. Vale confirmar
antes de instalar: peso no bundle, licenca e se o pacote atual (`@xyflow/react`)
atende sem plugins pagos.

## Objetivo

Ter um canvas onde o usuario adiciona blocos logicos da paleta, posiciona,
seleciona e remove, com o modelo de dados definido.

## Escopo tecnico

- `apps/web/package.json` - dependencia do React Flow
- `apps/web/src/features/circuit/types.ts` (novo) - modelo de bloco
- `apps/web/src/features/circuit/blocks/` (novo) - componentes de no
- `apps/web/src/features/circuit/circuit-canvas.tsx` (novo)
- `apps/web/src/features/circuit/block-palette.tsx` (novo)
- `apps/web/vite.config.ts` - chunk proprio, se o peso justificar

## Passo a passo

1. Avaliar e instalar o React Flow. Registrar no `README.md` o peso que ele
   adiciona ao bundle - o Monaco ja domina o tamanho, e uma segunda dependencia
   grande merece registro (RNF07 sobre carregamento inicial).
2. Definir o modelo, independente da biblioteca:
   - `BlockKind`: `and`, `or`, `not`, `xor`, `nand`, `nor`, `input`, `output`,
     `constant`;
   - `CircuitBlock`: `id`, `kind`, `position`, `label`, `inputs` (quantidade,
     configuravel para portas de 2+ entradas), `value` (para constante);
   - manter o modelo separado dos tipos do React Flow: o grafo e o que RF13
     traduz e o que RF12-I03 persiste; nao deve carregar detalhe de renderizacao.
3. Implementar um componente de no por tipo, com os terminais nas posicoes
   definidas pelo design. Nos simples com `memo`, para nao re-renderizar a cada
   movimento do canvas.
4. Montar o canvas com grade, alinhamento a grade, zoom, ajustar a tela e
   selecao multipla. Aproveitar os controles nativos do React Flow em vez de
   reimplementar.
5. Construir a paleta: lista de blocos por categoria, adicionar por arrastar e
   por clique (arrastar sozinho e inacessivel por teclado).
6. Implementar remocao (tecla `Delete` e acao no menu) e desfazer/refazer sobre o
   modelo proprio - o React Flow nao traz historico.
7. Estilizar via tokens de tema para funcionar nos dois modos (RF10).
8. Acessibilidade: nos focalizaveis, movimentacao com setas, `aria-label`
   descrevendo tipo e rotulo do bloco.

## Criterios de aceite

- [ ] Blocos podem ser adicionados por arrastar e por clique na paleta.
- [ ] Mover, selecionar (individual e multiplo) e remover funcionam.
- [ ] Desfazer e refazer cobrem adicionar, mover e remover.
- [ ] Zoom e ajuste a tela funcionam por mouse e por teclado.
- [ ] O canvas respeita o tema claro/escuro.
- [ ] Os nos sao alcancaveis e movimentaveis por teclado.
- [ ] O modelo de circuito nao depende de tipos do React Flow.
- [ ] O impacto no tamanho do bundle esta medido e documentado.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: montar visualmente um somador completo (sem conectar - isso e RF12-I02).

## Riscos

- Acoplar o modelo aos tipos do React Flow torna RF13 e a persistencia refens da
  biblioteca; a separacao precisa ser mantida desde o primeiro commit.
- Historico de desfazer sobre grafo cresce em memoria; limitar o numero de
  passos.
- Arrastar da paleta e o unico caminho em muitas implementacoes; aqui o clique
  precisa existir desde o inicio, nao como remendo posterior.
