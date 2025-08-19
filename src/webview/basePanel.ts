// src/webview/visualizer/basePanel.ts
import * as vscode from "vscode";
import { VisualizerKind } from "@/types/webview";
import * as path from "path";

export abstract class BaseVisualizerPanel {
  protected panel: vscode.WebviewPanel;
  protected disposables: vscode.Disposable[] = [];

  constructor(
    protected readonly context: vscode.ExtensionContext,
    protected readonly kind: VisualizerKind,
    title: string
  ) {
    this.panel = vscode.window.createWebviewPanel(
      `csviz.${kind}`,
      title,
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, "media")),
        ],
      }
    );
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  /** Abgeleitete Klassen liefern HTML. */
  protected abstract getHtml(): string;

  /** Abgeleitete Klassen binden Message-Handler. */
  protected abstract wireMessages(): void;

  protected webviewUri(...segments: string[]) {
    const onDisk = vscode.Uri.file(
      path.join(this.context.extensionPath, ...segments)
    );
    return this.panel.webview.asWebviewUri(onDisk);
  }

  protected nonce(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < 32; i++)
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
  }

  show() {
    this.panel.webview.html = this.getHtml();
    this.wireMessages();
    this.panel.reveal();
  }

  asPanel(): vscode.WebviewPanel {
    return this.panel;
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
