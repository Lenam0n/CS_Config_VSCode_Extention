// src/lint/runner.ts
import * as vscode from "vscode";
import {
  LintContext,
  LintFinding,
  LintRule,
  LintRuleConfig,
  LintSeverity,
} from "@/types/lint";
import { AliasIndex } from "@feature/aliasIndex";
import { ruleExecScript } from "@lint/execScript";
import { ruleDuplicateBind } from "@lint/duplicateBind";
import { ruleAliasCycle } from "@lint/aliasCycle";
import { ruleAliasSpacing } from "@lint/aliasSpacing";
import { ruleUnusedAlias } from "@lint/unusedAlias";

export interface LintSettings {
  enabled: boolean;
  rules: Record<string, LintRuleConfig>;
}

export const DefaultLintSettings: LintSettings = {
  enabled: true,
  rules: {
    "exec-script-forbidden": { enabled: true, severity: "warning" },
    "duplicate-bind-key": { enabled: true, severity: "warning" },
    "alias-cycle": { enabled: true, severity: "error" },
    "alias-unused": { enabled: true, severity: "info" },
    "alias-spacing": { enabled: true, severity: "hint" },
  },
};

const ALL_RULES: LintRule[] = [
  ruleExecScript,
  ruleDuplicateBind,
  ruleAliasCycle,
  ruleAliasSpacing,
  ruleUnusedAlias,
];

export function loadLintSettings(): LintSettings {
  const cfg = vscode.workspace.getConfiguration("csCommands.lint");
  const enabled = cfg.get<boolean>("enabled", DefaultLintSettings.enabled);
  const rules = { ...DefaultLintSettings.rules };

  // Erlaubt overrides via csCommands.lint.rules.<ruleId> = "off"|"hint"|"info"|"warning"|"error"
  const userRules = cfg.get<Record<string, string>>("rules", {});
  for (const [rid, sev] of Object.entries(userRules)) {
    if (!rules[rid]) rules[rid] = { enabled: true, severity: "warning" };
    if (sev === "off") rules[rid].enabled = false;
    else
      rules[rid] = {
        enabled: true,
        severity: (sev as LintSeverity) ?? "warning",
      };
  }
  return { enabled, rules };
}

export function runLinter(
  document: vscode.TextDocument,
  aliasIndex: AliasIndex
): LintFinding[] {
  const settings = loadLintSettings();
  if (!settings.enabled) return [];

  const text = document.getText();
  const lines = text.split(/\r?\n/);

  const ctx: LintContext = {
    document,
    text,
    lines,
    aliasIndex,
    configOf: (ruleId) =>
      settings.rules[ruleId] ?? { enabled: true, severity: "warning" },
  };

  const all: LintFinding[] = [];
  for (const rule of ALL_RULES) {
    all.push(...rule.run(ctx));
  }
  return all;
}
