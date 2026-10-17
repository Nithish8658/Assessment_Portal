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

// Raised on window when the editor blocks a paste; SecurityGuard shows the warning and records it
export const ASSESSMENT_VIOLATION_EVENT = 'assessment-violation';

const normalizeClip = (text: string) => text.replace(/\r\n/g, '\n').trim();

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Text the candidate copied or cut inside this editor; only that may be pasted back
  const ownClipsRef = useRef<string[]>([]);

  // Paste control: moving your own code around works, but anything copied elsewhere (code
  // prepared before the exam, an AI answer) is refused before Monaco sees it and reported as a
  // PASTE_BLOCKED proctoring event. The pasted text itself is never sent anywhere.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const report = () => {
      window.dispatchEvent(new CustomEvent(ASSESSMENT_VIOLATION_EVENT, {
        detail: { type: 'PASTE_BLOCKED', message: 'PROCTORING CONTROL: Pasting code from outside the editor is not allowed. Type your solution.' },
      }));
    };
    const remember = () => {
      const editor = editorRef.current;
      const model = editor?.getModel();
      const selection = editor?.getSelection();
      if (!editor || !model || !selection) return;
      // With nothing selected, Monaco copies the whole line
      const text = normalizeClip(selection.isEmpty()
        ? model.getLineContent(selection.startLineNumber)
        : model.getValueInRange(selection));
      if (text) ownClipsRef.current = [text, ...ownClipsRef.current.filter((c) => c !== text)].slice(0, 20);
    };
    // Bubble phase, after Monaco handled it: the page-wide guard must not flag the candidate's own edits
    const keepInside = (e: Event) => e.stopPropagation();
    const checkPaste = (e: ClipboardEvent) => {
      const text = normalizeClip(e.clipboardData?.getData('text/plain') || '');
      if (!text || ownClipsRef.current.includes(text)) return;
      e.preventDefault();
      e.stopPropagation();
      report();
    };
    const blockDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.length) return;
      e.preventDefault();
      e.stopPropagation();
      report();
    };
    el.addEventListener('copy', remember, true);
    el.addEventListener('cut', remember, true);
    el.addEventListener('paste', checkPaste, true);
    el.addEventListener('drop', blockDrop, true);
    el.addEventListener('copy', keepInside);
    el.addEventListener('cut', keepInside);
    el.addEventListener('paste', keepInside);
    return () => {
      el.removeEventListener('copy', remember, true);
      el.removeEventListener('cut', remember, true);
      el.removeEventListener('paste', checkPaste, true);
      el.removeEventListener('drop', blockDrop, true);
      el.removeEventListener('copy', keepInside);
      el.removeEventListener('cut', keepInside);
      el.removeEventListener('paste', keepInside);
    };
  }, []);

  // Configure custom theme and shortcuts upon mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define Portal Porcelain & Neon Orange theme
    monaco.editor.defineTheme('nasc-porcelain-neon', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'FF5500', fontStyle: 'bold' },
        { token: 'type', foreground: '0284C7' },
        { token: 'identifier', foreground: '0F172A' },
        { token: 'string', foreground: '16A34A' },
        { token: 'number', foreground: 'D97706' },
        { token: 'comment', foreground: '94A3B8', fontStyle: 'italic' },
        { token: 'operator', foreground: 'FF5500' }
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#0F172A',
        'editorCursor.foreground': '#FF5500',
        'editor.lineHighlightBackground': '#F8FAFC',
        'editorLineNumber.foreground': '#94A3B8',
        'editorLineNumber.activeForeground': '#FF5500',
        'editor.selectionBackground': '#FF550026',
        'editor.inactiveSelectionBackground': '#FF550014',
        'editorIndentGuide.background': '#E2E8F0',
        'editorIndentGuide.activeBackground': '#FF550066',
        'editorGutter.background': '#F8FAFC',
        'editorWidget.background': '#FFFFFF',
        'editorWidget.border': '#E2E8F0',
        'editorSuggestWidget.background': '#FFFFFF',
        'editorSuggestWidget.border': '#E2E8F0',
        'editorSuggestWidget.foreground': '#0F172A',
        'editorSuggestWidget.selectedBackground': '#FF55001F'
      }
    });

    monaco.editor.setTheme('nasc-porcelain-neon');

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
    <div ref={containerRef} className="w-full h-full min-h-[360px] rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm relative">
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full bg-[#FFFFFF] text-[#64748B] font-mono text-xs space-x-2">
            <div className="w-4 h-4 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin"></div>
            <span>Loading Code Editor...</span>
          </div>
        }
        options={{
          theme: 'nasc-porcelain-neon',
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
