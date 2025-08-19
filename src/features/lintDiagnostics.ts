// src/features/lintDiagnostics.ts
import * as vscode from "vscode";
import { runLinter } from "@/lint/runner";

/**
 * Diagnostik + CodeActions (Quick Fixes) für Linting.
 */
export function registerLinting(
  aliasIndex: import("@feature/aliasIndex").AliasIndex,
  languages: string[]
) {
  const collection =
    vscode.languages.createDiagnosticCollection("cs-commands-lint");

  const toSeverity = (sev: string): vscode.DiagnosticSeverity => {
    switch (sev) {
      case "error":
        return vscode.DiagnosticSeverity.Error;
      case "warning":
        return vscode.DiagnosticSeverity.Warning;
      case "info":
        return vscode.DiagnosticSeverity.Information;
      default:
        return vscode.DiagnosticSeverity.Hint;
    }
  };

  function refresh(doc: vscode.TextDocument) {
    if (!languages.includes(doc.languageId)) return;
    const findings = runLinter(doc, aliasIndex);
    const diags: vscode.Diagnostic[] = [];
    for (const f of findings) {
      const range = new vscode.Range(f.line, f.range[0], f.line, f.range[1]);
      const d = new vscode.Diagnostic(range, f.message, toSeverity(f.severity));
      d.code = { value: f.ruleId, target: undefined as any };
      // pack metadata for CodeActions
      (d as any).__lint = f.data ?? {};
      diags.push(d);
    }
    collection.set(doc.uri, diags);
  }

  const subs: vscode.Disposable[] = [];
  subs.push(
    vscode.workspace.onDidOpenTextDocument(refresh),
    vscode.workspace.onDidChangeTextDocument((e) => refresh(e.document)),
    vscode.workspace.onDidCloseTextDocument((d) => collection.delete(d.uri))
  );

  // initial
  for (const d of vscode.workspace.textDocuments) refresh(d);

  // Code Actions (Quick Fix)
  const caProvider: vscode.CodeActionProvider = {
    provideCodeActions(doc, range, ctx) {
      const actions: vscode.CodeAction[] = [];
      for (const diag of ctx.diagnostics) {
        const ruleId =
          typeof diag.code === "object" && diag.code
            ? (diag.code as any).value
            : String(diag.code ?? "");
        switch (ruleId) {
          case "exec-script-forbidden":
          case "duplicate-bind-key":
          case "alias-unused": {
            // Fix: Zeile auskommentieren
            const fix = new vscode.CodeAction(
              "Comment out this line",
              vscode.CodeActionKind.QuickFix
            );
            const line = diag.range.start.line;
            const text = doc.lineAt(line).text;
            if (!/^\s*\/\//.test(text)) {
              fix.edit = new vscode.WorkspaceEdit();
              const start = new vscode.Position(line, 0);
              fix.edit.insert(doc.uri, start, "// ");
              fix.diagnostics = [diag];
              fix.isPreferred = ruleId !== "alias-unused"; // bevorzugt bei echten Problemen
              actions.push(fix);
            }
            break;
          }
          case "alias-spacing": {
            // Fix: Ersetze Zeile mit normalisiertem Replacement
            const rep = (diag as any).__lint?.replacement as string | undefined;
            if (rep !== undefined) {
              const fix = new vscode.CodeAction(
                "Normalize alias spacing",
                vscode.CodeActionKind.QuickFix
              );
              fix.edit = new vscode.WorkspaceEdit();
              fix.edit.replace(doc.uri, diag.range, rep);
              fix.diagnostics = [diag];
              fix.isPreferred = true;
              actions.push(fix);
            }
            break;
          }
          case "alias-cycle": {
            // Optional: keine automatische Fix-Idee – nur Info
            const info = new vscode.CodeAction(
              "Show cycle info",
              vscode.CodeActionKind.Empty
            );
            info.command = {
              title: "Alias cycle",
              command: "vscode.open",
              arguments: [], // nothing – placeholder; could show an information message
            };
            actions.push(info);
            break;
          }
          default:
            break;
        }
      }
      return actions;
    },
  };

  const selectors = languages.map((id) => ({
    language: id,
    scheme: "file" as const,
  }));
  const caReg = vscode.languages.registerCodeActionsProvider(
    selectors,
    caProvider,
    {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }
  );

  return {
    dispose() {
      collection.dispose();
      for (const d of subs) d.dispose();
      caReg.dispose();
    },
  };
}
