// src/lint/rules/aliasSpacing.ts
import { LintRule } from "@/types/lint";
import {
  normalizeAliasValueSpacing,
  splitCommentSmart,
} from "@/format/formatter";

export const ruleAliasSpacing: LintRule = {
  id: "alias-spacing",
  meta: {
    description: "Normalize ';' spacing in alias values (outside strings).",
  },
  run({ lines, configOf }) {
    const cfg = configOf("alias-spacing");
    if (!cfg.enabled) return [];
    const findings = [];

    for (let i = 0; i < lines.length; i++) {
      if (!/^\s*alias\b/i.test(lines[i])) continue;
      const { code, comment } = splitCommentSmart(lines[i]);
      const normalized = normalizeAliasValueSpacing(code);
      if (normalized !== code.trimEnd()) {
        const fixed = (normalized + (comment ? "  " + comment : "")).trimEnd();
        findings.push({
          ruleId: "alias-spacing",
          message: "Normalize ';' spacing in alias line.",
          severity: cfg.severity,
          line: i,
          range: [0, lines[i].length] as [number, number],
          data: { replacement: fixed },
        });
      }
    }

    return findings;
  },
};
