// src/webview/visualizer/radarPanel.ts
import * as vscode from "vscode";
import { BaseVisualizerPanel } from "./basePanel";

export class RadarPanel extends BaseVisualizerPanel {
  constructor(ctx: vscode.ExtensionContext) {
    super(ctx, "radar", "CS2 Visualizer — Radar Preview");
  }

  protected getHtml(): string {
    const nonce = this.nonce();
    return /* html */ `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none'; style-src ${
                this.asPanel().webview.cspSource
              } 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <style>
          :root{ --fg: var(--vscode-editor-foreground); --bg: var(--vscode-editor-background); }
          html,body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--vscode-font-family, system-ui);}
          .wrap{padding:16px}
          h1{font-size:16px;margin:0 0 8px}
          .box{padding:12px;border:1px solid rgba(127,127,127,.3);border-radius:6px;background:rgba(127,127,127,.08)}
          .muted{opacity:.8}
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>Radar Preview</h1>
          <div class="box">
            <p class="muted">Coming soon. Dieses Panel ist vorbereitet – hier kannst du später die <code>cl_radar_*</code>-Werte visualisieren.</p>
            <ul>
              <li><code>cl_radar_always_centered</code></li>
              <li><code>cl_radar_scale</code></li>
              <li><code>cl_radar_icon_scale_min</code></li>
            </ul>
          </div>
        </div>
        <script nonce="${nonce}">/* placeholder */</script>
      </body>
      </html>
    `;
  }

  protected wireMessages(): void {
    // Derzeit keine Host↔Webview-Kommunikation nötig (reines Placeholder-Panel).
  }
}
