# Extensibilidade do pipeline — adicionar uma toolchain (RNF08)

Prova de conceito de RNF08-I02: o **GHDL** (VHDL) foi adicionado como segunda toolchain sobre
o registro de RNF08-I01. É demonstração de extensibilidade, **não** suporte a VHDL como
funcionalidade: não há seleção na interface, destaque de sintaxe nem documentação para o
usuário final. O contrato aceita `kind: "simulate-vhdl"` (arquivos `.vhd`/`.vhdl`).

## Procedimento

1. **Imagem** em `infra/<toolchain>/` (Dockerfile + script de entrada), usuário `sandbox`
   (uid 10001), `WORKDIR /work`, seguindo os códigos de saída de `infra/sandbox/README.md`.
   Exemplo: `infra/sandbox-ghdl/` (`pnpm sandbox:build:ghdl`; Debian slim + `ghdl-mcode`, 129 MB,
   porque o Alpine 3.20 não empacota o GHDL).
2. **Contrato**: valor novo em `JobKindSchema` e extensões aceitas em `SOURCE_EXTENSIONS`
   (`packages/shared/src/schemas/simulation.ts`).
3. **Parser** de diagnósticos da ferramenta, com testes (`diagnostics-ghdl.ts`).
4. **Registro**: entrada em `TOOLCHAINS` (`toolchains.ts`) com imagem, parser, artefatos e
   `sourceAnalysis`. A variável de ambiente da imagem entra em `config/env.ts`
   (`SANDBOX_IMAGE_GHDL`).
5. **Proxy do Docker**: a imagem entra na lista `PROXY_ALLOWED_IMAGES` (`infra/docker-compose.yml`).
6. Testes: parser, registro e uma integração contra o Docker real
   (`pnpm --filter @tplab/api test:sandbox:ghdl`).

## Achados — o que precisou mudar fora do registro e da imagem

A issue pede que toda alteração fora do registro/imagem seja registrada: ela mostra onde a
modularidade ainda não existia.

| Onde | O que foi preciso | Avaliação |
| --- | --- | --- |
| `routes.ts`, `queue.ts` | Nada | A API e a fila já eram agnósticas — o ponto forte do desenho. |
| `packages/shared` (`simulation.ts`) | `kind` ampliado, `language` aceita `vhdl`, extensões por toolchain | Esperado: o contrato é o lugar de declarar o tipo. Os arquivos de **projeto** (`hdl.ts`) seguem só Verilog. |
| `infra/docker-proxy` (`policy.mjs`, `proxy.mjs`) | A política aceitava **uma** imagem (`PROXY_ALLOWED_IMAGE`); virou lista | **Lacuna real**: o proxy tinha a imagem do Verilog fixa. Cada toolchain nova exige declarar a imagem aqui também. |
| `config/env.ts`, `docker-compose.yml` | Variável da imagem nova | Esperado (uma variável por imagem). |
| `sandbox.ts` | Só o tipo do parâmetro (`Pick<HdlSources, 'design' \| 'testbench'>`) | O sandbox já era genérico; o tipo é que presumia Verilog. |
| `worker.ts` | Contrato do testbench, vetores de toolchain, `attachHints` e a heurística pós-execução são **Verilog** | **Lacuna real**: análises de código estavam acopladas à sintaxe Verilog. Resolvido com `Toolchain.sourceAnalysis` (`verilog` \| `none`); para VHDL elas simplesmente não rodam, então VHDL não recebe os avisos didáticos. |
| `hints.ts`, `limits.ts`, `testbench.ts` | Não alterados | `limits.ts` (limites de RNF05) é agnóstico e vale para as duas; hints/testbench continuam Verilog. |

Conclusão: adicionar a segunda toolchain tocou **registro + imagem + contrato** como previsto,
mais **duas lacunas** (lista de imagens do proxy e análises de fonte Verilog no worker),
ambas corrigidas. A modularidade é verdadeira para execução, fila e artefatos; a análise
didática de código ainda é por linguagem e precisaria ser reescrita por toolchain para VHDL.

## Limites e isolamento

A imagem GHDL roda por `runInSandbox` com `buildSandboxContainerOptions`: as mesmas barreiras
de RNF04 (sem rede, rootfs somente leitura, `CapDrop ALL`, `no-new-privileges`, PIDs) e os
mesmos limites de RNF05 (memória, CPU, tempos de análise e simulação, teto de arquivo). A
integração `sandbox-ghdl.integration.ts` confere o timeout (código 124) e o erro de análise
(código 2) nessa imagem. O espaço da imagem extra (129 MB) é desprezível diante dos 32 GB
previstos para a VM.
