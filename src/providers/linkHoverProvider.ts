import * as vscode from 'vscode'

import { LinkDefinitionProvider } from './linkProvider'

const linkProviders = new Map<
  LinkHoverProvider,
  {
    disposable: vscode.Disposable
  }
>()

export function createLinkHoverProvider(): LinkHoverProvider {
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
    const link = links?.find((lnk) => lnk.description && lnk.range.contains(position))
    if (!link) {
      return null
    }

    const markdown = new vscode.MarkdownString()
    markdown.supportHtml = true
    markdown.appendMarkdown(`${link.description}\n\n`)
    return new vscode.Hover(markdown, link.range)
  }
}

export function disposeLinkHoverProvider(lhp: LinkHoverProvider): void {
  const res = linkProviders.get(lhp)
  if (!res) {
    return
  }
  res.disposable.dispose()
}

export function disposeAllLinkHoverProviders(): void {
  for (const res of linkProviders.values()) {
    res.disposable.dispose()
  }
}
