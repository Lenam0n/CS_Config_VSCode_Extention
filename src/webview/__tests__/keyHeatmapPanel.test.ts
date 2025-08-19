// src/webview/visualizer/__tests__/keyHeatmapPanel.test.ts
import * as vscode from "~helper/vscode.test";
import { KeyHeatmapPanel } from "@webview/keyHeatmapPanel";

function installWebviewMocks() {
  (vscode as any).ColorThemeKind = { Light: 1, Dark: 2 };
  (vscode.window as any).activeColorTheme = {
    kind: (vscode as any).ColorThemeKind.Dark,
  };

  (vscode.window as any).onDidChangeActiveColorTheme = jest.fn((_h: any) => ({
    dispose: jest.fn(),
  }));

  (vscode.window as any).createWebviewPanel = jest.fn(
    (viewType: string, title: string) => {
      const webview = {
        html: "",
        cspSource: "vscode-resource://test",
        asWebviewUri: (uri: any) =>
          "vscode-resource://" + (uri?.fsPath ?? String(uri)),
        postMessage: jest.fn(async () => true),
        // Für Message-Wiring benötigen wir einen Speicher für Handler:
        _handler: null as any,
        onDidReceiveMessage(this: any, h: any) {
          this._handler = h;
          return { dispose: jest.fn() };
        },
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

function makeDoc(text: string) {
  const lines = text.split(/\r?\n/);
  return {
    getText: () => text,
    lineCount: lines.length,
    lineAt: (i: number) => ({ text: lines[i] }),
  } as any;
}

describe("KeyHeatmapPanel", () => {
  beforeEach(() => installWebviewMocks());

  test("collectBindingsFrom: letztes Vorkommen gewinnt, Kommentare ignoriert", () => {
    const ctx = {
      extensionPath: process.cwd(),
      extensionUri: vscode.Uri.file(process.cwd()),
      subscriptions: [],
    } as any;

    const panel = new KeyHeatmapPanel(ctx);
    const doc = makeDoc(
      [
        'bind "e" "+use"',
        'bind "e" "+attack" // späterer override',
        'bind "f" "+lookatweapon" // ok',
        'alias jt "+jump; -attack"',
        '// bind "z" "+attack" (nur kommentar)',
      ].join("\n")
    );

    const map = panel.collectBindingsFrom(doc);
    expect(map.e).toBe("+attack");
    expect(map.f).toBe("+lookatweapon");
    expect(map.z).toBeUndefined();
  });

  test("ready/request:update → postMessage heatmap:setData & setTheme", () => {
    const ctx = {
      extensionPath: process.cwd(),
      extensionUri: vscode.Uri.file(process.cwd()),
      subscriptions: [],
    } as any;

    const panel = new KeyHeatmapPanel(ctx);
    const editor = {
      document: makeDoc('bind "e" "+use"'),
    } as any;
    (vscode.window as any).activeTextEditor = editor;

    panel.show();
    const rawPanel = panel.asPanel() as any;

    // Simuliere initiale Webview-Ready
    rawPanel.webview._handler?.({ type: "ready" });

    // 2x postMessage: setData + setTheme
    const posts = (rawPanel.webview.postMessage as jest.Mock).mock.calls.map(
      (c) => c[0]
    );
    expect(posts.some((m: any) => m.type === "heatmap:setData")).toBe(true);
    expect(posts.some((m: any) => m.type === "heatmap:setTheme")).toBe(true);
  });

  test("Änderungen im aktiven Dokument triggern update", () => {
    const ctx = {
      extensionPath: process.cwd(),
      extensionUri: vscode.Uri.file(process.cwd()),
      subscriptions: [],
    } as any;

    const panel = new KeyHeatmapPanel(ctx);
    const doc = makeDoc('bind "x" "+jump"');
    (vscode.window as any).activeTextEditor = { document: doc };

    panel.show();
    const rawPanel = panel.asPanel() as any;
    rawPanel.webview._handler?.({ type: "ready" });

    // change event feuern
    (vscode as any).__emitChange({ document: doc });

    const lastPost = (
      rawPanel.webview.postMessage as jest.Mock
    ).mock.calls.pop()?.[0];
    expect(lastPost?.type).toBe("heatmap:setData");
    expect(lastPost?.payload?.bindings?.x).toBe("+jump");
  });

  test("Editorwechsel triggert update", () => {
    const ctx = {
      extensionPath: process.cwd(),
      extensionUri: vscode.Uri.file(process.cwd()),
      subscriptions: [],
    } as any;

    const panel = new KeyHeatmapPanel(ctx);
    const doc1 = makeDoc('bind "a" "+left"');
    const doc2 = makeDoc('bind "b" "+right"');

    (vscode.window as any).activeTextEditor = { document: doc1 };
    panel.show();
    const rawPanel = panel.asPanel() as any;
    rawPanel.webview._handler?.({ type: "ready" });

    // Editorwechsel
    (vscode as any).__setActiveEditor({ document: doc2 });

    const lastPost = (
      rawPanel.webview.postMessage as jest.Mock
    ).mock.calls.pop()?.[0];
    expect(lastPost?.type).toBe("heatmap:setData");
    expect(lastPost?.payload?.bindings?.b).toBe("+right");
  });
});
