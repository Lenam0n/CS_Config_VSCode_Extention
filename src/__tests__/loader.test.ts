import * as fs from "fs";
import * as path from "path";
import * as vscode from "~helper/vscode.test";
import { CommandDatabase } from "@/loader";

const tmpDir = path.join(process.cwd(), ".tmp-tests-loader");

function writeJson(p: string, data: any) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

describe("CommandDatabase", () => {
  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });
  afterAll(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test("loads bundled db (fallback) when no dataPath configured", async () => {
    // place a bundled data file at <context>/data/commands.json
    const ctx = new vscode.ExtensionContext(path.join(tmpDir, "ext"));
    const bundled = path.join(ctx.extPath, "data", "commands.json");
    writeJson(bundled, [
      { command: "bind", type: "cmd", flags: [], description: "" },
    ]);

    const db = new CommandDatabase(ctx as any);
    await db.init();

    expect(db.get("bind")!.command).toBe("bind");
    expect(db.has("missing")).toBe(false);
  });

  test("reload() triggers event on changes", async () => {
    (vscode.workspace.getConfiguration as any).mockImplementation(() => ({
      get: (k: string) =>
        k === "dataPath"
          ? path.join("data", "custom.json")
          : k === "languages"
          ? ["cs2cfg"]
          : "warning",
    }));

    const ctx = new vscode.ExtensionContext(path.join(tmpDir, "ext2"));
    const customPath = path.join(process.cwd(), "data", "custom.json");
    writeJson(customPath, [
      { command: "foo", type: "cmd", flags: [], description: "" },
    ]);
    const db = new CommandDatabase(ctx as any);
    const spy = jest.fn();
    db.onDidUpdate(spy);

    await db.init();
    expect(db.get("foo")).toBeTruthy();

    writeJson(customPath, [
      { command: "bar", type: "cmd", flags: [], description: "" },
    ]);
    await db.reload();
    expect(db.get("bar")).toBeTruthy();
    expect(spy).toHaveBeenCalled();
  });

  test("invalid JSON shape throws", async () => {
    (vscode.workspace.getConfiguration as any).mockImplementation(() => ({
      get: (k: string) =>
        k === "dataPath"
          ? path.join("data", "broken.json")
          : k === "languages"
          ? ["cs2cfg"]
          : "warning",
    }));
    const ctx = new vscode.ExtensionContext(path.join(tmpDir, "ext3"));
    const brokenPath = path.join(process.cwd(), "data", "broken.json");
    fs.mkdirSync(path.dirname(brokenPath), { recursive: true });
    fs.writeFileSync(brokenPath, '{"not":"array"}', "utf8");

    const db = new CommandDatabase(ctx as any);
    await expect(db.init()).rejects.toThrow(/kein Array|Array/i);
  });
});
