// src/types/crosshair.ts

export interface CrosshairSettings {
  cl_crosshairstyle?: number;
  cl_crosshairsize?: number;
  cl_crosshairthickness?: number;
  cl_crosshairgap?: number;
  cl_crosshair_drawoutline?: number;
  cl_crosshair_outlinethickness?: number;
  cl_crosshairdot?: number;
  cl_crosshair_t?: number;
  cl_crosshairusealpha?: number;
  cl_crosshairalpha?: number;
  cl_crosshair_recoil?: number;
  cl_crosshairgap_useweaponvalue?: number;
  cl_crosshaircolor?: number;
  cl_crosshaircolor_r?: number;
  cl_crosshaircolor_g?: number;
  cl_crosshaircolor_b?: number;
}

export function renderCrosshairCfg(
  s: CrosshairSettings,
  header?: string[]
): string {
  const lines: string[] = [];
  if (header?.length) {
    lines.push(...header.map((h) => `// ${h}`), "");
  }
  const push = (k: keyof CrosshairSettings) => {
    const v = s[k];
    if (v === undefined) return;
    lines.push(`${String(k)} ${Number.isInteger(v) ? v : String(v)}`);
  };
  push("cl_crosshairstyle");
  push("cl_crosshairsize");
  push("cl_crosshairthickness");
  push("cl_crosshairgap");
  push("cl_crosshair_drawoutline");
  push("cl_crosshair_outlinethickness");
  push("cl_crosshairdot");
  push("cl_crosshair_t");
  push("cl_crosshairusealpha");
  push("cl_crosshairalpha");
  push("cl_crosshair_recoil");
  push("cl_crosshairgap_useweaponvalue");
  push("cl_crosshaircolor");
  // Custom RGB (falls gesetzt)
  if (s.cl_crosshaircolor === 5) {
    push("cl_crosshaircolor_r");
    push("cl_crosshaircolor_g");
    push("cl_crosshaircolor_b");
  }
  return lines.join("\n") + "\n";
}
