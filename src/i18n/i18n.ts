// src/i18n/i18n.ts
import * as vscode from "vscode";
import {
  I18nState,
  LocaleCode,
  TranslateOptions,
  TranslationTree,
} from "@/types/i18n";
import * as path from "path";

function flatten(
  tree: TranslationTree,
  prefix = "",
  out: Record<string, string> = {}
) {
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else flatten(v, key, out);
  }
  return out;
}

function interpolate(input: string, vars: Record<string, any>): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, name) => {
    const v = vars[name];
    return v === undefined || v === null ? "" : String(v);
  });
}

async function listLocalesInFolder(extPath: vscode.Uri): Promise<string[]> {
  try {
    const dir = vscode.Uri.joinPath(extPath, "i18n");
    const entries = await vscode.workspace.fs.readDirectory(dir);
    return entries
      .filter(
        ([name, type]) => type === vscode.FileType.File && /\.json$/i.test(name)
      )
      .map(([name]) => name.replace(/\.json$/i, ""));
  } catch {
    return ["en", "de"]; // minimaler Fallback
  }
}

async function loadLocaleFile(
  extPath: vscode.Uri,
  locale: string
): Promise<Record<string, string>> {
  const uri = vscode.Uri.joinPath(extPath, "i18n", `${locale}.json`);
  try {
    const buf = await vscode.workspace.fs.readFile(uri);
    const json = JSON.parse(
      Buffer.from(buf).toString("utf8")
    ) as TranslationTree;
    return flatten(json);
  } catch {
    return {};
  }
}

export class I18nService {
  private context!: vscode.ExtensionContext;
  private state: I18nState = {
    languageSetting: "auto",
    activeLocale: "en",
    available: ["en"],
  };
  private cache: Record<string, string> = {};
  private cacheEN: Record<string, string> = {};
  private emitter = new vscode.EventEmitter<I18nState>();
  readonly onDidChange = this.emitter.event;

  async init(context: vscode.ExtensionContext) {
    this.context = context;

    // verfügbare locales erkennen
    this.state.available = await listLocalesInFolder(context.extensionUri);

    // Setting lesen + initial laden
    const cfg = vscode.workspace.getConfiguration("csCommands");
    const lang = (cfg.get<string>("language", "auto") || "auto") as
      | "auto"
      | string;
    await this.applyLanguageSetting(lang);

    // Config-Änderungen beobachten
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration("csCommands.language")) {
          const next = (vscode.workspace
            .getConfiguration("csCommands")
            .get<string>("language", "auto") || "auto") as "auto" | string;
          await this.applyLanguageSetting(next);
        }
      })
    );
  }

  getActiveLocale(): LocaleCode {
    return this.state.activeLocale;
  }

  getAvailableLocales(): LocaleCode[] {
    return this.state.available.slice();
  }

  async applyLanguageSetting(setting: "auto" | LocaleCode) {
    this.state.languageSetting = setting;

    // 1) resolve "auto" → VS Code UI language (z. B. "de", "de-DE", "en")
    let resolved = setting;
    if (setting === "auto") {
      const ui = (vscode.env.language || "en").toLowerCase();
      // normalize: prefer base language if regional not found
      if (this.state.available.includes(ui)) resolved = ui;
      else {
        const base = ui.split("-")[0];
        resolved = this.state.available.includes(base) ? base : "en";
      }
    }

    // 2) locale laden + en fallback cachen
    this.cache = await loadLocaleFile(this.context.extensionUri, resolved);
    this.cacheEN = await loadLocaleFile(this.context.extensionUri, "en");
    this.state.activeLocale = resolved;
    this.emitter.fire({ ...this.state });
  }

  /**
   * Übersetzt einen Schlüssel.
   * Fallback-Kette: active → en → key oder custom fallback.
   */
  t(key: string, opt?: TranslateOptions): string {
    const { vars = {}, count, fallback } = opt || {};
    const pickKey = (base: string) => {
      if (typeof count === "number" && count !== 1) {
        const pluralKey = `${base}_plural`;
        if (this.cache[pluralKey]) return pluralKey;
        if (this.cacheEN[pluralKey]) return pluralKey;
      }
      return base;
    };

    const finalKey = pickKey(key);
    const raw =
      this.cache[finalKey] ??
      this.cacheEN[finalKey] ??
      (fallback !== undefined ? fallback : key);

    // Interpolation
    return interpolate(raw, { ...vars, count });
  }
}

// Singleton-Fabrik
let _i18n: I18nService | null = null;
export async function initI18n(
  context: vscode.ExtensionContext
): Promise<I18nService> {
  if (!_i18n) {
    _i18n = new I18nService();
    await _i18n.init(context);
  }
  return _i18n;
}
export function i18n(): I18nService {
  if (!_i18n)
    throw new Error(
      "I18nService not initialized. Call initI18n(context) in activate()."
    );
  return _i18n;
}
