// src/commands/launchOptions.ts
import * as vscode from "vscode";
import { LaunchArg, LaunchCatalog, LaunchArgParam } from "@/types/launch";

type LaunchPick = vscode.QuickPickItem & { opt: LaunchArg };
type EnumPick = vscode.QuickPickItem & { val: string };

async function loadCatalog(
  ctx: vscode.ExtensionContext
): Promise<LaunchCatalog> {
  const uri = vscode.Uri.joinPath(
    ctx.extensionUri,
    "data",
    "cs2.launchOptions.json"
  );
  const buf = await vscode.workspace.fs.readFile(uri);
  return JSON.parse(Buffer.from(buf).toString("utf-8")) as LaunchCatalog;
}

/** Normalisiert die .params-Union ([], LaunchArgParam[], [LaunchArgParam]) → LaunchArgParam[] */
function getParams(opt: LaunchArg): LaunchArgParam[] {
  const raw = (opt as any).params;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as LaunchArgParam[];
  return [];
}

function validateValue(p: LaunchArgParam, raw: string): string | undefined {
  if (p.type === "integer" || p.type === "number") {
    const num = Number(raw);
    if (Number.isNaN(num)) return "Zahl erwartet.";
    if (p.min !== undefined && num < p.min) return `>= ${p.min} erwartet.`;
    if (p.max !== undefined && num > p.max) return `<= ${p.max} erwartet.`;
  }
  if (p.type === "string" && raw.trim().length === 0)
    return "Wert darf nicht leer sein.";
  return undefined;
}

async function promptParams(opt: LaunchArg): Promise<string[]> {
  const out: string[] = [];
  const params = getParams(opt); // ← WICHTIG: nie mehr 'never[]'

  for (const p of params) {
    // Enum-Auswahl
    if (p.enum && p.enum.length) {
      const picks: EnumPick[] = p.enum.map((v) => ({
        label: String(v),
        val: String(v),
      }));
      const picked = await vscode.window.showQuickPick<EnumPick>(picks, {
        placeHolder: `${opt.name} — ${p.name}`,
        ignoreFocusOut: true,
      });
      if (!picked) return []; // abgebrochen
      out.push(picked.val);
      continue;
    }

    // Freitext-/Zahlen-Eingabe
    const def =
      p.default !== undefined ? String(p.default) : p.placeholder ?? "";
    const raw = await vscode.window.showInputBox({
      title: `${opt.name} — ${p.name}`,
      value: def,
      placeHolder: p.placeholder,
      validateInput: (val) => validateValue(p, val) ?? undefined,
      ignoreFocusOut: true,
    });
    if (raw === undefined) return []; // abgebrochen
    out.push(raw);
  }

  return out;
}

function assertNever(x: never): never {
  throw new Error(`Unhandled LaunchArg kind: ${(x as any)?.kind}`);
}

function assemble(opt: LaunchArg, params: string[]): string {
  switch (opt.kind) {
    case "flag":
      return opt.name;

    case "flagWithValue":
    case "plus": {
      const parts = params.map((v) =>
        /\s/.test(v) ? `"${v.replace(/"/g, '\\"')}"` : v
      );
      return [opt.name, ...parts].join(" ");
    }

    default:
      return assertNever(opt);
  }
}

export async function commandBuildLaunchOptions(
  ctx: vscode.ExtensionContext
): Promise<void> {
  const catalog = await loadCatalog(ctx);

  // klar typisierte Items
  const items: LaunchPick[] = catalog.options.map((o) => ({
    label: o.name,
    description: o.description,
    detail: `[${o.category}] ${String(o.status).toUpperCase()}`,
    opt: o,
    picked: false,
  }));

  // showQuickPick mit canPickMany:true → Array-Returntyp
  const pick = await vscode.window.showQuickPick<LaunchPick>(items, {
    canPickMany: true,
    matchOnDescription: true,
    matchOnDetail: true,
    placeHolder: "Wähle Launch-Optionen (Leertaste toggelt).",
  });

  // pick ist LaunchPick[] | undefined
  if (!pick || pick.length === 0) return;

  const chosen: string[] = [];
  for (const item of pick) {
    const opt: LaunchArg = item.opt;
    const vals = await promptParams(opt);
    // Wenn Parameter erwartet, aber Eingabe abgebrochen → überspringen
    if (vals.length === 0 && getParams(opt).length > 0) continue;
    chosen.push(assemble(opt, vals));
  }

  const result = chosen.join(" ");

  const action = await vscode.window.showInformationMessage(
    "Launch-Options generiert.",
    { modal: true, detail: result },
    "In Zwischenablage kopieren",
    "In aktuelles Dokument einfügen"
  );
  if (!action) return;

  if (action === "In Zwischenablage kopieren") {
    await vscode.env.clipboard.writeText(result);
    vscode.window.showInformationMessage(
      "Launch-Options in die Zwischenablage kopiert."
    );
  } else {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      await vscode.env.clipboard.writeText(result);
      vscode.window.showInformationMessage(
        "Kein Editor offen – String in die Zwischenablage kopiert."
      );
      return;
    }
    await editor.edit((ed) => ed.insert(editor.selection.active, result));
  }
}
