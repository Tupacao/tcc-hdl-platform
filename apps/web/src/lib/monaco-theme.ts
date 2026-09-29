import type { Monaco } from '@monaco-editor/react';

function readVar(styles: CSSStyleDeclaration, name: string): string {
  return styles.getPropertyValue(name).trim();
}

function stripHash(value: string): string {
  return value.replace(/^#/, '');
}

export const EDITOR_THEME_NAME = 'tplab';

/**
 * RF02-I02 — os temas padrão `vs`/`vs-dark` do Monaco não foram construídos
 * sobre a paleta do produto e não têm garantia de contraste AA sobre `--card`
 * (docs/design-system-fundamentos.md seção 8). Lê as variáveis `--code-*`
 * (RF11, já usadas no realce de código da documentação) e `--editor-*`
 * (exclusivas do Monaco) do tema ATUALMENTE aplicado em `<html>` e redefine o
 * tema `tplab` com esses valores — chamar de novo a cada troca de tema
 * (`ThemeProvider` já aplica a classe `.dark` num `useLayoutEffect`, antes dos
 * efeitos passivos rodarem, então ler `getComputedStyle` aqui de dentro de um
 * `useEffect` é seguro, mesmo padrão de `readWaveformColors`).
 *
 * O tokenizer `systemverilog` do Monaco marca toda palavra-chave nomeada como
 * `keyword.<palavra>` (ex.: `keyword.module`) mas diretivas de pré-processador
 * genéricas (`` `timescale ``, `` `define ``) como `keyword` puro — com
 * `tokenPostfix: '.sv'`, isso vira `keyword.sv` (2 segmentos) vs
 * `keyword.module.sv` (3 segmentos), o que permite diferenciar as duas
 * categorias por uma regra mais específica sem tocar no tokenizer.
 */
export function applyEditorTheme(
  monaco: Monaco,
  isDark: boolean,
  root: HTMLElement = document.documentElement,
): void {
  const styles = getComputedStyle(root);
  const code = (name: string) => stripHash(readVar(styles, name));
  const editorColor = (name: string) => readVar(styles, name);

  const typeKeywords = [
    'wire',
    'reg',
    'input',
    'output',
    'inout',
    'logic',
    'integer',
    'real',
    'realtime',
    'time',
    'bit',
    'byte',
    'shortint',
    'longint',
    'int',
    'string',
    'signed',
    'unsigned',
    'genvar',
    'parameter',
    'localparam',
    'tri',
    'tri0',
    'tri1',
    'supply0',
    'supply1',
    'wor',
    'wand',
  ];

  monaco.editor.defineTheme(EDITOR_THEME_NAME, {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      // Diretivas: `timescale/`define genéricas (token "keyword" puro) e `include (token
      // dedicado) e tarefas de sistema ($display etc.) — precisam vir antes do fallback
      // genérico de palavra-chave abaixo.
      { token: 'keyword.sv', foreground: code('--code-directive') },
      { token: 'keyword.directive', foreground: code('--code-directive') },
      { token: 'variable.predefined', foreground: code('--code-directive') },
      // Tipos (wire, reg, input, output, ...) e nome do módulo instanciado.
      ...typeKeywords.map((word) => ({
        token: `keyword.${word}`,
        foreground: code('--code-type'),
      })),
      { token: 'type', foreground: code('--code-type') },
      // Fallback: qualquer outra palavra-chave nomeada (module, assign, always, begin, ...).
      { token: 'keyword', foreground: code('--code-keyword') },
      { token: 'number', foreground: code('--code-number') },
      { token: 'string', foreground: code('--code-string') },
      { token: 'comment', foreground: code('--code-comment') },
      { token: 'delimiter', foreground: code('--code-operator') },
    ],
    colors: {
      'editor.background': editorColor('--editor-background'),
      'editor.foreground': editorColor('--code-foreground'),
      'editorLineNumber.foreground': editorColor('--editor-line-number'),
      'editorLineNumber.activeForeground': editorColor('--code-foreground'),
      'editor.lineHighlightBackground': editorColor('--editor-current-line'),
      'editor.selectionBackground': editorColor('--editor-selection'),
    },
  });

  monaco.editor.setTheme(EDITOR_THEME_NAME);
}
