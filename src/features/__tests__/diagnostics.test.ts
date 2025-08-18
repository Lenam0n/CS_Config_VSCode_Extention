import * as vscode from "~helper/vscode.test";
import { createDiagnostics } from "@feature/diagnostics";
import { AliasIndex } from "@feature/aliasIndex";
import { makeDoc } from "~helper/doc.test";

const db = {
  has: (n: string) => n === "bind" || n === "r_fullscreen_gamma",
  onDidUpdate: (cb: any) => ({ dispose: () => {} }),
};

describe("diagnostics", () => {
  test("flags unknown first tokens as diagnostics", () => {
    const aliases = new AliasIndex();
    const disp = createDiagnostics(db as any, ["cs2cfg"], aliases);
    const doc = makeDoc(["foo 1", 'bind "e" "+use"']);
    vscode.__emitOpen(doc as any);

    const coll = vscode.__registry.diagnosticsCollection.get("cs-commands");
    expect(coll.set).toHaveBeenCalled();
    const lastCall = (coll.set as jest.Mock).mock.calls.pop();
    const [_uri, diags] = lastCall;
    expect(diags.length).toBe(1);
    expect(diags[0].message).toContain('Unbekannter Command oder Alias: "foo"');
    disp.dispose();
  });

  test("does not flag when token is known alias", () => {
    const aliases = new AliasIndex();
    const disp = createDiagnostics(db as any, ["cs2cfg"], aliases);

    const doc = makeDoc(["alias jt +attack", "jt"]);
    vscode.__emitOpen(doc as any); // triggers alias scan + refresh

    const coll = vscode.__registry.diagnosticsCollection.get("cs-commands");
    const lastCall = (coll.set as jest.Mock).mock.calls.pop();
    const [_uri, diags] = lastCall;
    expect(diags.length).toBe(0);
    disp.dispose();
  });

  test("respects enableDiagnostics = off", () => {
    (vscode.workspace.getConfiguration as any).mockImplementation(() => ({
      get: (k: string) =>
        k === "enableDiagnostics" ? "off" : k === "languages" ? ["cs2cfg"] : "",
    }));
    const aliases = new AliasIndex();
    const disp = createDiagnostics(db as any, ["cs2cfg"], aliases);
    const doc = makeDoc(["foo"]);
    vscode.__emitOpen(doc as any);

    const coll = vscode.__registry.diagnosticsCollection.get("cs-commands");
    // when off, we delete the URI
    expect(coll.delete).toHaveBeenCalled();
    disp.dispose();
  });
});
