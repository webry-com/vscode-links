import fs from 'fs'
import path from 'path'

import { type ResolvedConfig, loadConfig } from 'c12'
import * as vscode from 'vscode'
import type { z } from 'zod'

import { vscLog } from './output'
import type { Config } from './schemas'
import { configSchema } from './schemas'

const watchers: vscode.FileSystemWatcher[] = []
const configs = new Map<string, z.infer<typeof configSchema>>()

export function watchConfigFiles(callback: () => void): void {
  disposeConfigWatchers()

  const extensions = ['js', 'ts', 'mjs', 'cjs', 'mts', 'cts']
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    const pattern = new vscode.RelativePattern(folder, `vsc-links.config.{${extensions.join(',')}}`)
    const watcher = vscode.workspace.createFileSystemWatcher(pattern)

    watcher.onDidChange(() => callback())
    watcher.onDidCreate(() => callback())
    watcher.onDidDelete(() => callback())
    watchers.push(watcher)
  }
}

export function disposeConfigWatchers(): void {
  for (const watcher of watchers) {
    watcher.dispose()
  }
  watchers.length = 0
}

export function getConfig(workspace: vscode.WorkspaceFolder | string): Config | undefined {
  return configs.get(typeof workspace === 'string' ? workspace : workspace.uri.fsPath)
}

function cacheConfig(config: ResolvedConfig, workspaceFolder: vscode.WorkspaceFolder) {
  // oxlint-disable-next-line no-underscore-dangle
  if (config.config.__JITI_ERROR__) {
    configs.delete(workspaceFolder.uri.fsPath)
    // oxlint-disable-next-line no-underscore-dangle
    vscLog('Error', JSON.stringify(config.config.__JITI_ERROR__, null, 2))
    return
  }

  const validationResult = configSchema.safeParse(config.config)
  if (!validationResult.success) {
    const extensions = ['js', 'ts', 'mjs', 'cjs', 'mts', 'cts']
    const configFileExists = extensions.some((ext) =>
      fs.existsSync(path.normalize(workspaceFolder.uri.fsPath + '/vsc-links.config.' + ext)),
    )
    if (configFileExists) {
      vscLog('Info', 'AAAA DELETE ')
      configs.delete(workspaceFolder.uri.fsPath)
      vscLog(
        'Error',
        `Invalid config in workspace "${workspaceFolder.name}":\n` + JSON.stringify(validationResult.error, null, 2),
      )
      return
    }
    return
  }

  vscLog('Info', 'AAAA SET ' + validationResult.data.links.length)
  configs.set(workspaceFolder.uri.fsPath, validationResult.data)
  vscLog(
    'Info',
    `Config in workspace "${workspaceFolder.name}" loaded with ${validationResult.data.links.length} link definitions!`,
  )
}

export async function updateConfigs(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders ?? []
  await Promise.all(workspaceFolders.map(async (workspaceFolder) => updateConfig(workspaceFolder)))
}

export async function updateConfig(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
  const config = await loadConfig({
    cwd: workspaceFolder.uri.fsPath,
    name: 'vsc-links',
    jitiOptions: {
      onError() {
        vscLog('Error', 'Failed to load config!')
      },
    },
    packageJson: false,
    rcFile: false,
    globalRc: false,
  })
  vscLog('Info', 'AAAA updateConfig ' + config.config.links.length)
  cacheConfig(config, workspaceFolder)
}
