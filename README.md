# CS Commands Intellisense (VS Code Extension)

> Bietet **IntelliSense**, **Hover**, **Diagnostics** und **Highlighting** für CS/Source/CS2-Configdateien (`.cfg`), basierend auf einer **CommandList JSON**

## Types

```ts
type CommandEntry = {
  command: string;
  type:
    | "cmd"
    | "boolean"
    | "integer"
    | "float"
    | "number"
    | "string"
    | "vector2"
    | "vector3"
    | "vector4";
  default?:
    | boolean
    | number
    | string
    | [number, number]
    | [number, number, number]
    | [number, number, number, number];
  flags: (
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
    | "vconsole_fuzzy"
  )[];
  description: string;
};
```

## Features

- **Completion**: Vorschläge aller bekannten command-Namen
- **Hover**: Typ, Default, Flags und Beschreibung
- **Diagnostics**: Unbekannte Commands (konfigurierbar)
- **Highlighting**: TextMate + semantische Tokens (bekannte Commands, Strings, Zahlen)
- **Live-Reload der JSON-Daten**

## Einstellungen

- **csCommands.dataPath**: Pfad (relativ zur Workspace-Root) zu deiner CommandList JSON. Leer lassen, um eingebaute Beispieldaten zu nutzen.

- **csCommands.enableDiagnostics**: "off" | "warning" | "error". Standard: "warning".

- **csCommands.languages**: Liste der Sprach-IDs (default: ["cs2cfg"]).

## Dateiendungen

Die Extension registriert die Sprache cs2cfg für:

- ```.cfg```
- ```.cfg.txt```
- ```.autoexec```
- ```.vcfg```

## Entwicklung

```shell
npm i
npm run watch
```

> F5 in VS Code zum Starten einer Extension Development Host Instanz

### Packen

```shell
npm run compile
npx vsce package
```

---

## So nutzt du deine eigene JSON

- Lege deine vollständige Kommandoliste (gemäß `CommandList`) irgendwo im Workspace ab, z. B. `data/commands.json`.
- Setze in den VS Code Settings (Workspace):  
  `csCommands.dataPath = "data/commands.json"`
- Die Extension beobachtet die Datei und lädt Änderungen automatisch.
