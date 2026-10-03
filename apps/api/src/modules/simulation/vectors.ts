import type { Diagnostic, HdlFile } from '@tplab/shared';

/**
 * Vetores da toolchain Verilog (RNF04-I03): recursos legitimos da linguagem que,
 * num ambiente que executa codigo de terceiros, tocam o sistema de arquivos ou o
 * sistema operacional. As barreiras do container ja contem o impacto (ver
 * `docs/SEGURANCA.md`), entao **avisar e melhor que bloquear** — `$readmemh` e a
 * forma normal de carregar memoria em exercicios de sistemas digitais. Igual ao
 * analisador de RF04-I01: regex sobre o texto, sempre `warning`, nunca impede a
 * submissao.
 */

/** Substitui comentarios por espacos, preservando as quebras de linha (os avisos citam a linha). */
function blankComments(source: string): string {
  const blank = (match: string) => match.replace(/[^\n]/g, ' ');
  return source.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/\/\/.*$/gm, blank);
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

/** Caminho que sai do diretorio do projeto: absoluto (`/`, `C:\`) ou com `..`. */
function escapesWorkdir(path: string): boolean {
  return /^([/\\]|[A-Za-z]:[/\\])/.test(path) || /(^|[/\\])\.\.([/\\]|$)/.test(path);
}

interface Vector {
  /** Trecho que abre a chamada, ja com o primeiro argumento string capturado no grupo 1. */
  pattern: RegExp;
  message: (path: string) => string;
}

const PATH_VECTORS: Vector[] = [
  {
    pattern: /`include\s+"([^"\n]*)"/g,
    message: (path) =>
      `O \`include "${path}" usa um caminho fora do projeto. No ambiente de execução só existem os arquivos do projeto: use apenas o nome do arquivo, por exemplo \`include "meu_arquivo.v".`,
  },
  {
    pattern: /\$readmem[hb]\s*\(\s*"([^"\n]*)"/g,
    message: (path) =>
      `O $readmemh/$readmemb lê "${path}", que fica fora do projeto e não existe no ambiente de execução. Use um arquivo do próprio projeto, com caminho relativo.`,
  },
  {
    pattern: /\$fopen\s*\(\s*"([^"\n]*)"/g,
    message: (path) =>
      `O $fopen usa "${path}", fora do diretório do projeto. Só é possível gravar em caminho relativo (por exemplo $fopen("saida.txt", "w")); o restante do sistema de arquivos é somente leitura.`,
  },
  {
    pattern: /\$dumpfile\s*\(\s*"([^"\n]*)"/g,
    message: (path) =>
      `O $dumpfile("${path}") aponta para fora do projeto e não vai gerar forma de onda. Use um nome relativo: $dumpfile("saida.vcd").`,
  },
];

function warning(file: string, line: number, message: string): Diagnostic {
  return {
    severity: 'warning',
    file,
    line,
    column: null,
    message,
    raw: message,
    title: null,
    hint: null,
  };
}

/**
 * Avisos sobre construcoes que dependem do sistema de arquivos ou do sistema
 * operacional do host, nos dois arquivos do projeto.
 */
export function analyzeToolchainVectors(files: HdlFile[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const file of files) {
    const source = blankComments(file.content);

    for (const vector of PATH_VECTORS) {
      for (const match of source.matchAll(vector.pattern)) {
        const path = match[1] ?? '';
        if (!escapesWorkdir(path)) continue;
        diagnostics.push(warning(file.name, lineOf(source, match.index), vector.message(path)));
      }
    }

    for (const match of source.matchAll(/\$system\s*\(/g)) {
      diagnostics.push(
        warning(
          file.name,
          lineOf(source, match.index),
          'O $system não existe nesta plataforma: a simulação é executada em um ambiente isolado que não roda comandos do sistema. A execução vai falhar nesta linha.',
        ),
      );
    }
  }

  return diagnostics;
}
