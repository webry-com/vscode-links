import * as vscode from "vscode"
import { findConfigFile } from "./config"
import crossSpawn from "cross-spawn"
import path from "path"
import { vscLog } from "./extension"

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
      vscLog("Error", `No config file found in workspace "${workspace.name}"`)
      return null
    }

    const relativeFilePath = path.relative(workspace.uri.fsPath, document.uri.fsPath).replace(/\\/g, "/")
    const content = document.getText()
    const result = await runCli(workspacePath, ["run", "-c", config.name, "-f", relativeFilePath], content)
    if (result == null) {
      vscLog("Error", `Links CLI Failed, see above.`)
      return null
    }

    try {
      const links = JSON.parse(result)
      vscLog("Info", `Created ${links.length} Links!`)

      return links.map((link: any) => {
        link.range = new vscode.Range(document.positionAt(link.range[0]), document.positionAt(link.range[1]))
        link.target = vscode.Uri.parse(link.target)
        return link
      })
    } catch (error) {
      vscLog("Error", `CLI produced unexpected results: ${error}`)
    }

    return null
  }
}

function runCli(workspacePath: string, args: string[], content: string): Promise<string | null> {
  return new Promise((resolve) => {
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

    cliProcess.on("Error", (error) => {
      vscLog("Error", `CLI process error (node ${[cliPath, ...args].join(" ")}): ${error}`)
    })

    cliProcess.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim())
        vscLog("Info", `CLI process "node ${[cliPath, ...args].join(" ")}" succeeded`)
      } else {
        vscLog("Error", `CLI process "node ${[cliPath, ...args].join(" ")}" failed (code ${code})`)
        vscLog("Error", `StdErr: ${errorOutput}`)
        vscLog("Error", `StdOut: ${output}`)
        resolve(null)
      }
    })

    cliProcess.stdin?.write(content)
    cliProcess.stdin?.end()
  })
}
