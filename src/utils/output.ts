import * as vscode from 'vscode'

let outputChannel: vscode.OutputChannel

export function registerOutputChannel(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel('VSCode Links')
  context.subscriptions.push(outputChannel)
}

export function showOutputChannel(): void {
  outputChannel.show(true)
}

export function vscLog(logLevel: 'Error' | 'Warn' | 'Info', message: unknown): void {
  const timestamp = new Date().toLocaleTimeString('de-DE')
  const logLevelPadded = `[${logLevel}]`.padEnd(7, ' ')
  const logMessage = `[${timestamp}] ${logLevelPadded} ${String(message)}`

  if (logLevel === 'Error') {
    console.error('VSCL: ', logMessage)
  } else if (logLevel === 'Warn') {
    console.warn('VSCL: ', logMessage)
  } else {
    console.log('VSCL: ', logMessage)
  }

  outputChannel.appendLine(logMessage)
}
