// src/util/text.ts

import { TokenHit } from "@/types";

/**
 * Zeile ist Kommentar?
 * Unterstützt `//` und `#` am Zeilenanfang (ignoring leading whitespace).
 */
export function isCommentLine(text: string): boolean {
  const t = text.trimStart();
  return t.startsWith("//") || t.startsWith("#");
}

/**
 * Erstes "Token" am Zeilenanfang (ohne Alias-/Bind-Präfixe),
 * nützlich für Hover/Diagnostics, die nur das erste Wort betrachten.
 *
 * Token-Regel: [A-Za-z0-9_.]+
 * Gibt Start-/End-Offset relativ zur Zeile zurück.
 */
export function firstToken(line: string): TokenHit | null {
  if (!line || isCommentLine(line)) return null;

  // Nur "Wort" am Zeilenanfang (ohne + - ~ Präfix),
  // damit echte Befehle wie 'alias', 'bind', 'r_fullscreen_gamma' etc. getroffen werden.
  const m = line.match(/^\s*([A-Za-z0-9_.]+)/);
  if (!m) return null;

  const token = m[1];
  // indexOf ist sicher, da m[1] aus line stammt
  const start = line.indexOf(token);
  const end = start + token.length;
  return { token, start, end };
}

/**
 * Token an der Cursor-Position innerhalb einer Zeile.
 * Erkennt optionales Präfix (+ | - | ~) direkt links vom Token,
 * z. B. "+attack", "-duck", "~somealias".
 *
 * Token-Regel: Präfix? + [A-Za-z0-9_.]+
 * Gibt Start-/End-Offset relativ zur Zeile zurück.
 *
 * @param text Komplette Zeile
 * @param ch   Zeichenindex (0…text.length). Ist ch zwischen Zeichen,
 *             wird zuerst das linke Zeichen als Bezug genommen.
 */
export function tokenAt(text: string, ch: number): TokenHit | null {
  if (!text) return null;
  if (ch < 0) ch = 0;
  if (ch > text.length) ch = text.length;

  const isWord = (c: string) => /[A-Za-z0-9_.]/.test(c);

  // Wenn Cursor genau auf einem Wortzeichen steht, nimm dieses,
  // andernfalls nutze das Zeichen links davon (falls vorhanden).
  let i = ch;
  if (i > 0 && (i === text.length || !isWord(text[i]))) {
    i--;
  }

  // Falls weder links noch rechts Wort/Präfix zu finden ist: kein Token
  const near =
    (i >= 0 && i < text.length ? text[i] : "") +
    (i + 1 < text.length ? text[i + 1] : "");
  if (
    !(
      i >= 0 &&
      i < text.length &&
      (isWord(text[i]) || /[+\-~]/.test(text[i]))
    ) &&
    !(/[+\-~]/.test(near[0]) && isWord(near[1] ?? ""))
  ) {
    return null;
  }

  // Nach links laufen bis zum Wortanfang
  let s = i;
  while (s > 0 && isWord(text[s - 1])) s--;

  // Optionales Präfix direkt vor dem Wort einbeziehen
  if (s > 0 && /[+\-~]/.test(text[s - 1])) s--;

  // Nach rechts laufen bis zum Wortende
  let e = i;
  while (e < text.length && isWord(text[e])) e++;

  // Falls Cursor ursprünglich genau vor dem ersten Wortzeichen lag (zwischen Präfix und Wort),
  // stelle sicher, dass das Wort selbst eingefangen wird.
  if (e === s && s < text.length && isWord(text[s])) {
    while (e < text.length && isWord(text[e])) e++;
  }

  const raw = text.slice(s, e);
  const token = raw.trim();
  if (!token) return null;

  return { token, start: s, end: e };
}
