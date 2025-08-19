/* eslint-disable @typescript-eslint/no-explicit-any */
// vscode.test.ts – umfangreicher VS Code Mock für Jest-Tests

// -------------------------------
// Basis: Disposable & EventEmitter
// -------------------------------
export type Disposable = { dispose: () => void };

export class EventEmitter<T = any> {
  private listeners: Array<(e: T) => any> = [];
  public event = (listener: (e: T) => any): Disposable => {
    this.listeners.push(listener);
    return {
      dispose: () =>
        (this.listeners = this.listeners.filter((l) => l !== listener)),
    };
  };
  public fire(e: T): void {
    for (const l of this.listeners) l(e);
  }
  public dispose(): void {
    this.listeners = [];
  }
}
export const Event = <T>(cb: (listener: (e: T) => any) => Disposable) => cb;

// -------------------------------
// Uri / FS
// -------------------------------
export class Uri {
  constructor(public scheme: string, public path: string) {}
  static file(p: string) {
    return new Uri("file", require("path").resolve(p));
  }
  get fsPath() {
    return this.path;
  }
  toString() {
    return `${this.scheme}://${this.path}`;
  }
  static joinPath(base: Uri, ...parts: string[]) {
    const joined = require("path").join(base.fsPath, ...parts);
    return Uri.file(joined);
  }
}

// -------------------------------
// Position / Range
// -------------------------------
export class Position {
  constructor(public line: number, public character: number) {}
}
export class Range {
  start: Position;
  end: Position;
  constructor(
    startLine: number,
    startChar: number,
    endLine: number,
    endChar: number
  ) {
    this.start = new Position(startLine, startChar);
    this.end = new Position(endLine, endChar);
  }
}

// -------------------------------
/* Markdown & Editing */
export class MarkdownString {
  public value = "";
  constructor(_?: string, _supportThemeIcons?: boolean) {}
  set isTrusted(_v: boolean) {}
  appendMarkdown(md: string) {
    this.value += md;
  }
}
export class TextEdit {
  static replace(range: any, newText: string) {
    return { type: "replace", range, newText };
  }
}
export class WorkspaceEdit {
  edits: any[] = [];
  insert(uri: any, pos: any, text: string) {
    this.edits.push({ type: "insert", uri, pos, text });
  }
  replace(uri: any, range: any, newText: string) {
    this.edits.push({ type: "replace", uri, range, newText });
  }
}
export class SnippetString {
  constructor(public value: string) {}
}

// -------------------------------
// Diagnostics / CodeActions
// -------------------------------
export enum DiagnosticSeverity {
  Error,
  Warning,
  Information,
  Hint,
}
export class Diagnostic {
  public code: any;
  constructor(
    public range: Range,
    public message: string,
    public severity: DiagnosticSeverity
  ) {}
}
export class CodeAction {
  public edit?: WorkspaceEdit;
  public diagnostics?: any[];
  public isPreferred?: boolean;
  public command?: { title: string; command: string; arguments?: any[] };
  constructor(public title: string, public kind: any) {}
}
export const CodeActionKind = { QuickFix: "quickfix", Empty: "empty" };

// -------------------------------
// Semantic Tokens
// -------------------------------
export class SemanticTokensLegend {
  constructor(public tokenTypes: string[], public tokenModifiers: string[]) {}
}
export class SemanticTokensBuilder {
  private tokens: Array<{
    line: number;
    startChar: number;
    length: number;
    type: string;
    mods: string[];
  }> = [];
  constructor(private legend: SemanticTokensLegend) {}
  push(
    line: number,
    startChar: number,
    length: number,
    _typeIdx: number,
    _modsBitset: number
  ) {
    const type = this.legend.tokenTypes[_typeIdx] ?? "unknown";
    this.tokens.push({ line, startChar, length, type, mods: [] });
  }
  build() {
    return { data: this.tokens };
  }
}

// -------------------------------
// Theme / Env
// -------------------------------
export const ColorThemeKind = {
  Light: 1,
  Dark: 2,
  HighContrast: 3,
  HighContrastLight: 4,
};
export const env = {
  language: "en",
  clipboard: { writeText: jest.fn(async () => {}) },
};

// -------------------------------
// __registry – globaler Test-Store
// -------------------------------
export const __registry = {
  completionProvider: null as any,
  hoverProvider: null as any,
  semanticProvider: null as any,
  formatProvider: null as any,
  codeActionProvider: null as any,
  diagnosticsCollection: new Map<string, any>(),
  commands: new Map<string, (...a: any[]) => any>(),
  openedDocs: [] as any[],
  files: new Map<string, Uint8Array>(),
  listeners: {
    onDidOpenTextDocument: [] as any[],
    onDidChangeTextDocument: [] as any[],
    onDidCloseTextDocument: [] as any[],
    onDidChangeConfiguration: [] as any[],
    onDidChangeActiveTextEditor: [] as any[],
    onDidChangeActiveColorTheme: [] as any[],
  },
  panels: [] as any[],
};

// -------------------------------
// window
// -------------------------------
export const window = {
  activeTextEditor: null as any,
  activeColorTheme: { kind: ColorThemeKind.Dark },
  showInformationMessage: jest.fn(async (..._args: any[]) => undefined),
  showWarningMessage: jest.fn(async (..._args: any[]) => undefined),
  showErrorMessage: jest.fn(async (..._args: any[]) => undefined),
  showSaveDialog: jest.fn(async () => undefined),
  showTextDocument: jest.fn(async (_doc: any) => {}),
  showInputBox: jest.fn(async () => undefined),
  showQuickPick: jest.fn(async () => undefined),

  // Webview Panel Mock
  createWebviewPanel: jest.fn(
    (_viewType: string, _title: string, _col: any, _opts: any) => {
      const messageListeners: any[] = [];
      const webview = {
        html: "",
        cspSource: "vscode-resource://test",
        asWebviewUri: (u: any) => u,
        onDidReceiveMessage: (cb: any) => {
          messageListeners.push(cb);
          return { dispose() {} };
        },
        postMessage: jest.fn(async (_msg: any) => true),
      };
      const panel = {
        webview,
        reveal: jest.fn(),
        onDidDispose: jest.fn(),
        dispose: jest.fn(),
      };
      (__registry.panels as any[]).push({ panel, messageListeners });
      return panel;
    }
  ),

  // Theme event
  onDidChangeActiveColorTheme: (cb: any) => {
    __registry.listeners.onDidChangeActiveColorTheme.push(cb);
    return { dispose() {} };
  },
};

// -------------------------------
// commands
// -------------------------------
export const commands = {
  registerCommand: jest.fn((cmd: string, fn: (...args: any[]) => any) => {
    __registry.commands.set(cmd, fn);
    return { dispose: () => {} };
  }),
  executeCommand: jest.fn(async (cmd: string, ...args: any[]) => {
    const fn = __registry.commands.get(cmd);
    return fn ? fn(...args) : undefined;
  }),
};

// -------------------------------
// workspace
// -------------------------------
const defaultConfigStore: Record<string, any> = {
  "csCommands.languages": ["cs2cfg"],
  "csCommands.features.completion": true,
  "csCommands.features.hover": true,
  "csCommands.features.diagnostics": "warning",
  "csCommands.features.lint": true,
  "csCommands.features.formatting": true,
  "csCommands.features.decorations": true,
  "csCommands.features.visualizer": true,
  "csCommands.features.snippets": true,
  "csCommands.language": "auto",
  "csCommands.paths.launchCatalog": "data/cs2.launchOptions.json",
};

export const workspace = {
  workspaceFolders: [{ uri: Uri.file(process.cwd()) }],
  textDocuments: [] as any[],
  fs: {
    async readFile(uri: any) {
      const key = uri?.fsPath ?? String(uri);
      const v = __registry.files.get(key);
      return v ?? new TextEncoder().encode("");
    },
    async writeFile(uri: any, data: Uint8Array) {
      const key = uri?.fsPath ?? String(uri);
      __registry.files.set(key, data);
    },
  },
  getConfiguration: jest.fn((section?: string) => {
    const prefix = section ? `${section}.` : "";
    return {
      get: <T>(k: string, def?: T) => {
        const full = section ? `${section}.${k}` : k;
        if (full in defaultConfigStore) return defaultConfigStore[full] as T;
        if (k in defaultConfigStore) return defaultConfigStore[k] as T;
        return def as T;
      },
      update: jest.fn(async (k: string, v: any, _target?: any) => {
        const full = section ? `${section}.${k}` : k;
        defaultConfigStore[full] = v;
        // Fire config change
        for (const h of __registry.listeners.onDidChangeConfiguration) {
          h({
            affectsConfiguration: (q: string) =>
              full.startsWith(q) || q.startsWith(full),
          });
        }
      }),
    };
  }),
  onDidOpenTextDocument: jest.fn((h: any) => {
    __registry.listeners.onDidOpenTextDocument.push(h);
    return { dispose() {} };
  }),
  onDidChangeTextDocument: jest.fn((h: any) => {
    __registry.listeners.onDidChangeTextDocument.push(h);
    return { dispose() {} };
  }),
  onDidCloseTextDocument: jest.fn((h: any) => {
    __registry.listeners.onDidCloseTextDocument.push(h);
    return { dispose() {} };
  }),
  onDidChangeConfiguration: jest.fn((h: any) => {
    __registry.listeners.onDidChangeConfiguration.push(h);
    return { dispose() {} };
  }),
  openTextDocument: jest.fn(async (arg: any) => {
    const uri = typeof arg === "string" ? Uri.file(arg) : arg?.uri ?? arg;
    const doc = {
      uri,
      languageId: "cs2cfg",
      getText: () =>
        new TextDecoder().decode(
          __registry.files.get(uri.fsPath) ?? new Uint8Array()
        ),
      lineCount: 0,
      lineAt: (i: number) => ({ text: "" }),
    };
    return doc;
  }),
};

// -------------------------------
// languages
// -------------------------------
export const languages = {
  registerCodeActionsProvider: jest.fn(
    (_sel: any, provider: any, _meta?: any) => {
      __registry.codeActionProvider = provider;
      return { dispose: () => {} };
    }
  ),
  registerCompletionItemProvider: jest.fn((_sel: any, provider: any) => {
    __registry.completionProvider = provider;
    return { dispose: () => {} };
  }),
  registerHoverProvider: jest.fn((_sel: any, provider: any) => {
    __registry.hoverProvider = provider;
    return { dispose: () => {} };
  }),
  registerDocumentSemanticTokensProvider: jest.fn(
    (_sel: any, provider: any, legend: any) => {
      __registry.semanticProvider = { provider, legend };
      return { dispose: () => {} };
    }
  ),
  registerDocumentFormattingEditProvider: jest.fn(
    (_sel: any, provider: any) => {
      __registry.formatProvider = provider;
      return { dispose: () => {} };
    }
  ),
  createDiagnosticCollection: (name: string) => {
    const coll = {
      name,
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn(),
    };
    __registry.diagnosticsCollection.set(name, coll);
    return coll;
  },
};

// -------------------------------
// ExtensionContext
// -------------------------------
export class ExtensionContext {
  constructor(public extensionUri: Uri = Uri.file(process.cwd())) {}
  // ⚠️ Back-compat: viele Tests nutzen noch 'extPath'
  get extPath(): string {
    return this.extensionUri.fsPath;
  }
  subscriptions: Disposable[] = [];
  asAbsolutePath(p: string) {
    return require("path").join(this.extensionUri.fsPath, p);
  }
}

// -------------------------------
// Test-Helper (Events, Files, Theme, Editor)
// -------------------------------
export function __emitOpen(doc: any) {
  workspace.textDocuments.push(doc);
  for (const h of __registry.listeners.onDidOpenTextDocument) h(doc);
}
export function __emitChange(e: any) {
  for (const h of __registry.listeners.onDidChangeTextDocument) h(e);
}
export function __emitClose(doc: any) {
  for (const h of __registry.listeners.onDidCloseTextDocument) h(doc);
}
export function __emitConfigChange(section = "csCommands") {
  for (const h of __registry.listeners.onDidChangeConfiguration)
    h({
      affectsConfiguration: (q: string) =>
        q === section || q.startsWith(section + "."),
    });
}
export function __setActiveEditor(ed: any) {
  (window as any).activeTextEditor = ed;
  for (const h of __registry.listeners.onDidChangeActiveTextEditor) h(ed);
}
export function __onDidChangeActiveTextEditor(cb: any) {
  __registry.listeners.onDidChangeActiveTextEditor.push(cb);
  return { dispose() {} };
}
export function __setThemeKind(kind: number) {
  (window as any).activeColorTheme = { kind };
  for (const h of __registry.listeners.onDidChangeActiveColorTheme) h({ kind });
}
export function __mockFile(pathOrUri: string | Uri, content: string) {
  const key =
    typeof pathOrUri === "string"
      ? require("path").resolve(pathOrUri)
      : pathOrUri.fsPath;
  __registry.files.set(key, new TextEncoder().encode(content));
}
export function __triggerWebviewMessage(index = 0, msg: any) {
  const entry = __registry.panels[index];
  if (!entry) return;
  for (const cb of entry.messageListeners) cb(msg);
}

// -------------------------------
// Default export (Kompatibilität)
// -------------------------------
export default {
  commands,
  window,
  workspace,
  languages,
  Uri,
  Range,
  Position,
  MarkdownString,
  SemanticTokensLegend,
  SemanticTokensBuilder,
  EventEmitter,
  Event,
  ExtensionContext,
  TextEdit,
  WorkspaceEdit,
  Diagnostic,
  DiagnosticSeverity,
  CodeAction,
  CodeActionKind,
  SnippetString,
  env,
  ColorThemeKind,
  __registry,
  __emitOpen,
  __emitChange,
  __emitClose,
  __emitConfigChange,
  __setActiveEditor,
  __onDidChangeActiveTextEditor,
  __setThemeKind,
  __mockFile,
  __triggerWebviewMessage,
};
