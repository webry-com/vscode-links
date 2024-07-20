import * as vscode from "vscode"
import { LinkDefinitionProvider } from "./linkDefinitionProvider"

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
