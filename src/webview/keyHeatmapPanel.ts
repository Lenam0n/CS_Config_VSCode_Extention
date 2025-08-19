// src/webview/visualizer/keyHeatmapPanel.ts
import * as vscode from "vscode";
import { BaseVisualizerPanel } from "./basePanel";
import { HostToWebviewMsg, WebviewToHostMsg } from "@/types/webview";
import { parseBind, splitCommentSmart } from "@/format/formatter";

export class KeyHeatmapPanel extends BaseVisualizerPanel {
  private lastBindings: Record<string, string> = {};

  constructor(ctx: vscode.ExtensionContext) {
    super(ctx, "heatmap", "CS2 Visualizer — Key Heatmap");
  }

  /** Sammle Bindings aus dem aktiven Dokument: letztes Vorkommen gewinnt. */
  collectBindingsFrom(document: vscode.TextDocument | undefined) {
    const bindings = new Map<string, string>();
    if (!document) return {};
    const lines = document.getText().split(/\r?\n/);
    for (const line of lines) {
      const { code } = splitCommentSmart(line);
      const ast = parseBind(code);
      if (ast.kind === "bind") {
        const key = ast.key.toLowerCase();
        const value = ast.value;
        bindings.set(key, value);
      }
    }
    return Object.fromEntries(bindings.entries());
  }

  /** Host → Webview */
  post(msg: HostToWebviewMsg) {
    this.asPanel().webview.postMessage(msg);
  }

  /** HTML mit CSP, lädt /media/heatmap/*. */
  protected getHtml(): string {
    const nonce = this.nonce();
    const styleUri = this.webviewUri("media", "heatmap", "style.css");
    const scriptUri = this.webviewUri("media", "heatmap", "main.js");

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy"
          content="default-src 'none'; img-src ${
            this.asPanel().webview.cspSource
          } blob: data:; style-src ${
      this.asPanel().webview.cspSource
    } 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${
      this.asPanel().webview.cspSource
    } data:;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="${styleUri}" rel="stylesheet" />
        <title>Key Heatmap</title>
      </head>
      <body>
        <header class="header">
          <h1>Key Heatmap</h1>
          <div class="tools">
            <input id="filterInput" type="text" placeholder="Filter by command (e.g. +attack)" />
            <span class="legend"><span class="dot bound"></span> bound <span class="dot unbound"></span> unbound</span>
          </div>
        </header>
        <main>
          <section id="keyboard"></section>
          <aside id="info">
            <h2>Selection</h2>
            <div id="selection">Click a key to see details.</div>
          </aside>
        </main>
        <footer class="footer">
          <small>Keys reflect current document. Edits update live. Mouse buttons not shown here.</small>
        </footer>

        <script nonce="${nonce}">
          const scriptUri = "${scriptUri}";
          // dynamic import without module
          (function(){
            const s = document.createElement('script');
            s.setAttribute('nonce', '${nonce}');
            s.src = scriptUri;
            document.body.appendChild(s);
          })();
        </script>
      </body>
      </html>
    `;
  }

  /** Webview ↔ Host wiring. */
  protected wireMessages(): void {
    this.asPanel().webview.onDidReceiveMessage(
      (msg: WebviewToHostMsg) => {
        if (msg.type === "ready" || msg.type === "request:update") {
          // initial / explicit update
          const doc = vscode.window.activeTextEditor?.document;
          this.lastBindings = this.collectBindingsFrom(doc);
          this.post({
            type: "heatmap:setData",
            payload: { bindings: this.lastBindings },
          });
          this.syncTheme();
        }
      },
      null,
      this.disposables
    );

    // Dokumentänderungen → Heatmap aktualisieren (debounced durch VS Code Events)
    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document !== vscode.window.activeTextEditor?.document) return;
      this.lastBindings = this.collectBindingsFrom(e.document);
      this.post({
        type: "heatmap:setData",
        payload: { bindings: this.lastBindings },
      });
    });
    const switchSub = vscode.window.onDidChangeActiveTextEditor((ed) => {
      if (!ed) return;
      this.lastBindings = this.collectBindingsFrom(ed.document);
      this.post({
        type: "heatmap:setData",
        payload: { bindings: this.lastBindings },
      });
    });
    const themeSub = vscode.window.onDidChangeActiveColorTheme(() =>
      this.syncTheme()
    );

    this.disposables.push(changeSub, switchSub, themeSub);
  }

  private syncTheme() {
    const theme =
      vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark
        ? "dark"
        : "light";
    this.post({ type: "heatmap:setTheme", payload: { theme } });
  }
}
