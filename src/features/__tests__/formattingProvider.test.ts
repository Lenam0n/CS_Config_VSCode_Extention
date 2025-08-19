import * as vscode from "~helper/vscode.test";
import { registerFormattingProvider } from "@/features/formattingProvider";
import {
  formatCfg,
  parseBind,
  splitCommentSmart,
  normalizeAliasValueSpacing,
} from "@/format/formatter";

describe("formatter internals", () => {
  test("splitCommentSmart respects // inside quotes", () => {
    const a = splitCommentSmart(`bind "k" "say //hello" // outside`);
    expect(a.code).toBe(`bind "k" "say //hello"`);
    expect(a.comment).toBe(`// outside`);

    const b = splitCommentSmart(`bind "k" "say \\"//\\" test"`);
    expect(b.code).toBe(`bind "k" "say \\"//\\" test"`);
    expect(b.comment).toBeNull();
  });

  test("parseBind handles quoted/unquoted keys & values", () => {
    const p1 = parseBind(`bind "e" "+use"`);
    expect(p1.kind).toBe("bind");
    if (p1.kind === "bind") {
      expect(p1.key).toBe("e");
      expect(p1.value).toBe("+use");
    }

    const p2 = parseBind(`  bind w +forward`);
    expect(p2.kind).toBe("bind");
    if (p2.kind === "bind") {
      expect(p2.key).toBe("w");
      expect(p2.value).toBe("+forward");
    }

    const p3 = parseBind(`echo "no bind"`);
    expect(p3.kind).toBe("other");
  });

  test("normalizeAliasValueSpacing only edits outside strings", () => {
    const s = `alias jt "+jump;-attack;  -attack2;   say \\"a;b\\"; -duck"`;
    const n = normalizeAliasValueSpacing(s);
    expect(n).toContain('+jump; -attack; -attack2; say \\"a;b\\"; -duck');
  });
});

describe("formatCfg end-to-end", () => {
  test("aligns bind groups, preserves comments, collapses blank lines, enforces quotes", () => {
    const src = [
      `// group 1`,
      `bind w +forward // move`,
      `bind "a" "+moveleft"`,
      `bind d  "+moveright"`,
      ``,
      `alias jt "+jump;-attack;-attack2" // test`,
      ``,
      `// group 2`,
      `bind "mouse1" +attack`,
      `bind mouse2 "+attack2" // alt`,
      `bind  "mouse3"    "player_ping"    `,
      ``,
      `bind "k" "say //hello" // outside`,
    ].join("\n");

    const out = formatCfg(src, {
      alignBinds: true,
      commentColumn: "auto",
      maxBlankLines: 1,
      formatAliasSpacing: true,
    });

    const lines = out.split("\n");

    // group 1 aligned: keys w,a,d -> align value column
    const g1 = lines.slice(1, 4);
    expect(g1[0]).toMatch(/^bind "w"\s+"\\\+forward"\s{2}\/\/ move$/);
    expect(g1[1]).toMatch(/^bind "a"\s+"\\\+moveleft"$/);
    expect(g1[2]).toMatch(/^bind "d"\s+"\\\+moveright"$/);

    // alias spacing normalized
    const aliasLine = lines[5];
    expect(aliasLine).toContain("+jump; -attack; -attack2"); // normalized
    expect(aliasLine).toContain("// test");

    // group 2 aligned independently
    const g2 = lines.slice(7, 10);
    expect(g2[0]).toMatch(/^bind "mouse1"\s+"\\\+attack"$/);
    expect(g2[1]).toMatch(/^bind "mouse2"\s+"\\\+attack2"\s{2}\/\/ alt$/);
    expect(g2[2]).toBe(`bind "mouse3" "player_ping"`);

    // comment inside quoted value remains part of value
    expect(lines[11]).toBe(`bind "k" "say //hello"  // outside`);

    // blank lines collapsed to max 1 between blocks
    expect(out).not.toMatch(/\n{3,}/);
  });
});

describe("provider wiring", () => {
  test("registers and returns a full-document replace edit only when content changes", () => {
    const disp = registerFormattingProvider(["cs2cfg"]);
    const provider = (vscode.__registry as any).formatProvider;
    expect(provider).toBeTruthy();

    const doc = {
      languageId: "cs2cfg",
      lineCount: 3,
      getText: () => `bind w +forward\n\n\n`,
    } as any;

    const edits = provider.provideDocumentFormattingEdits(doc, {
      insertSpaces: true,
      tabSize: 2,
    });
    expect(edits.length).toBe(1);
    expect(edits[0].type).toBe("replace");
    expect((edits[0] as any).newText).toBe(`bind "w" "\\+forward"\n`);
    disp.dispose();

    // If already formatted, no edits
    const doc2 = {
      languageId: "cs2cfg",
      lineCount: 1,
      getText: () => `bind "w" "\\+forward"\n`,
    } as any;
    const disp2 = registerFormattingProvider(["cs2cfg"]);
    const edits2 = (
      vscode.__registry as any
    ).formatProvider.provideDocumentFormattingEdits(doc2, {
      insertSpaces: true,
      tabSize: 2,
    });
    expect(edits2).toEqual([]);
    disp2.dispose();
  });
});
