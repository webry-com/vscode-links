import * as vscode from "vscode"
import { LinkDefinitionProvider } from "../providers/linkProvider"
import { v4 } from "uuid"

const linkProviders: Map<
  LinkButtonHoverProvider,
  {
    disposable: vscode.Disposable
  }
> = new Map()
const buttonHandlers = new Map<string, () => void>()
export function getButtonActionHandler(token: string) {
  return buttonHandlers.get(token)
}

export function createLinkButtonHoverProvider() {
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
    const link = links?.find((link) => link.buttons && link.range.contains(position))
    if (link == null) {
      return null
    }

    const markdown = new vscode.MarkdownString()
    markdown.supportHtml = true

    const markdowns: string[] = []
    link.buttons?.forEach((button) => {
      const title = button.title.replace(/([[\]()\\])/g, "\\$1")

      if ("target" in button) {
        markdowns.push(`[${title}](${button.target})`)
      } else {
        markdown.isTrusted = true

        const token = v4()
        buttonHandlers.set(token, button.action)

        const commandUri = vscode.Uri.parse(
          `command:vscode-links.linkButton?${encodeURIComponent(
            JSON.stringify({
              actionToken: token,
            }),
          )}`,
        )
        markdowns.push(`[${title}](${commandUri})`)
      }
    })

    markdown.appendMarkdown(markdowns.join("  •  "))
    return new vscode.Hover(markdown, link.range)
  }
}

export function disposeLinkButtonHoverProvider(lbhp: LinkButtonHoverProvider) {
  const res = linkProviders.get(lbhp)
  if (!res) {
    return
  }
  res.disposable.dispose()
}

export function disposeAllLinkButtonHoverProviders() {
  linkProviders.forEach((res) => {
    res.disposable.dispose()
  })
}
