// src/lint/rules/duplicateBind.ts
import { LintRule } from "@/types/lint";
import { parseBind } from "@/format/formatter";

/**
 * Findet doppelte bind-Belegungen derselben Taste innerhalb des Dokuments.
 * Markiert alle Vorkommen außer dem letzten (CS2: „letzte gewinnt“).
 */
export const ruleDuplicateBind: LintRule = {
  id: "duplicate-bind-key",
  meta: { description: "Detects multiple binds for the same key." },
  run({ lines, configOf }) {
    const cfg = configOf("duplicate-bind-key");
    if (!cfg.enabled) return [];
    type Occ = { line: number; start: number; end: number; value: string };
    const map = new Map<string, Occ[]>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const code = line.replace(/\/\/.*$/, "");
      const ast = parseBind(code);
      if (ast.kind === "bind") {
        const start = line.toLowerCase().indexOf("bind");
        const end = line.length;
        const occ: Occ = { line: i, start, end, value: ast.value };
        const arr = map.get(ast.key) ?? [];
        arr.push(occ);
        map.set(ast.key, arr);
      }
    }

    const findings = [];
    for (const [key, occs] of map) {
      if (occs.length <= 1) continue;
      for (let i = 0; i < occs.length - 1; i++) {
        const o = occs[i];
        findings.push({
          ruleId: "duplicate-bind-key",
          message: `Key "${key}" is bound multiple times; later binding takes precedence.`,
          severity: cfg.severity,
          line: o.line,
          range: [0, lines[o.line].length] as [number, number],
          data: { key, line: o.line },
        });
      }
    }
    return findings;
  },
};
