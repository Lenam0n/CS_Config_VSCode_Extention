// src/types/command.ts

/** Alle bekannten Flag-Tokens aus deinem Dump. Bei Bedarf um neue erweitern. */
export type Flag =
  | "sv"
  | "cl"
  | "sp"
  | "rep"
  | "cheat"
  | "release"
  | "a"
  | "nf"
  | "prot"
  | "norecord"
  | "server_cant_query"
  | "server_can_execute"
  | "clientcmd_can_execute"
  | "per_user"
  | "user"
  | "execute_per_tick"
  | "vconsole_set_focus"
  | "vconsole_fuzzy";

/** Wert-Typ eines Eintrags:
 *  - "cmd" = Konsolenbefehl (kein persistenter Wert)
 *  - die übrigen = CVar-Typen (persistente/konfigurierbare Werte)
 */
export type ValueType =
  | "cmd"
  | "boolean"
  | "integer"
  | "float"
  | "number"
  | "string"
  | "vector2"
  | "vector3"
  | "vector4";

/** Zulässige Default-Werte (Skalare + kurze Vektoren) */
export type DefaultValue =
  | boolean
  | number
  | string
  | [number, number]
  | [number, number, number]
  | [number, number, number, number];

/** Eintrag für reine Commands (type==="cmd") */
export type CommandEntryCmd = {
  command: string;
  type: "cmd";
  /** Für cmds existiert i.d.R. kein sinnvoller Default. Leer oder null ist ok. */
  default?: "" | null;
  flags: Flag[];
  description: string;
};

/** Eintrag für CVars (alles außer "cmd") */
export type CommandEntryCVar = {
  command: string;
  type: Exclude<ValueType, "cmd">;
  default?: DefaultValue;
  flags: Flag[];
  description: string;
};

/** Union-Typ für beliebigen Eintrag (ohne `group`) */
export type CommandEntry = CommandEntryCmd | CommandEntryCVar;

/** Liste aller Einträge */
export type CommandList = CommandEntry[];
