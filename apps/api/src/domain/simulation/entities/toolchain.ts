import type { Diagnostic, JobKind } from '@tplab/shared';

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
 * acrescentar uma entrada no registro de `application/simulation/service/toolchains.ts` e um
 * valor em `JobKindSchema` — o pipeline (fila, rate limit, retencao, metricas) e o mesmo para
 * todos. O script da imagem segue a convencao de codigos de saida de `infra/sandbox/README.md`.
 *
 * O contrato vive em `domain/` para que `infra/sandbox` dependa so da interface, nunca do
 * registro concreto (que conhece `env` e os parsers de diagnostico).
 */
export interface Toolchain {
  kind: JobKind;
  /** Imagem Docker; resolvida na chamada para refletir o ambiente atual. */
  image: () => string;
  /** Converte o stderr da ferramenta em diagnosticos com arquivo/linha/coluna (RF05). */
  parseDiagnostics: (stderr: string, knownFileNames: readonly string[]) => Diagnostic[];
  artifacts: readonly ArtifactSpec[];
  /**
   * As analises de codigo-fonte do worker (contrato do testbench, vetores, dicas de erro)
   * conhecem a sintaxe Verilog; com `none` nao rodam — achado de RNF08-I02, ver
   * `docs/EXTENSIBILIDADE.md`.
   */
  sourceAnalysis: 'verilog' | 'none';
}
