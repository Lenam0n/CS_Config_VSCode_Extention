// src/features/semanticTokens.ts

import * as vscode from "vscode";
import type { CommandDatabase } from "@/loader";
import { firstToken, isCommentLine } from "@util/text";
import { AliasIndex } from "@feature/aliasIndex";

// Token-Legend: semantische Typen
const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();
const legend = buildLegend(["function", "number", "string", "comment"], []);

function buildLegend(types: string[], modifiers: string[]) {
  types.forEach((t, i) => tokenTypes.set(t, i));
  modifiers.forEach((m, i) => tokenModifiers.set(m, i));
  return new vscode.SemanticTokensLegend(types, modifiers);
}

/**
 * Semantische Tokenisierung:
 * - Erstes Token der Zeile als "function", wenn Command ODER Alias.
 * - Strings & Zahlen via Regex markieren.
 * - Kommentarrest nach // als "comment".
 */
export function registerSemanticTokens(
  db: CommandDatabase,
  languages: string[],
  aliases: AliasIndex
) {
  const provider: vscode.DocumentSemanticTokensProvider = {
    provideDocumentSemanticTokens(document) {
      const builder = new vscode.SemanticTokensBuilder(legend);

      for (let line = 0; line < document.lineCount; line++) {
        const text = document.lineAt(line).text;

        // Kommentarrest ab //
        const commentIdx = text.indexOf("//");
        if (commentIdx >= 0) {
          pushToken(
            builder,
            line,
            commentIdx,
            text.length - commentIdx,
            "comment"
          );
        }

        if (isCommentLine(text)) continue;

        // Erstes Token (Command oder Alias) → function
        const tok = firstToken(text);
        if (
          tok &&
          (db.has(tok.token) || aliases.isAlias(document, tok.token))
        ) {
          pushToken(builder, line, tok.start, tok.end - tok.start, "function");
        }

        // Strings
        const strRegex = /"([^"\\]|\\.)*"/g;
        for (let m; (m = strRegex.exec(text)); ) {
          pushToken(builder, line, m.index, m[0].length, "string");
        }

        // Zahlen
        const numRegex =
          /(?<![\w.])[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?(?![\w.])/g;
        for (let m; (m = numRegex.exec(text)); ) {
          pushToken(builder, line, m.index, m[0].length, "number");
        }
      }

      return builder.build();
    },
  };

  const selectors = languages.map((id) => ({
    language: id,
    scheme: "file" as const,
  }));
  return vscode.languages.registerDocumentSemanticTokensProvider(
    selectors,
    provider,
    legend
  );
}

function pushToken(
  builder: vscode.SemanticTokensBuilder,
  line: number,
  startChar: number,
  length: number,
  tokenType: string,
  tokenModifiersStr?: string[]
) {
  const t = tokenTypes.get(tokenType) ?? 0;
  const mods = (tokenModifiersStr ?? []).reduce(
    (acc, m) => acc | (1 << (tokenModifiers.get(m) ?? 0)),
    0
  );
  builder.push(line, startChar, length, t, mods);
}
