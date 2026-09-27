import type { Diagnostic, HdlFile } from '@tplab/shared';

/**
 * Analisador heuristico do contrato que a plataforma espera do testbench
 * (RF04-I01): regex sobre o texto, nunca um parser completo de Verilog.
 * Comentarios e strings podem enganar o regex — por isso toda saida daqui e
 * `severity: 'warning'`, nunca `error`: a submissao sempre segue para a fila,
 * mesmo quando a heuristica erra.
 */

const ORIGIN = 'tplab';

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * `<moduleName> [#(...)] <instanceName> (` — aceita parametrizacao
 * (`#(.WIDTH(8))`) e quebra de linha entre o nome do modulo e o da instancia.
 */
function instantiatesModule(source: string, moduleName: string): boolean {
  const pattern = new RegExp(
    `\\b${escapeRegExp(moduleName)}\\b\\s*(#\\s*\\([^;]*?\\)\\s*)?[A-Za-z_$][\\w$]*\\s*\\(`,
  );
  return pattern.test(stripComments(source));
}

function declaresModule(source: string, moduleName: string): boolean {
  return new RegExp(`\\bmodule\\s+${escapeRegExp(moduleName)}\\b`).test(stripComments(source));
}

function mentionsDumpDirectives(source: string): boolean {
  const stripped = stripComments(source);
  return /\$dumpfile\s*\(/.test(stripped) && /\$dumpvars\s*\(/.test(stripped);
}

function warning(file: string, message: string): Diagnostic {
  return {
    severity: 'warning',
    file,
    line: null,
    column: null,
    message,
    raw: `[${ORIGIN}] ${message}`,
    title: null,
    hint: null,
  };
}

export interface TestbenchContractResult {
  diagnostics: Diagnostic[];
  /** Usado por `analyzePostExecution` para nao repetir o mesmo aviso depois da execucao. */
  missingDumpDirectives: boolean;
}

/**
 * Checagens estaticas, antes de gastar um container: o design declara o
 * `topModule`? O testbench instancia esse mesmo modulo? O testbench pede a
 * gravacao da forma de onda? Nenhuma delas impede a submissao.
 */
export function analyzeTestbenchContract(
  design: HdlFile,
  testbench: HdlFile,
  topModule: string,
): TestbenchContractResult {
  const diagnostics: Diagnostic[] = [];

  if (!declaresModule(design.content, topModule)) {
    diagnostics.push(
      warning(
        design.name,
        `O arquivo de design nao declara "module ${topModule}". Confira se o nome do modulo de topo bate com o que foi declarado.`,
      ),
    );
  }

  if (!instantiatesModule(testbench.content, topModule)) {
    diagnostics.push(
      warning(
        testbench.name,
        `O testbench nao parece instanciar "${topModule}". A simulacao roda, mas pode nao testar o circuito esperado.`,
      ),
    );
  }

  const missingDumpDirectives = !mentionsDumpDirectives(testbench.content);
  if (missingDumpDirectives) {
    diagnostics.push(
      warning(
        testbench.name,
        `O testbench nao chama $dumpfile/$dumpvars, entao nenhuma forma de onda sera gerada. Exemplo: $dumpfile("saida.vcd"); $dumpvars(0, ${topModule});`,
      ),
    );
  }

  return { diagnostics, missingDumpDirectives };
}

export interface PostExecutionInput {
  testbenchName: string;
  topModule: string;
  failure: string | null;
  stdout: string;
  vcd: string | null;
  /** `missingDumpDirectives` de `analyzeTestbenchContract` — evita duplicar o mesmo diagnostico. */
  alreadyWarnedMissingDump: boolean;
}

/**
 * Depois da execucao: uma simulacao que terminou sem erro mas nao produziu
 * `.vcd` tem duas causas comuns, e a interface deve dizer qual delas —
 * mostrar "nenhuma forma de onda" sem explicacao e o que mais frustra quem
 * esta escrevendo o primeiro testbench.
 */
export function analyzePostExecution(input: PostExecutionInput): Diagnostic[] {
  if (input.failure !== null) return [];
  if (input.vcd !== null) return [];

  if (input.stdout.trim().length === 0) {
    return [
      warning(
        input.testbenchName,
        'A simulacao terminou sem nenhuma saida (nem texto, nem forma de onda). O testbench provavelmente nao instancia o modulo de topo.',
      ),
    ];
  }

  if (input.alreadyWarnedMissingDump) return [];

  return [
    warning(
      input.testbenchName,
      `A simulacao rodou mas nao gerou forma de onda. Confira se $dumpfile/$dumpvars estao dentro de um bloco "initial" que de fato executa, com o escopo certo: $dumpvars(0, ${input.topModule}).`,
    ),
  ];
}
