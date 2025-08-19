import * as vscode from "~helper/vscode.test";
import { registerLinting } from "@/features/lintDiagnostics";
import { AliasIndex } from "@feature/aliasIndex";

describe("lint diagnostics & code actions", () => {
  test("publishes diagnostics and provides quick fixes", () => {
    const text = [
      'bind "k" "+use"',
      'bind "k" "+attack" // duplicate',
      'alias jt "+jump;-attack;-attack2"',
      "exec bad.cfg",
    ].join("\n");

    const doc = {
      uri: vscode.Uri.file("/tmp/test.cfg"),
      languageId: "cs2cfg",
      getText: () => text,
      lineCount: 4,
      lineAt: (i: number) => ({ text: text.split("\n")[i] }),
    } as any;

    const idx = new AliasIndex();
    idx.scan(doc);

    const disp = registerLinting(idx, ["cs2cfg"]);

    vscode.__emitOpen(doc);
    const dc = vscode.__registry.diagnosticsCollection.get("cs-commands-lint");
    expect(dc.set).toHaveBeenCalled();

    // simulate CodeAction retrieval
    const caProvider = (vscode.__registry as any).codeActionProvider;
    const diagsArg = (dc.set as jest.Mock).mock.calls.pop()[1] as any[];
    const actions = caProvider.provideCodeActions(
      doc,
      new vscode.Range(0, 0, 0, 0),
      { diagnostics: diagsArg }
    );

    // expect at least one "Comment out this line" fix
    const labels = actions.map((a: any) => a.title);
    expect(labels.some((t: string) => /Comment out this line/.test(t))).toBe(
      true
    );

    disp.dispose();
  });
});
