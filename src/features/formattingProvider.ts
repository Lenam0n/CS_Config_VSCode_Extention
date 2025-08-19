// src/features/formattingProvider.ts

import * as vscode from "vscode";
import { formatCfg } from "@/format/formatter";
import { defaultFormatOptions, FormatOptions } from "@/types/format";

function getOptions(): FormatOptions {
  const cfg = vscode.workspace.getConfiguration("csCommands.format");
  const alignBinds = cfg.get<boolean>(
    "alignBinds",
    defaultFormatOptions.alignBinds
  );
  const commentColumn = (cfg.get<number | "auto">(
    "commentColumn",
    defaultFormatOptions.commentColumn
  ) ?? defaultFormatOptions.commentColumn) as number | "auto";
  const maxBlankLines = cfg.get<number>(
    "maxBlankLines",
    defaultFormatOptions.maxBlankLines
  );
  const formatAliasSpacing = cfg.get<boolean>(
    "formatAliasSpacing",
    defaultFormatOptions.formatAliasSpacing
  );

  return { alignBinds, commentColumn, maxBlankLines, formatAliasSpacing };
}

export function registerFormattingProvider(languages: string[]) {
  const provider: vscode.DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document, _options) {
      const fullRange = new vscode.Range(0, 0, document.lineCount, 0);
      const original = document.getText();
      const opts = getOptions();
      const formatted = formatCfg(original, opts);

      if (formatted === original) return [];
      return [vscode.TextEdit.replace(fullRange, formatted)];
    },
  };

  const selectors = languages.map((id) => ({
    language: id,
    scheme: "file" as const,
  }));
  return vscode.languages.registerDocumentFormattingEditProvider(
    selectors,
    provider
  );
}
