// src/types/webview.ts
export type VisualizerKind = "heatmap" | "radar" | "hud" | "crosshair";

export type HostToWebviewMsg =
  | {
      type: "heatmap:setData";
      payload: {
        bindings: Record<string, string>; // key -> command/value (letztes Vorkommen gewinnt)
      };
    }
  | { type: "heatmap:setTheme"; payload: { theme: "light" | "dark" } };

export type WebviewToHostMsg =
  | { type: "ready"; payload?: {} }
  | { type: "request:update"; payload?: {} };
