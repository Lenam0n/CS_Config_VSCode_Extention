import { AliasMap, AliasResolution } from "@/types";
import * as vscode from "vscode";

const ALIAS_RE =
  /^\s*alias\s+(?:"([^"]+)"|([^\s"]+))\s+(?:"((?:[^"\\]|\\.)*)"|(.+))\s*$/i;

function unescapeQuoted(s: string): string {
  return s.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

function stripOuterQuotes(s: string): string {
  const t = s.trim();
  if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1);
  return t;
}

/** Zerlegt einen Alias-Value in einzelne Befehl-Segmente (durch ';' getrennt) */
function splitSegments(value: string): string[] {
  return value
    .split(";")
    .map((s) => stripOuterQuotes(s).trim())
    .filter(Boolean);
}

/** Extrahiert den "ersten Token" eines Segments (inkl. + / - Präfix) */
function firstTokenLoose(segment: string): string | null {
  const m = segment.match(/^\s*([+\-~]?[A-Za-z0-9_.]+)/);
  return m ? m[1] : null;
}

export class AliasIndex {
  private byDoc = new Map<string, AliasMap>();
  private _onDidUpdate = new vscode.EventEmitter<vscode.TextDocument>();
  public onDidUpdate = this._onDidUpdate.event;

  /** Vollständigen Index für ein Dokument bauen */
  public scan(doc: vscode.TextDocument) {
    if (doc.languageId !== "cs2cfg") return;
    const key = doc.uri.toString();
    const map: AliasMap = new Map();

    for (let i = 0; i < doc.lineCount; i++) {
      const line = doc.lineAt(i).text;
      const m = line.match(ALIAS_RE);
      if (!m) continue;
      const name = (m[1] ?? m[2] ?? "").trim();
      const rawVal = (m[3] ?? m[4] ?? "").trim();
      if (!name) continue;
      const value = m[3] ? unescapeQuoted(rawVal) : rawVal;
      map.set(name, value);
    }

    this.byDoc.set(key, map);
    this._onDidUpdate.fire(doc);
  }

  public clear(doc: vscode.TextDocument) {
    const key = doc.uri.toString();
    this.byDoc.delete(key);
    this._onDidUpdate.fire(doc);
  }

  public getMap(doc: vscode.TextDocument): AliasMap {
    return this.byDoc.get(doc.uri.toString()) ?? new Map();
  }

  public isAlias(doc: vscode.TextDocument, name: string): boolean {
    return this.getMap(doc).has(name);
  }

  public getValue(doc: vscode.TextDocument, name: string): string | undefined {
    return this.getMap(doc).get(name);
  }

  /** Verschachtelte Auflösung mit Cycle-Erkennung und Tiefe-Limit */
  public resolve(
    doc: vscode.TextDocument,
    name: string,
    maxDepth = 32
  ): AliasResolution | undefined {
    const amap = this.getMap(doc);
    if (!amap.has(name)) return undefined;

    const steps: string[] = [];
    const immediate = splitSegments(amap.get(name)!);

    const flattened: string[] = [];
    const seen = new Set<string>();
    let cycle: string[] | undefined;

    const visit = (token: string, depth: number) => {
      if (depth > maxDepth) return; // Abbruch bei exzessiver Tiefe
      // Entferne +/-
      const bare = token.replace(/^[+\-~]/, "");
      if (amap.has(bare)) {
        if (seen.has(bare)) {
          // Zyklus
          const idx = steps.indexOf(bare);
          cycle = idx >= 0 ? steps.slice(idx).concat(bare) : [bare, bare];
          return;
        }
        seen.add(bare);
        steps.push(bare);
        const val = amap.get(bare)!;
        const segs = splitSegments(val);
        for (const seg of segs) {
          const t = firstTokenLoose(seg);
          if (!t) continue;
          visit(t, depth + 1);
          if (cycle) return;
        }
      } else {
        // Terminaler Befehl
        flattened.push(token);
      }
    };

    for (const seg of immediate) {
      const t = firstTokenLoose(seg);
      if (!t) continue;
      visit(t, 1);
      if (cycle) break;
    }

    return { steps, flattened, immediateSegments: immediate, cycle };
  }
}
