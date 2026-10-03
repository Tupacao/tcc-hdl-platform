# RNF04-I03 - Vetores especificos da toolchain Verilog

| Campo | Valor |
| --- | --- |
| Feature | [RNF04](feature.md) |
| Branch | `chore/rnf04-vetores-toolchain` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RNF04-I01 |

## Contexto

As barreiras de RNF04-I01 tratam o container como caixa preta. Existe uma segunda
classe de risco, especifica de **o que o Verilog e o Icarus permitem** por
projeto - recursos legitimos da linguagem que, num ambiente que aceita codigo de
terceiros, viram vetor:

- **`` `include ``** - a diretiva le arquivos. Com caminho absoluto
  (`` `include "/etc/passwd" ``), o conteudo pode acabar na saida do compilador
  ou dentro do binario simulado.
- **`$readmemh` / `$readmemb`** - leem arquivos em tempo de simulacao e podem
  despejar o conteudo com `$display`.
- **`$fopen` / `$fwrite` / `$fdisplay`** - escrevem arquivos; combinadas com o
  bind do workdir, escrevem onde o worker le.
- **`$system`** - executa comando do sistema. Se a build do Icarus tiver esse
  recurso habilitado, e execucao arbitraria dentro do container.
- **`$dumpfile`** com caminho arbitrario - grava o VCD fora do workdir, ou
  sobrescreve arquivo existente.
- **Bomba de compilacao** - macros recursivas ou `` `include `` circular que
  esgotam memoria antes mesmo da simulacao.

`run-simulation.sh` compila com `iverilog -g2012 -o /tmp/simulation.vvp` sobre
todos os `.v`/`.sv` de `/work`, sem restringir nenhuma dessas construcoes.

## Objetivo

Verificar quais vetores da toolchain sao exploraveis dentro do sandbox e mitigar
os que passarem pelas barreiras existentes.

## Escopo tecnico

- `infra/sandbox/run-simulation.sh` - opcoes do `iverilog`
- `infra/sandbox/Dockerfile` - permissoes e conteudo da imagem
- `apps/api/src/modules/simulation/testbench.ts` - avisos (de RF04-I01)
- `docs/SEGURANCA.md` - registro

## Passo a passo

1. Testar cada vetor da lista acima com um par design/testbench real, submetido
   pelo fluxo normal, e registrar o resultado.
2. Avaliar o impacto real de cada um sob as barreiras ja existentes. Ler
   `/etc/passwd` de dentro de um container efemero, sem rede e com rootfs somente
   leitura, tem impacto baixo - a informacao nao sai e o container morre. O
   registro dessa avaliacao vale tanto quanto a mitigacao.
3. Restringir o que for restringivel sem quebrar uso legitimo:
   - conferir se o `iverilog` oferece opcao de limitar caminhos de `` `include ``
     (`-I` define caminhos de busca; avaliar o efeito de caminho absoluto);
   - considerar validar no backend, antes de enfileirar, a presenca de caminho
     absoluto em `` `include ``, `$readmemh` e `$dumpfile`, emitindo aviso ou
     recusa conforme o risco (reaproveitando o analisador de RF04-I01);
   - confirmar se `$system` esta habilitado na build usada; se estiver e nao
     houver como desabilitar, tratar como risco a compensar.
4. Verificar a bomba de compilacao: macro recursiva e `` `include `` circular.
   O `iverilog` roda **fora** do `timeout` no script atual - so o `vvp` esta
   protegido. Se a compilacao puder travar indefinidamente, o timeout precisa
   cobrir tambem o `iverilog`.
5. Conferir a permissao do workdir montado: o usuario `sandbox` precisa escrever
   o `.vcd`, e nao deveria poder alterar os proprios fontes de forma a confundir
   a leitura posterior.
6. Ajustar o `run-simulation.sh` com o que for decidido, mantendo os codigos de
   saida (0/2/3/124) intactos - `mapFailure` em `sandbox.ts` depende deles.
7. Registrar tudo em `docs/SEGURANCA.md`: vetor, impacto observado, mitigacao ou
   risco aceito.

## Criterios de aceite

- [ ] Cada vetor da lista foi testado e o resultado registrado.
- [ ] O `iverilog` esta coberto por timeout, assim como o `vvp`.
- [ ] Bomba de compilacao termina por timeout, sem derrubar o worker.
- [ ] Escrita fora do workdir por `$fopen`/`$dumpfile` esta impedida ou avaliada.
- [ ] O estado de `$system` na imagem esta verificado e documentado.
- [ ] Os codigos de saida do script continuam 0/2/3/124.
- [ ] Uso legitimo (`$dumpfile("wave.vcd")`, `$display`) continua funcionando.
- [ ] `docs/SEGURANCA.md` registra vetor, impacto e decisao.

## Verificacao

```bash
pnpm sandbox:build
pnpm --filter @tplab/api test
```

Manual: submeter cada vetor pela interface e conferir o desfecho.

## Riscos

- Restringir demais quebra uso legitimo: `$readmemh` e a forma normal de carregar
  memoria em exercicios de sistemas digitais. Avisar e melhor que bloquear,
  quando o impacto for baixo.
- Mudar os codigos de saida do `run-simulation.sh` quebra `mapFailure` em
  silencio - o acoplamento esta registrado em `CLAUDE.md` e precisa ser
  respeitado.
