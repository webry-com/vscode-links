import * as vscode from "vscode"
import { LinkDefinitionProvider } from "./linkDefinitionProvider"
import { getWorkspaceConfig, setupConfigWatcher } from "./config"

/**
 * TODO: Custom search function
 */

let isActivated = false

export function activate(context: vscode.ExtensionContext) {
  activateExtension(context)

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-links.activate", async () => {
      if (!isActivated) {
        await activateExtension(context)
      } else {
        vscode.window.showInformationMessage("Extension is already active.")
      }
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-links.createConfig", async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders ?? []
      if (workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspaces are currently opened.")
        return
      }

      const selectedWorkspaceIndex = await vscode.window.showQuickPick(
        workspaceFolders.map((folder) => folder.name),
        {
          placeHolder: "Select a workspace",
        },
      )

      if (!selectedWorkspaceIndex) {
        vscode.window.showInformationMessage("No workspace was selected.")
        return
      }

      const selectedWorkspace = workspaceFolders.find((folder) => folder.name === selectedWorkspaceIndex)
      if (!selectedWorkspace) {
        vscode.window.showErrorMessage("Failed to find the selected workspace.")
        return
      }

      const configContent = getDefaultWorkspaceConfig()
      const configFilePath = `${selectedWorkspace.uri.fsPath}/vscode-links.config.js`

      try {
        vscode.workspace.fs.stat(vscode.Uri.file(configFilePath)).then(() => {
          vscode.window.showTextDocument(vscode.Uri.file(configFilePath))
        })
      } catch (error) {
        vscode.workspace.fs
          .writeFile(vscode.Uri.file(configFilePath), new TextEncoder().encode(configContent))
          .then(() => {
            vscode.window.showTextDocument(vscode.Uri.file(configFilePath))
          })
      }
    }),
  )
}

function getDefaultWorkspaceConfig(): string {
  return `
export default {
  links: [
    {
      include: "**/*",
      pattern: /vscode-links/g,
      handle: () => {
        return {
          target: "https://github.com/webry-com/vscode-links#readme",
          tooltip: "Go to VSCode ReadMe.",
        }
      },
    },
  ],
};
  `
}

async function activateExtension(context: vscode.ExtensionContext) {
  await setupConfigWatcher(context)

  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    const config = getWorkspaceConfig(folder.uri.fsPath)
    if (config === null) {
      continue
    }

    const options: {
      pattern?: string
      language?: string
    } = {}

    options.pattern = `**/*`

    vscode.languages.registerDocumentLinkProvider(options, new LinkDefinitionProvider())
  }

  isActivated = true
}

export function deactivate() {}
