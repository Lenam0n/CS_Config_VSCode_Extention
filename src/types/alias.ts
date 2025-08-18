// src/types/alias.ts

/** Ein Alias in einer Datei: Name → Raw-Expansion */
export type AliasMap = Map<string, string>;

export interface AliasResolution {
  /** in der Reihenfolge der besuchten Alias-Namen (zur Cycle-Erklärung) */
  steps: string[];
  /** finale "Basistoken" nach voller Expansion (nur die ersten Tokens pro Segment) */
  flattened: string[];
  /** direkte Segmente der ersten Expansion (nur informativ) */
  immediateSegments: string[];
  /** Falls Zyklus erkannt, komplette Kette bis zur Wiederholung */
  cycle?: string[];
}
