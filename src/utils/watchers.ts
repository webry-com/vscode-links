import * as vscode from "vscode"
import { type ConfigLayerMeta, type ResolvedConfig, type UserInputConfig, loadConfig } from "c12"
import { vscLog } from "../utils/output"
import type { z } from "zod"
import fs from "fs"
import path from "path"
import { configSchema } from "./schemas"

const watchers: vscode.FileSystemWatcher[] = []
const configs: Map<string, z.infer<typeof configSchema>> = new Map()

export function watchConfigFiles(callback: () => void): void {
  disposeConfigWatchers()

  const extensions = ["js", "ts", "mjs", "cjs", "mts", "cts"]
  vscode.workspace.workspaceFolders?.forEach((folder) => {
    const pattern = new vscode.RelativePattern(folder, `vsc-links.config.{${extensions.join(",")}}`)
    const watcher = vscode.workspace.createFileSystemWatcher(pattern)

    watcher.onDidChange(() => callback())
    watcher.onDidCreate(() => callback())
    watcher.onDidDelete(() => callback())
    watchers.push(watcher)
  })
}

export function disposeConfigWatchers() {
  for (const watcher of watchers) {
    watcher.dispose()
  }
  watchers.length = 0
}

export function getConfig(workspace: vscode.WorkspaceFolder | string) {
  return configs.get(typeof workspace === "string" ? workspace : workspace.uri.fsPath)
}

function cacheConfig(
  config: ResolvedConfig<UserInputConfig, ConfigLayerMeta>,
  workspaceFolder: vscode.WorkspaceFolder,
) {
  if (config.config.__JITI_ERROR__) {
    configs.delete(workspaceFolder.uri.fsPath)
    vscLog("Error", JSON.stringify(config.config.__JITI_ERROR__, null, 2))
    return
  }

  const validationResult = configSchema.safeParse(config.config)
  if (!validationResult.success) {
    const extensions = ["js", "ts", "mjs", "cjs", "mts", "cts"]
    const configFileExists = extensions.some((ext) =>
      fs.existsSync(path.normalize(workspaceFolder.uri.fsPath + "/vsc-links.config." + ext)),
    )
    if (configFileExists) {
      vscLog("Info", "AAAA DELETE ")
      configs.delete(workspaceFolder.uri.fsPath)
      vscLog(
        "Error",
        `Invalid config in workspace "${workspaceFolder.name}":\n` + JSON.stringify(validationResult.error, null, 2),
      )
      return
    }
    return
  }

  vscLog("Info", "AAAA SET " + validationResult.data.links.length)
  configs.set(workspaceFolder.uri.fsPath, validationResult.data)
  vscLog(
    "Info",
    `Config in workspace "${workspaceFolder.name}" loaded with ${validationResult.data.links.length} link definitions!`,
  )
}

export async function updateConfigs() {
  const workspaceFolders = vscode.workspace.workspaceFolders ?? []
  for (const workspaceFolder of workspaceFolders) {
    await updateConfig(workspaceFolder)
  }
}

export async function updateConfig(workspaceFolder: vscode.WorkspaceFolder) {
  const config = await loadConfig({
    cwd: workspaceFolder.uri.fsPath,
    name: "vsc-links",
    jitiOptions: {
      onError() {
        vscLog("Error", "Failed to load config!")
      },
    },
    packageJson: false,
    rcFile: false,
    globalRc: false,
  })
  vscLog("Info", "AAAA updateConfig " + config.config.links.length)
  cacheConfig(config, workspaceFolder)
}
