import * as vscode from "vscode"
import { LinkDefinitionProvider } from "./linkDefinitionProvider"
import { vscLog } from "./utils/output"

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
