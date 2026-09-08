# RF12-I02 - Conexoes, terminais e validacao do grafo

| Campo | Valor |
| --- | --- |
| Feature | [RF12](feature.md) |
| Branch | `feat/rf12-conexoes-e-validacao-grafo` |
| Tamanho | G (aprox. 2 dias) |
| Depende de | RF12-I01 |

## Contexto

Com os blocos no canvas, falta o que faz deles um circuito: os fios. Conectar e
onde estao as regras do dominio, e onde um editor generico de grafos deixa de
servir sem ajuda:

- um terminal de **saida** liga a um ou mais terminais de **entrada**; saida com
  saida nao existe;
- um terminal de entrada aceita **um unico** driver - dois fios chegando no mesmo
  ponto e curto, nao ligacao;
- circuito combinacional **nao pode ter ciclo** - realimentacao sem elemento de
  memoria e uma condicao invalida, nao um estilo;
- entrada de porta desconectada nao tem valor definido; RF13 nao consegue gerar
  codigo a partir disso.

Essas regras nao sao alertas cosmeticos: sao a condicao para RF13 existir.

## Objetivo

Permitir conectar terminais com feedback imediato do que e valido, e manter uma
validacao continua do grafo que RF13 possa consumir.

## Escopo tecnico

- `apps/web/src/features/circuit/circuit-canvas.tsx` - conexoes
- `apps/web/src/features/circuit/validate.ts` (novo) - regras do grafo
- `apps/web/src/features/circuit/validate.test.ts` (novo)
- `apps/web/src/features/circuit/problems-panel.tsx` (novo)

## Passo a passo

1. Declarar os terminais com tipo (`source` / `target`) e usar a validacao de
   conexao do React Flow (`isValidConnection`) para recusar ligacao invalida
   ainda durante o arraste, com destaque visual do alvo valido.
2. Impedir mais de um driver por entrada: nova conexao em terminal ocupado ou
   substitui a anterior ou e recusada. Recomendacao: substituir, avisando - e o
   que o usuario normalmente quer.
3. Escrever `validate.ts` como funcao pura sobre o modelo, devolvendo uma lista de
   problemas tipados (`{ kind, severity, blockId?, edgeId?, message }`):
   - `ciclo` (erro) - detectado por busca em profundidade com marcacao;
   - `entrada-desconectada` (erro para RF13, aviso durante a edicao);
   - `saida-sem-origem` (erro);
   - `bloco-isolado` (aviso);
   - `sem-entradas` / `sem-saidas` no circuito (aviso).
4. Rodar a validacao a cada alteracao do grafo, com debounce, e marcar no canvas
   os blocos e fios envolvidos - sem impedir a edicao. Circuito incompleto e um
   estado normal enquanto se monta.
5. Construir um painel de problemas listando o que foi encontrado, com clique
   levando ao elemento (mesmo padrao do console de RF05).
6. Nomear entradas e saidas: o rotulo vira nome de porta em RF13, entao precisa
   ser identificador Verilog valido - reaproveitar `ModuleNameSchema` de
   `packages/shared`. Validar no momento da edicao e avisar sobre nome duplicado.
7. Cobrir `validate.ts` com testes: ciclo simples, ciclo longo, entrada solta,
   saida sem origem, somador completo valido, circuito vazio.
8. Acessibilidade: conectar sem mouse - selecionar terminal de origem, depois
   terminal de destino, confirmar com `Enter`.

## Criterios de aceite

- [ ] Saida so conecta a entrada; a tentativa invalida e recusada durante o
      arraste.
- [ ] Entrada nunca fica com dois drivers.
- [ ] Ciclo e detectado e sinalizado no canvas e no painel de problemas.
- [ ] Entradas desconectadas sao sinalizadas sem bloquear a edicao.
- [ ] Rotulos invalidos ou duplicados de porta sao sinalizados.
- [ ] Clicar num problema seleciona o elemento correspondente.
- [ ] E possivel criar uma conexao usando apenas o teclado.
- [ ] Um somador completo montado corretamente nao acusa nenhum erro.
- [ ] `validate.ts` tem teste para cada tipo de problema.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: montar um somador completo valido; depois criar um ciclo e conferir a
deteccao.

## Riscos

- Validar em cada alteracao com grafos grandes pode pesar; debounce e algoritmo
  linear resolvem para o tamanho previsto (dezenas de blocos).
- Excesso de marcacao de erro enquanto o usuario monta e desestimulante:
  distinguir bem "ainda incompleto" (aviso discreto) de "invalido" (erro).
