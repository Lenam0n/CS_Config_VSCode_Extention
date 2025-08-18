// src/features/diagnostics.ts

import * as vscode from "vscode";
import type { CommandDatabase } from "@/loader";
import { firstToken, isCommentLine } from "@util/text";
import { AliasIndex } from "@feature/aliasIndex";

/**
 * Diagnostics: markiert unbekannte Erst-Tokens der Zeile,
 * ignoriert jedoch gültige Aliase im aktuellen Dokument.
 */
export function createDiagnostics(
  db: CommandDatabase,
  languages: string[],
  aliases: AliasIndex
) {
  const collection = vscode.languages.createDiagnosticCollection("cs-commands");

  const cfg = () => vscode.workspace.getConfiguration("csCommands");
  function severity(): vscode.DiagnosticSeverity | null {
    const mode = (cfg().get("enableDiagnostics") as string) || "warning";
    if (mode === "off") return null;
    return mode === "error"
      ? vscode.DiagnosticSeverity.Error
      : vscode.DiagnosticSeverity.Warning;
  }

  function refresh(doc: vscode.TextDocument) {
    if (!languages.includes(doc.languageId) || doc.uri.scheme !== "file")
      return;
    const sev = severity();
    if (sev === null) {
      collection.delete(doc.uri);
      return;
    }

    const diags: vscode.Diagnostic[] = [];
    for (let i = 0; i < doc.lineCount; i++) {
      const lineText = doc.lineAt(i).text;
      if (isCommentLine(lineText)) continue;
      const tok = firstToken(lineText);
      if (!tok) continue;

      // OK, wenn Command bekannt ODER Alias im Dokument
      if (db.has(tok.token) || aliases.isAlias(doc, tok.token)) continue;

      const r = new vscode.Range(i, tok.start, i, tok.end);
      const d = new vscode.Diagnostic(
        r,
        `Unbekannter Command oder Alias: "${tok.token}"`,
        sev
      );
      d.source = "CS Commands";
      diags.push(d);
    }

    collection.set(doc.uri, diags);
  }

  // Events: Dokumente scannen & Diagnostics aktualisieren
  const subs: vscode.Disposable[] = [];
  subs.push(
    vscode.workspace.onDidOpenTextDocument((d) => {
      if (languages.includes(d.languageId)) {
        aliases.scan(d);
        refresh(d);
      }
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (languages.includes(e.document.languageId)) {
        aliases.scan(e.document);
        refresh(e.document);
      }
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (languages.includes(doc.languageId)) {
        aliases.clear(doc);
        collection.delete(doc.uri);
      }
    })
  );

  // initial
  if (vscode.window.activeTextEditor) {
    const d = vscode.window.activeTextEditor.document;
    if (languages.includes(d.languageId)) {
      aliases.scan(d);
      refresh(d);
    }
  }

  // Reload bei DB-/Alias-Updates
  const dbSub = db.onDidUpdate(() => {
    if (vscode.window.activeTextEditor) {
      const d = vscode.window.activeTextEditor.document;
      if (languages.includes(d.languageId)) refresh(d);
    }
  });
  const aliasSub = aliases.onDidUpdate((doc) => {
    if (languages.includes(doc.languageId)) refresh(doc);
  });

  return {
    dispose() {
      collection.dispose();
      subs.forEach((s) => s.dispose());
      dbSub.dispose();
      aliasSub.dispose();
    },
  };
}
