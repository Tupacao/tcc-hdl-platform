import type { SimulationFailure, TruncatedFlags } from '@tplab/shared';

/** Em qual etapa o limite de tempo estourou — `host` = o `killTimer` do worker, nao o script. */
export type TimeoutPhase = 'compile' | 'simulate' | 'host';

/**
 * Tempos parciais dentro de `durationMs` (RF03-I04) — separam o overhead do
 * Docker (criacao do container) da execucao de verdade (`iverilog`/`vvp`) e
 * da leitura dos artefatos, para investigar RNF07-I02 sem adivinhar onde o
 * tempo foi gasto. Somados, ficam perto de `durationMs` (a diferenca e o
 * tempo gasto escrevendo os fontes no tmpdir e removendo o container/workdir).
 */
export interface SandboxTimings {
  containerCreateMs: number;
  executionMs: number;
  artifactsReadMs: number;
  /** RNF07-I01 — `iverilog` e `vvp` separados (marca `@@tplab-timing` do script); `null` se a etapa nao terminou. */
  compileMs: number | null;
  simulateMs: number | null;
}

/**
 * Desfecho de uma execucao no sandbox. Produzido por `infra/sandbox` e consumido
 * pela regra de negocio (`application/simulation/service/*`): por isso o tipo mora
 * em `domain/`, e nenhum dos dois lados importa o outro.
 */
export interface SandboxOutcome {
  exitCode: number;
  failure: SimulationFailure | null;
  stdout: string;
  stderr: string;
  /** RNF08-I01 — artefatos declarados pela toolchain que o container gerou, por nome. */
  artifacts: Record<string, string>;
  /** Derivado de `artifacts.vcd`, mantido para os consumidores atuais. */
  vcd: string | null;
  durationMs: number;
  timings: SandboxTimings;
  /** RF04-I02 — quais dos tres artefatos acima vieram cortados por teto de tamanho. */
  truncated: TruncatedFlags;
  /** RNF05-I01 — `State.OOMKilled` do container: o dado autoritativo de estouro de memoria. */
  oomKilled: boolean;
  /** RNF05-I01 — etapa que estourou o tempo, ou `null` quando nao houve timeout. */
  timeoutPhase: TimeoutPhase | null;
  /** RNF05-I02 — o Docker recusou `logs` mesmo apos novas tentativas: stdout/stderr vieram vazios por falha, nao por silencio do codigo. */
  logsUnavailable: boolean;
}

/** Tetos de recurso de uma execucao (RNF05), resolvidos a partir do ambiente. */
export interface SandboxLimits {
  image: string;
  timeoutMs: number;
  /** Teto da compilacao (`iverilog`), separado do da simulacao. */
  compileTimeoutMs: number;
  memoryMb: number;
  cpus: number;
}

/** Conteudo lido de um artefato, com a marca de corte por teto de tamanho (RF04-I02). */
export interface TruncationResult {
  text: string;
  truncated: boolean;
}
