import { Uri } from "~helper/vscode.test";

export function makeDoc(lines: string[], languageId = "cs2cfg") {
  return {
    uri: Uri.file("/test/doc.cfg"),
    languageId,
    lineCount: lines.length,
    lineAt: (i: number) => ({ text: lines[i] }),
    getText: () => lines.join("\n"),
  };
}

export function pos(line: number, character: number) {
  return { line, character };
}
