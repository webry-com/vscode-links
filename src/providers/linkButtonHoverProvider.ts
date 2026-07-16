import { v4 } from 'uuid'
import * as vscode from 'vscode'

import { vscLog } from '@/utils/output'

import { LinkDefinitionProvider } from './linkProvider'

const linkProviders = new Map<
  LinkButtonHoverProvider,
  {
    disposable: vscode.Disposable
  }
>()
const buttonHandlers = new Map<string, () => void>()
export function getButtonActionHandler(token: string): (() => void) | undefined {
  return buttonHandlers.get(token)
}

export function createLinkButtonHoverProvider(): LinkButtonHoverProvider {
  const lbhp = new LinkButtonHoverProvider()
  const lbhpDisposable = vscode.languages.registerHoverProvider({ pattern: `**/*` }, lbhp)

  linkProviders.set(lbhp, {
    disposable: lbhpDisposable,
  })
  return lbhp
}

export class LinkButtonHoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
    const linkProvider = new LinkDefinitionProvider()
    const links = linkProvider.provideDocumentLinks(document)
    const link = links?.find((lnk) => lnk.buttons && lnk.range.contains(position))
    if (link == null) {
      return null
    }

    const markdown = new vscode.MarkdownString()
    markdown.supportHtml = true

    const markdowns: string[] = []
    for (const button of link.buttons ?? []) {
      const title = button.title.replace(/([[\]()\\])/g, '\\$1')

      if ('target' in button && /:\d+(?::\d+)?$/.exec(button.target)) {
        // Handle file:line or file:line:column format manually since VSCode markdown doesn't support it
        markdown.isTrusted = true

        const token = v4()
        buttonHandlers.set(token, () => {
          const match = /:(\d+)(?::(\d+))?$/.exec(button.target)

          let filePath: string
          let lineNumber: number = 1
          let columnNumber: number = 0

          if (match) {
            filePath = button.target.replace(/:(\d+)(?::(\d+))?$/, '') // Remove :line:column from end
            lineNumber = Number.parseInt(match[1], 10)
            columnNumber = match[2] ? Number.parseInt(match[2], 10) : 0
          } else {
            filePath = button.target
          }

          vscLog('Info', `Opening file: ${filePath}`)
          const uri = vscode.Uri.parse(filePath, true)
          vscode.workspace.openTextDocument(uri).then((doc) => {
            vscLog('Info', `Successfully opened: ${doc.uri.toString()}`)

            vscode.window.showTextDocument(doc).then((editor) => {
              const pos = new vscode.Position(lineNumber - 1, Math.max(0, columnNumber - 1))
              editor.selection = new vscode.Selection(pos, pos)
              editor.revealRange(new vscode.Range(pos, pos))
            })
          })
        })

        const commandUri = vscode.Uri.parse(
          `command:vsc-links.linkButton?${encodeURIComponent(
            JSON.stringify({
              actionToken: token,
            }),
          )}`,
        )
        markdowns.push(`[${title}](${String(commandUri)})`)
      } else if ('target' in button) {
        markdowns.push(`[${title}](${button.target})`)
      } else {
        markdown.isTrusted = true

        const token = v4()
        buttonHandlers.set(token, () => {
          void button.action()
        })

        const commandUri = vscode.Uri.parse(
          `command:vsc-links.linkButton?${encodeURIComponent(
            JSON.stringify({
              actionToken: token,
            }),
          )}`,
        )
        markdowns.push(`[${title}](${String(commandUri)})`)
      }
    }

    markdown.appendMarkdown(markdowns.join('  •  '))
    return new vscode.Hover(markdown, link.range)
  }
}

export function disposeLinkButtonHoverProvider(lbhp: LinkButtonHoverProvider): void {
  const res = linkProviders.get(lbhp)
  if (!res) {
    return
  }
  res.disposable.dispose()
}

export function disposeAllLinkButtonHoverProviders(): void {
  for (const res of linkProviders.values()) {
    res.disposable.dispose()
  }
}
