import * as vscode from "vscode"

let outputChannel: vscode.OutputChannel

export function registerOutputChannel(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("VSCode Links")
  context.subscriptions.push(outputChannel)
}

export function showOutputChannel() {
  outputChannel.show(true)
}

export function vscLog(logLevel: "Error" | "Warn" | "Info", message: unknown) {
  const timestamp = new Date().toLocaleTimeString("de-DE")
  const logMessage = `[${timestamp}] [${logLevel.padEnd(5, " ")}] ${message}`

  if (logLevel === "Error") {
    console.error(logMessage)
  } else if (logLevel === "Warn") {
    console.warn(logMessage)
  } else {
    console.log(logMessage)
  }

  outputChannel.appendLine(logMessage)
}
