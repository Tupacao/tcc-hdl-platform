import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { Diagnostic } from '@tplab/shared';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import type { editor } from 'monaco-editor';
import { useTheme } from '@/hooks/use-theme';
import type { ShortcutId } from '../utils/shortcuts';

interface CodeEditorProps {
  fileName: string;
  value: string;
  diagnostics: Diagnostic[];
  onChange: (value: string) => void;
  /** RF09-I02 - atalhos que precisam valer com o foco dentro do Monaco (ele captura as teclas). */
  onShortcut: (id: ShortcutId) => void;
  /** RF09-I03 - posição do cursor para a barra de estado. */
  onCursorChange?: (position: { line: number; column: number }) => void;
}

/** RF05-I02 - navegação imperativa até um diagnóstico, exposta ao `Workspace`. */
export interface CodeEditorHandle {
  /**
   * Rola até a linha, posiciona o cursor e foca o editor. Não faz nada se
   * `file` não for o arquivo atualmente exibido - quem chama é responsável
   * por trocar de aba antes (`Workspace`), porque só o modelo visível pode
   * ser revelado de forma útil.
   */
  revealPosition: (file: string, line: number, column: number | null) => void;
}

const MARKER_OWNER = 'iverilog';

/** Editor Verilog com destaque de sintaxe (RF02) e marcação de erros (RF05). */
export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { fileName, value, diagnostics, onChange, onShortcut, onCursorChange },
  ref,
) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const onCursorChangeRef = useRef(onCursorChange);
  const onShortcutRef = useRef(onShortcut);
  useEffect(() => {
    onShortcutRef.current = onShortcut;
    onCursorChangeRef.current = onCursorChange;
  }, [onShortcut, onCursorChange]);

  const handleMount = useCallback<OnMount>((instance, monaco) => {
    editorRef.current = instance;
    monacoRef.current = monaco;

    const report = () => {
      const position = instance.getPosition();
      if (position) {
        onCursorChangeRef.current?.({ line: position.lineNumber, column: position.column });
      }
    };
    report();
    instance.onDidChangeCursorPosition(report);

    // Sobrescrevem os atalhos nativos do Monaco (Ctrl+Enter insere linha; F8 só percorre
    // marcadores do arquivo aberto). Escape só sai do editor quando nenhum widget está aberto.
    const { KeyCode, KeyMod } = monaco;
    instance.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, () => onShortcutRef.current('run'));
    instance.addCommand(KeyCode.F8, () => onShortcutRef.current('next-diagnostic'));
    instance.addCommand(KeyMod.Shift | KeyCode.F8, () =>
      onShortcutRef.current('previous-diagnostic'),
    );
    instance.addCommand(
      KeyCode.Escape,
      () => onShortcutRef.current('leave-editor'),
      '!suggestWidgetVisible && !findWidgetVisible && !parameterHintsVisible && !renameInputVisible && !inSnippetMode && !editorHasMultipleSelections',
    );
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      revealPosition: (file, line, column) => {
        const instance = editorRef.current;
        const model = instance?.getModel();
        if (!instance || !model || file !== fileName) return;

        const clampedLine = Math.min(Math.max(line, 1), model.getLineCount());
        const clampedColumn = column ?? 1;
        instance.revealLineInCenterIfOutsideViewport(clampedLine);
        instance.setPosition({ lineNumber: clampedLine, column: clampedColumn });
        instance.focus();
      },
    }),
    [fileName],
  );

  // Reaplica os marcadores sempre que a API devolver novos diagnósticos.
  useEffect(() => {
    const instance = editorRef.current;
    const monaco = monacoRef.current;
    const model = instance?.getModel();
    if (!monaco || !model) return;

    const markers: editor.IMarkerData[] = diagnostics
      .filter((diagnostic) => diagnostic.line !== null && diagnostic.file === fileName)
      .map((diagnostic) => {
        const line = Math.min(Math.max(diagnostic.line ?? 1, 1), model.getLineCount());
        return {
          severity:
            diagnostic.severity === 'error'
              ? monaco.MarkerSeverity.Error
              : monaco.MarkerSeverity.Warning,
          message: diagnostic.message,
          startLineNumber: line,
          endLineNumber: line,
          startColumn: diagnostic.column ?? 1,
          endColumn: model.getLineMaxColumn(line),
        };
      });

    monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
  }, [diagnostics, fileName, value]);

  return (
    <Editor
      path={fileName}
      language="verilog"
      value={value}
      theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs'}
      onChange={(next) => onChange(next ?? '')}
      onMount={handleMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 4,
        automaticLayout: true,
        renderLineHighlight: 'gutter',
      }}
      loading={<span className="p-4 text-sm text-muted-foreground">Carregando editor...</span>}
    />
  );
});
