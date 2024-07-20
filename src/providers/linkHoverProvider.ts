import * as vscode from "vscode"
import { LinkDefinitionProvider } from "../providers/linkProvider"

const linkProviders: Map<
  LinkHoverProvider,
  {
    disposable: vscode.Disposable
  }
> = new Map()

export function createLinkHoverProvider() {
  const lhp = new LinkHoverProvider()
  const lhpDisposable = vscode.languages.registerHoverProvider({ pattern: `**/*` }, lhp)

  linkProviders.set(lhp, {
    disposable: lhpDisposable,
  })
  return lhp
}

export class LinkHoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
    const linkProvider = new LinkDefinitionProvider()
    const links = linkProvider.provideDocumentLinks(document)
    const link = links?.find((link) => link.description && link.range.contains(position))
    if (!link) {
      return null
    }

    const markdown = new vscode.MarkdownString()
    markdown.supportHtml = true
    markdown.appendMarkdown(`${link.description}\n\n`)
    return new vscode.Hover(markdown, link.range)
  }
}

export function disposeLinkHoverProvider(lhp: LinkHoverProvider) {
  const res = linkProviders.get(lhp)
  if (!res) {
    return
  }
  res.disposable.dispose()
}

export function disposeAllLinkHoverProviders() {
  linkProviders.forEach((res) => {
    res.disposable.dispose()
  })
}
