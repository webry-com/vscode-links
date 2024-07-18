import * as vscode from "vscode"
import { type ConfigLayerMeta, type ResolvedConfig, type UserInputConfig, watchConfig } from "c12"
import { showOutputChannel, vscLog } from "./output"
import { z } from "zod"

const watchers: Map<string, Awaited<ReturnType<typeof watchConfig>>> = new Map()
const configs: Map<string, z.infer<typeof configSchema>> = new Map()
export const handlerResponseSchema = z.object({
  target: z.string(),
  tooltip: z.string().optional(),
  jumpPattern: z
    .any()
    .refine((val) => val instanceof RegExp || typeof val === "string")
    .optional(),
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

export function getConfig(workspace: vscode.WorkspaceFolder) {
  return configs.get(workspace.uri.fsPath)
}

function loadConfig(config: ResolvedConfig<UserInputConfig, ConfigLayerMeta>, workspaceFolder: vscode.WorkspaceFolder) {
  if (config.config.__JITI_ERROR__) {
    vscLog("Error", JSON.stringify(config.config.__JITI_ERROR__, null, 2))
    showOutputChannel()
    return
  }

  const validationResult = configSchema.safeParse(config.config)
  if (!validationResult.success) {
    vscLog("Error", "Invalid config:\n" + JSON.stringify(validationResult.error, null, 2))
    showOutputChannel()
    return
  }

  configs.set(workspaceFolder.uri.fsPath, validationResult.data)
  vscLog("Info", "Config loaded!")
}

export async function createConfigWatchers() {
  const workspaceFolders = vscode.workspace.workspaceFolders ?? []
  for (const workspaceFolder of workspaceFolders) {
    const config = await watchConfig({
      cwd: workspaceFolder.uri.fsPath,
      name: "vsc-links",
      onUpdate({ newConfig }) {
        loadConfig(newConfig, workspaceFolder)
      },
      onWatch: (event) => {
        vscLog("Info", `Updating... ${event.path}`)
      },
      jitiOptions: {
        onError() {
          vscLog("Error", "Failed to load config!")
        },
      },
    })
    watchers.set(workspaceFolder.uri.fsPath, config)
    loadConfig(config, workspaceFolder)
  }
}

export async function disposeConfigWatchers() {
  for (const watcher of watchers.values()) {
    watcher.unwatch()
  }
}
