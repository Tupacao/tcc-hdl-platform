import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { Diagnostic } from '@tplab/shared';
import { useCallback, useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor';
import { useTheme } from '@/hooks/use-theme';

interface CodeEditorProps {
  fileName: string;
  value: string;
  diagnostics: Diagnostic[];
  onChange: (value: string) => void;
}

const MARKER_OWNER = 'iverilog';

/** Editor Verilog com destaque de sintaxe (RF02) e marcação de erros (RF05). */
export function CodeEditor({ fileName, value, diagnostics, onChange }: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleMount = useCallback<OnMount>((instance, monaco) => {
    editorRef.current = instance;
    monacoRef.current = monaco;
  }, []);

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
}
