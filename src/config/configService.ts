// src/config/configService.ts
import * as vscode from "vscode";
import {
  ExtensionSettings,
  DecorationsConfig,
  FeatureToggles,
  FormatConfig,
  PathsConfig,
  VisualizationConfig,
} from "@/types/settings";

const DEFAULT_SETTINGS: ExtensionSettings = {
  features: {
    completion: true,
    hover: true,
    diagnostics: "warning",
    lint: true,
    formatting: true,
    decorations: true,
    visualizer: true,
    snippets: true,
  },
  decorations: {
    enable: true,
    colors: {
      cmd: "#7aa2f7",
      cvar: "#9ece6a",
      aliasDef: "#e0af68",
      aliasUse: "#e0af68",
      bindKey: "#bb9af7",
      bindValue: "#7dcfff",
      plusAction: "#f7768e",
      forbidden: "#ff5370",
    },
    style: {},
  },
  format: {
    alignBinds: true,
    commentColumn: "auto",
    maxBlankLines: 1,
    formatAliasSpacing: true,
  },
  paths: {
    commandsJson: "",
    crosshairCodeMap: "",
    templatesDir: "assets/templates",
    launchCatalog: "data/cs2.launchOptions.json",
  },
  visualize: {
    theme: "auto",
    heatmapIncludeMouse: false,
    heatmapFilter: "",
  },
};

export class ConfigService {
  private _settings: ExtensionSettings = DEFAULT_SETTINGS;
  private emitter = new vscode.EventEmitter<ExtensionSettings>();
  readonly onDidChange = this.emitter.event;

  constructor() {
    this.reload();
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("csCommands")) {
        this.reload();
      }
    });
  }

  get settings(): ExtensionSettings {
    return this._settings;
  }

  get features(): FeatureToggles {
    return this._settings.features;
  }

  get decorations(): DecorationsConfig {
    return this._settings.decorations;
  }

  get format(): FormatConfig {
    return this._settings.format;
  }

  get paths(): PathsConfig {
    return this._settings.paths;
  }

  get visualize(): VisualizationConfig {
    return this._settings.visualize;
  }

  private reload() {
    const cfg = vscode.workspace.getConfiguration("csCommands");

    // Helpers for safe get
    const g = <T>(k: string, def: T) => cfg.get<T>(k, def);

    const next: ExtensionSettings = {
      features: {
        completion: g<boolean>(
          "features.completion",
          DEFAULT_SETTINGS.features.completion
        ),
        hover: g<boolean>("features.hover", DEFAULT_SETTINGS.features.hover),
        diagnostics: g<"off" | "warning" | "error">(
          "features.diagnostics",
          DEFAULT_SETTINGS.features.diagnostics
        ),
        lint: g<boolean>("features.lint", DEFAULT_SETTINGS.features.lint),
        formatting: g<boolean>(
          "features.formatting",
          DEFAULT_SETTINGS.features.formatting
        ),
        decorations: g<boolean>(
          "features.decorations",
          DEFAULT_SETTINGS.features.decorations
        ),
        visualizer: g<boolean>(
          "features.visualizer",
          DEFAULT_SETTINGS.features.visualizer
        ),
        snippets: g<boolean>(
          "features.snippets",
          DEFAULT_SETTINGS.features.snippets
        ),
      },
      decorations: {
        enable: g<boolean>(
          "highlight.enable",
          DEFAULT_SETTINGS.decorations.enable
        ),
        colors: {
          cmd: g<string>(
            "highlight.colors.cmd",
            DEFAULT_SETTINGS.decorations.colors.cmd
          ),
          cvar: g<string>(
            "highlight.colors.cvar",
            DEFAULT_SETTINGS.decorations.colors.cvar
          ),
          aliasDef: g<string>(
            "highlight.colors.aliasDef",
            DEFAULT_SETTINGS.decorations.colors.aliasDef
          ),
          aliasUse: g<string>(
            "highlight.colors.aliasUse",
            DEFAULT_SETTINGS.decorations.colors.aliasUse
          ),
          bindKey: g<string>(
            "highlight.colors.bindKey",
            DEFAULT_SETTINGS.decorations.colors.bindKey
          ),
          bindValue: g<string>(
            "highlight.colors.bindValue",
            DEFAULT_SETTINGS.decorations.colors.bindValue
          ),
          plusAction: g<string>(
            "highlight.colors.plusAction",
            DEFAULT_SETTINGS.decorations.colors.plusAction
          ),
          forbidden: g<string>(
            "highlight.colors.forbidden",
            DEFAULT_SETTINGS.decorations.colors.forbidden
          ),
        },
        style: g("highlight.style", DEFAULT_SETTINGS.decorations.style),
      },
      format: {
        alignBinds: g<boolean>(
          "format.alignBinds",
          DEFAULT_SETTINGS.format.alignBinds
        ),
        commentColumn: g<number | "auto">(
          "format.commentColumn",
          DEFAULT_SETTINGS.format.commentColumn
        ),
        maxBlankLines: g<number>(
          "format.maxBlankLines",
          DEFAULT_SETTINGS.format.maxBlankLines
        ),
        formatAliasSpacing: g<boolean>(
          "format.formatAliasSpacing",
          DEFAULT_SETTINGS.format.formatAliasSpacing
        ),
      },
      paths: {
        commandsJson: g<string>(
          "paths.commandsJson",
          DEFAULT_SETTINGS.paths.commandsJson
        ),
        crosshairCodeMap: g<string>(
          "paths.crosshairCodeMap",
          DEFAULT_SETTINGS.paths.crosshairCodeMap
        ),
        templatesDir: g<string>(
          "paths.templatesDir",
          DEFAULT_SETTINGS.paths.templatesDir
        ),
        launchCatalog: g<string>(
          "paths.launchCatalog",
          DEFAULT_SETTINGS.paths.launchCatalog
        ),
      },
      visualize: {
        theme: g<"auto" | "light" | "dark">(
          "visualize.theme",
          DEFAULT_SETTINGS.visualize.theme
        ),
        heatmapIncludeMouse: g<boolean>(
          "visualize.heatmapIncludeMouse",
          DEFAULT_SETTINGS.visualize.heatmapIncludeMouse
        ),
        heatmapFilter: g<string>(
          "visualize.heatmapFilter",
          DEFAULT_SETTINGS.visualize.heatmapFilter
        ),
      },
    };

    this._settings = next;
    this.emitter.fire(this._settings);
  }
}
