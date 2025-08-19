import * as vscode from "~helper/vscode.test";
import { commandImportCrosshairFromShareCode } from "@/commands/crosshairImport";
import { decodeShareCodeToSettings } from "@/utils/crosshairShareCode";

jest.mock("@/utils/crosshairShareCode", () => {
  const actual = jest.requireActual("@/utils/crosshairShareCode");
  return {
    ...actual,
    // wir lassen Validierung/Normalisierung real laufen
    decodeShareCodeToSettings: jest.fn(actual.decodeShareCodeToSettings),
  };
});

describe("commandImportCrosshairFromShareCode", () => {
  beforeEach(() => {
    (vscode.window.showInputBox as any).mockReset();
    (vscode.window.showQuickPick as any).mockReset();
    (vscode.window.showSaveDialog as any).mockReset();
    (vscode.window.showTextDocument as any).mockReset();
    (vscode.window.showInformationMessage as any).mockReset();
    (vscode.workspace.fs.writeFile as any).mockReset();
  });

  test("known code → renders CVars and inserts into current document", async () => {
    (vscode.window.showInputBox as any).mockResolvedValue(
      "CSGO-eMEzp-hfW4f-3b9tt-6iRs3-sLNMB"
    );
    (vscode.window.showQuickPick as any).mockResolvedValue({
      id: "insert",
      label: "",
    });
    const editor = {
      selection: { active: { line: 0, character: 0 } },
      insertSnippet: jest.fn(async () => {}),
    };
    (vscode.window as any).activeTextEditor = editor;

    await commandImportCrosshairFromShareCode({} as any);

    expect(editor.insertSnippet).toHaveBeenCalled();
    const content = (editor.insertSnippet as jest.Mock).mock.calls[0][0]
      .value as string;
    expect(content).toContain("cl_crosshairstyle 5");
    expect(content).toContain("cl_crosshairthickness 0.5");
    expect(content).toContain(
      "apply_crosshair_code CSGO-eMEZP-HFW4F-3B9TT-6IRS3-SLNMB"
    );
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      "Crosshair aus Share-Code eingefügt."
    );
  });

  test("unknown code → fallback with apply_crosshair_code and file creation", async () => {
    (vscode.window.showInputBox as any).mockResolvedValue(
      "CSGO-AAAAA-BBBBB-CCCCC-DDDDD-EEEEE"
    );
    (decodeShareCodeToSettings as jest.Mock).mockResolvedValue(null); // force unknown
    (vscode.window.showQuickPick as any).mockResolvedValue({
      id: "file",
      label: "",
    });
    const uri = vscode.Uri.file("/tmp/crosshair.cfg");
    (vscode.window.showSaveDialog as any).mockResolvedValue(uri);
    (vscode.workspace.fs.writeFile as any).mockImplementation(async () => {});

    await commandImportCrosshairFromShareCode({} as any);

    expect(vscode.workspace.fs.writeFile).toHaveBeenCalled();
    const data = (vscode.workspace.fs.writeFile as jest.Mock).mock
      .calls[0][1] as Uint8Array;
    const text = new TextDecoder().decode(data);
    expect(text).toContain(
      "apply_crosshair_code CSGO-AAAAA-BBBBB-CCCCC-DDDDD-EEEEE"
    );
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      "crosshair.cfg (Fallback) erstellt."
    );
  });

  test("validation rejects invalid format", async () => {
    (vscode.window.showInputBox as any).mockResolvedValue("not-a-code");
    // Die Validierung in showInputBox verhindert OK – also wird QuickPick nicht geöffnet
    await commandImportCrosshairFromShareCode({} as any);
    expect(vscode.window.showQuickPick).not.toHaveBeenCalled();
  });
});
