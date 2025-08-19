// src/commands/language.ts
import * as vscode from "vscode";
import { i18n } from "@/i18n/i18n";

export async function commandSwitchLanguage(): Promise<void> {
  const service = i18n();
  const active = service.getActiveLocale();
  const all = service.getAvailableLocales();

  const items = [
    {
      label: "Auto",
      description: "Use VS Code UI language",
      id: "auto" as const,
    },
    ...all.map((lc) => ({
      label: lc.toUpperCase(),
      description: lc === active ? "active" : "",
      id: lc,
    })),
  ];

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: "Select extension language",
    canPickMany: false,
    ignoreFocusOut: true,
  });
  if (!pick) return;

  // Setting setzen (global)
  await vscode.workspace
    .getConfiguration("csCommands")
    .update("language", pick.id, vscode.ConfigurationTarget.Global);

  vscode.window.showInformationMessage(
    service.t("i18n.languageSwitched", {
      vars: { lang: String(pick.id).toUpperCase() },
    })
  );
}
