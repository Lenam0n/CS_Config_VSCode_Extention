// src/types/editor.ts

/** Treffer eines Tokens in einer Zeile (für Hover/Diagnostics etc.) */
export type TokenHit = { token: string; start: number; end: number };
