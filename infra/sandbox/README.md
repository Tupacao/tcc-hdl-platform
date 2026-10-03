# Sandbox — convenção dos scripts de toolchain (RNF08-I01)

Cada toolchain (Icarus Verilog hoje; GHDL, Yosys etc. depois) é uma imagem Docker com um
script de entrada que lê os fontes em `/work`, roda a ferramenta e deixa os artefatos também
em `/work`. A plataforma não conhece a ferramenta: só o registro
`apps/api/src/modules/simulation/toolchains.ts` (imagem, parser de diagnósticos, artefatos
esperados) e esta convenção.

## Códigos de saída — contrato de todo script

| Código | Significado                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| 0      | sucesso                                                                        |
| 2      | erro de compilação/análise do código do usuário                                |
| 3      | erro em tempo de execução/simulação                                            |
| 4      | timeout da compilação/análise (`SIM_COMPILE_TIMEOUT_S`)                        |
| 124    | timeout da execução (`SIM_TIMEOUT_S`)                                          |
| 153    | arquivo gravado acima do teto por arquivo (128 + SIGXFSZ, `ulimit -f`)         |
| 137    | SIGKILL antes do limite — quem decide se foi memória é o `OOMKilled` do Docker |

`mapFailure` (`sandbox.ts`) traduz estes códigos para `SimulationFailure`; mudar um lado
exige mudar o outro. Qualquer outro código vira `internal_error`.

## Variáveis de ambiente do container

`SIM_TIMEOUT_S` e `SIM_COMPILE_TIMEOUT_S`. Nada mais da API chega ao container.

## Saída

- stdout/stderr são lidos dos logs do container. A última linha de stderr pode ser
  `@@tplab-timing compile_ms=N simulate_ms=N` (RNF07-I01); o host a remove.
- Artefatos: arquivos em `/work` cujo nome casa com o `filePattern` declarado no registro,
  cada um com seu teto de bytes. Só arquivo regular é lido.

## Adicionar uma toolchain

1. Imagem + script em `infra/sandbox/` seguindo esta convenção.
2. Valor novo em `JobKindSchema` (`packages/shared`).
3. Entrada em `TOOLCHAINS` (`toolchains.ts`): imagem, parser, artefatos.
4. As opções do container (`buildSandboxContainerOptions`) e a política do proxy do Docker
   continuam as mesmas — a imagem é o único campo que varia.
