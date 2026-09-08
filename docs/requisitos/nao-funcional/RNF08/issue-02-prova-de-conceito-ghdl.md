# RNF08-I02 - Prova de conceito com uma segunda toolchain

| Campo | Valor |
| --- | --- |
| Feature | [RNF08](feature.md) |
| Branch | `feat/rnf08-prova-de-conceito-ghdl` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RNF08-I01 |

## Contexto

Arquitetura modular so e verificavel adicionando o segundo caso. Enquanto houver
uma unica toolchain, "modular" e afirmacao de intencao - exatamente o tipo de
afirmacao que uma banca de TCC pede para demonstrar.

O candidato natural e o **GHDL**, para VHDL: e a extensao citada em
`CLAUDE.md` e em `docs/PROJECT_CONTEXT.md`, tem imagem Docker disponivel, produz
o mesmo tipo de artefato (`.vcd`) e cabe no mesmo modelo de execucao. Yosys
(sintese) seria uma prova mais forte por produzir artefatos diferentes, e custa
bem mais - fica como alternativa se o prazo permitir.

O objetivo aqui e **demonstrar a extensibilidade**, nao entregar suporte a VHDL
como funcionalidade de produto. Isso muda o criterio de aceite: nao ha interface,
nao ha destaque de sintaxe VHDL, nao ha documentacao para o usuario final.

## Objetivo

Adicionar uma segunda toolchain de ponta a ponta, tocando apenas o registro e a
imagem, e registrar a evidencia.

## Escopo tecnico

- `infra/sandbox-ghdl/Dockerfile` (novo)
- `infra/sandbox-ghdl/run-simulation.sh` (novo)
- `apps/api/src/modules/simulation/toolchains.ts` - nova entrada
- `apps/api/src/modules/simulation/diagnostics-ghdl.ts` (novo)
- `package.json` - script de build da imagem
- `docs/EXTENSIBILIDADE.md` (novo) - o procedimento

## Passo a passo

1. Construir a imagem com o GHDL, no mesmo padrao da imagem existente: base
   enxuta, usuario nao privilegiado (`sandbox`), sem ferramenta desnecessaria.
2. Escrever o script de execucao respeitando a convencao de codigos de saida
   fixada em RNF08-I01 (0/2/3/124) e o mesmo timeout por variavel de ambiente. O
   GHDL tem etapas proprias (`analyze`, `elaborate`, `run`), e o script precisa
   mapear falha de analise para 2 e falha de execucao para 3.
3. Escrever o parser de diagnosticos do GHDL, cujo formato difere do Icarus, e
   cobri-lo com testes seguindo o padrao de `diagnostics.test.ts`.
4. Registrar a toolchain no registro criado em RNF08-I01: imagem, comando,
   parser, artefatos.
5. Verificar o que precisou mudar fora do registro e da imagem. **Toda alteracao
   em `routes.ts`, `queue.ts` ou `sandbox.ts` e um achado**, e o achado e o
   resultado mais valioso desta issue: mostra onde a modularidade ainda nao
   existe. Corrigir o que for razoavel e registrar o restante.
6. Executar um exemplo VHDL simples de ponta a ponta - um contador -, conferindo
   que produz `.vcd` e que os diagnosticos aparecem no mesmo console.
7. Confirmar que os limites de RNF05 e o isolamento de RNF04 valem igualmente
   para a nova imagem: nao ha excecao para toolchain nova.
8. Escrever `docs/EXTENSIBILIDADE.md` com o procedimento passo a passo para
   adicionar uma toolchain, usando esta como exemplo trabalhado - e o entregavel
   que sustenta RNF08 no texto do TCC.

## Criterios de aceite

- [ ] A imagem da segunda toolchain constroi e roda isolada.
- [ ] Um exemplo VHDL completa o fluxo e produz `.vcd`.
- [ ] Os diagnosticos do GHDL aparecem no mesmo formato, com arquivo e linha.
- [ ] `routes.ts` nao foi alterado.
- [ ] Toda alteracao fora do registro e da imagem esta registrada como achado.
- [ ] Os limites e o isolamento valem para a nova toolchain.
- [ ] O fluxo Verilog nao regrediu.
- [ ] `docs/EXTENSIBILIDADE.md` documenta o procedimento.

## Verificacao

```bash
docker build -t tplab-sandbox-ghdl:latest infra/sandbox-ghdl
pnpm --filter @tplab/api test
pnpm typecheck
```

Manual: submeter um design VHDL com seu testbench e conferir o resultado.

## Riscos

- Expandir isso para suporte real a VHDL (destaque de sintaxe, selecao na
  interface, documentacao) e outra feature inteira; o escopo aqui e prova de
  conceito, e deve ser explicitado na interface para nao criar expectativa.
- Se a segunda toolchain exigir mudanca em varios arquivos, a conclusao honesta e
  que a arquitetura ainda nao e modular como afirmado - e isso precisa aparecer
  no texto do TCC, nao ser escondido.
- Duas imagens de sandbox dobram o espaco em disco na VM; conferir contra o disco
  de 32 GB previsto.
