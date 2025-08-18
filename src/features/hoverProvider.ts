// src/features/hoverProvider.ts

import * as vscode from "vscode";
import type { CommandDatabase } from "@/loader";
import { firstToken, tokenAt } from "@util/text";
import { AliasIndex } from "@feature/aliasIndex";

/**
 * Hover provider: zeigt bei Commands die Doku (Type/Default/Flags/Beschreibung),
 * bei Aliasen die Expansion inkl. verschachtelter Auflösung und Cycle-Erkennung.
 */
export function registerHoverProvider(
  db: CommandDatabase,
  languages: string[],
  aliases: AliasIndex
) {
  const provider: vscode.HoverProvider = {
    provideHover(document, position) {
      const line = document.lineAt(position.line).text;

      // Token exakt unter Cursor (damit auch in "bind X aliasName" funktioniert)
      const tokAt = tokenAt(line, position.character);
      // Fallback: erstes Token der Zeile
      const tokFirst = firstToken(line);
      const tok = tokAt ?? tokFirst;
      if (!tok) return;

      // a) Alias-Hover
      if (aliases.isAlias(document, tok.token)) {
        const res = aliases.resolve(document, tok.token);
        const md = new vscode.MarkdownString(undefined, true);
        md.isTrusted = false;

        md.appendMarkdown(`**alias ${tok.token}**`);
        const raw = aliases.getValue(document, tok.token);
        if (raw) md.appendMarkdown(` — \`${raw}\``);

        if (res?.steps?.length) {
          md.appendMarkdown(`\n\n**Kette:** ${res.steps.join(" → ")}`);
        }
        if (res?.cycle) {
          md.appendMarkdown(
            `\n\n⚠️ **Zyklus erkannt:** ${res.cycle.join(" → ")}`
          );
        }

        if (res?.flattened?.length) {
          md.appendMarkdown(`\n\n**Expands to final commands:**`);
          for (const t of res.flattened) {
            const bare = t.replace(/^[+\-~]/, "");
            const entry = db.get(bare) ?? db.get(t);
            if (entry) {
              md.appendMarkdown(
                `\n- \`${t}\` — ${entry.description || entry.type}`
              );
            } else {
              md.appendMarkdown(`\n- \`${t}\``);
            }
          }
        }

        const range = new vscode.Range(
          position.line,
          tok.start,
          position.line,
          tok.end
        );
        return new vscode.Hover(md, range);
      }

      // b) Regulärer Command aus DB
      const entry = db.get(tok.token);
      if (!entry) return;

      const md = new vscode.MarkdownString(undefined, true);
      md.isTrusted = false;

      md.appendMarkdown(`**${entry.command}** — \`${entry.type}\``);

      const def = (entry as any).default;
      if (typeof def !== "undefined" && def !== null && def !== "") {
        md.appendMarkdown(`  •  **Default:** \`${JSON.stringify(def)}\``);
      }
      const flags: string[] | undefined = (entry as any).flags;
      if (flags?.length) {
        md.appendMarkdown(`  •  **Flags:** \`${flags.join(", ")}\``);
      }
      if ((entry as any).description) {
        md.appendMarkdown(`\n\n${(entry as any).description}`);
      }

      const range = new vscode.Range(
        position.line,
        tok.start,
        position.line,
        tok.end
      );
      return new vscode.Hover(md, range);
    },
  };

  const selectors = languages.map((id) => ({
    language: id,
    scheme: "file" as const,
  }));
  return vscode.languages.registerHoverProvider(selectors, provider);
}
