import * as vscode from "vscode"
import { findConfigFile } from "./config"
import crossSpawn from "cross-spawn"
import path from "path"
import fs from "fs"
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
      const data = JSON.parse(result)
      const compatibleData: any = {}
      if (Array.isArray(data)) {
        compatibleData.version = "0"
        compatibleData.links = data
      } else {
        Object.assign(compatibleData, data)
      }

      vscLog("Info", `Created ${compatibleData.links.length} Links!`)

      return compatibleData.links.map((link: any) => {
        const finalLink: vscode.DocumentLink & {
          _originalVsclTarget: string
          _vsclTarget: vscode.Uri
          _jumpPattern: any
        } = {
          _originalVsclTarget: link.target,
          _vsclTarget: vscode.Uri.parse(link.target),
          range: new vscode.Range(document.positionAt(link.range[0]), document.positionAt(link.range[1])),
          tooltip: link.tooltip || "",
          _jumpPattern: link.jumpPattern,
        }

        // Jumping to a specific line with "jumpPattern"
        if (finalLink._vsclTarget.scheme === "file" && typeof link.jumpPattern === "object") {
          const targetDocument = vscode.workspace.textDocuments.find(
            (doc) => doc.uri.path === finalLink._vsclTarget.path,
          )
          if (targetDocument) {
            if (link.jumpPattern.pattern) {
              const regex = new RegExp(link.jumpPattern.pattern, link.jumpPattern.flags || "g")
              const index = targetDocument.getText().search(regex)
              if (index >= 0) {
                const position = targetDocument.positionAt(index)
                finalLink.target = vscode.Uri.parse(`${link.target}#L${position.line + 1}:${position.character + 1}`)
              }
            } else if (link.jumpPattern.literal) {
              const index = targetDocument.getText().indexOf(link.jumpPattern.literal)
              if (index >= 0) {
                const position = targetDocument.positionAt(index)
                finalLink.target = vscode.Uri.parse(`${link.target}#L${position.line + 1}:${position.character + 1}`)
              }
            }
          } else {
            return finalLink
          }
        } else {
          finalLink.target = finalLink._vsclTarget
        }

        return finalLink
      })
    } catch (error) {
      vscLog("Error", error as any)
    }

    return null
  }

  resolveDocumentLink(
    link: vscode.DocumentLink & { _vsclTarget: vscode.Uri; _jumpPattern: any; _originalVsclTarget: string },
  ): vscode.ProviderResult<vscode.DocumentLink> {
    if (link.target) {
      return {
        ...link,
        target: link._vsclTarget,
      }
    }

    console.log("SUCCESS")

    try {
      const targetDocument = fs.readFileSync(link._vsclTarget.fsPath, "utf8")
      if (link._jumpPattern.pattern) {
        const regex = new RegExp(link._jumpPattern.pattern, link._jumpPattern.flags || "g")
        const index = targetDocument.search(regex)
        if (index >= 0) {
          const { line, column } = getLineAndColumn(targetDocument, index)
          link.target = vscode.Uri.parse(`${link._originalVsclTarget}#L${line}:${column}`)
        }
      } else if (link._jumpPattern.literal) {
        const index = targetDocument.indexOf(link._jumpPattern.literal)
        if (index >= 0) {
          const { line, column } = getLineAndColumn(targetDocument, index)
          link.target = vscode.Uri.parse(`${link._originalVsclTarget}#L${line}:${column}`)
        }
      }
    } catch (error) {
      vscLog("Error", error as any)
    }

    if (!link.target) {
      vscLog("Error", `Could not find linePattern in document: ${link._vsclTarget.path}`)
      link.target = link._vsclTarget
    }

    return link
  }
}

function getLineAndColumn(
  text: string,
  index: number,
): {
  line: number
  column: number
} {
  if (index < 0 || index > text.length) {
    return { line: 1, column: 1 }
  }

  const lines = text.split("\n")
  let currentLength = 0
  let lineNumber = 1

  for (const line of lines) {
    const lineLength = line.length + 1
    if (currentLength + lineLength > index) {
      return {
        line: lineNumber,
        column: index - currentLength + 1,
      }
    }
    currentLength += lineLength
    lineNumber++
  }

  return {
    line: lineNumber - 1,
    column: lines[lines.length - 1].length + 1,
  }
}

function runCli(workspacePath: string, args: string[], content: string): Promise<string | null> {
  return new Promise((resolve) => {
    const linkedPath = path.join("C:\\Users\\SBrau\\Desktop\\vscode-links-cli\\build\\main\\cli.js")
    const cliPath = path.join(workspacePath, "node_modules", "vscode-links-cli", "build", "module", "cli.js")
    const cliProcess = crossSpawn("node", [linkedPath, ...args], {
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
