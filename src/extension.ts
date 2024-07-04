import * as vscode from "vscode"
import fs from "fs"
import { LinkDefinitionProvider } from "./LinkDefinitionProvider"
import path from "path"

/**
 * TODO: Custom search function
 */

export function activate(context: vscode.ExtensionContext) {
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
      const filePath = path.join(selectedWorkspace.uri.fsPath, "vsc-links.config.js")

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

  vscode.languages.registerDocumentLinkProvider({ pattern: `**/*` }, new LinkDefinitionProvider())
}

export function deactivate() {}

function getDefaultWorkspaceConfig(): string {
  return `
/** @type {import("vscode-links-cli").VSCodeLinksConfig} */
export default {
  links: [
    {
      include: "**/*",
      pattern: /vscode-link/g,
      handle: ({}) => {
        return {
          target: "https://github.com/webry-com/vscode-links#readme",
          tooltip: "Go to VSCode ReadMe.",
        };
      },
    },
  ],
};
  `
}
