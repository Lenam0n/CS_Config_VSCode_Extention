import * as vscode from "~helper/vscode.test";
import { registerCompletionProvider } from "@feature/completionProvider";
import { AliasIndex } from "@feature/aliasIndex";

const db = {
  getAll: () => [
    {
      command: "bind",
      type: "cmd",
      flags: ["release"],
      description: "Bind a key",
    },
    {
      command: "r_fullscreen_gamma",
      type: "number",
      default: 2.2,
      flags: ["a"],
      description: "Gamma",
    },
  ],
};

describe("completionProvider", () => {
  test("provides command and alias items", () => {
    const aliases = new AliasIndex();
    const doc = {
      languageId: "cs2cfg",
      lineCount: 1,
      lineAt: () => ({ text: "b" }),
    } as any;
    aliases.scan({
      ...doc,
      lineAt: () => ({ text: "alias jt +jump; -attack" }),
    } as any);

    registerCompletionProvider(db as any, ["cs2cfg"], aliases);

    const provider = vscode.__registry.completionProvider!;
    const list = provider.provideCompletionItems(doc, {
      line: 0,
      character: 1,
    });
    const items = (list.items ?? list) as any[];

    const labels = items.map((i) => i.label);
    expect(labels).toContain("bind");
    expect(labels).toContain("r_fullscreen_gamma");
    expect(labels).toContain("jt"); // alias
  });

  test("skips comments", () => {
    const aliases = new AliasIndex();
    registerCompletionProvider(db as any, ["cs2cfg"], aliases);
    const provider = vscode.__registry.completionProvider!;
    const doc = {
      languageId: "cs2cfg",
      lineCount: 1,
      lineAt: () => ({ text: " // comment" }),
    } as any;
    const list = provider.provideCompletionItems(doc, {
      line: 0,
      character: 0,
    });
    expect(list).toBeUndefined();
  });
});
