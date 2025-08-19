// src/webview/visualizer/__tests__/hudPanel.test.ts
import * as vscode from "~helper/vscode.test";
import { HudPanel } from "@webview/hudPanel";

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

describe("HudPanel", () => {
  beforeEach(() => installWebviewMocks());

  test("getHtml enthält Überschrift und CSP", () => {
    const ctx = {
      extensionPath: process.cwd(),
      extensionUri: vscode.Uri.file(process.cwd()),
      subscriptions: [],
    } as any;

    const panel = new HudPanel(ctx);
    panel.show();
    const html = (panel.asPanel() as any).webview.html;
    expect(html).toContain("HUD Preview");
    expect(html).toContain("Content-Security-Policy");
  });
});
