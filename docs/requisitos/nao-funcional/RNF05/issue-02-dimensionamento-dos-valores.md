# RNF05-I02 - Dimensionamento dos valores com medicao

| Campo | Valor |
| --- | --- |
| Feature | [RNF05](feature.md) |
| Branch | `feat-RNF05-02-dimensionamento-valores-back` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RNF05-I01, RF03-I04 |

## Contexto

Os valores atuais - 10 s, 128 MB, 0,5 CPU, 128 PIDs, 256 KB por arquivo, 8 MB de
VCD - foram escolhidos por estimativa razoavel, nao por medicao. Nenhum deles tem
justificativa registrada.

Isso importa em duas frentes. No produto: limite apertado demais recusa trabalho
legitimo, e frouxo demais desperdica a VM. No TCC: afirmar "definimos 10 segundos"
sem dado por tras e mais fraco que "medimos o percentil 95 em X ms e definimos o
limite com folga de Y".

RF03-I04 instrumenta o worker com duracao por job, que e exatamente a materia
prima desta issue.

## Objetivo

Medir o consumo real de simulacoes representativas e ajustar os limites com base
nos dados, deixando cada valor justificado.

## Escopo tecnico

- `apps/api/src/config/env.ts` - valores padrao
- `apps/api/.env.example` e `infra/docker-compose.yml`
- `packages/shared/src/schemas/hdl.ts` - `MAX_SOURCE_BYTES`
- `apps/api/src/modules/simulation/sandbox.ts` - `MAX_VCD_BYTES`
- `README.md` - justificativa dos valores

## Passo a passo

1. Montar um conjunto representativo de simulacoes: os exemplos de RF20 (somador,
   multiplexador, contador), um circuito de porte medio (ULA simples, registrador
   de deslocamento) e um caso pesado deliberado (contador de 16 bits com muitos
   ciclos e `$dumpvars` completo).
2. Medir, para cada um, com a instrumentacao de RF03-I04: tempo de criacao do
   container, de compilacao, de simulacao e de leitura de artefatos; pico de
   memoria (`docker stats` ou `Memory.MaxUsage` do container); tamanho do `.vcd`.
3. Repetir cada medicao varias vezes e registrar mediana e percentil 95 - media
   sozinha esconde a cauda, que e justamente o que o limite precisa cobrir.
4. Medir na VM alvo (B2s), nao so na maquina de desenvolvimento: o desempenho
   difere, e o limite precisa valer onde a plataforma roda.
5. Definir cada limite como o valor medido no pior caso legitimo mais uma folga
   explicita (por exemplo, 3x o p95), e escrever o raciocinio.
6. Rever especificamente:
   - `SANDBOX_TIMEOUT_MS` contra o alvo de 5 s de RNF07 - o limite e o teto de
     seguranca, nao a meta de desempenho, e precisa ser maior;
   - `SANDBOX_MEMORY_MB` contra o pico do `iverilog` no caso pesado;
   - `MAX_VCD_BYTES` contra o que o visualizador de RF06 aguenta e contra a
     retencao de RF03-I03 - os tres numeros precisam ser decididos juntos;
   - `MAX_SOURCE_BYTES` contra o maior exemplo real.
7. Verificar o efeito agregado: dois jobs simultaneos no limite de memoria devem
   caber com folga nos 4 GiB da VM, junto com Postgres, Redis, API e worker.
8. Registrar tudo no `README.md`: valor, medicao que o sustenta, folga adotada e
   data.

## Criterios de aceite

- [x] Ha medicao registrada para cada simulacao do conjunto representativo. _(sete casos, README)_
- [~] Mediana e p95 estao registrados, na VM alvo. _(mediana, p95 e maximo registrados com 20 amostras; **na maquina de desenvolvimento** — a VM B2s so existe apos RF01-I02. O protocolo esta em `measure:sandbox`)_
- [x] Cada limite tem justificativa escrita, com a folga explicita.
- [x] Nenhum exemplo de RF20 chega perto de qualquer limite. _(o maior exemplo usa 20 MB e 1,4 s de simulacao; o caso pesado deliberado, 4 MB e 2,7 s)_
- [x] Dois jobs simultaneos no limite cabem na VM com folga. _(pior caso somado ~1,9 GB dos 4 GiB — calculo com pecas medidas em repouso; nao medido na VM)_
- [x] `MAX_VCD_BYTES`, a retencao de RF03-I03 e o teto de RF04-I02 sao coerentes.
- [x] Os valores estao no `README.md` com a data da medicao.

## Verificacao

```bash
pnpm sandbox:build
pnpm dev:worker
curl -s http://localhost:3333/health/metrics
docker stats --no-stream
```

## Nota de implementacao

Medicao completa, tabelas e o raciocinio de cada limite estao no `README.md`, secao
"Dimensionamento dos limites" (2026-09-29). Achados que mudaram decisoes:

- **O container domina o tempo**: compilar + simular um exemplo leva ~20 ms; criar
  (~1,5 s) e iniciar/aguardar (~1 s) o container e todo o resto. O timeout de
  simulacao (10 s) cobre so o `vvp`, entao nao tem de acompanhar esse overhead — que
  e problema de RNF07-I02.
- **`MAX_SOURCE_BYTES` era o unico limite que nao fechava a conta**: o par de arquivos
  que o contrato aceitava (2 × 256 KB) nao cabia nos tetos de compilacao nem de
  memoria. Passou a **64 KB por arquivo** (compila em 0,66 s / 40 MB, folga de 7,6× e
  3,2×). E mudanca de contrato em `packages/shared`; o texto de ajuda que cita o
  numero (`inicio-rapido.tsx`) segue em PR de front separada (front e back nao
  compartilham branch).
- Nao ha valor que precisasse subir: 10 s, 5 s, 128 MB e 0,5 CPU se sustentam. O caso
  limitado por CPU (RAM de 1 M palavras) dobra o tempo com 0,5 em vez de 1 CPU — aceito
  porque 2 jobs × 0,5 = 1 dos 2 vCPU da B2s.
- Achado colateral, do mesmo protocolo: o Docker de desenvolvimento respondeu `409` a
  `logs` **ate em execucao normal** (1 vez em ~140) — a leitura agora repete e, se
  ainda assim falhar, o resultado deixa de ser "sucesso com saida vazia" e vira `internal_error`
  com mensagem propria.

## Riscos

- Medir so na maquina de desenvolvimento produz numero otimista; a VM B2s tem
  menos CPU e a diferenca aparece justamente no caso pesado.
- Ajustar um limite sem os outros gera incoerencia: aumentar o VCD sem aumentar a
  retencao enche o Redis. Decidir os tres numeros no mesmo movimento.
