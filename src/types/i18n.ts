// src/types/i18n.ts

export type LocaleCode = string; // z. B. "en", "de", "fr", "pt-BR"

export type TranslationTree = {
  [key: string]: string | TranslationTree;
};

export interface I18nState {
  /** "auto" nutzt VS Code UI-Sprache */
  languageSetting: "auto" | LocaleCode;
  /** aktuell aktive Locale (nach Auflösung) */
  activeLocale: LocaleCode;
  /** verfügbare Locales (aus i18n/*.json ermittelt) */
  available: LocaleCode[];
}

export interface TranslateOptions {
  /** Variablen für {{name}}-Interpolation */
  vars?: Record<string, string | number | boolean>;
  /**
   * Plural-Zahl: wenn gesetzt, wird versucht, <key>_plural zu verwenden (≠1),
   * andernfalls <key> (==1). Fehlt _plural, fällt es auf <key> zurück.
   */
  count?: number;
  /** eigener Fallback-Text, falls kein Eintrag gefunden wurde */
  fallback?: string;
}
