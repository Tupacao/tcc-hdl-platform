import { DEFAULT_JOB_KIND, type JobKind } from '@tplab/shared';
import { env } from '../../../config/env.js';
import type { Toolchain } from '../../../domain/simulation/entities/toolchain.js';
import { parseIcarusDiagnostics } from './diagnostics-icarus.js';
import { parseGhdlDiagnostics } from './diagnostics-ghdl.js';

/**
 * Registro das toolchains disponiveis. O contrato (`Toolchain`) vive em
 * `domain/simulation/entities/toolchain.ts`; aqui ficam as implementacoes, que
 * conhecem o ambiente (imagem configurada) e os parsers de diagnostico.
 */
export const VERILOG_TOOLCHAIN: Toolchain = {
  kind: 'simulate-verilog',
  image: () => env.SANDBOX_IMAGE,
  parseDiagnostics: parseIcarusDiagnostics,
  artifacts: [{ name: 'vcd', filePattern: /\.vcd$/, maxBytes: () => env.MAX_VCD_BYTES }],
  sourceAnalysis: 'verilog',
};

/** Prova de conceito de RNF08-I02: VHDL com GHDL, mesmo artefato (`.vcd`), parser proprio. */
export const VHDL_TOOLCHAIN: Toolchain = {
  kind: 'simulate-vhdl',
  image: () => env.SANDBOX_IMAGE_GHDL,
  parseDiagnostics: parseGhdlDiagnostics,
  artifacts: VERILOG_TOOLCHAIN.artifacts,
  sourceAnalysis: 'none',
};

/** Sem entrada aqui o `kind` nao e executavel: o tipo `Record<JobKind, ...>` obriga a cobrir todos. */
export const TOOLCHAINS: Record<JobKind, Toolchain> = {
  'simulate-verilog': VERILOG_TOOLCHAIN,
  'simulate-vhdl': VHDL_TOOLCHAIN,
};

/** Toolchain do job; sem `kind` (cliente anterior a RNF08) vale o padrao Verilog. */
export function toolchainFor(kind: JobKind | undefined): Toolchain {
  return TOOLCHAINS[kind ?? DEFAULT_JOB_KIND];
}
