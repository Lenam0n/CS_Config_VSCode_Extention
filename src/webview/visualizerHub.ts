// src/webview/visualizer/visualizerHub.ts
import * as vscode from "vscode";
import { KeyHeatmapPanel } from "./keyHeatmapPanel";
import { BaseVisualizerPanel } from "./basePanel";
import { VisualizerKind } from "@/types/webview";
import { CrosshairPanel } from "./crosshairPanel";
import { HudPanel } from "./hudPanel";
import { RadarPanel } from "./radarPanel";

export class VisualizerHub {
  private heatmap?: KeyHeatmapPanel;
  private radar?: BaseVisualizerPanel;
  private hud?: BaseVisualizerPanel;
  private crosshair?: BaseVisualizerPanel;

  constructor(private readonly ctx: vscode.ExtensionContext) {}

  async open(kind: VisualizerKind): Promise<void> {
    switch (kind) {
      case "heatmap":
        if (!this.heatmap) this.heatmap = new KeyHeatmapPanel(this.ctx);
        this.heatmap.show();
        break;
      case "radar":
        if (!this.radar) this.radar = new RadarPanel(this.ctx);
        this.radar.show();
        break;
      case "hud":
        if (!this.hud) this.hud = new HudPanel(this.ctx);
        this.hud.show();
        break;
      case "crosshair":
        if (!this.crosshair) this.crosshair = new CrosshairPanel(this.ctx);
        this.crosshair.show();
        break;
    }
  }

  private placeholder(title: string) {
    const panel = vscode.window.createWebviewPanel(
      "csviz.placeholder",
      `CS2 Visualizer — ${title}`,
      vscode.ViewColumn.Beside,
      { enableScripts: false, retainContextWhenHidden: true }
    );
    panel.webview.html = `
      <html><body style="font-family: var(--vscode-font-family); padding: 1rem;">
        <h2>${title}</h2>
        <p>Coming soon. This route is scaffolded and ready for implementation.</p>
      </body></html>`;
  }
}
