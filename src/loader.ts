import * as vscode from "vscode";
import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import type { CommandList } from "@/types";

export class CommandDatabase {
  private data: CommandList = [];
  private index = new Map<string, number>();
  private watcher?: fs.FSWatcher;
  private _onDidUpdate = new vscode.EventEmitter<void>();
  public onDidUpdate = this._onDidUpdate.event;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async init() {
    await this.loadFromConfiguredPath();
  }

  public getAll(): CommandList {
    return this.data;
  }

  public get(command: string) {
    const idx = this.index.get(command.toLowerCase());
    return typeof idx === "number" ? this.data[idx] : undefined;
  }

  public has(command: string) {
    return this.index.has(command.toLowerCase());
  }

  public dispose() {
    this.watcher?.close();
    this._onDidUpdate.dispose();
  }

  public async reload() {
    await this.loadFromConfiguredPath(true);
  }

  private async loadFromConfiguredPath(force = false) {
    const cfg = vscode.workspace.getConfiguration("csCommands");
    const relPath: string = cfg.get("dataPath") || "";
    let dbPath: string;

    if (relPath) {
      const ws = vscode.workspace.workspaceFolders?.[0];
      if (!ws) {
        vscode.window.showWarningMessage(
          "csCommands.dataPath ist gesetzt, aber es ist kein Workspace geöffnet. Fallback auf eingebettete Daten."
        );
        dbPath = this.bundledDbPath();
      } else {
        dbPath = path.join(ws.uri.fsPath, relPath);
      }
    } else {
      dbPath = this.bundledDbPath();
    }

    const was = JSON.stringify(this.data);
    const next = await this.readJson(dbPath);
    this.apply(next);

    if (this.watcher) this.watcher.close();
    if (relPath) {
      this.watcher = fs.watch(dbPath, { persistent: false }, async (evt) => {
        if (evt === "change" || evt === "rename") {
          try {
            const n = await this.readJson(dbPath);
            this.apply(n);
          } catch (e) {
            // Ignorieren, bis Datei wieder valide ist
          }
        }
      });
    }

    if (force || JSON.stringify(this.data) !== was) this._onDidUpdate.fire();
  }

  private bundledDbPath() {
    return this.context.asAbsolutePath(path.join("data", "commands.json"));
  }

  private async readJson(filePath: string): Promise<CommandList> {
    const buf = await fsp.readFile(filePath, "utf8");
    const parsed = JSON.parse(buf);
    if (!Array.isArray(parsed)) {
      throw new Error("CommandList JSON ist kein Array.");
    }
    // Light validation: ensure required fields exist
    for (const [i, e] of parsed.entries()) {
      if (!e || typeof e.command !== "string" || typeof e.type !== "string") {
        throw new Error(`Ungültiger Eintrag an Index ${i}.`);
      }
    }
    return parsed;
  }

  private apply(list: CommandList) {
    this.data = list;
    this.index.clear();
    list.forEach((e, i) => this.index.set(e.command.toLowerCase(), i));
  }
}
