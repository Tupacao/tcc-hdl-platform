import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import type { Diagnostic } from '@tplab/shared';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import type { editor } from 'monaco-editor';
import { useTheme } from '@/hooks/use-theme';
import { applyEditorTheme, EDITOR_THEME_NAME } from '@/lib/monaco-theme';
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

/**
 * RF02-I02 — `bracketColorizationOptions`, `tabSize` e `insertSpaces` são propriedades
 * do MODELO (`ITextModel.updateOptions`), não só do editor: `options.*` no `<Editor>`
 * não alcança de forma confiável modelos criados fora de `editor.create()`, que é o
 * caso aqui (`@monaco-editor/react` cria/cacheia um modelo por `path` para preservar
 * estado entre abas, RF02-I03). Verificado ao vivo: sem repassar o corte de
 * `bracketColorizationOptions` aqui, Monaco recolore `module`/`endmodule`, `begin`/`end`
 * etc. (pares registrados em `conf.brackets` do systemverilog.js) por profundidade de
 * aninhamento, por cima da paleta fixa por categoria de
 * `docs/design-system-fundamentos.md` seção 8 — e como esses pares costumam envolver o
 * arquivo/bloco inteiro, o efeito é quase permanente, não uma colorização ocasional.
 * Chamar a cada modelo (montagem inicial e troca de aba).
 */
function applyModelOptions(instance: editor.IStandaloneCodeEditor): void {
  instance.getModel()?.updateOptions({
    tabSize: 2,
    insertSpaces: true,
    bracketColorizationOptions: { enabled: false, independentColorPoolPerBracketType: false },
  });
}

/** Editor Verilog com destaque de sintaxe (RF02) e marcação de erros (RF05). */
export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { fileName, value, diagnostics, onChange, onShortcut, onCursorChange },
  ref,
) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  // Chaveado por arquivo: os ids de decoração são escopados ao modelo do Monaco, e cada
  // aba tem o seu (RF09-I03/RF02-I03 - path caching do @monaco-editor/react) - misturar
  // ids de modelos diferentes no mesmo `deltaDecorations` falha silenciosamente.
  const errorDecorationsRef = useRef<Map<string, string[]>>(new Map());
  // RF02-I03 (risco "modelos não são coletados automaticamente") - `@monaco-editor/react`
  // cacheia um `ITextModel` por `path` visitado (troca de aba), mas ao desmontar só
  // descarta o modelo ATIVO no momento (`keepCurrentModel` padrão); o modelo da aba
  // inativa vaza. Como `Workspace` remonta `CodeEditor` por `key={project.id}` a cada
  // troca de projeto (`App.tsx`), e o nome do arquivo vem do nome do projeto, dois
  // projetos com o mesmo nome reaproveitariam o modelo antigo com conteúdo desatualizado
  // - além do vazamento puro de memória em sessões longas. Registra todo `fileName`
  // visitado e descarta os modelos correspondentes no desmonte final (ver useEffect
  // com `[]` mais abaixo); `getModel` devolve `undefined` para o que a própria
  // biblioteca já descartou, então não há risco de "dispose" duplicado.
  const visitedFileNamesRef = useRef<Set<string>>(new Set());
  const onCursorChangeRef = useRef(onCursorChange);
  const onShortcutRef = useRef(onShortcut);
  useEffect(() => {
    onShortcutRef.current = onShortcut;
    onCursorChangeRef.current = onCursorChange;
  }, [onShortcut, onCursorChange]);

  // RF02-I02 — tema Monaco customizado, definido antes do editor nascer (evita o flash de
  // `vs` padrão) e refeito a cada troca de tema (inclui a preferência "system" do SO, que
  // `ThemeProvider` já resolve em `resolvedTheme`).
  const handleBeforeMount = useCallback(
    (monaco: Monaco) => {
      applyEditorTheme(monaco, resolvedTheme === 'dark');
    },
    [resolvedTheme],
  );

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    applyEditorTheme(monaco, resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const handleMount = useCallback<OnMount>((instance, monaco) => {
    editorRef.current = instance;
    monacoRef.current = monaco;
    applyModelOptions(instance);

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

  // Cada troca de aba troca de modelo (RF02-I03) — a opção é por modelo, então precisa
  // ser reaplicada a cada `fileName` novo, não só na montagem.
  useEffect(() => {
    const instance = editorRef.current;
    if (instance) applyModelOptions(instance);
    visitedFileNamesRef.current.add(fileName);
  }, [fileName]);

  // Descarta todos os modelos visitados por este editor ao desmontar (ver comentário de
  // `visitedFileNamesRef` acima) — não só o ativo no momento, que `@monaco-editor/react`
  // já cobre sozinho.
  useEffect(() => {
    return () => {
      const monaco = monacoRef.current;
      if (!monaco) return;
      for (const name of visitedFileNamesRef.current) {
        monaco.editor.getModel(monaco.Uri.parse(name))?.dispose();
      }
    };
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

    // RF02-I02 — fundo de linha com erro (docs/design-system-fundamentos.md seção 8);
    // só severidade "error", avisos não ganham destaque de linha inteira.
    const errorLines = new Set(
      diagnostics
        .filter((d) => d.severity === 'error' && d.line !== null && d.file === fileName)
        .map((d) => Math.min(Math.max(d.line ?? 1, 1), model.getLineCount())),
    );
    const errorDecorations: editor.IModelDeltaDecoration[] = [...errorLines].map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: { isWholeLine: true, className: 'tplab-editor-error-line' },
    }));
    errorDecorationsRef.current.set(
      fileName,
      model.deltaDecorations(errorDecorationsRef.current.get(fileName) ?? [], errorDecorations),
    );
  }, [diagnostics, fileName, value]);

  return (
    <Editor
      path={fileName}
      language="verilog"
      value={value}
      theme={EDITOR_THEME_NAME}
      beforeMount={handleBeforeMount}
      onChange={(next) => onChange(next ?? '')}
      onMount={handleMount}
      options={{
        fontSize: 14,
        lineNumbers: 'on',
        tabSize: 2,
        insertSpaces: true,
        minimap: { enabled: false },
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        renderLineHighlight: 'all',
        renderWhitespace: 'selection',
        // RF02-I02 pedia `bracketPairColorization` habilitado, mas os pares de bracket do
        // Verilog incluem palavras-chave de bloco inteiras (`module`/`endmodule`, `begin`/
        // `end`, `case`/`endcase`, ...) - com a colorização "arco-íris" ligada, Monaco
        // repinta essas palavras por profundidade de aninhamento, por cima da paleta fixa
        // por categoria do design (`docs/design-system-fundamentos.md` seção 8). Desligado
        // aqui e (o que efetivamente vale, por ser opção de modelo) em `applyModelOptions`
        // acima. O destaque do par correspondente ao cursor continua funcionando via
        // `matchBrackets` (padrão do Monaco), então isto não perde a intenção de I01
        // ("begin/end reconhecidos como par para destaque"), só a recolorização permanente.
        bracketPairColorization: { enabled: false },
        guides: { bracketPairs: false, highlightActiveBracketPair: false },
      }}
      loading={<span className="p-4 text-sm text-muted-foreground">Carregando editor...</span>}
    />
  );
});
