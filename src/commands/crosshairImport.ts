// src/commands/crosshairImport.ts

import * as vscode from "vscode";
import {
  decodeShareCodeToSettings,
  isValidShareCode,
  normalizeShareCode,
} from "@/utils/crosshairShareCode";
import { CrosshairSettings, renderCrosshairCfg } from "@/types/crosshair";

function toBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

async function pickSaveUri(
  defaultFileName: string
): Promise<vscode.Uri | undefined> {
  return vscode.window.showSaveDialog({
    defaultUri: vscode.workspace.workspaceFolders?.[0]
      ? vscode.Uri.joinPath(
          vscode.workspace.workspaceFolders[0].uri,
          defaultFileName
        )
      : undefined,
    saveLabel: "Create",
    filters: { "Config Files": ["cfg"], "All Files": ["*"] },
  });
}

function renderHeader(title: string, notes?: string[]): string[] {
  const stamp = (() => {
    const d = new Date();
    const p = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
      d.getHours()
    )}:${p(d.getMinutes())}`;
  })();

  const line = "=".repeat(31);
  const out = [` ${line}`, ` ${title} — imported ${stamp}`, ` ${line}`];
  if (notes?.length) out.push(...notes);
  return out;
}

function renderFromSettings(settings: CrosshairSettings, code: string): string {
  const header = renderHeader("CS2 CROSSHAIR", [
    `apply_crosshair_code ${normalizeShareCode(
      code
    )}  // original share-code (for reference)`,
  ]);
  return renderCrosshairCfg(settings, header) + `\n`;
}

function renderFallback(code: string): string {
  const header = renderHeader("CS2 CROSSHAIR (FALLBACK)", [
    "Decoder konnte diesen Share-Code nicht automatisch extrahieren.",
    "Du kannst ihn ingame anwenden oder eine Mapping-Datei hinterlegen:",
    "- console: apply_crosshair_code <CODE>",
    "- setting: csCommands.crosshair.codeMapPath -> JSON mit <CODE> -> CVars",
  ]);
  const lines = [
    ...header.map((h) => `// ${h}`),
    "",
    `apply_crosshair_code ${normalizeShareCode(code)}`,
    `echo "Crosshair Share-Code angewendet"`,
  ];
  return lines.join("\n") + "\n";
}

export async function commandImportCrosshairFromShareCode(
  ctx: vscode.ExtensionContext
): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  // 1) Eingabe des Codes
  const input = await vscode.window.showInputBox({
    prompt: "CSGO Crosshair-Share-Code eingeben (z. B. CSGO-xxxxx-xxxxx-...)",
    placeHolder: "CSGO-……",
    validateInput: (val) =>
      isValidShareCode(val) ? undefined : "Kein valider CSGO-Share-Code-String",
  });
  if (!input) return;

  const code = normalizeShareCode(input);

  // 2) Dekodieren
  const settings = await decodeShareCodeToSettings(code);

  // 3) Ziel: Einfügen hier vs. Datei erzeugen
  const choice = await vscode.window.showQuickPick(
    [
      { label: "In aktuelles Dokument einfügen", id: "insert" },
      { label: "Neue crosshair.cfg erzeugen", id: "file" },
    ],
    { placeHolder: "Wie möchtest du die Crosshair-Einstellungen übernehmen?" }
  );
  if (!choice) return;

  const content = settings
    ? renderFromSettings(settings, code)
    : renderFallback(code);

  if (choice.id === "insert" && editor) {
    await editor.insertSnippet(
      new vscode.SnippetString(content),
      editor.selection.active
    );
    vscode.window.showInformationMessage(
      settings
        ? "Crosshair aus Share-Code eingefügt."
        : "Fallback (apply_crosshair_code) eingefügt."
    );
    return;
  }

  // Datei-Variante
  const uri = await pickSaveUri("crosshair.cfg");
  if (!uri) return;

  await vscode.workspace.fs.writeFile(uri, toBytes(content));
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
  vscode.window.showInformationMessage(
    settings
      ? "crosshair.cfg aus Share-Code erstellt."
      : "crosshair.cfg (Fallback) erstellt."
  );
}
