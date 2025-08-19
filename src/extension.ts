// src/extension.ts
import * as vscode from "vscode";

// Core services
import { ConfigService } from "@/config/configService";
import { initI18n, i18n } from "@/i18n/i18n";

// Data / analysis
import { CommandDatabase } from "@/loader";
import { AliasIndex } from "@feature/aliasIndex";

// IntelliSense & UX
import { registerCompletionProvider } from "@/features/completionProvider";
import { registerHoverProvider } from "@/features/hoverProvider";
import { registerSemanticTokens } from "@/features/semanticTokens";
import { createDiagnostics } from "@/features/diagnostics";
import { registerFormattingProvider } from "@/features/formattingProvider";
import { registerLinting } from "@/features/lintDiagnostics";
import { registerDecorations } from "@/features/decorations";

// Commands
import {
  commandGenerateAutoexec,
  commandGenerateCrosshairCfg,
} from "@/commands/generateConfigs";
import {
  commandInsertBindSeries,
  commandInsertCustomBindSeries,
} from "@/commands/multiCursorHelpers";
import { commandImportCrosshairFromShareCode } from "@/commands/crosshairImport";
import { commandBuildLaunchOptions } from "@/commands/launchOptions";
import { commandSwitchLanguage } from "@/commands/language";

// Visualizer
import { VisualizerHub } from "@webview/visualizerHub";

export async function activate(context: vscode.ExtensionContext) {
  // i18n zuerst, damit Meldungen lokalisiert sind
  await initI18n(context);
  const t = i18n();

  // Settings / Config
  const config = new ConfigService();

  // Datenbank (Commands JSON – kann über Settings überschrieben werden)
  const db = new CommandDatabase(context);
  await db.init();

  // Alias-Index (pro Dokument)
  const aliases = new AliasIndex();

  // Bestehende CFG-Dokumente scannen
  vscode.workspace.textDocuments.forEach((d) => {
    if (d.languageId === "cs2cfg") aliases.scan(d);
  });
  if (vscode.window.activeTextEditor?.document.languageId === "cs2cfg") {
    aliases.scan(vscode.window.activeTextEditor.document);
  }

  const languages = getEnabledLanguages();
  const disposables: vscode.Disposable[] = [];

  // IntelliSense / Provider – toggelbar über Settings
  if (config.features.completion) {
    disposables.push(registerCompletionProvider(db, languages, aliases));
  }
  if (config.features.hover) {
    disposables.push(registerHoverProvider(db, languages, aliases));
  }
  // Semantic Tokens: sinnvoll stets aktivieren (günstig)
  disposables.push(registerSemanticTokens(db, languages, aliases));

  // Formatter
  if (config.features.formatting) {
    disposables.push(registerFormattingProvider(languages));
  }

  // Linting (mit Quick Fixes)
  if (config.features.lint) {
    disposables.push(registerLinting(aliases, languages));
  }

  // Alte einfache Diagnostics (unbekannte Tokens), nur wenn gewünscht
  if (config.features.diagnostics !== "off") {
    disposables.push(createDiagnostics(db, languages, aliases));
  }

  // Farbliche Overlays (Decorations)
  if (config.features.decorations) {
    disposables.push(registerDecorations(config, languages, aliases, db));
  }

  // Visualizer (Webviews)
  const viz = new VisualizerHub(context);

  // Commands registrieren
  disposables.push(
    // Datenbank neu laden
    vscode.commands.registerCommand("csCommands.reloadDatabase", async () => {
      try {
        await db.reload();
        vscode.window.showInformationMessage(
          t.t("commands.reloadDatabase.success")
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        vscode.window.showErrorMessage(
          t.t("commands.reloadDatabase.error", { vars: { error: msg } })
        );
      }
    }),

    // Config-Generatoren
    vscode.commands.registerCommand("csCommands.generateAutoexec", () =>
      commandGenerateAutoexec(context)
    ),
    vscode.commands.registerCommand("csCommands.generateCrosshairCfg", () =>
      commandGenerateCrosshairCfg(context)
    ),

    // Crosshair: Share-Code import
    vscode.commands.registerCommand("csCommands.importCrosshairShareCode", () =>
      commandImportCrosshairFromShareCode(context)
    ),

    // Launch Options Builder
    vscode.commands.registerCommand("csCommands.buildLaunchOptions", () =>
      commandBuildLaunchOptions(context)
    ),

    // Snippet / Multi-Cursor Helpers
    vscode.commands.registerCommand(
      "csCommands.insertBindSeries",
      commandInsertBindSeries
    ),
    vscode.commands.registerCommand(
      "csCommands.insertCustomBindSeries",
      commandInsertCustomBindSeries
    ),

    // Visualizer – einzelne Routen
    vscode.commands.registerCommand("csCommands.visualize", async () => {
      const pick = await vscode.window.showQuickPick(
        [
          { label: i18n().t("visualizer.quickPick.heatmap"), id: "heatmap" },
          { label: i18n().t("visualizer.quickPick.radar"), id: "radar" },
          { label: i18n().t("visualizer.quickPick.hud"), id: "hud" },
          {
            label: i18n().t("visualizer.quickPick.crosshair"),
            id: "crosshair",
          },
        ],
        { placeHolder: i18n().t("visualizer.quickPick.title") }
      );
      if (!pick) return;
      await viz.open(pick.id as any);
    }),
    vscode.commands.registerCommand("csCommands.visualize.keyHeatmap", () =>
      viz.open("heatmap")
    ),
    vscode.commands.registerCommand("csCommands.visualize.radarPreview", () =>
      viz.open("radar")
    ),
    vscode.commands.registerCommand("csCommands.visualize.hudPreview", () =>
      viz.open("hud")
    ),
    vscode.commands.registerCommand(
      "csCommands.visualize.crosshairPreview",
      () => viz.open("crosshair")
    ),

    // Sprache wechseln
    vscode.commands.registerCommand(
      "csCommands.language.switch",
      commandSwitchLanguage
    )
  );

  // Live-Rescan für Aliase beim Editorenwechsel
  disposables.push(
    vscode.window.onDidChangeActiveTextEditor((ed) => {
      if (ed?.document.languageId === "cs2cfg") aliases.scan(ed.document);
    })
  );

  // Konfig-Änderungen (z. B. Pfade) → DB neu laden
  disposables.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("csCommands.dataPath") ||
        e.affectsConfiguration("csCommands.paths.commandsJson")
      ) {
        vscode.commands.executeCommand("csCommands.reloadDatabase");
      }
    })
  );

  context.subscriptions.push(...disposables, db);

  // Willkommen (lokalisiert)
  vscode.window.showInformationMessage(i18n().t("general.welcome"));
}

export function deactivate() {}

/** Gelesene Sprach-IDs für die Extension (konfigurierbar) */
function getEnabledLanguages(): string[] {
  const cfg = vscode.workspace.getConfiguration("csCommands");
  const langs = cfg.get<string[]>("languages") ?? ["cs2cfg"];
  return langs.length ? langs : ["cs2cfg"];
}
