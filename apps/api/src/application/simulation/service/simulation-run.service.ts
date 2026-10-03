import { env } from '../../../config/env.js';
import type {
  SimulationJobResult,
  SimulationRunInput,
} from '../../../domain/simulation/dtos/simulation-job.dto.js';
import type { SandboxOutcome } from '../../../domain/simulation/entities/sandbox.js';
import type { SimulationRunService } from '../../../domain/simulation/services/simulation-run.service.js';
import { defaultSandboxLimits, runInSandbox } from '../../../infra/sandbox/sandbox.js';
import { logger } from '../../../lib/logger.js';
import { attachHints } from './hints.js';
import { buildJobLogRecord } from './job-log.js';
import { analyzeLimitFailure, dropShellNoise } from './limits.js';
import { analyzePostExecution, analyzeTestbenchContract } from './testbench.js';
import { toolchainFor } from './toolchains.js';
import { analyzeToolchainVectors } from './vectors.js';

/** Gravacao das metricas do job (RF03-I04); injetada para manter o Redis fora desta camada. */
export type OutcomeRecorder = (outcome: SandboxOutcome) => Promise<void>;

/**
 * Pipeline de um job de simulacao, do lado do worker: escolhe a toolchain, roda
 * no sandbox e converte a saida bruta em diagnosticos (RF05), avisos de contrato
 * do testbench (RF04-I01), avisos de vetores da toolchain (RNF04-I03) e
 * mensagens de limite (RNF05).
 *
 * Ficava inteiro dentro de `src/worker.ts`; aqui e testavel sem subir a fila, e
 * o worker volta a ser so o processo que consome o BullMQ.
 */
export class DefaultSimulationRunService implements SimulationRunService {
  constructor(private readonly recordOutcome: OutcomeRecorder = async () => undefined) {}

  async run(input: SimulationRunInput): Promise<SimulationJobResult> {
    const { data, jobId } = input;
    const toolchain = toolchainFor(data.kind);
    const outcome = await runInSandbox(data, defaultSandboxLimits(toolchain), toolchain);

    // RF04-I01: contrato do testbench (topModule coerente, $dumpfile/$dumpvars
    // presentes) — heuristica, nunca bloqueia; vira `warning` no mesmo console
    // dos diagnosticos do iverilog, sem componente novo no frontend.
    // Essas analises conhecem a sintaxe Verilog (RNF08-I02): outras toolchains nao as recebem.
    const verilogAnalysis = toolchain.sourceAnalysis === 'verilog';
    const contract = verilogAnalysis
      ? analyzeTestbenchContract(data.design, data.testbench, data.topModule)
      : { diagnostics: [], missingDumpDirectives: false };
    const postExecutionWarnings = !verilogAnalysis
      ? []
      : analyzePostExecution({
          testbenchName: data.testbench.name,
          topModule: data.topModule,
          failure: outcome.failure,
          stdout: outcome.stdout,
          vcd: outcome.vcd,
          alreadyWarnedMissingDump: contract.missingDumpDirectives,
        });

    // RNF05: limite atingido vira erro com causa provavel e proximo passo.
    const limitDiagnostics = analyzeLimitFailure({
      failure: outcome.failure,
      timeoutPhase: outcome.timeoutPhase,
      exitCode: outcome.exitCode,
      logsUnavailable: outcome.logsUnavailable,
      testbenchName: data.testbench.name,
      timeoutMs: env.SANDBOX_TIMEOUT_MS,
      compileTimeoutMs: env.SANDBOX_COMPILE_TIMEOUT_MS,
      memoryMb: env.SANDBOX_MEMORY_MB,
    });
    if (outcome.timeoutPhase === 'host') {
      // O timeout interno do script deveria ter agido antes: se o `killTimer` do host
      // foi quem matou, o limite de dentro do container parou de funcionar.
      logger.warn({ jobId }, 'killTimer do host encerrou o job — timeout interno falhou');
    }

    const toolDiagnostics = toolchain.parseDiagnostics(outcome.stderr, [
      data.design.name,
      data.testbench.name,
    ]);
    const diagnostics = [
      ...contract.diagnostics,
      // RNF04-I03: construcoes que tocam o sistema de arquivos/SO — aviso, nunca bloqueio.
      ...(verilogAnalysis ? analyzeToolchainVectors([data.design, data.testbench]) : []),
      ...limitDiagnostics,
      ...dropShellNoise(
        verilogAnalysis ? attachHints(toolDiagnostics) : toolDiagnostics,
        limitDiagnostics,
      ),
      ...postExecutionWarnings,
    ];

    logger.info(
      buildJobLogRecord({
        jobId,
        sources: data,
        outcome,
        queuedAt: input.queuedAt,
        processedAt: input.processedAt,
      }),
      'job de simulacao concluido',
    );
    await this.recordOutcome(outcome).catch((cause: unknown) => {
      logger.warn({ err: cause }, 'falha ao gravar metricas do worker no Redis');
    });

    return {
      failure: outcome.failure,
      diagnostics,
      stdout: outcome.stdout,
      stderr: outcome.stderr,
      artifacts: outcome.artifacts,
      vcd: outcome.vcd,
      durationMs: outcome.durationMs,
      finishedAt: new Date().toISOString(),
      // O job terminou de processar — por definicao nao esta mais na fila (RF03-I02).
      queuePosition: null,
      truncated: outcome.truncated,
      timings: {
        queueWaitMs: input.processedAt !== undefined ? input.processedAt - input.queuedAt : null,
        containerCreateMs: outcome.timings.containerCreateMs,
        compileMs: outcome.timings.compileMs,
        simulateMs: outcome.timings.simulateMs,
        executionMs: outcome.timings.executionMs,
        artifactsReadMs: outcome.timings.artifactsReadMs,
      },
    };
  }
}
