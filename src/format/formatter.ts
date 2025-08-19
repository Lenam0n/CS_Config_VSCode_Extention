// src/format/formatter.ts

import { defaultFormatOptions, FormatOptions } from "@/types/format";

/** Ergebnis des "smarten" Kommentar-Splits. */
type SplitLine = { code: string; comment: string | null };

/** Bind-Parse-Ergebnis. */
export type BindAst =
  | {
      kind: "bind";
      key: string;
      value: string;
      rawKeyQuoted: boolean;
      rawValueQuoted: boolean;
      leading: string;
    }
  | { kind: "other" };

const RE_BIND_START = /^\s*bind\b/i;

/** Entfernt ein äußeres Anführungszeichen-Paar, wenn es "sauber" ist. */
function unquote(s: string): { text: string; quoted: boolean } {
  const t = s.trim();
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    return { text: t.slice(1, -1), quoted: true };
  }
  return { text: t, quoted: false };
}

/** Escaped innere Anführungszeichen für einen Value in doppelten Quotes. */
function escapeForQuotes(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Finde `//` Kommentar-Anfang außerhalb von String-Literalen. */
export function splitCommentSmart(line: string): SplitLine {
  let inString = false;
  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i];
    const nxt = line[i + 1];
    if (ch === '"' && line[i - 1] !== "\\") inString = !inString;
    if (!inString && ch === "/" && nxt === "/") {
      return {
        code: line.slice(0, i).trimEnd(),
        comment: line.slice(i).trim(),
      };
    }
  }
  return { code: line.trimEnd(), comment: null };
}

/** Tokenize: ein Wort oder ein quoted-String ab index, gibt [token, nextIdx] zurück. */
function readToken(s: string, i: number): [string, number] | null {
  while (i < s.length && /\s/.test(s[i])) i++;
  if (i >= s.length) return null;

  if (s[i] === '"') {
    let j = i + 1;
    let out = "";
    while (j < s.length) {
      const c = s[j];
      if (c === '"' && s[j - 1] !== "\\") {
        return [`"${out}"`, j + 1];
      }
      if (c === "\\" && j + 1 < s.length) {
        // keep escaped
        out += "\\" + s[j + 1];
        j += 2;
      } else {
        out += c;
        j++;
      }
    }
    // ungeschlossene Quotes – nimm Rest
    return [s.slice(i), s.length];
  }

  let j = i;
  while (j < s.length && !/\s/.test(s[j])) j++;
  return [s.slice(i, j), j];
}

/** Parse einer bind-Zeile (nur der Code-Teil ohne Kommentar). */
export function parseBind(code: string): BindAst {
  if (!RE_BIND_START.test(code)) return { kind: "other" };

  // leading whitespace behalten (zum Erkennen von Gruppen egal, aber nice to have)
  const leading = code.match(/^\s*/)?.[0] ?? "";
  let i = leading.length + "bind".length;
  while (i < code.length && /\s/.test(code[i])) i++;

  const keyTok = readToken(code, i);
  if (!keyTok) return { kind: "other" };
  const [rawKey, afterKey] = keyTok;

  const valueTok = readToken(code, afterKey);
  if (!valueTok) {
    // bind ohne Value ist formal möglich – wir formatieren trotzdem
    return {
      kind: "bind",
      key: unquote(rawKey).text,
      value: "",
      rawKeyQuoted: rawKey.trimStart().startsWith('"'),
      rawValueQuoted: false,
      leading,
    };
  }
  const [rawVal] = valueTok;

  const uqKey = unquote(rawKey);
  const uqVal = unquote(rawVal);

  return {
    kind: "bind",
    key: uqKey.text,
    value: uqVal.text,
    rawKeyQuoted: uqKey.quoted,
    rawValueQuoted: uqVal.quoted,
    leading,
  };
}

/** Alias-Spacing: `;` außerhalb von Strings auf "`; `" normalisieren. */
export function normalizeAliasValueSpacing(code: string): string {
  if (!/^\s*alias\b/i.test(code)) return code.trimEnd();
  let out = "";
  let inString = false;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '"' && code[i - 1] !== "\\") inString = !inString;
    if (!inString && c === ";") {
      out += "; ";
      // skip Folgespaces
      let j = i + 1;
      while (j < code.length && /\s/.test(code[j])) j++;
      i = j - 1;
    } else {
      out += c;
    }
  }
  // Doppelleerzeichen nach alias/Name zusammenziehen
  return out.replace(/\s+$/g, "").replace(/\s{2,}/g, " ");
}

/** Formatiert ein Dokument gemäß Optionen. */
export function formatCfg(
  text: string,
  partial?: Partial<FormatOptions>
): string {
  const opt: FormatOptions = { ...defaultFormatOptions, ...(partial || {}) };
  const lines = text.split(/\r?\n/);

  // 1) Vorverarbeitung: trailing WS trimmen, Alias-Spacing normalisieren (optional)
  const pre: { code: string; comment: string | null; original: string }[] =
    lines.map((line) => {
      const { code, comment } = splitCommentSmart(line);
      const newCode = opt.formatAliasSpacing
        ? normalizeAliasValueSpacing(code)
        : code.trimEnd();
      return { code: newCode, comment, original: line };
    });

  // 2) Bind-Gruppen erkennen: zusammenhängende bind-Zeilen
  type Row = (typeof pre)[number] & { bind: BindAst };
  const rows: Row[] = pre.map((r) => ({ ...r, bind: parseBind(r.code) }));

  const result: string[] = [];
  let i = 0;

  const flushBindGroup = (group: Row[]) => {
    if (!group.length) return;
    if (!opt.alignBinds) {
      for (const r of group) result.push(renderBind(r.bind, r.comment, "auto"));
      return;
    }
    const maxKeyLen = Math.max(
      ...group.map((r) => (r.bind.kind === "bind" ? r.bind.key.length : 0))
    );
    for (const r of group) {
      result.push(renderBind(r.bind, r.comment, "auto", maxKeyLen));
    }
  };

  const pushNonBind = (r: Row) => {
    // Einfach Code + Kommentar rekonstruieren
    const code = r.code.trimEnd();
    const line =
      r.comment && r.comment.length
        ? (code ? code + "  " : "") + r.comment // 2 Spaces vor `//` falls code existiert
        : code;
    result.push(line);
  };

  while (i < rows.length) {
    // Leerzeilen später in Schritt 3 handhaben
    if (rows[i].code.trim() === "" && !rows[i].comment) {
      result.push("");
      i++;
      continue;
    }

    if (rows[i].bind.kind === "bind") {
      const group: Row[] = [];
      // Gruppe = bind-Zeilen bis zur ersten Nicht-bind/Leer-Kommentar-Mix-Zeile
      while (i < rows.length) {
        const r = rows[i];
        if (r.bind.kind === "bind") {
          group.push(r);
          i++;
        } else if (r.code.trim() === "" && !r.comment) {
          // Unterbrechung – aber Leerzeile zählt NICHT zur Gruppe
          break;
        } else {
          break;
        }
      }
      flushBindGroup(group);
      continue;
    }

    pushNonBind(rows[i]);
    i++;
  }

  // 3) Leerzeilen entkoppeln: auf maxBlankLines begrenzen
  const maxBlank = Math.max(0, opt.maxBlankLines);
  const withBlankPolicy: string[] = [];
  let blankRun = 0;
  for (const l of result) {
    if (l.trim() === "") {
      blankRun++;
      if (blankRun <= maxBlank) withBlankPolicy.push("");
    } else {
      blankRun = 0;
      withBlankPolicy.push(l);
    }
  }

  return withBlankPolicy.join("\n").replace(/\s+$/gm, "");
}

function renderBind(
  ast: BindAst,
  comment: string | null,
  commentPolicy: "auto" | number,
  maxKeyLen?: number
): string {
  if (ast.kind !== "bind") return "";

  const key = ast.key;
  const val = ast.value;

  // Standardisiere: immer Quotes erzwingen
  const keyOut = `"${escapeForQuotes(key)}"`;
  const valOut = `"${escapeForQuotes(val)}"`;

  const left = `bind ${keyOut}`;
  let padAfterKey = " ";
  if (typeof maxKeyLen === "number") {
    const need = Math.max(0, maxKeyLen - key.length);
    padAfterKey = " " + " ".repeat(need);
  }

  let line = `${left}${padAfterKey} ${valOut}`.replace(/ {2,}/g, " ");

  if (comment) {
    if (commentPolicy === "auto") {
      line += "  " + comment.replace(/^\s*\/\/\s*/, "// ");
    } else {
      // Mindest-Spalte sicherstellen (1-basiert)
      const target = Math.max(1, commentPolicy);
      const current = line.length + 1; // 1-basiert
      if (current < target) {
        line += " ".repeat(target - current);
      } else {
        line += "  ";
      }
      line += comment.replace(/^\s*\/\/\s*/, "// ");
    }
  }
  return line.trimEnd();
}
