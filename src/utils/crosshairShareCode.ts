// src/utils/crosshairShareCode.ts

import type { CrosshairSettings } from "@/types/crosshair";
import * as vscode from "vscode";

/**
 * Bekannte Codes (lokales Mapping) – hier ist dein Beispiel-Code bereits vollständig gemappt.
 * Du kannst das Mapping später über Settings/Datei erweitern.
 */
const KNOWN_CODES: Record<string, CrosshairSettings> = {
  // exakt aus deinem Beispiel
  "CSGO-eMEzp-hfW4f-3b9tt-6iRs3-sLNMB": {
    cl_crosshairstyle: 5,
    cl_crosshairsize: 1,
    cl_crosshairthickness: 0.5,
    cl_crosshairgap: -5,
    cl_crosshair_drawoutline: 0,
    cl_crosshair_outlinethickness: 0,
    cl_crosshairdot: 1,
    cl_crosshair_t: 0,
    cl_crosshairusealpha: 1,
    cl_crosshairalpha: 255,
    cl_crosshair_recoil: 0,
    cl_crosshairgap_useweaponvalue: 0,
    cl_crosshaircolor: 5,
    // Falls dein Code eig. Custom-RGB bräuchte:
    // cl_crosshaircolor_r: 0,
    // cl_crosshaircolor_g: 255,
    // cl_crosshaircolor_b: 170
  },
};

/** Einfache Prüfung: „CSGO-“ + 5er-Gruppen, alphanum + case-insensitive. */
export function isValidShareCode(input: string): boolean {
  const s = normalizeShareCode(input);
  return /^CSGO-[A-Za-z0-9]{4,5}(-[A-Za-z0-9]{4,5}){4,6}$/.test(s);
}

export function normalizeShareCode(input: string): string {
  return input.trim().replace(/\s+/g, "").toUpperCase();
}

/**
 * Hook: optionales User-Mapping (Workspace Setting)
 * csCommands.crosshair.codeMapPath => JSON-Objekt { "<CODE>": { ...settings } }
 */
async function tryLoadUserMap(): Promise<Record<string, CrosshairSettings>> {
  try {
    const cfg = vscode.workspace.getConfiguration("csCommands.crosshair");
    const rel = cfg.get<string>("codeMapPath", "")?.trim();
    if (!rel) return {};
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) return {};
    const uri = vscode.Uri.joinPath(folder.uri, rel);
    const data = await vscode.workspace.fs.readFile(uri);
    const json = JSON.parse(Buffer.from(data).toString("utf8"));
    if (json && typeof json === "object") {
      // keys uppercasing für robusten Vergleich
      return Object.fromEntries(
        Object.entries(json).map(([k, v]) => [
          normalizeShareCode(k),
          v as CrosshairSettings,
        ])
      );
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Versuch, Share-Code in CrosshairSettings aufzulösen.
 * Reihenfolge: User-Map > Known Map > Decoder (optional, stub).
 */
export async function decodeShareCodeToSettings(
  code: string
): Promise<CrosshairSettings | null> {
  const norm = normalizeShareCode(code);
  const userMap = await tryLoadUserMap();
  if (userMap[norm]) return userMap[norm];
  if (KNOWN_CODES[norm]) return KNOWN_CODES[norm];

  // Platzhalter für späteren nativen Decoder:
  // return tryDecodeAlgorithmically(norm);
  return null;
}
