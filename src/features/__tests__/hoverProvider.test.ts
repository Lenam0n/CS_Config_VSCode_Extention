import * as vscode from "~helper/vscode.test";
import { registerHoverProvider } from "@feature/hoverProvider";
import { AliasIndex } from "@feature/aliasIndex";

const db = {
  get: (name: string) => {
    if (name === "bind")
      return {
        command: "bind",
        type: "cmd",
        flags: ["release"],
        description: "Bind a key",
      };
    if (name === "smile")
      return {
        command: "smile",
        type: "cmd",
        flags: [],
        description: "Smile :)",
      };
    return undefined;
  },
};

describe("hoverProvider", () => {
  test("shows command hover for recognized token", () => {
    const aliases = new AliasIndex();
    registerHoverProvider(db as any, ["cs2cfg"], aliases);

    const provider = vscode.__registry.hoverProvider!;
    const doc = {
      languageId: "cs2cfg",
      lineAt: () => ({ text: 'bind "e" "+use"' }),
    } as any;
    const h = provider.provideHover(doc, { line: 0, character: 0 });
    expect(h).toBeTruthy();
    // @ts-ignore
    expect(h.contents[0].value).toContain("**bind**");
    // @ts-ignore
    expect(h.contents[0].value).toContain("`cmd`");
  });

  test("shows alias hover with nested expansion and final command docs", () => {
    const aliases = new AliasIndex();
    const doc = {
      languageId: "cs2cfg",
      lineAt: (i: number) => ({
        text: i === 0 ? "alias jt smile; +attack" : "bind mouse3 jt",
      }),
    } as any;
    aliases.scan(doc as any);

    registerHoverProvider(db as any, ["cs2cfg"], aliases);
    const provider = vscode.__registry.hoverProvider!;

    // hover over usage in line 1 on 'jt'
    const line1 = (doc as any).lineAt(1).text as string;
    const col = line1.indexOf("jt") + 1;
    const h = provider.provideHover(doc, { line: 1, character: col });
    expect(h).toBeTruthy();
    // @ts-ignore
    const md = h.contents[0].value as string;
    expect(md).toContain("**alias jt**");
    expect(md).toContain("smile");
    expect(md).toContain("+attack");
    expect(md).toContain("Smile :)"); // from db
  });

  test("no hover for unknown tokens", () => {
    const aliases = new AliasIndex();
    registerHoverProvider(db as any, ["cs2cfg"], aliases);
    const provider = vscode.__registry.hoverProvider!;
    const doc = {
      languageId: "cs2cfg",
      lineAt: () => ({ text: "foo" }),
    } as any;
    expect(
      provider.provideHover(doc, { line: 0, character: 0 })
    ).toBeUndefined();
  });
});
