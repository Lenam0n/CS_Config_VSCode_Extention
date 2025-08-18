// src/extension.ts

import * as vscode from "vscode";
import { CommandDatabase } from "@/loader";
import { registerCompletionProvider } from "@feature/completionProvider";
import { registerHoverProvider } from "@feature/hoverProvider";
import { createDiagnostics } from "@feature/diagnostics";
import { registerSemanticTokens } from "@feature/semanticTokens";
import { AliasIndex } from "@feature/aliasIndex";
import {
  commandGenerateAutoexec,
  commandGenerateCrosshairCfg,
} from "@command/generateConfigs";

/**
 * Aktivierung der Extension:
 * - Datenbank laden
 * - AliasIndex initialisieren & scannen
 * - Features (Completion, Hover, SemanticTokens, Diagnostics) registrieren
 * - Commands (Reload, Generate Autoexec/Crosshair) registrieren
 * - Config-/Editor-Listener verdrahten
 */
export async function activate(context: vscode.ExtensionContext) {
  const db = new CommandDatabase(context);
  await db.init();

  const aliases = new AliasIndex();

  // Beim Start bereits geöffnete Dokumente scannen
  vscode.workspace.textDocuments.forEach((d) => {
    if (d.languageId === "cs2cfg") aliases.scan(d);
  });

  // Aktiven Editor initial scannen (falls vorhanden)
  if (vscode.window.activeTextEditor?.document.languageId === "cs2cfg") {
    aliases.scan(vscode.window.activeTextEditor.document);
  }

  const languages = getEnabledLanguages();
  const disposables: vscode.Disposable[] = [];

  // Feature-Provider
  disposables.push(registerCompletionProvider(db, languages, aliases));
  disposables.push(registerHoverProvider(db, languages, aliases));
  disposables.push(registerSemanticTokens(db, languages, aliases));

  // Diagnostics
  const diag = createDiagnostics(db, languages, aliases);
  disposables.push(diag);

  // Reload-Command
  disposables.push(
    vscode.commands.registerCommand("csCommands.reloadDatabase", async () => {
      try {
        await db.reload();
        vscode.window.showInformationMessage("CS Commands: Daten neu geladen.");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        vscode.window.showErrorMessage(
          `CS Commands: Konnte Daten nicht laden: ${msg}`
        );
      }
    })
  );

  // Generator-Commands (Kontext muss übergeben werden)
  disposables.push(
    vscode.commands.registerCommand("csCommands.generateAutoexec", () =>
      commandGenerateAutoexec(context)
    ),
    vscode.commands.registerCommand("csCommands.generateCrosshairCfg", () =>
      commandGenerateCrosshairCfg(context)
    )
  );

  // Editorwechsel → Aliase frisch scannen
  disposables.push(
    vscode.window.onDidChangeActiveTextEditor((ed) => {
      if (ed?.document.languageId === "cs2cfg") aliases.scan(ed.document);
    })
  );

  // Settings-Änderungen (z. B. dataPath) beobachten
  const cfgDisp = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("csCommands.dataPath")) {
      vscode.commands.executeCommand("csCommands.reloadDatabase");
    }
  });
  disposables.push(cfgDisp);

  context.subscriptions.push(...disposables, db);
}

export function deactivate() {
  // Disposables werden von VS Code aufgeräumt
}

function getEnabledLanguages(): string[] {
  const cfg = vscode.workspace.getConfiguration("csCommands");
  const langs = cfg.get<string[]>("languages") ?? ["cs2cfg"];
  return langs.length ? langs : ["cs2cfg"];
}
