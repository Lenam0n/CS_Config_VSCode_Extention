import { runLinter } from "@/lint/runner";
import { AliasIndex } from "@feature/aliasIndex";

const makeDoc = (text: string) =>
  ({
    getText: () => text,
    lineCount: text.split(/\r?\n/).length,
    lineAt: (i: number) => ({ text: text.split(/\r?\n/)[i] }),
  } as any);

describe("lint runner & rules", () => {
  test("flags exec/script lines, duplicate binds, alias spacing, cycles & unused", () => {
    const text = [
      "exec my.cfg",
      "script what",
      'bind "e" "+use"',
      'bind "e" "+reload" // duplicate',
      "alias a b; c;d",
      "alias b c",
      "alias c a", // cycle
      "alias lonely +attack",
    ].join("\n");

    const doc = makeDoc(text);
    const idx = new AliasIndex();
    idx.scan({
      languageId: "cs2cfg",
      getText: () => text,
      lineCount: 8,
      lineAt: (i: number) => ({ text: text.split("\n")[i] }),
    } as any);

    const findings = runLinter(doc, idx);
    const byRule = (id: string) => findings.filter((f) => f.ruleId === id);

    expect(byRule("exec-script-forbidden").length).toBe(2);
    expect(byRule("duplicate-bind-key").length).toBe(1);
    expect(byRule("alias-spacing").length).toBe(1);
    expect(byRule("alias-cycle").length).toBe(1);
    expect(byRule("alias-unused").some((f) => /lonely/.test(f.message))).toBe(
      true
    );
  });
});
