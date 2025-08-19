// src/webview/visualizer/__tests__/basePanel.test.ts
import * as vscode from "~helper/vscode.test";
import { BaseVisualizerPanel } from "@webview/basePanel";

class DummyPanel extends BaseVisualizerPanel {
  public wired = false;
  constructor(ctx: any) {
    super(ctx, "hud", "Dummy");
  }
  protected getHtml(): string {
    return "<html><body>ok</body></html>";
  }
  protected wireMessages(): void {
    this.wired = true;
  }
}

function installWebviewMocks() {
  (vscode.window as any).createWebviewPanel = jest.fn(
    (viewType: string, title: string, _col: any, _opts: any) => {
      const webview = {
        html: "",
        cspSource: "vscode-resource://test",
        asWebviewUri: (uri: any) =>
          "vscode-resource://" + (uri?.fsPath ?? String(uri)),
        postMessage: jest.fn(async () => true),
        onDidReceiveMessage: jest.fn(),
      };
      const panel = {
        viewType,
        title,
        webview,
        reveal: jest.fn(),
        onDidDispose: (h: Function, _thisArg?: any, bucket?: any[]) => {
          bucket?.push({ dispose: jest.fn() });
          // nicht automatisch triggern
          return { dispose: jest.fn() };
        },
      };
      return panel;
    }
  );
}

describe("BaseVisualizerPanel", () => {
  beforeEach(() => {
    installWebviewMocks();
  });

  test("show() setzt HTML und ruft wireMessages()", () => {
    const ctx = {
      extensionPath: process.cwd(),
      extensionUri: vscode.Uri.file(process.cwd()),
      subscriptions: [],
    } as any;

    const p = new DummyPanel(ctx);
    p.show();

    const panel = p.asPanel() as any;
    expect(panel.webview.html).toContain("ok");
    expect(p.wired).toBe(true);
    expect(panel.reveal).toHaveBeenCalled();
  });

  test("webviewUri() nutzt asWebviewUri()", () => {
    const ctx = {
      extensionPath: process.cwd(),
      extensionUri: vscode.Uri.file(process.cwd()),
      subscriptions: [],
    } as any;

    const p = new DummyPanel(ctx);
    p.show();
    const uri = (p as any).webviewUri("media", "heatmap", "style.css");
    expect(String(uri)).toMatch(/^vscode-resource:\/\//);
  });

  test("dispose() disposed alle Disposables", () => {
    const ctx = {
      extensionPath: process.cwd(),
      extensionUri: vscode.Uri.file(process.cwd()),
      subscriptions: [],
    } as any;

    const p = new DummyPanel(ctx);
    // Fake-Disposable hineinschieben
    const d = { dispose: jest.fn() };
    (p as any).disposables.push(d);

    p.dispose();
    expect(d.dispose).toHaveBeenCalled();
    expect((p as any).disposables.length).toBe(0);
  });
});
