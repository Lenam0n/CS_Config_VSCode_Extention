// src/types/lint.ts
import type * as vscode from "vscode";
import { AliasIndex } from "@feature/aliasIndex";

export type LintSeverity = "error" | "warning" | "info" | "hint";

export interface LintRuleConfig {
  /** enable/disable per rule */
  enabled: boolean;
  /** severity mapping */
  severity: LintSeverity;
}

export interface LintFinding {
  ruleId: string;
  message: string;
  severity: LintSeverity;
  /** 0-based line number */
  line: number;
  /** inclusive [start, end) in characters on that line */
  range: [number, number];
  /** optional data to help quick fixes */
  data?: Record<string, unknown>;
}

export interface LintContext {
  document: vscode.TextDocument;
  text: string;
  lines: string[];
  aliasIndex: AliasIndex;
  /** utility to set config per ruleId */
  configOf(ruleId: string): LintRuleConfig;
}

export interface LintRule {
  id: string;
  meta: {
    description: string;
  };
  run(ctx: LintContext): LintFinding[];
}
