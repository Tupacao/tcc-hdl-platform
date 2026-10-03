import type { Diagnostic, SimulationFailure } from '@tplab/shared';
import type { TimeoutPhase } from './sandbox.js';

export interface LimitFailureInput {
  failure: SimulationFailure | null;
  timeoutPhase: TimeoutPhase | null;
  /** Arquivo a que o diagnostico se associa na lista de Problemas (o testbench). */
  testbenchName: string;
  timeoutMs: number;
  compileTimeoutMs: number;
  memoryMb: number;
}

function limitError(file: string, title: string, message: string, hint: string): Diagnostic {
  return { severity: 'error', file, line: null, column: null, message, raw: message, title, hint };
}

function seconds(ms: number): string {
  return String(Math.ceil(ms / 1000));
}

/**
 * Limite atingido precisa virar mensagem que ensina (RNF05): "tempo limite
 * excedido" sozinho nao diz que provavelmente falta um `$finish` ou que ha um
 * `always` sem `#`. Sai como `error` no mesmo console dos diagnosticos do
 * compilador, com a manchete em `title` e a orientacao em `hint` — o contrato
 * `DiagnosticSchema` que RF05 ja renderiza, sem componente novo.
 */
export function analyzeLimitFailure(input: LimitFailureInput): Diagnostic[] {
  const file = input.testbenchName;

  if (input.failure === 'memory_limit') {
    return [
      limitError(
        file,
        'Limite de memória excedido',
        `A execução usou mais de ${input.memoryMb} MB e foi interrompida.`,
        'Costuma ser uma memória ou vetor grande demais (por exemplo reg [31:0] mem [0:100000000]) ou um laço que acumula dados sem parar. Reduza o tamanho declarado ou o número de ciclos simulados.',
      ),
    ];
  }

  if (input.failure === 'timeout') {
    if (input.timeoutPhase === 'compile') {
      return [
        limitError(
          file,
          'Tempo limite da compilação excedido',
          `A compilação passou de ${seconds(input.compileTimeoutMs)} s e foi interrompida.`,
          'Costuma ser uma macro que se referencia (`define A `B e `define B `A) ou um `include circular. Revise as diretivas `define e `include.',
        ),
      ];
    }
    return [
      limitError(
        file,
        'Tempo limite da simulação excedido',
        `A simulação passou de ${seconds(input.timeoutMs)} s e foi interrompida.`,
        'Provavelmente falta um $finish no testbench, ou há um always/initial que repete sem controle de tempo. Chame $finish depois do último estímulo e use um atraso (#) dentro de todo laço que não termina sozinho.',
      ),
    ];
  }

  if (input.failure === 'internal_error') {
    return [
      limitError(
        file,
        'Erro interno da plataforma',
        'A execução foi interrompida por um motivo que não vem do seu código.',
        'Execute de novo. Se acontecer outra vez, o problema é da plataforma e não do circuito.',
      ),
    ];
  }

  return [];
}

/**
 * O shell do container imprime "Killed" em stderr quando o `timeout -s KILL` mata o
 * processo — o parser de diagnosticos o le como um erro qualquer, duplicando a
 * mensagem de limite (que ja explica o que aconteceu). Descartado so quando ha
 * um diagnostico de limite para substitui-lo.
 */
export function dropKilledNoise(
  diagnostics: Diagnostic[],
  limitDiagnostics: Diagnostic[],
): Diagnostic[] {
  if (limitDiagnostics.length === 0) return diagnostics;
  return diagnostics.filter((diagnostic) => diagnostic.raw.trim() !== 'Killed');
}
