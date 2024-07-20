import * as vscode from "vscode"
import { LinkDefinitionProvider } from "../providers/linkProvider"
import { vscLog } from "../utils/output"

const linkProviders: Map<
  LinkButtonHoverProvider,
  {
    disposable: vscode.Disposable
  }
> = new Map()

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
    if (!link) {
      return null
    }

    const markdown = new vscode.MarkdownString()
    markdown.supportHtml = true

    link.buttons?.forEach((button) => {
      const title = button.title.replace(/([[\]()\\])/g, "\\$1")

      if ("target" in button) {
        markdown.appendMarkdown(`[${title}](${button.target})  `)
      } else {
        // button.action()
        // markdown.isTrusted = true
        // markdown.appendMarkdown(`[${title}](command:${button.action})  `)
        // const commandUri = vscode.Uri.parse(
        //   `command:vscode-links.customButton?${encodeURIComponent(JSON.stringify({ index }))}`,
        // )
        vscLog("Error", "Button action()s not yet supported! Use targets instead.")
      }
    })

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
