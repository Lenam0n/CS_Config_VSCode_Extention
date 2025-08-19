// src/webview/visualizer/__tests__/radarPanel.test.ts
import * as vscode from "~helper/vscode.test";
import { RadarPanel } from "@webview/radarPanel";

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

describe("RadarPanel", () => {
  beforeEach(() => installWebviewMocks());

  test("getHtml enthält Überschrift und CSP", () => {
    const ctx = {
      extensionPath: process.cwd(),
      extensionUri: vscode.Uri.file(process.cwd()),
      subscriptions: [],
    } as any;

    const panel = new RadarPanel(ctx);
    panel.show();
    const html = (panel.asPanel() as any).webview.html;
    expect(html).toContain("Radar Preview");
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("cl_radar_");
  });
});
