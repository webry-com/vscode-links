import * as vscode from "vscode"
import fs from "fs"
import path from "path"

import { registerOutputChannel } from "./utils/output"
import { ConfigType, createBaseConfig } from "./utils/defaults"
import { askWorkspace } from "./utils/vscode"
import { updateConfigs, disposeConfigWatchers, watchConfigFiles } from "./utils/watchers"
import { createLinkHoverProvider, disposeAllLinkHoverProviders } from "./providers/linkHoverProvider"
import { createLinkButtonHoverProvider, disposeAllLinkButtonHoverProviders } from "./providers/linkButtonHoverProvider"
import { createLinkProvider, disposeAllLinkProviders } from "./providers/linkProvider"

export function activate(context: vscode.ExtensionContext) {
  registerOutputChannel(context)
  updateConfigs()
  watchConfigFiles(() => updateConfigs())

  createLinkProvider()
  createLinkHoverProvider()
  createLinkButtonHoverProvider()

  registerRestartVSCodeLinksCommand(context)
  registerCreateConfigCommand(context)
}

export function deactivate() {
  disposeConfigWatchers()

  disposeAllLinkProviders()
  disposeAllLinkHoverProviders()
  disposeAllLinkButtonHoverProviders()
}

function registerRestartVSCodeLinksCommand(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-links.restartVSCodeLinks", async () => {
      disposeAllLinkProviders()
      disposeAllLinkHoverProviders()
      disposeAllLinkButtonHoverProviders()

      updateConfigs()
      watchConfigFiles(() => updateConfigs())
      createLinkProvider()
    }),
  )
}

function registerCreateConfigCommand(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-links.createConfig", async () => {
      const selectedWorkspace = await askWorkspace()
      if (!selectedWorkspace) {
        return
      }

      const configTypes: ConfigType[] = [".ts", ".js", ".cjs", ".mjs"] as const
      const configType = await vscode.window.showQuickPick(configTypes, {
        placeHolder: "Select a format...",
      })
      const isConfigType = (t: any): t is ConfigType => configTypes.includes(t)
      if (!configType || !isConfigType(configType)) {
        return
      }

      const configContent = createBaseConfig(configType)
      const filePath = path.join(selectedWorkspace.uri.fsPath, "vsc-links.config" + configType)

      if (fs.existsSync(filePath)) {
        const document = await vscode.workspace.openTextDocument(filePath)
        await vscode.window.showTextDocument(document)
      } else {
        fs.writeFileSync(filePath, configContent)
        const document = await vscode.workspace.openTextDocument(filePath)
        await vscode.window.showTextDocument(document)
      }
    }),
  )
}
