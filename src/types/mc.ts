// src/types/mc.ts
export interface BindSeriesOption {
  id: string;
  label: string;
  description?: string;
  keys: string[];
}

export interface InsertBindSeriesOptions {
  /** Default-Wert im Snippet-Platzhalter (z. B. +attack). Leer für "" */
  defaultValue?: string;
  /** Ein gemeinsamer Platzhalter für alle Werte (${1:...}) */
  sharedPlaceholder?: boolean;
  /** Zusätzliche Leerzeile nach dem Block einfügen */
  trailingNewline?: boolean;
}
