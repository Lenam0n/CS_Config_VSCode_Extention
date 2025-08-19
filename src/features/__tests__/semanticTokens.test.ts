// src/features/__tests__/semanticTokens.test.ts
import * as fs from "fs";
import * as path from "path";
import * as vscode from "~helper/vscode.test";
import { CommandDatabase } from "@/loader";
import { registerSemanticTokens } from "@/features/semanticTokens";
import { AliasIndex } from "@feature/aliasIndex";

const tmpDir = path.join(process.cwd(), ".tmp-tests-semantic");

function writeJson(p: string, data: any) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

describe("semantic tokens provider", () => {
  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test("registers provider and emits tokens for known commands/cvars/aliases", async () => {
    // ExtensionContext mit echter URI (Mock versteht extensionUri)
    const extUri = vscode.Uri.file(path.join(tmpDir, "ext"));
    const ctx = new vscode.ExtensionContext(extUri);

    // Bundled DB unter <ext>/data/commands.json bereitstellen
    const bundled = path.join(ctx.extPath, "data", "commands.json");
    writeJson(bundled, [
      { command: "bind", type: "cmd", flags: [], description: "Bind a key" },
      {
        command: "alias",
        type: "cmd",
        flags: [],
        description: "Define an alias",
      },
      {
        command: "cl_radar_scale",
        type: "float",
        flags: ["cl"],
        description: "Radar scale",
      },
    ]);

    // DB initialisieren
    const db = new CommandDatabase(ctx as any);
    await db.init();

    // AliasIndex vorbereiten
    const aliasIndex = new AliasIndex();

    // Provider registrieren
    const disp = registerSemanticTokens(db, ["cs2cfg"], aliasIndex);

    // Test-Dokument
    const text = [
      'bind "k" "+attack"',
      'cl_radar_scale "0.85"',
      'alias jt "+jump; -attack; -attack2"',
    ].join("\n");

    const doc = {
      uri: vscode.Uri.file(path.join(tmpDir, "sample.cfg")),
      languageId: "cs2cfg",
      getText: () => text,
      lineCount: text.split(/\r?\n/).length,
      lineAt: (i: number) => ({ text: text.split(/\r?\n/)[i] }),
    } as any;

    // Aliase scannen (für Kontexte, falls Provider sie nutzt)
    aliasIndex.scan(doc);

    // Provider & Legend aus Registry holen (Mock speichert diese)
    const reg = (vscode.__registry as any).semanticProvider;
    expect(reg).toBeTruthy();
    const provider = reg.provider as {
      provideDocumentSemanticTokens: (d: any, _t?: any) => any;
    };
    const legend = reg.legend as vscode.SemanticTokensLegend;
    expect(Array.isArray(legend.tokenTypes)).toBe(true);
    expect(legend.tokenTypes.length).toBeGreaterThan(0);

    // Tokens anfordern
    const res = await provider.provideDocumentSemanticTokens(doc, undefined);
    // Unser Mock-Bilder gibt { data: Array<{ line,startChar,length,type,mods }> } zurück
    expect(res).toBeTruthy();
    const tokens = (res as any).data as Array<{
      line: number;
      startChar: number;
      length: number;
      type: string;
    }>;
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);

    // Sanity-Checks: Es sollte mind. ein Token in jeder der 3 Zeilen geben
    const linesCovered = new Set(tokens.map((t) => t.line));
    expect(linesCovered.has(0)).toBe(true); // bind-Zeile
    expect(linesCovered.has(1)).toBe(true); // cvar-Zeile
    expect(linesCovered.has(2)).toBe(true); // alias-Zeile

    // Optional: Prüfen, dass Token-Typen aus der Legend kommen
    const allTypesInLegend = tokens.every((t) =>
      legend.tokenTypes.includes(t.type)
    );
    expect(allTypesInLegend).toBe(true);

    // Aufräumen
    disp.dispose();
  });

  test("does not emit tokens for non-matching language ids", async () => {
    const extUri = vscode.Uri.file(path.join(tmpDir, "ext2"));
    const ctx = new vscode.ExtensionContext(extUri);

    // DB mit minimalem Inhalt
    const bundled = path.join(ctx.extPath, "data", "commands.json");
    writeJson(bundled, [
      { command: "bind", type: "cmd", flags: [], description: "" },
    ]);

    const db = new CommandDatabase(ctx as any);
    await db.init();

    const aliasIndex = new AliasIndex();
    const disp = registerSemanticTokens(db, ["cs2cfg"], aliasIndex);

    const text = 'bind "k" "+attack"';
    const doc = {
      uri: vscode.Uri.file(path.join(tmpDir, "other.txt")),
      languageId: "plaintext", // nicht aktiviert
      getText: () => text,
      lineCount: 1,
      lineAt: (_i: number) => ({ text }),
    } as any;

    const reg = (vscode.__registry as any).semanticProvider;
    const provider = reg.provider as {
      provideDocumentSemanticTokens: (d: any, _t?: any) => any;
    };
    const res = await provider.provideDocumentSemanticTokens(doc, undefined);

    // Viele Provider geben dann einfach keine Tokens zurück – unser Mock-Builder
    // produziert in diesem Fall nichts. Wir erlauben entweder leere Liste oder undefined.
    if (res) {
      const tokens = (res as any).data as any[];
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBe(0);
    } else {
      expect(res).toBeFalsy();
    }

    disp.dispose();
  });
});
