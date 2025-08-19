// src/types/settings.ts

export type ColorHex = string; // "#RRGGBB" oder "#RRGGBBAA"

export interface FeatureToggles {
  completion: boolean;
  hover: boolean;
  diagnostics: "off" | "warning" | "error";
  lint: boolean;
  formatting: boolean;
  decorations: boolean;
  visualizer: boolean;
  snippets: boolean;
}

export interface HighlightColors {
  cmd: ColorHex; // reine Konsolenbefehle (type==="cmd")
  cvar: ColorHex; // CVars (persistente Werte)
  aliasDef: ColorHex; // alias NAME (Definition)
  aliasUse: ColorHex; // alias Nutzung (z.B. bind value == alias)
  bindKey: ColorHex; // bind "<key>"
  bindValue: ColorHex; // bind "<value>"
  plusAction: ColorHex; // +attack / -attack etc. (Actions/Segments)
  forbidden: ColorHex; // exec/script (optional, z.B. rötlich)
}

export interface DecorationStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  opacity: number; // 0..1
}

export interface DecorationsConfig {
  enable: boolean;
  colors: HighlightColors;
  style: Partial<Record<keyof HighlightColors, DecorationStyle>>;
}

export interface PathsConfig {
  commandsJson: string; // Pfad zur CommandList JSON (falls override)
  crosshairCodeMap: string; // Pfad zur Share-Code Map
  templatesDir: string; // Pfad zu /assets/templates override
  launchCatalog: string; // Pfad zur LaunchOptions JSON override
}

export interface FormatConfig {
  alignBinds: boolean;
  commentColumn: number | "auto";
  maxBlankLines: number;
  formatAliasSpacing: boolean;
}

export interface VisualizationConfig {
  theme: "auto" | "light" | "dark";
  heatmapIncludeMouse: boolean;
  heatmapFilter: string;
}

export interface ExtensionSettings {
  features: FeatureToggles;
  decorations: DecorationsConfig;
  format: FormatConfig;
  paths: PathsConfig;
  visualize: VisualizationConfig;
}
