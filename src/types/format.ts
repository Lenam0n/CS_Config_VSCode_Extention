// src/types/format.ts

export interface FormatOptions {
  /** Bind-Gruppen spaltenweise ausrichten ("bind" | "key" | "value" | "// comment") */
  alignBinds: boolean;
  /**
   * Kommentar-Spalte. "auto" richtet Kommentare direkt hinter dem Value mit ≥2 Spaces aus.
   * Eine Zahl richtet Kommentare ab einer festen (1-basierten) Spalte aus.
   */
  commentColumn: number | "auto";
  /** Max. Anzahl aufeinanderfolgender Leerzeilen (Default 1) */
  maxBlankLines: number;
  /** In alias-Zeilen `;` auf "`; `" normalisieren (nur außerhalb von Strings) */
  formatAliasSpacing: boolean;
}

export const defaultFormatOptions: FormatOptions = {
  alignBinds: true,
  commentColumn: "auto",
  maxBlankLines: 1,
  formatAliasSpacing: true,
};
