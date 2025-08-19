// src/types/launch.ts
export type LaunchValueType = "boolean" | "integer" | "number" | "string";

export type LaunchStatus =
  | "supported" // offiziell/üblich, erwartet zu funktionieren
  | "optional" // funktioniert meist, aber oft redundant
  | "legacy" // kann ignoriert sein / alte Source-Option
  | "unknown"; // unklar / selten

export interface LaunchArgParam {
  name: string;
  type: LaunchValueType;
  /** Minimal zulässiger Wert (für integer/number) */
  min?: number;
  /** Maximal zulässiger Wert (für integer/number) */
  max?: number;
  /** Vorgabewert (wird dem User vorgeschlagen) */
  default?: string | number | boolean;
  /** Wahlmöglichkeiten (statt freiem Input) */
  enum?: Array<string | number>;
  /** Platzhalter-Hinweis im Prompt */
  placeholder?: string;
}

export interface LaunchBase {
  id: string; // interne ID (unique)
  name: string; // z. B. "-novid" oder "+fps_max"
  aliases?: string[]; // alternative Schreibweisen
  category: string; // "video" | "system" | ...
  description: string;
  status: LaunchStatus;
  docs?: string[]; // Links zu Quellen
  notes?: string[]; // Hinweise / Einschränkungen
}

export interface LaunchFlag extends LaunchBase {
  kind: "flag"; // schalter ohne argumente
  params?: []; // leer
}

export interface LaunchFlagWithValue extends LaunchBase {
  kind: "flagWithValue"; // z. B. -w 1920
  params: [LaunchArgParam] | LaunchArgParam[]; // 1..n
}

export interface LaunchPlusCommand extends LaunchBase {
  kind: "plus"; // z. B. +fps_max 0
  params?: [LaunchArgParam] | LaunchArgParam[];
}

export type LaunchArg = LaunchFlag | LaunchFlagWithValue | LaunchPlusCommand;

export type LaunchCatalog = {
  meta: {
    game: "Counter-Strike 2";
    version: string; // Datum o. ä.
    warning?: string;
  };
  categories: Array<{ id: string; title: string }>;
  options: LaunchArg[];
};
