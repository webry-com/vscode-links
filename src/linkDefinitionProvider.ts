import * as vscode from "vscode"
import { findConfigFile } from "./config"
import crossSpawn from "cross-spawn"
import path from "path"

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
    const content = document.getText()
    const result = await runCli(workspacePath, ["run", "-c", config.name, "-f", relativeFilePath], content)
    if (result == null) {
      return null
    }

    try {
      const links = JSON.parse(result)
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

function runCli(workspacePath: string, args: string[], content: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    // const linkedPath = path.join("XXX\\Desktop\\vscode-links-cli\\build\\main\\cli.js")
    const cliPath = path.join(workspacePath, "node_modules", "vscode-links-cli", "build", "module", "cli.js")
    const cliProcess = crossSpawn("node", [cliPath, ...args], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: workspacePath,
      env: { ...process.env },
    })

    let output = ""
    let errorOutput = ""

    cliProcess.stdout?.on("data", (data) => {
      output += data.toString()
    })

    cliProcess.stderr?.on("data", (data) => {
      errorOutput += data.toString()
    })

    cliProcess.on("error", (error) => {
      console.error(error)
      reject(error)
    })

    cliProcess.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim())
      } else {
        console.error(`CLI process exited with code ${code}`)
        console.error(`Error output: ${errorOutput} ${output}`)
        resolve(null)
      }
    })

    cliProcess.stdin?.write(content)
    cliProcess.stdin?.end()
  })
}
