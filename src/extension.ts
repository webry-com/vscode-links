import fs from 'fs'
import path from 'path'

import * as vscode from 'vscode'

import {
  createLinkButtonHoverProvider,
  disposeAllLinkButtonHoverProviders,
  getButtonActionHandler,
} from './providers/linkButtonHoverProvider'
import { createLinkHoverProvider, disposeAllLinkHoverProviders } from './providers/linkHoverProvider'
import { createLinkProvider, disposeAllLinkProviders } from './providers/linkProvider'
import type { ConfigType } from './utils/defaults'
import { createBaseConfig } from './utils/defaults'
import { registerOutputChannel, vscLog } from './utils/output'
import { askWorkspace } from './utils/vscode'
import { updateConfigs, disposeConfigWatchers, watchConfigFiles } from './utils/watchers'

export function activate(context: vscode.ExtensionContext): void {
  registerOutputChannel(context)
  void updateConfigs()
  watchConfigFiles(() => {
    void updateConfigs()
    vscLog('Info', 'Config Change Detected!')
  })

  createLinkProvider()
  createLinkHoverProvider()
  createLinkButtonHoverProvider()

  registerRestartVSCodeLinksCommand(context)
  registerRefreshProvidersVSCodeLinksCommand(context)
  registerCreateConfigCommand(context)
  registerLinkButtonCommand(context)
}

export function deactivate(): void {
  disposeConfigWatchers()

  disposeAllLinkProviders()
  disposeAllLinkHoverProviders()
  disposeAllLinkButtonHoverProviders()
}

function registerRestartVSCodeLinksCommand(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vsc-links.restartVSCodeLinks', () => {
      disposeAllLinkProviders()
      disposeAllLinkHoverProviders()
      disposeAllLinkButtonHoverProviders()

      void updateConfigs()
      watchConfigFiles(() => {
        void updateConfigs()
        vscLog('Info', 'Config Change Detected!')
      })

      createLinkProvider()
      createLinkHoverProvider()
      createLinkButtonHoverProvider()
    }),
  )
}

function registerRefreshProvidersVSCodeLinksCommand(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vsc-links.refreshVSCodeLinksProviders', () => {
      disposeAllLinkProviders()
      disposeAllLinkHoverProviders()
      disposeAllLinkButtonHoverProviders()

      void updateConfigs()

      createLinkProvider()
      createLinkHoverProvider()
      createLinkButtonHoverProvider()
    }),
  )
}

function registerCreateConfigCommand(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vsc-links.createConfig', async () => {
      const selectedWorkspace = await askWorkspace()
      if (!selectedWorkspace) {
        return
      }

      const configTypes: ConfigType[] = ['.ts', '.js', '.cjs', '.mjs'] as const
      const configType = await vscode.window.showQuickPick(configTypes, {
        placeHolder: 'Select a format...',
      })
      const isConfigType = (t: any): t is ConfigType => configTypes.includes(t)
      if (!configType || !isConfigType(configType)) {
        return
      }

      const configContent = createBaseConfig(configType)
      const filePath = path.join(selectedWorkspace.uri.fsPath, 'vsc-links.config' + configType)

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

function registerLinkButtonCommand(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vsc-links.linkButton', (args: { actionToken: string }) => {
      const action = getButtonActionHandler(args.actionToken)
      action?.()
    }),
  )
}
