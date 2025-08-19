// src/lint/rules/execScript.ts
import { LintRule } from "@/types/lint";

const execRe = /^\s*exec\s+.+\.cfg\b/i;
const scriptRe = /^\s*script\b/i;

export const ruleExecScript: LintRule = {
  id: "exec-script-forbidden",
  meta: {
    description: "Disallow 'exec *.cfg' and 'script' lines in autoexecs.",
  },
  run({ lines, configOf }) {
    const cfg = configOf("exec-script-forbidden");
    if (!cfg.enabled) return [];
    const findings = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (execRe.test(l) || scriptRe.test(l)) {
        findings.push({
          ruleId: "exec-script-forbidden",
          message: execRe.test(l)
            ? "Use of 'exec … .cfg' is discouraged here."
            : "Use of 'script' is discouraged here.",
          severity: cfg.severity,
          line: i,
          range: [0, l.length] as [number, number],
          data: { kind: execRe.test(l) ? "exec" : "script" },
        });
      }
    }
    return findings;
  },
};
