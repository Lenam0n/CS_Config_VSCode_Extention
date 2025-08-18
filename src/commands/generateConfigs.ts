// src/commands/generateConfigs.ts

import * as vscode from "vscode";
import * as fsp from "fs/promises";
import * as path from "path";
import { AutoexecTemplate, CrosshairTemplate } from "@/types";

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

function stamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

async function readJson<T>(
  context: vscode.ExtensionContext,
  relPath: string
): Promise<T> {
  const abs = context.asAbsolutePath(relPath);
  const buf = await fsp.readFile(abs, "utf8");
  return JSON.parse(buf) as T;
}

function banner(title: string, subtitle?: string): string {
  const line = "// " + "=".repeat(75);
  const head = `//  ${title}${subtitle ? " — " + subtitle : ""}`;
  return `${line}\n${head}\n${line}\n`;
}

/**
 * Entfernt sicherheitshalber verbotene/unerwünschte Zeilen:
 * - exec ... .cfg
 * - script (ganze Zeilen)
 */
function stripForbidden(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];
  const execRe = /^\s*exec\s+.+\.cfg\b/i;
  const scriptRe = /^\s*script\b/i;
  for (const l of lines) {
    if (execRe.test(l)) continue;
    if (scriptRe.test(l)) continue;
    out.push(l);
  }
  return out.join("\n");
}

function renderAutoexec(tpl: AutoexecTemplate): string {
  const head =
    banner(`${tpl.meta.name} — generated ${stamp()}`) +
    `//\n//  TABLE OF CONTENTS\n` +
    tpl.meta.sectionsOrder
      .map((id) => `//   [${id}] ${tpl.meta.sectionsToc[id]}`)
      .join("\n") +
    `\n//\n` +
    (tpl.meta.notes?.length
      ? `//  Notes:\n` +
        tpl.meta.notes.map((n) => `//   - ${n}`).join("\n") +
        `\n`
      : "") +
    banner(tpl.meta.name);

  const sections = tpl.meta.sectionsOrder
    .map((id) => {
      const sec = tpl.sections[id];
      const title = `// ${sec.title}\n// ----------------------------------------------------------------------------`;
      return [title, ...sec.lines, ""].join("\n");
    })
    .join("\n");

  return stripForbidden(`${head}\n${sections}`);
}

function renderCrosshair(tpl: CrosshairTemplate): string {
  const head =
    banner(`${tpl.meta.name} — generated ${stamp()}`) +
    (tpl.meta.notes?.length
      ? tpl.meta.notes.map((n) => `//  ${n}`).join("\n") + "\n"
      : "") +
    banner(tpl.meta.name);

  return stripForbidden(`${head}\n${tpl.lines.join("\n")}\n`);
}

export async function commandGenerateAutoexec(
  context: vscode.ExtensionContext
): Promise<void> {
  const uri = await pickSaveUri("autoexec.cfg");
  if (!uri) return;

  const tpl = await readJson<AutoexecTemplate>(
    context,
    path.join("assets", "templates", "autoexec.template.json")
  );
  const content = renderAutoexec(tpl);

  await vscode.workspace.fs.writeFile(uri, toBytes(content));
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
  vscode.window.showInformationMessage("autoexec.cfg erstellt.");
}

export async function commandGenerateCrosshairCfg(
  context: vscode.ExtensionContext
): Promise<void> {
  const uri = await pickSaveUri("crosshair.cfg");
  if (!uri) return;

  const tpl = await readJson<CrosshairTemplate>(
    context,
    path.join("assets", "templates", "crosshair.template.json")
  );
  const content = renderCrosshair(tpl);

  await vscode.workspace.fs.writeFile(uri, toBytes(content));
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
  vscode.window.showInformationMessage("crosshair.cfg erstellt.");
}
