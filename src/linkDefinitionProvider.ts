import * as vscode from "vscode"
import { findConfigFile } from "./config"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)

export class LinkDefinitionProvider implements vscode.DocumentLinkProvider {
  constructor() {}

  public async provideDocumentLinks(document: vscode.TextDocument) {
    const workspace = vscode.workspace.getWorkspaceFolder(document.uri)
    if (!workspace) {
      return null
    }

    const workspacePath = workspace.uri.fsPath
    const config = findConfigFile(workspacePath)
    if (config == null) {
      return null
    }

    const relativeFilePath = path.relative(workspace.uri.fsPath, document.uri.fsPath).replace(/\\/g, "/")
    const result = await runCli(workspacePath, ["run", "-c", config.name, "-f", relativeFilePath])
    if (result == null) {
      return null
    }

    try {
      const links = JSON.parse(result.trim())
      console.log("[VSCode Links] Provided Links: ", links)

      return links.map((link: any) => {
        link.range = new vscode.Range(document.positionAt(link.range[0]), document.positionAt(link.range[1]))
        link.target = vscode.Uri.parse(link.target)
        return link
      })
    } catch (error) {
      console.error(error)
    }

    return null
  }
}

async function runCli(workspacePath: string, args: string[]): Promise<string | null> {
  const command = `npx vscode-links-cli ${args.join(" ")}`
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: workspacePath })
    if (stderr) {
      throw new Error(stderr)
    }
    return stdout.trim()
  } catch (error) {
    console.error(error)
    return null
  }
}
