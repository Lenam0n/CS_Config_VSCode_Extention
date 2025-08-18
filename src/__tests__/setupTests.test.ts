import { __registry, window, workspace } from "~helper/vscode.test";

beforeEach(() => {
  // Reset registries/mocks between tests
  __registry.completionProvider = null;
  __registry.hoverProvider = null;
  __registry.semanticProvider = null;
  __registry.diagnosticsCollection.clear();
  __registry.commands.clear();
  __registry.openedDocs = [];
  for (const k of Object.keys(__registry.listeners) as Array<
    keyof typeof __registry.listeners
  >) {
    __registry.listeners[k] = [];
  }
  (window.showInformationMessage as any).mockClear?.();
  (window.showWarningMessage as any).mockClear?.();
  (window.showErrorMessage as any).mockClear?.();
  (window.showSaveDialog as any).mockClear?.();
  (window.showTextDocument as any).mockClear?.();
  (workspace.fs.writeFile as any).mockClear?.();
  (workspace.getConfiguration as any).mockClear?.();
});
