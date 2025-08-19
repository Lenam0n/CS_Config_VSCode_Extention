// src/features/decorations.ts
import * as vscode from "vscode";
import { ConfigService } from "@/config/configService";
import { splitCommentSmart, parseBind } from "@/format/formatter";
import { AliasIndex } from "@feature/aliasIndex";
import { CommandDatabase } from "@/loader";
import { HighlightColors } from "@/types/settings";

type DecKey =
  | "cmd"
  | "cvar"
  | "aliasDef"
  | "aliasUse"
  | "bindKey"
  | "bindValue"
  | "plusAction"
  | "forbidden";

export function registerDecorations(
  config: ConfigService,
  langs: string[],
  _aliases: AliasIndex, // aktuell nicht direkt benötigt (wir scannen die Datei selbst)
  db?: CommandDatabase
) {
  let types = buildDecorationTypes(config);
  const collection: Record<DecKey, vscode.DecorationOptions[]> = {
    cmd: [],
    cvar: [],
    aliasDef: [],
    aliasUse: [],
    bindKey: [],
    bindValue: [],
    plusAction: [],
    forbidden: [],
  };

  const recomputeAll = () => {
    if (!config.features.decorations || !config.decorations.enable)
      return clearAll();

    const editor = vscode.window.activeTextEditor;
    if (!editor || !langs.includes(editor.document.languageId))
      return clearAll();

    for (const k of Object.keys(collection) as DecKey[]) collection[k] = [];
    const text = editor.document.getText();
    const lines = text.split(/\r?\n/);

    // Alias-Namen per Zeilen-Scan sammeln (kein AliasIndex.get nötig)
    const aliasNames = new Set<string>();
    for (const ln of lines) {
      const m = ln.match(/^\s*alias\s+("?)([^\s"]+)\1\b/i);
      if (m) aliasNames.add(m[2].toLowerCase());
    }

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const { code } = splitCommentSmart(raw);

      // Forbidden (exec/script)
      if (/^\s*exec\s+.+\.cfg\b/i.test(code) || /^\s*script\b/i.test(code)) {
        push("forbidden", i, 0, raw.length);
      }

      // alias DEF
      const mAlias = code.match(/^\s*alias\s+("?)([^\s"]+)\1\b/i);
      if (mAlias) {
        const start = code.indexOf(mAlias[2]);
        push("aliasDef", i, start, start + mAlias[2].length);
        // optional: mark plus-actions within expansion
        const expIdx = code.indexOf(mAlias[0]) + mAlias[0].length;
        markPlusSegments(i, code.slice(expIdx));
      }

      // bind key/value
      const ast = parseBind(code);
      if (ast.kind === "bind") {
        // mark key/value inside quotes by naive search:
        const keyStart = code.indexOf('"');
        const keyEnd = keyStart >= 0 ? code.indexOf('"', keyStart + 1) : -1;
        if (keyStart >= 0 && keyEnd > keyStart)
          push("bindKey", i, keyStart + 1, keyEnd);

        const valStart = keyEnd >= 0 ? code.indexOf('"', keyEnd + 1) : -1;
        const valEnd = valStart >= 0 ? code.indexOf('"', valStart + 1) : -1;
        if (valStart >= 0 && valEnd > valStart) {
          push("bindValue", i, valStart + 1, valEnd);
          // alias use? (value equals alias name)
          const v = ast.value.toLowerCase();
          if (aliasNames.has(v)) push("aliasUse", i, valStart + 1, valEnd);
        }

        // plus actions in value (e.g. alias segments bound directly)
        markPlusSegments(i, code);
      }

      // DB lookup for tokens (optional) – robust auf verschiedene DB-Methoden
      if (db) {
        for (const tokenInfo of tokenizeOutsideStrings(code)) {
          const name = tokenInfo.text;
          const hit =
            (db as any)?.find?.(name) ??
            (db as any)?.lookup?.(name) ??
            (db as any)?.get?.(name) ??
            undefined;
          if (hit) {
            if ((hit as any).type === "cmd")
              push("cmd", i, tokenInfo.start, tokenInfo.end);
            else push("cvar", i, tokenInfo.start, tokenInfo.end);
          }
        }
      }
      // comment is left to theme; we don't overlay it (to avoid clash)
    }

    // apply
    const ed = vscode.window.activeTextEditor!;
    for (const k of Object.keys(collection) as DecKey[]) {
      ed.setDecorations(types[k], collection[k]);
    }
  };

  const push = (k: DecKey, line: number, start: number, end: number) => {
    if (start < 0 || end <= start) return;
    collection[k].push({ range: new vscode.Range(line, start, line, end) });
  };

  const markPlusSegments = (line: number, code: string) => {
    // highlight tokens that start with + or - outside strings
    let inStr = false;
    for (let i = 0; i < code.length; i++) {
      const c = code[i];
      if (c === '"' && code[i - 1] !== "\\") inStr = !inStr;
      if (!inStr && (c === "+" || c === "-")) {
        const s = i;
        let e = i + 1;
        while (e < code.length && /[A-Za-z0-9_]/.test(code[e])) e++;
        if (e > s + 1) push("plusAction", line, s, e);
        i = e;
      }
    }
  };

  const tokenizeOutsideStrings = (code: string) => {
    const out: Array<{ text: string; start: number; end: number }> = [];
    let inStr = false,
      start = -1;
    for (let i = 0; i <= code.length; i++) {
      const c = code[i];
      if (c === '"' && code[i - 1] !== "\\") inStr = !inStr;
      const isSep = i === code.length || /\s|;/.test(c ?? "");
      if (!inStr) {
        if (start === -1 && !isSep) start = i;
        if (start !== -1 && isSep) {
          const text = code.slice(start, i).replace(/^"+|"+$/g, "");
          out.push({ text, start, end: i });
          start = -1;
        }
      }
    }
    return out;
  };

  const clearAll = () => {
    const ed = vscode.window.activeTextEditor;
    if (!ed) return;
    for (const k of Object.keys(types) as DecKey[]) {
      ed.setDecorations(types[k], []);
    }
  };

  const rebuildTypes = () => {
    for (const key in types) types[key as DecKey].dispose();
    types = buildDecorationTypes(config);
  };

  // wire
  const subs: vscode.Disposable[] = [];
  subs.push(
    vscode.window.onDidChangeActiveTextEditor(recomputeAll),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document === vscode.window.activeTextEditor?.document)
        recomputeAll();
    }),
    config.onDidChange(() => {
      rebuildTypes();
      recomputeAll();
    })
  );

  // initial
  setTimeout(recomputeAll, 50);

  return {
    dispose() {
      subs.forEach((d) => d.dispose());
      clearAll();
      for (const key in types) types[key as DecKey].dispose();
    },
  };
}

function buildDecorationTypes(
  config: ConfigService
): Record<DecKey, vscode.TextEditorDecorationType> {
  const s = (k: keyof HighlightColors) => styleFrom(config, k);
  return {
    cmd: vscode.window.createTextEditorDecorationType(s("cmd")),
    cvar: vscode.window.createTextEditorDecorationType(s("cvar")),
    aliasDef: vscode.window.createTextEditorDecorationType(s("aliasDef")),
    aliasUse: vscode.window.createTextEditorDecorationType(s("aliasUse")),
    bindKey: vscode.window.createTextEditorDecorationType(s("bindKey")),
    bindValue: vscode.window.createTextEditorDecorationType(s("bindValue")),
    plusAction: vscode.window.createTextEditorDecorationType(s("plusAction")),
    forbidden: vscode.window.createTextEditorDecorationType(s("forbidden")),
  };
}

function styleFrom(
  config: ConfigService,
  key: keyof HighlightColors
): vscode.DecorationRenderOptions {
  const colors = config.decorations.colors;
  const styles = config.decorations.style;
  const color = colors[key] || "#ffffff";
  const perKey = styles[key];
  const opacity = perKey?.opacity ?? 1;

  const opts: vscode.DecorationRenderOptions = {
    color,
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
  };

  // underline etc.
  const decos: string[] = [];
  if (perKey?.underline) decos.push("underline");
  if (decos.length) (opts as any).textDecoration = decos.join(" ");

  // opacity via rgba blend
  if (
    /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(color) &&
    opacity < 1 &&
    opacity >= 0
  ) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    (opts as any).color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return opts;
}
