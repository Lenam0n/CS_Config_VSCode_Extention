// src/commands/multiCursorHelpers.ts

import * as vscode from "vscode";
import { BindSeriesOption, InsertBindSeriesOptions } from "@/types/mc";

// ---- Key-Sets --------------------------------------------------------------

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const NUMBER_ROW = "0123456789".split("");
const FUNCTION_KEYS = Array.from({ length: 12 }, (_, i) => `f${i + 1}`);
const NAV_EDIT = [
  "tab",
  "capslock",
  "scrolllock",
  "numlock",
  "backspace",
  "enter",
  "escape",
  "ins",
  "del",
  "home",
  "end",
  "pgup",
  "pgdn",
  "printscreen",
  "pause",
];
const ARROWS = ["up", "down", "left", "right"];
const PUNCT_OEM = [
  "grave",
  "minus",
  "equals",
  "leftbracket",
  "rightbracket",
  "semicolon",
  "apostrophe",
  "comma",
  "period",
  "slash",
  "backslash",
];
const NUMPAD = [
  "kp_ins",
  "kp_end",
  "kp_downarrow",
  "kp_pgdn",
  "kp_leftarrow",
  "kp_5",
  "kp_rightarrow",
  "kp_home",
  "kp_uparrow",
  "kp_pgup",
  "kp_del",
  "kp_enter",
  "kp_plus",
  "kp_minus",
  "kp_multiply",
  "kp_slash",
];
const MOD_SYS = ["space", "shift", "ctrl", "alt", "rshift", "rctrl", "ralt"];
const MOUSE = [
  "mouse1",
  "mouse2",
  "mouse3",
  "mouse4",
  "mouse5",
  "mwheelup",
  "mwheeldown",
];

const SERIES: BindSeriesOption[] = [
  { id: "letters", label: "Letters A–Z", keys: LETTERS },
  { id: "numrow", label: "Number Row 0–9", keys: NUMBER_ROW },
  { id: "function", label: "Function Keys F1–F12", keys: FUNCTION_KEYS },
  { id: "nav", label: "Navigation & Editing", keys: NAV_EDIT },
  { id: "arrows", label: "Arrow Keys", keys: ARROWS },
  { id: "punct", label: "Punctuation / OEM", keys: PUNCT_OEM },
  { id: "numpad", label: "Numpad", keys: NUMPAD },
  { id: "mods", label: "Modifiers & System", keys: MOD_SYS },
  { id: "mouse", label: "Mouse Buttons & Wheel", keys: MOUSE },
];

// ---- Snippet-Bau -----------------------------------------------------------

function escSnippetText(s: string): string {
  // Snippet-Escapes: \, $ und } müssen escaped werden
  return s.replace(/\\/g, "\\\\").replace(/\$/g, "\\$").replace(/\}/g, "\\}");
}

export function makeBindSeriesSnippet(
  keys: string[],
  opts: InsertBindSeriesOptions
): vscode.SnippetString {
  const shared = opts.sharedPlaceholder !== false; // default true
  const defaultVal = opts.defaultValue ?? "";
  const placeholderCore = escSnippetText(defaultVal);

  const lines: string[] = [];
  keys.forEach((key, idx) => {
    const ph = shared
      ? `\${1:${placeholderCore}}`
      : `\${${idx + 1}:${placeholderCore}}`;
    const line = `bind "${escSnippetText(key)}" "${ph}"`;
    lines.push(line);
  });

  if (opts.trailingNewline) lines.push("");

  return new vscode.SnippetString(lines.join("\n"));
}

// ---- Commands --------------------------------------------------------------

export async function commandInsertBindSeries(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("Kein aktiver Editor.");
    return;
  }

  const pick = await vscode.window.showQuickPick(
    SERIES.map((s) => ({
      label: s.label,
      description: `${s.keys.length} keys`,
      id: s.id,
    })),
    { placeHolder: "Wähle ein Key-Set für Bind-Serien" }
  );
  if (!pick) return;

  const sel = SERIES.find((s) => s.id === (pick as any).id)!;

  const defaultValue = await vscode.window.showInputBox({
    prompt:
      'Optional: Standard-Value für alle Binds (z. B. "+attack"). Leerlassen für "".',
    value: "",
  });
  if (typeof defaultValue === "undefined") return; // Abbruch

  const snippet = makeBindSeriesSnippet(sel.keys, {
    defaultValue,
    sharedPlaceholder: true,
    trailingNewline: true,
  });

  await editor.insertSnippet(snippet, editor.selection.active);
}

export async function commandInsertCustomBindSeries(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("Kein aktiver Editor.");
    return;
  }

  const rawKeys = await vscode.window.showInputBox({
    prompt:
      "Eigene Keys (kommagetrennt). Beispiele: kp_end, kp_ins, mouse1, y, z, leftbracket ...",
    value: "",
  });
  if (typeof rawKeys === "undefined") return; // Abbruch

  const keys = (rawKeys || "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  if (!keys.length) {
    vscode.window.showWarningMessage("Keine gültigen Keys angegeben.");
    return;
  }

  const defaultValue = await vscode.window.showInputBox({
    prompt: 'Optional: Standard-Value (z. B. "+use"). Leerlassen für "".',
    value: "",
  });
  if (typeof defaultValue === "undefined") return;

  const snippet = makeBindSeriesSnippet(keys, {
    defaultValue,
    sharedPlaceholder: true,
    trailingNewline: true,
  });

  await editor.insertSnippet(snippet, editor.selection.active);
}
