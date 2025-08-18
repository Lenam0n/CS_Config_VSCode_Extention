// __tests__/commands.generateConfigs.edge.test.ts

import * as path from "path";
import * as vscode from "~helper/vscode.test";

// --- Mock fs/promises BEFORE importing the module under test
const readFileMock = jest.fn<Promise<string>, [string, string]>();
jest.mock("fs/promises", () => ({
  __esModule: true,
  default: {},
  readFile: (...args: any[]) => (readFileMock as any)(...args),
}));

// Import after mocks
import {
  commandGenerateAutoexec,
  commandGenerateCrosshairCfg,
} from "@command/generateConfigs";

// Small helper
const utf8 = (data: Uint8Array) => new TextDecoder().decode(data);

describe("commands/generateConfigs (edge cases)", () => {
  beforeAll(() => {
    // Freeze time for deterministic banner timestamp
    jest.useFakeTimers().setSystemTime(new Date("2031-07-15T13:37:42.000Z"));
  });

  beforeEach(() => {
    // Reset vscode mocks per test
    (vscode.window.showSaveDialog as any).mockReset();
    (vscode.workspace.fs.writeFile as any).mockReset();
    (vscode.window.showInformationMessage as any).mockReset();
    (vscode.window.showTextDocument as any).mockReset();
    (vscode.workspace.textDocuments as any).length = 0;
    (readFileMock as any).mockReset();
  });

  const ctx = new vscode.ExtensionContext(
    path.join(process.cwd(), "test-ext-root")
  );

  test("autoexec: renders banners, ToC, sections in order, Notes; strips exec/script; writes & opens", async () => {
    // Arrange template with exec/script noise to ensure stripping
    const autoexecTemplate = {
      meta: {
        name: "CS2 AUTOEXEC",
        notes: [
          "Place any custom exec-chains in your own files; this template avoids 'exec' by design.",
          "Keep sections tidy. Use this as your clean baseline.",
        ],
        sectionsOrder: ["01", "02"],
        sectionsToc: {
          "01": "Core Settings",
          "02": "HUD & Viewmodel",
        },
      },
      sections: {
        "01": {
          title: "[01] Core Settings",
          lines: [
            'con_enable "1"',
            "EXEC something.cfg", // should be stripped (case-insensitive)
            'script print("bad")', // should be stripped
            'echo "[autoexec] Core Settings loaded"',
          ],
        },
        "02": {
          title: "[02] HUD & Viewmodel",
          lines: [
            'viewmodel_fov "68"',
            "exec another.cfg", // should be stripped
            'echo "[autoexec] HUD & Viewmodel loaded"',
          ],
        },
      },
    };

    // Mock fs readFile resolution path-sensitive
    (readFileMock as any).mockImplementation((absPath: string, enc: string) => {
      expect(enc).toBe("utf8");
      // We verify that path resolution uses the expected relative path
      if (
        absPath.endsWith(
          path.join("assets", "templates", "autoexec.template.json")
        )
      ) {
        return Promise.resolve(JSON.stringify(autoexecTemplate));
      }
      return Promise.reject(new Error("Unexpected path: " + absPath));
    });

    // Mock save dialog target
    const target = vscode.Uri.file("/tmp/autoexec.cfg");
    (vscode.window.showSaveDialog as any).mockResolvedValue(target);

    // Capture written bytes
    let written: Uint8Array | null = null;
    (vscode.workspace.fs.writeFile as any).mockImplementation(
      async (_uri: any, data: Uint8Array) => {
        written = data;
      }
    );

    // Act
    await commandGenerateAutoexec(ctx as any);

    // Assert write
    expect(vscode.workspace.fs.writeFile).toHaveBeenCalledTimes(1);
    expect(written).toBeTruthy();
    const content = utf8(written!);

    // Header banners & generated timestamp (fixed from fake timers)
    expect(content).toContain("CS2 AUTOEXEC — generated 2031-07-15 13:37");
    // ToC lines present and ordered
    const idxCore = content.indexOf("[01] Core Settings");
    const idxHud = content.indexOf("[02] HUD & Viewmodel");
    expect(idxCore).toBeGreaterThan(-1);
    expect(idxHud).toBeGreaterThan(idxCore);

    // Notes included
    expect(content).toContain("Notes:");
    expect(content).toContain("Keep sections tidy.");

    // Forbidden lines removed
    expect(content).not.toMatch(/^\s*exec\s+.+\.cfg/im);
    expect(content).not.toMatch(/^\s*script\b/im);

    // Section titles and echoes present
    expect(content).toContain("// [01] Core Settings");
    expect(content).toContain('echo "[autoexec] Core Settings loaded"');
    expect(content).toContain("// [02] HUD & Viewmodel");

    // Editor feedback
    expect(vscode.window.showTextDocument).toHaveBeenCalledTimes(1);
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      "autoexec.cfg erstellt."
    );
  });

  test('autoexec: template WITHOUT notes is rendered gracefully (no "Notes:" header)', async () => {
    const autoexecNoNotes = {
      meta: {
        name: "CS2 AUTOEXEC",
        sectionsOrder: ["01"],
        sectionsToc: { "01": "Core Settings" },
      },
      sections: {
        "01": { title: "[01] Core Settings", lines: ['echo "ok"'] },
      },
    };
    (readFileMock as any).mockImplementation((absPath: string) => {
      if (
        absPath.endsWith(
          path.join("assets", "templates", "autoexec.template.json")
        )
      ) {
        return Promise.resolve(JSON.stringify(autoexecNoNotes));
      }
      return Promise.reject(new Error("Unexpected path"));
    });

    const target = vscode.Uri.file("/tmp/autoexec-no-notes.cfg");
    (vscode.window.showSaveDialog as any).mockResolvedValue(target);

    let written: Uint8Array | null = null;
    (vscode.workspace.fs.writeFile as any).mockImplementation(
      async (_u: any, data: Uint8Array) => {
        written = data;
      }
    );

    await commandGenerateAutoexec(ctx as any);

    const content = utf8(written!);
    expect(content).not.toContain("Notes:");
    expect(content).toContain("// [01] Core Settings");
    expect(content).toContain('echo "ok"');
  });

  test("crosshair: renders banner & notes; strips exec/script; writes & opens", async () => {
    const crosshairTpl = {
      meta: {
        name: "CS2 CROSSHAIR",
        notes: ["Import this via: exec crosshair.cfg"],
      },
      lines: [
        "cl_crosshairstyle 5",
        "exec secrets.cfg", // stripped
        "script nope", // stripped
        'echo "Crosshair geladen!"',
      ],
    };

    (readFileMock as any).mockImplementation((absPath: string, enc: string) => {
      if (
        absPath.endsWith(
          path.join("assets", "templates", "crosshair.template.json")
        )
      ) {
        return Promise.resolve(JSON.stringify(crosshairTpl));
      }
      return Promise.reject(new Error("Unexpected path: " + absPath));
    });

    const target = vscode.Uri.file("/tmp/crosshair.cfg");
    (vscode.window.showSaveDialog as any).mockResolvedValue(target);

    let written: Uint8Array | null = null;
    (vscode.workspace.fs.writeFile as any).mockImplementation(
      async (_u: any, data: Uint8Array) => {
        written = data;
      }
    );

    await commandGenerateCrosshairCfg(ctx as any);

    const content = utf8(written!);
    expect(content).toContain("CS2 CROSSHAIR — generated 2031-07-15 13:37");
    expect(content).toContain("Import this via: exec crosshair.cfg");
    expect(content).toContain("cl_crosshairstyle 5");
    expect(content).toContain('echo "Crosshair geladen!"');
    expect(content).not.toMatch(/^\s*exec\s+.+\.cfg/im);
    expect(content).not.toMatch(/^\s*script\b/im);

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      "crosshair.cfg erstellt."
    );
    expect(vscode.window.showTextDocument).toHaveBeenCalledTimes(1);
  });

  test("cancel save dialog → no write, no open, no info", async () => {
    (vscode.window.showSaveDialog as any).mockResolvedValue(undefined);
    await commandGenerateAutoexec(ctx as any);
    expect(vscode.workspace.fs.writeFile).not.toHaveBeenCalled();
    expect(vscode.window.showTextDocument).not.toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
  });

  test("forbidden matcher edge-cases: spacing & case-insensitive match; keep similar words", async () => {
    const autoexecTemplate = {
      meta: {
        name: "CS2 AUTOEXEC",
        sectionsOrder: ["01"],
        sectionsToc: { "01": "Core" },
      },
      sections: {
        "01": {
          title: "[01] Core",
          lines: [
            "  EXEC    some/Path/To/Thing.cfg   ", // stripped
            "exec\tconfigs/test.cfg", // stripped (tab)
            'execsauce "should stay"', // NOT stripped
            'scripting "should stay"', // NOT stripped (not starting with "script ")
            "script", // stripped
            'echo "done"',
          ],
        },
      },
    };

    (readFileMock as any).mockImplementation((absPath: string) => {
      if (
        absPath.endsWith(
          path.join("assets", "templates", "autoexec.template.json")
        )
      ) {
        return Promise.resolve(JSON.stringify(autoexecTemplate));
      }
      return Promise.reject(new Error("Unexpected path"));
    });

    const target = vscode.Uri.file("/tmp/autoexec-forbidden-edge.cfg");
    (vscode.window.showSaveDialog as any).mockResolvedValue(target);

    let written: Uint8Array | null = null;
    (vscode.workspace.fs.writeFile as any).mockImplementation(
      async (_u: any, data: Uint8Array) => {
        written = data;
      }
    );

    await commandGenerateAutoexec(ctx as any);
    const content = utf8(written!);

    expect(content).not.toMatch(/^\s*exec\s+.+\.cfg/im);
    expect(content).not.toMatch(/^\s*script\b/im);
    // These lines should remain
    expect(content).toContain('execsauce "should stay"');
    expect(content).toContain('scripting "should stay"');
    expect(content).toContain('echo "done"');
  });

  test("resolves template files via context.asAbsolutePath (path assertion)", async () => {
    // Spy on context.asAbsolutePath to ensure correct relative path is requested
    const spy = jest.spyOn(ctx, "asAbsolutePath");

    const autoexecTemplate = {
      meta: {
        name: "CS2 AUTOEXEC",
        sectionsOrder: ["01"],
        sectionsToc: { "01": "Core" },
      },
      sections: { "01": { title: "[01] Core", lines: ['echo "ok"'] } },
    };

    (readFileMock as any).mockImplementation((absPath: string) => {
      if (
        absPath.endsWith(
          path.join("assets", "templates", "autoexec.template.json")
        )
      ) {
        return Promise.resolve(JSON.stringify(autoexecTemplate));
      }
      return Promise.reject(new Error("Unexpected path"));
    });

    (vscode.window.showSaveDialog as any).mockResolvedValue(
      vscode.Uri.file("/tmp/autoexec-path.cfg")
    );
    (vscode.workspace.fs.writeFile as any).mockImplementation(async () => {});

    await commandGenerateAutoexec(ctx as any);

    expect(spy).toHaveBeenCalledWith(
      path.join("assets", "templates", "autoexec.template.json")
    );
    spy.mockRestore();
  });
});
