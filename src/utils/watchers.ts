import * as vscode from "vscode"
import { type ConfigLayerMeta, type ResolvedConfig, type UserInputConfig, loadConfig } from "c12"
import { showOutputChannel, vscLog } from "../utils/output"
import { z } from "zod"

export const linkButtonSchema = z
  .object({
    title: z.string(),
    action: z.function().args().returns(z.void()),
  })
  .or(
    z.object({
      title: z.string(),
      target: z.string(),
      jumpPattern: z
        .any()
        .refine((val) => val instanceof RegExp || typeof val === "string")
        .optional(),
    }),
  )
export const handlerResponseSchema = z.object({
  target: z.string(),
  tooltip: z.string().optional(),
  jumpPattern: z
    .any()
    .refine((val) => val instanceof RegExp || typeof val === "string")
    .optional(),
  description: z.string().optional(),
  buttons: z.array(linkButtonSchema).optional(),
})
export const configSchema = z.object({
  links: z.array(
    z.object({
      include: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .default("**/*"),
      exclude: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .default([]),
      pattern: z
        .any()
        .refine(
          (val): val is RegExp | RegExp[] =>
            val instanceof RegExp || (Array.isArray(val) && val.length > 0 && val.every((v) => v instanceof RegExp)),
        ),
      handle: z
        .function()
        .args(
          z.object({
            linkText: z.string(),
            workspace: z.any(),
            file: z.any(),
            log: z.any(),
          }),
        )
        .returns(handlerResponseSchema),
    }),
  ),
})

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
}

export function getConfig(workspace: vscode.WorkspaceFolder) {
  return configs.get(workspace.uri.fsPath)
}

function cacheConfig(
  config: ResolvedConfig<UserInputConfig, ConfigLayerMeta>,
  workspaceFolder: vscode.WorkspaceFolder,
) {
  if (config.config.__JITI_ERROR__) {
    configs.delete(workspaceFolder.uri.fsPath)
    vscLog("Error", JSON.stringify(config.config.__JITI_ERROR__, null, 2))
    showOutputChannel()
    return
  }

  const validationResult = configSchema.safeParse(config.config)
  if (!validationResult.success) {
    configs.delete(workspaceFolder.uri.fsPath)
    vscLog("Error", "Invalid config:\n" + JSON.stringify(validationResult.error, null, 2))
    showOutputChannel()
    return
  }

  configs.set(workspaceFolder.uri.fsPath, validationResult.data)
  vscLog("Info", `Config in workspace "${workspaceFolder.name}" loaded!`)
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
    extend: false,
    packageJson: false,
    rcFile: false,
    globalRc: false,
  })
  cacheConfig(config, workspaceFolder)
}
