// src/features/completionProvider.ts

import * as vscode from "vscode";
import type { CommandDatabase } from "@/loader";
import type { CommandEntry } from "@/types";
import { isCommentLine } from "@util/text";
import { AliasIndex } from "@feature/aliasIndex";

/**
 * Completion provider: schlägt bekannte Commands aus der DB
 * sowie im aktuellen Dokument definierte Aliase vor.
 */
export function registerCompletionProvider(
  db: CommandDatabase,
  languages: string[],
  aliases: AliasIndex
) {
  const provider: vscode.CompletionItemProvider = {
    provideCompletionItems(document, position) {
      const line = document.lineAt(position.line).text;
      if (isCommentLine(line)) return undefined;

      const items: vscode.CompletionItem[] = [];

      // 1) Commands aus DB
      for (const entry of db.getAll()) {
        items.push(toCmdItem(entry));
      }

      // 2) Aliase aus dem aktuellen Dokument
      const amap = aliases.getMap(document);
      for (const name of amap.keys()) {
        const it = new vscode.CompletionItem(
          name,
          vscode.CompletionItemKind.Variable
        );
        it.insertText = name;
        it.detail = "alias";
        it.sortText = "1_" + name; // nach Commands einsortieren
        const md = new vscode.MarkdownString(undefined, true);
        md.isTrusted = false;
        md.appendMarkdown(`**alias ${name}** → \`${amap.get(name)}\``);
        it.documentation = md;
        items.push(it);
      }

      return new vscode.CompletionList(items, true);
    },
  };

  const selectors = languages.map((id) => ({
    language: id,
    scheme: "file" as const,
  }));
  return vscode.languages.registerCompletionItemProvider(
    selectors,
    provider,
    ".",
    "_"
  );
}

function toCmdItem(entry: CommandEntry): vscode.CompletionItem {
  const it = new vscode.CompletionItem(
    entry.command,
    vscode.CompletionItemKind.Function
  );
  it.insertText = entry.command;
  it.detail = entry.type === "cmd" ? "command" : `cvar<${entry.type}>`;
  it.sortText = "0_" + entry.command;
  it.filterText = entry.command;

  const md = new vscode.MarkdownString(undefined, true);
  md.isTrusted = false;
  md.appendMarkdown(`**${entry.command}**  \n`);
  md.appendMarkdown(`*Type:* \`${entry.type}\``);

  const def = (entry as any).default;
  if (typeof def !== "undefined" && def !== null && def !== "") {
    md.appendMarkdown(`  •  *Default:* \`${JSON.stringify(def)}\``);
  }
  const flags: string[] | undefined = (entry as any).flags;
  if (flags?.length) {
    md.appendMarkdown(`  •  *Flags:* \`${flags.join(", ")}\``);
  }
  if ((entry as any).description) {
    md.appendMarkdown(`\n\n${(entry as any).description}`);
  }

  it.documentation = md;
  return it;
}
