# CS Commands Intellisense (VS Code Extension)

> Bietet **IntelliSense**, **Hover**, **Diagnostics**, **Linting**, **Auto-Format**, **Snippets**, **Visualizer-Webviews** und **Highlighting** für CS/Source/CS2-Configdateien (`.cfg`) – datengetrieben via **JSON**.

---

## Inhalt

- [CS Commands Intellisense (VS Code Extension)](#cs-commands-intellisense-vs-code-extension)
  - [Inhalt](#inhalt)
  - [Haupt-Features](#haupt-features)
  - [Befehle (Command Palette)](#befehle-command-palette)
  - [Einstellungen (Settings)](#einstellungen-settings)
    - [Schnellstart: Settings-Beispiele](#schnellstart-settings-beispiele)
    - [Farben \& Styles für Highlighting](#farben--styles-für-highlighting)
    - [Formatter-Optionen](#formatter-optionen)
    - [Pfad-Overrides](#pfad-overrides)
    - [Sprache / i18n](#sprache--i18n)
    - [Visualizer](#visualizer)
  - [Konfig-Generatoren](#konfig-generatoren)
  - [Crosshair Share-Code Import](#crosshair-share-code-import)
  - [Launch-Options Builder](#launch-options-builder)
  - [Alias-Auflösung \& Hover](#alias-auflösung--hover)
  - [Diagnostik \& Linting](#diagnostik--linting)
    - [Diagnostics-Schweregrad](#diagnostics-schweregrad)
    - [Lint-Regeln (per Rule konfigurierbar, z. B. Severity „off“)](#lint-regeln-per-rule-konfigurierbar-z-b-severity-off)
  - [Snippets \& Multi-Cursor-Helper](#snippets--multi-cursor-helper)
  - [Dateiendungen \& Sprache](#dateiendungen--sprache)
  - [Eigene Command-Daten (JSON)](#eigene-command-daten-json)
  - [Types](#types)
  - [Entwicklung](#entwicklung)
    - [Build, Test, Packen](#build-test-packen)
    - [CI/CD](#cicd)

---

## Haupt-Features

- **Completion**: Kontextsensitiv – unterscheidet z. B. `bind`-Wert, `alias`-Expansion, Allgemein. Bietet passende Aktionen (`+attack`, `slot1…`) und bekannte Alias-Namen priorisiert an.
- **Hover**: Typ, Default, Flags, Beschreibung – inkl. Auflösung von Alias-Ketten (zeigt Ziel-Command & Expansion, erkennt Zyklen).
- **Diagnostics**: Unbekannte Commands, Alias-Zyklen, doppelte Binds, verbotene `exec`/`script` – Schweregrad konfigurierbar.
- **Linting**: Regelbasiert (z. B. `duplicate-bind-key`, `alias-cycle`, `alias-unused`, `alias-spacing`) mit Quick-Fixes.
- **Auto-Format**: Ausrichtung von `bind`-Spalten, normalisierte `;`-Abstände in Alias-Expansionen, Steuerung der Kommentarspalte.
- **Highlighting**: TextMate + **semantische Tokens** + **Decorations** (konfigurierbare Farben für `bind`-Key/Value, Alias-Def/Use, `+/-`Actions, verbotene Zeilen).
- **Visualizer-Webviews**:
  - **Key Heatmap** (voll implementiert; liest Binds aus dem aktuellen Dokument)
  - **Radar/HUD/Crosshair Preview** (Panels vorbereitet – leicht erweiterbar)
- **Konfig-Generatoren**:
  - **Autoexec**-Template (TOC, saubere Baseline ohne `exec`/`script`)
  - **Crosshair.cfg** aus Beispiel/Template
- **Crosshair Share-Code Import**: `CSGO-…` Code → `crosshair.cfg` (bekannte Codes gemappt; Fallback via `apply_crosshair_code`).
- **Launch-Options Builder**: Interaktives Zusammenstellen von `-`- und `+`-Optionen aus einer JSON-Katalogdatei.
- **i18n**: Sprache per Setting/Command umschaltbar (z. B. `auto`, `en`, `de`) mit Fallbackkette.

---

## Befehle (Command Palette)

| Command ID                              | Titel                                                  |
| --------------------------------------- | ------------------------------------------------------ |
| `csCommands.reloadDatabase`             | CS Commands: Daten neu laden                           |
| `csCommands.generateAutoexec`           | CS Commands: Autoexec generieren                       |
| `csCommands.generateCrosshairCfg`       | CS Commands: Crosshair.cfg generieren                  |
| `csCommands.importCrosshairShareCode`   | CS Commands: Crosshair aus Share-Code importieren      |
| `csCommands.buildLaunchOptions`         | CS Commands: CS2 Launch Options erstellen              |
| `csCommands.insertBindSeries`           | CS Commands: Insert Bind Series (Multi-Cursor Snippet) |
| `csCommands.insertCustomBindSeries`     | CS Commands: Insert Custom Bind Series                 |
| `csCommands.visualize`                  | CS Commands: Visualize… (Picker)                       |
| `csCommands.visualize.keyHeatmap`       | CS Commands: Visualize Key Heatmap                     |
| `csCommands.visualize.radarPreview`     | CS Commands: Visualize Radar Preview                   |
| `csCommands.visualize.hudPreview`       | CS Commands: Visualize HUD Preview                     |
| `csCommands.visualize.crosshairPreview` | CS Commands: Visualize Crosshair Preview               |
| `csCommands.language.switch`            | CS Commands: Switch Language                           |

---

## Einstellungen (Settings)

Alle Settings sind unter dem Namespace `csCommands.*`.

### Schnellstart: Settings-Beispiele

**User- oder Workspace-Settings (`.vscode/settings.json`):**

```jsonc
{
  // Sprache der Extension: "auto" nutzt VS Code UI-Sprache
  "csCommands.language": "de",

  // Aktivierte Sprachen (Dateitypen), in denen Features laufen
  "csCommands.languages": ["cs2cfg"],

  // Feature-Toggles
  "csCommands.features.completion": true,
  "csCommands.features.hover": true,
  "csCommands.features.diagnostics": "warning", // "off" | "warning" | "error"
  "csCommands.features.lint": true,
  "csCommands.features.formatting": true,
  "csCommands.features.decorations": true,
  "csCommands.features.visualizer": true,
  "csCommands.features.snippets": true,

  // Highlight-Farben
  "csCommands.highlight.enable": true,
  "csCommands.highlight.colors.bindKey": "#bb9af7",
  "csCommands.highlight.colors.bindValue": "#7dcfff",
  "csCommands.highlight.colors.aliasDef": "#e0af68",
  "csCommands.highlight.colors.aliasUse": "#e0af68",
  "csCommands.highlight.colors.cmd": "#7aa2f7",
  "csCommands.highlight.colors.cvar": "#9ece6a",
  "csCommands.highlight.colors.plusAction": "#f7768e",
  "csCommands.highlight.colors.forbidden": "#ff5370",

  // Formatter
  "csCommands.format.alignBinds": true,
  "csCommands.format.commentColumn": "auto", // oder Zahl z. B. 48
  "csCommands.format.maxBlankLines": 1,
  "csCommands.format.formatAliasSpacing": true,

  // Datenquellen/Pfade (Workspace-relativ)
  "csCommands.paths.commandsJson": "data/commands.json",
  "csCommands.paths.launchCatalog": "data/cs2.launchOptions.json",
  "csCommands.paths.templatesDir": "assets/templates",
  "csCommands.paths.crosshairCodeMap": "data/crosshairMap.json",

  // Visualizer
  "csCommands.visualize.theme": "auto",
  "csCommands.visualize.heatmapIncludeMouse": false,
  "csCommands.visualize.heatmapFilter": ""
}
```

> **Hinweis**: `csCommands.dataPath` ist **deprecated** – nutze `csCommands.paths.commandsJson`.

### Farben & Styles für Highlighting

- Farben pro Kategorie unter `csCommands.highlight.colors.\*`
- Optionaler Stil pro Kategorie unter `csCommands.highlight.style`
  Beispiel:
  - underline
  - opacity

### Formatter-Optionen

- `alignBinds` (Spaltenausrichtung)
- `commentColumn` ("auto" oder fixe Spalte)
- `maxBlankLines`
- `formatAliasSpacing` (normalisiert ;-Abstände)

### Pfad-Overrides

- `paths.commandsJson` → deine **CommandList JSON**
- `paths.launchCatalog` → **Launch-Options Katalog JSON**
- `paths.templatesDir` → Templates-Ordner
- `paths.crosshairCodeMap` → Mapping von **Share-Code** → **Crosshair-CVars**

### Sprache / i18n

- Setting: ``csCommands.language = "auto" | "en" | "de"`
- Command: **CS Commands: Switch Language**
- `auto` verwendet die VS Code UI-Sprache, mit Fallback auf Basissprache (z. B. de statt `de-CH`) und danach `en`.

---

### Visualizer

- **Key Heatmap** (voll implementiert): Darstellung deiner Tastatur-Belegung, Filter nach Command, Live-Update beim Editieren.
- **Radar/HUD/Crosshair Preview**: Panels bereits verdrahtet (Platzhalter), leicht erweiterbar via Webview-Assets.

---

## Konfig-Generatoren

- **Autoexec generieren**: Sauberes Template mit **Table of Contents** & thematischen Sektionen (ohne `exec`/`script`).
- **Crosshair.cfg generieren**: Erzeugt eine `crosshair.cfg` basierend auf deinem Beispiel-Setup/Template.

---

## Crosshair Share-Code Import

- Command: **CS Commands: Crosshair aus Share-Code importieren**
- Erkennt valide Codes (`CSGO-xxxxx-...`), löst bekannte Codes in CVars auf (Mapping erweiterbar per `csCommands.paths.crosshairCodeMap`).
- Unbekannte Codes → **Fallback**: `apply_crosshair_code <CODE>`.

---

## Launch-Options Builder

- Interaktiver Picker über JSON-Katalog (`data/cs2.launchOptions.json`)
- Unterstützt Flags (`-novid`), Werte-Flags (`-w 1920`) und +-Commands (`+fps_max 0`).
- Ausgabe wahlweise in Zwischenablage oder direkt in den Editor.

---

## Alias-Auflösung & Hover

- Beim Hover über einen Alias zeigt die Extension:
- **Kette/Steps, direkte Segmente, flattened** Basistoken
- Zyklus-Erkennung (zeigt Cycle-Kette)
- In der Completion werden im Alias-/Bind-Kontext **passende Aktionen** & **Alias-Namen** priorisiert.

---

## Diagnostik & Linting

### Diagnostics-Schweregrad

`csCommands.features.diagnostics = "off" | "warning" | "error"`

### Lint-Regeln (per Rule konfigurierbar, z. B. Severity „off“)

- `exec-script-forbidden` (markiert `exec … .cfg` / `script`)
- `duplicate-bind-key` (gleiches Key mehrfach)
- `alias-cycle` (Zyklen)
- `alias-unused` (nie verwendete Aliase)
- `alias-spacing` (Inkonsistenzen bei `;`/Spacing)

---

## Snippets & Multi-Cursor-Helper

- **Insert Bind Series**: Schnelles Einfügen von `bind`-Zeilen für Key-Reihen oder Numpad.
- **Custom Bind Series**: Eigenes Set interaktiv zusammenstellen.
- **Snippets** für Kauf-Binds, `say`/`toggle`-Muster etc. (erweiterbar).

---

## Dateiendungen & Sprache

Die Extension registriert die Sprache `cs2cfg` für:

- `.cfg`
- `.cfg.txt`
- `.autoexec`
- `.vcfg`

---

## Eigene Command-Daten (JSON)

- Lege deine Command-Daten als `CommandList` im Workspace ab (z. B. `data/commands.json`).
- Setze `csCommands.paths.commandsJson = "data/commands.json"`.
- Die Extension lädt Änderungen automatisch; manuell via **CS Commands: Daten neu laden**.

---

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

> Zusätzlich nutzt die Extension intern Typschemata für Launch-Options, Crosshair-Settings, Templates und i18n – du kannst diese in `src/types/\*` einsehen und erweitern.

---

## Entwicklung

### Build, Test, Packen

```bash
npm i

# Dev-Build (watch)
npm run watch

# Unit-Tests (Jest)
npm test

# Kompilieren
npm run compile

# Paket bauen (vsce)
npx vsce package
```

> In VS Code F5 starten, um eine **Extension Development Host** Instanz zu öffnen.

### CI/CD

- GitHub Actions Pipeline: **lint** + **test** + **build**; optionaler Deploy auf GitHub/Marketplace.

- Dev-Pfad: mit einem -dev Parameter/Workflow-Input auf einen **dev-Branch** pushen, ohne Marketplace-Release.

_Die CI-Artefakte & Deploy-Skripte sind so konfiguriert, dass sie **nicht** in das veröffentlichte Marketplace-Paket gelangen._
