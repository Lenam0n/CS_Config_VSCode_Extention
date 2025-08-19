// src/webview/visualizer/__tests__/visualizerHub.test.ts
import * as vscode from "~helper/vscode.test";
import { VisualizerHub } from "@webview/visualizerHub";

function installWebviewMocks() {
  (vscode.window as any).createWebviewPanel = jest.fn(
    (viewType: string, title: string) => {
      const webview = {
        html: "",
        cspSource: "vscode-resource://test",
        asWebviewUri: (uri: any) =>
          "vscode-resource://" + (uri?.fsPath ?? String(uri)),
        postMessage: jest.fn(async () => true),
        onDidReceiveMessage: jest.fn(),
      };
      return {
        viewType,
        title,
        webview,
        reveal: jest.fn(),
        onDidDispose: jest.fn(),
      };
    }
  );
}

describe("VisualizerHub", () => {
  beforeEach(() => installWebviewMocks());

  test("open(kind) erzeugt Panel pro Kind nur einmal, weitere Aufrufe nur reveal()", async () => {
    const ctx = {
      extensionPath: process.cwd(),
      extensionUri: vscode.Uri.file(process.cwd()),
      subscriptions: [],
    } as any;

    const hub = new VisualizerHub(ctx);

    // 1) heatmap zweimal
    await hub.open("heatmap");
    await hub.open("heatmap");

    // 2) andere drei Kinds je einmal
    await hub.open("radar");
    await hub.open("hud");
    await hub.open("crosshair");

    const calls = (vscode.window as any).createWebviewPanel as jest.Mock;
    const types = calls.mock.calls.map((c) => c[0]); // viewType = "csviz.<kind>"

    // heatmap nur einmal erstellt
    expect(types.filter((t: string) => t === "csviz.heatmap").length).toBe(1);
    // radar/hud/crosshair je einmal
    expect(types).toContain("csviz.radar");
    expect(types).toContain("csviz.hud");
    expect(types).toContain("csviz.crosshair");
  });
});
