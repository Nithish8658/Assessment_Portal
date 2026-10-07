import React, { useRef, useEffect } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import type * as monacoType from 'monaco-editor';

export interface CompilerDiagnostic {
  line: number;
  column?: number;
  message: string;
}

export interface AssessmentCodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  isReadOnly?: boolean;
  compilerErrors?: CompilerDiagnostic[] | string | null;
  height?: string | number;
  placeholder?: string;
}

/**
 * Normalizes input language string to Monaco-compatible language identifiers.
 */
function normalizeMonacoLanguage(lang: string): string {
  const l = lang?.toLowerCase().trim() || 'python';
  switch (l) {
    case 'c':
      return 'c';
    case 'cpp':
    case 'c++':
      return 'cpp';
    case 'python':
    case 'python3':
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'javascript':
    case 'node':
    case 'js':
      return 'javascript';
    case 'typescript':
    case 'ts':
      return 'typescript';
    case 'sql':
      return 'sql';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    default:
      return 'plaintext';
  }
}

/**
 * Parses raw compiler stderr strings (e.g. GCC/Clang/Java/Python) into structured diagnostics.
 */
function parseCompilerErrors(rawOutput: string): CompilerDiagnostic[] {
  if (!rawOutput) return [];
  const diagnostics: CompilerDiagnostic[] = [];

  // 1. GCC / Clang / Java format: "solution.c:14:5: error: expected ';'" or "Main.java:5: error: cannot find symbol"
  const generalCompilerRegex = /(?:[a-zA-Z0-9_\-\.]+\.(?:c|cpp|h|hpp|java|py|js|ts)):(\d+):(?:(\d+):)?\s*(?:fatal )?(?:error|warning)?:\s*(.*)/gi;
  let match;
  while ((match = generalCompilerRegex.exec(rawOutput)) !== null) {
    const line = parseInt(match[1], 10);
    const column = match[2] ? parseInt(match[2], 10) : 1;
    const message = match[3]?.trim() || 'Compilation error';
    if (!isNaN(line)) {
      diagnostics.push({ line, column, message });
    }
  }

  // 2. Python Traceback format: "File "solution.py", line 12, in <module>"
  if (diagnostics.length === 0) {
    const pyRegex = /File\s+["'].*?["'],\s+line\s+(\d+)(?:,\s+in\s+.*)?\n\s*(?:.*?\n)?\s*([A-Za-z]+Error:.*)/gi;
    while ((match = pyRegex.exec(rawOutput)) !== null) {
      const line = parseInt(match[1], 10);
      const message = match[2]?.trim() || 'Runtime/Syntax error';
      if (!isNaN(line)) {
        diagnostics.push({ line, column: 1, message });
      }
    }
  }

  // 3. Fallback generic Line Number detector: "line 15"
  if (diagnostics.length === 0) {
    const lineRegex = /(?:line\s+(\d+)|:(\d+):)/gi;
    while ((match = lineRegex.exec(rawOutput)) !== null) {
      const line = parseInt(match[1] || match[2], 10);
      if (!isNaN(line) && line > 0 && line < 1000) {
        diagnostics.push({ line, column: 1, message: rawOutput.slice(0, 120) });
        break;
      }
    }
  }

  return diagnostics;
}


export const AssessmentCodeEditor: React.FC<AssessmentCodeEditorProps> = ({
  language,
  value,
  onChange,
  onRun,
  isReadOnly = false,
  compilerErrors = null,
  height = '100%'
}) => {
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // Configure custom theme and shortcuts upon mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define Portal Dark Gold theme
    monaco.editor.defineTheme('nasc-dark-gold', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'E3C766', fontStyle: 'bold' },
        { token: 'type', foreground: '60A5FA' },
        { token: 'identifier', foreground: 'F8F5ED' },
        { token: 'string', foreground: '4ADE80' },
        { token: 'number', foreground: 'FBBF24' },
        { token: 'comment', foreground: '7A7568', fontStyle: 'italic' },
        { token: 'operator', foreground: 'C9A227' }
      ],
      colors: {
        'editor.background': '#11110F',
        'editor.foreground': '#F8F5ED',
        'editorCursor.foreground': '#C9A227',
        'editor.lineHighlightBackground': '#1C1B18',
        'editorLineNumber.foreground': '#4A463D',
        'editorLineNumber.activeForeground': '#C9A227',
        'editor.selectionBackground': '#C9A22733',
        'editor.inactiveSelectionBackground': '#C9A2271A',
        'editorIndentGuide.background': '#2A2824',
        'editorIndentGuide.activeBackground': '#C9A22766',
        'editorGutter.background': '#11110F',
        'editorWidget.background': '#1C1B18',
        'editorWidget.border': '#2A2824',
        'editorSuggestWidget.background': '#1C1B18',
        'editorSuggestWidget.border': '#2A2824',
        'editorSuggestWidget.foreground': '#F8F5ED',
        'editorSuggestWidget.selectedBackground': '#C9A22722'
      }
    });

    monaco.editor.setTheme('nasc-dark-gold');

    // Register Ctrl+Enter / Cmd+Enter run shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun) {
        onRun();
      }
    });
  };

  // Sync compiler diagnostic markers (error squiggles) when compiler errors change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    let parsedList: CompilerDiagnostic[] = [];
    if (typeof compilerErrors === 'string') {
      parsedList = parseCompilerErrors(compilerErrors);
    } else if (Array.isArray(compilerErrors)) {
      parsedList = compilerErrors;
    }

    if (parsedList.length === 0) {
      monaco.editor.setModelMarkers(model, 'compiler', []);
      return;
    }

    const markers: monacoType.editor.IMarkerData[] = parsedList.map((err) => {
      const line = Math.max(1, Math.min(err.line, model.getLineCount()));
      const col = Math.max(1, err.column || 1);
      return {
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: line,
        startColumn: col,
        endLineNumber: line,
        endColumn: model.getLineMaxColumn(line),
        message: err.message
      };
    });

    monaco.editor.setModelMarkers(model, 'compiler', markers);
  }, [compilerErrors]);

  const monacoLanguage = normalizeMonacoLanguage(language);

  return (
    <div className="w-full h-full min-h-[360px] rounded-xl overflow-hidden border border-[#2A2824] bg-[#11110F] relative">
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full bg-[#11110F] text-[#9E988A] font-mono text-xs space-x-2">
            <div className="w-4 h-4 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin"></div>
            <span>Loading Code Editor...</span>
          </div>
        }
        options={{
          theme: 'nasc-dark-gold',
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          tabSize: 4,
          insertSpaces: true,
          minimap: { enabled: false }, // Disabled for maximum coding real estate
          contextmenu: false, // Security constraint: Disables right-click context menu
          quickSuggestions: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderLineHighlight: 'line',
          lineNumbers: 'on',
          folding: true,
          bracketPairColorization: { enabled: true },
          formatOnPaste: false,
          dragAndDrop: false, // Security constraint: Prevents dragging text from external windows
          readOnly: isReadOnly,
          domReadOnly: isReadOnly,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8
          },
          padding: {
            top: 12,
            bottom: 12
          }
        }}
      />
    </div>
  );
};
