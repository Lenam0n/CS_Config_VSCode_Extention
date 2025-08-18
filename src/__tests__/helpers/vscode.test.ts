/* eslint-disable @typescript-eslint/no-explicit-any */
export type Disposable = { dispose: () => void };

export class EventEmitter<T = any> {
  private listeners: Array<(e: T) => any> = [];
  public event = (listener: (e: T) => any): Disposable => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        this.listeners = this.listeners.filter((l) => l !== listener);
      },
    };
  };
  public fire(e: T): void {
    for (const l of this.listeners) l(e);
  }
  public dispose(): void {
    this.listeners = [];
  }
}

export class Uri {
  constructor(public fsPath: string) {}
  toString() {
    return `file://${this.fsPath}`;
  }
  static file(p: string) {
    return new Uri(p);
  }
  static joinPath(base: Uri, ...parts: string[]) {
    const path = require("path");
    return new Uri(require("path").join(base.fsPath, ...parts));
  }
}

export class Range {
  constructor(
    public startLine: number,
    public startChar: number,
    public endLine: number,
    public endChar: number
  ) {}
}
export class Position {
  constructor(public line: number, public character: number) {}
}
export class MarkdownString {
  public value = "";
  constructor(_?: string, _supportThemeIcons?: boolean) {}
  set isTrusted(_v: boolean) {}
  appendMarkdown(md: string) {
    this.value += md;
  }
}

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
    // Für Tests speichern wir "semantisch" ab; Mapping übernehmen die Tests selbst.
    const type = this.legend.tokenTypes[_typeIdx] ?? "unknown";
    this.tokens.push({ line, startChar, length, type, mods: [] });
  }
  build() {
    return { data: this.tokens };
  }
}

// Test-Erfassung für Registrierungen
export const __registry = {
  completionProvider: null as any,
  hoverProvider: null as any,
  semanticProvider: null as any,
  diagnosticsCollection: new Map<string, any>(),
  commands: new Map<string, (...a: any[]) => any>(),
  openedDocs: [] as any[],
  listeners: {
    onDidOpenTextDocument: [] as any[],
    onDidChangeTextDocument: [] as any[],
    onDidCloseTextDocument: [] as any[],
    onDidChangeConfiguration: [] as any[],
    onDidChangeActiveTextEditor: [] as any[],
  },
};

export const languages = {
  registerCompletionItemProvider: jest.fn((selectors: any, provider: any) => {
    __registry.completionProvider = provider;
    return { dispose: () => {} };
  }),
  registerHoverProvider: jest.fn((selectors: any, provider: any) => {
    __registry.hoverProvider = provider;
    return { dispose: () => {} };
  }),
  registerDocumentSemanticTokensProvider: jest.fn(
    (selectors: any, provider: any, legend: any) => {
      __registry.semanticProvider = { provider, legend };
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

export const window = {
  activeTextEditor: null as any,
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showSaveDialog: jest.fn(async () => undefined),
  showTextDocument: jest.fn(async (_doc: any) => {}),
};

export const workspace = {
  workspaceFolders: [{ uri: Uri.file(process.cwd()) }],
  textDocuments: [] as any[],
  fs: {
    writeFile: jest.fn(async (_uri: any, _data: Uint8Array) => {}),
  },
  getConfiguration: jest.fn((_section?: string) => {
    const cfg = new Map<string, any>([
      ["dataPath", ""],
      ["enableDiagnostics", "warning"],
      ["languages", ["cs2cfg"]],
    ]);
    return {
      get: (k: string, def?: any) => (cfg.has(k) ? cfg.get(k) : def),
    };
  }),
  onDidOpenTextDocument: jest.fn((h: any) => {
    __registry.listeners.onDidOpenTextDocument.push(h);
    return { dispose: () => {} };
  }),
  onDidChangeTextDocument: jest.fn((h: any) => {
    __registry.listeners.onDidChangeTextDocument.push(h);
    return { dispose: () => {} };
  }),
  onDidCloseTextDocument: jest.fn((h: any) => {
    __registry.listeners.onDidCloseTextDocument.push(h);
    return { dispose: () => {} };
  }),
  onDidChangeConfiguration: jest.fn((h: any) => {
    __registry.listeners.onDidChangeConfiguration.push(h);
    return { dispose: () => {} };
  }),
};

export const Event = <T>(cb: (listener: (e: T) => any) => Disposable) => cb;

export const env = {} as any;

export const ExtensionContext = class {
  constructor(public extPath = process.cwd()) {}
  asAbsolutePath(p: string) {
    const path = require("path");
    return path.join(this.extPath, p);
  }
  subscriptions: Disposable[] = [];
};

// Helpers für Tests
export function __emitOpen(doc: any) {
  __registry.openedDocs.push(doc);
  for (const h of __registry.listeners.onDidOpenTextDocument) h(doc);
}
export function __emitChange(e: any) {
  for (const h of __registry.listeners.onDidChangeTextDocument) h(e);
}
export function __emitClose(doc: any) {
  for (const h of __registry.listeners.onDidCloseTextDocument) h(doc);
}
export function __emitConfigChange(e: any) {
  for (const h of __registry.listeners.onDidChangeConfiguration) h(e);
}
export function __setActiveEditor(ed: any) {
  (window as any).activeTextEditor = ed;
  if (ed)
    for (const h of __registry.listeners.onDidChangeActiveTextEditor) h(ed);
}

export default {
  languages,
  commands,
  window,
  workspace,
  Uri,
  Range,
  Position,
  MarkdownString,
  SemanticTokensLegend,
  SemanticTokensBuilder,
  EventEmitter,
  ExtensionContext,
};
