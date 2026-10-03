import { DEFAULT_JOB_KIND, type Diagnostic, type JobKind } from '@tplab/shared';
import { env } from '../../config/env.js';
import { parseIcarusDiagnostics } from './diagnostics.js';

/** Artefato que o container deixa em `/work` e a plataforma devolve ao usuario (RNF08-I01). */
export interface ArtifactSpec {
  /** Chave em `SimulationResult.artifacts`. */
  name: string;
  /** Nome do arquivo no workdir; o primeiro que casar e lido. */
  filePattern: RegExp;
  /** Teto em bytes (RF04-I02); acima disso o conteudo e cortado e marcado como truncado. */
  maxBytes: () => number;
}

/**
 * Tudo que depende da ferramenta rodando no sandbox. Adicionar uma toolchain (GHDL, Yosys...) e
 * acrescentar uma entrada em `TOOLCHAINS` e um valor em `JobKindSchema` — o pipeline (fila,
 * rate limit, retencao, metricas) e o mesmo para todos. O script da imagem segue a convencao
 * de codigos de saida de `infra/sandbox/README.md`.
 */
export interface Toolchain {
  kind: JobKind;
  /** Imagem Docker; resolvida na chamada para refletir o ambiente atual. */
  image: () => string;
  /** Converte o stderr da ferramenta em diagnosticos com arquivo/linha/coluna (RF05). */
  parseDiagnostics: (stderr: string, knownFileNames: readonly string[]) => Diagnostic[];
  artifacts: readonly ArtifactSpec[];
}

export const VERILOG_TOOLCHAIN: Toolchain = {
  kind: 'simulate-verilog',
  image: () => env.SANDBOX_IMAGE,
  parseDiagnostics: parseIcarusDiagnostics,
  artifacts: [{ name: 'vcd', filePattern: /\.vcd$/, maxBytes: () => env.MAX_VCD_BYTES }],
};

/** Sem entrada aqui o `kind` nao e executavel: o tipo `Record<JobKind, ...>` obriga a cobrir todos. */
export const TOOLCHAINS: Record<JobKind, Toolchain> = {
  'simulate-verilog': VERILOG_TOOLCHAIN,
};

/** Toolchain do job; sem `kind` (cliente anterior a RNF08) vale o padrao Verilog. */
export function toolchainFor(kind: JobKind | undefined): Toolchain {
  return TOOLCHAINS[kind ?? DEFAULT_JOB_KIND];
}
