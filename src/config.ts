import * as vscode from "vscode"
import { pathToFileURL } from "url"
import path from "path"
import fs from "fs"
import z from "zod"

const CONFIG_FILE_NAMES = ["vscode-links.config.js", "vscode-links.config.mjs"]

const regexSchema = z.instanceof(RegExp)
const customLinksConfigSchema = z.object({
  links: z.array(
    z.object({
      include: z.union([z.string(), z.array(z.string())]),
      exclude: z.union([z.string(), z.array(z.string())]).optional(),
      handle: z
        .function()
        .args(z.record(z.string(), z.any()))
        .returns(
          z.object({
            target: z.string(),
            tooltip: z.string().optional(),
          }),
        ),
      pattern: z.union([regexSchema, z.array(regexSchema)]).optional(),
      customPattern: z
        .function()
        .args(z.object({ documentText: z.string() }))
        .returns(z.union([z.tuple([z.number(), z.number()]), z.undefined(), z.null()]))
        .optional(),
    }),
  ),
})

export type CustomLinksConfig = z.infer<typeof customLinksConfigSchema>

const workspaceConfigs = new Map<string, CustomLinksConfig>()
export async function setupConfigWatcher(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    return
  }

  for (const folder of workspaceFolders) {
    await onConfigFileChanged(folder.uri.fsPath)
  }

  workspaceFolders.forEach((folder) => {
    const pattern = new vscode.RelativePattern(folder, `{${CONFIG_FILE_NAMES.join(",")}}`)
    const watcher = vscode.workspace.createFileSystemWatcher(pattern)

    watcher.onDidCreate(() => onConfigFileChanged(folder.uri.fsPath))
    watcher.onDidChange(() => onConfigFileChanged(folder.uri.fsPath))
    watcher.onDidDelete(() => onConfigFileDeleted(folder.uri.fsPath))

    context.subscriptions.push(watcher)
  })
}

export function getWorkspaceConfig(workspacePath: string): CustomLinksConfig | null {
  return workspaceConfigs.get(workspacePath) ?? null
}

async function onConfigFileChanged(workspacePath: string) {
  const config = await loadConfig(workspacePath)

  if (config && validateConfig(config)) {
    console.log("links", config)
    workspaceConfigs.set(workspacePath, config)
  }
}

function onConfigFileDeleted(workspacePath: string) {
  workspaceConfigs.delete(workspacePath)
}

function validateConfig(config: unknown): config is CustomLinksConfig {
  const result = customLinksConfigSchema.safeParse(config)
  if (!result.success) {
    vscode.window.showErrorMessage(`Invalid vscode links configuration. Error: ${result.error}`)
  }

  return result.success
}

async function loadConfig(workspacePath: string): Promise<unknown> {
  const configPath = findConfigFile(workspacePath)
  if (!configPath) {
    return null
  }

  try {
    const configUrl = pathToFileURL(configPath).toString()
    const cacheTimestamp = "?t=" + Date.now()
    const config = await import(configUrl + cacheTimestamp)
    if (!config.default) {
      vscode.window.showErrorMessage(
        "Invalid configuration file. It should export a default configuration object. Check the docs for further details.",
      )
      return null
    }

    return config.default
  } catch (error) {
    console.error("Error loading configuration:", error)
    vscode.window.showErrorMessage(
      `Error loading configuration file: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  return null
}

function findConfigFile(workspacePath: string): string | null {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = path.join(workspacePath, fileName)
    if (fs.existsSync(filePath)) {
      return filePath
    }
  }
  return null
}
