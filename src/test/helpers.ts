import path from 'path'

import * as vscode from 'vscode'

import { registerOutputChannel } from '@/utils/output'

let outputChannelRegistered = false

/**
 * The source modules log through the extension's output channel. Each test
 * bundle has its own module state, so register a channel once per bundle
 * before exercising code that calls vscLog.
 */
export function ensureOutputChannel(): void {
  if (outputChannelRegistered) {
    return
  }
  outputChannelRegistered = true
  // registerOutputChannel only touches context.subscriptions.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  registerOutputChannel({ subscriptions: [] } as unknown as vscode.ExtensionContext)
}

export function fixtureWorkspaceFolder(): vscode.WorkspaceFolder {
  const folder = vscode.workspace.workspaceFolders?.[0]
  if (!folder) {
    throw new Error('Expected the test-fixtures/workspace folder to be opened (see .vscode-test.mjs)')
  }
  return folder
}

export function fixturePath(...segments: string[]): string {
  return path.join(fixtureWorkspaceFolder().uri.fsPath, ...segments)
}

/**
 * Builds a WorkspaceFolder object for a sibling fixture directory that is not
 * actually opened in the test instance. updateConfig only uses the folder as
 * a config-loading cwd and cache key, so this is enough for unit tests.
 */
export function fakeWorkspaceFolder(dirName: string): vscode.WorkspaceFolder {
  const fixturesRoot = path.resolve(fixtureWorkspaceFolder().uri.fsPath, '..')
  return {
    uri: vscode.Uri.file(path.join(fixturesRoot, dirName)),
    name: dirName,
    index: 1,
  }
}

export async function openFixtureDocument(name: string): Promise<vscode.TextDocument> {
  return vscode.workspace.openTextDocument(vscode.Uri.file(fixturePath(name)))
}

export async function pollUntil<T>(
  fn: () => Promise<T | undefined | null | false> | T | undefined | null | false,
  message: string,
  timeoutMs = 15_000,
  intervalMs = 200,
): Promise<T> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    // Polling is inherently sequential.
    // oxlint-disable-next-line no-await-in-loop
    const result = await fn()
    if (result != null && result !== false) {
      return result
    }
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for: ${message}`)
    }
    // oxlint-disable-next-line no-await-in-loop
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, intervalMs)
    })
  }
}
