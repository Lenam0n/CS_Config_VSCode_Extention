// src/lint/rules/aliasCycle.ts
import { LintRule } from "@/types/lint";

/**
 * Erkennt Alias-Zyklen. Nutzt AliasIndex.resolve(..).
 */
export const ruleAliasCycle: LintRule = {
  id: "alias-cycle",
  meta: { description: "Detect cyclic alias definitions." },
  run({ lines, aliasIndex, configOf, document }) {
    const cfg = configOf("alias-cycle");
    if (!cfg.enabled) return [];

    const defMap = new Map<string, number>();
    const defRe = /^\s*alias\s+("?)([^\s"]+)\1\b/i;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(defRe);
      if (m) defMap.set(m[2], i);
    }

    const findings = [];
    for (const [name, line] of defMap) {
      const res = aliasIndex.resolve(document, name, 50);
      if (res?.cycle && res.cycle.length >= 2) {
        const msg = `Alias cycle detected: ${res.cycle.join(" → ")}`;
        findings.push({
          ruleId: "alias-cycle",
          message: msg,
          severity: cfg.severity,
          line,
          range: [0, lines[line].length] as [number, number],
          data: { cycle: res.cycle },
        });
      }
    }
    return findings;
  },
};
