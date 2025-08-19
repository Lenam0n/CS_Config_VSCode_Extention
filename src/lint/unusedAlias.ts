// src/lint/rules/unusedAlias.ts
import { LintRule } from "@/types/lint";

/**
 * Unbenutzte Aliase: definiert, aber im restlichen Text nicht verwendet.
 * Heuristik: einfache Wortsuche mit \b-Grenzen.
 */
export const ruleUnusedAlias: LintRule = {
  id: "alias-unused",
  meta: { description: "Detect unused aliases." },
  run({ lines, configOf, text }) {
    const cfg = configOf("alias-unused");
    if (!cfg.enabled) return [];

    const defRe = /^\s*alias\s+("?)([^\s"]+)\1\b/i;
    const defs: Array<{ name: string; line: number }> = [];
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(defRe);
      if (m) defs.push({ name: m[2], line: i });
    }
    if (!defs.length) return [];

    const findings = [];
    for (const { name, line } of defs) {
      const re = new RegExp(`\\b${name}\\b`, "g");
      let count = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) count++;
      if (count <= 1) {
        findings.push({
          ruleId: "alias-unused",
          message: `Alias "${name}" seems to be unused.`,
          severity: cfg.severity,
          line,
          range: [0, lines[line].length] as [number, number],
          data: { name },
        });
      }
    }
    return findings;
  },
};
