import assert from 'assert'

import * as vscode from 'vscode'

import { getButtonActionHandler, LinkButtonHoverProvider } from '@/providers/linkButtonHoverProvider'
import { LinkHoverProvider } from '@/providers/linkHoverProvider'
import { LinkDefinitionProvider } from '@/providers/linkProvider'
import { updateConfig } from '@/utils/watchers'

import { ensureOutputChannel, fixtureWorkspaceFolder, openFixtureDocument, pollUntil } from './helpers'

function linkPosition(document: vscode.TextDocument): vscode.Position {
  const links = new LinkDefinitionProvider().provideDocumentLinks(document) ?? []
  assert.ok(links.length > 0, `expected links in ${document.fileName}`)
  return links[0].range.start.translate(0, 1)
}

function markdownValue(hover: vscode.Hover): string {
  const content = hover.contents[0]
  assert.ok(content instanceof vscode.MarkdownString)
  return content.value
}

function commandTokens(markdown: string): string[] {
  return [...markdown.matchAll(/command:vsc-links\.linkButton\?([^)]+)/g)].map((match) => {
    const parsed: unknown = JSON.parse(decodeURIComponent(match[1]))
    assert.ok(
      parsed !== null &&
        typeof parsed === 'object' &&
        'actionToken' in parsed &&
        typeof parsed.actionToken === 'string',
      'command uri should carry an actionToken',
    )
    return parsed.actionToken
  })
}

describe('hover providers', () => {
  before(async () => {
    ensureOutputChannel()
    await updateConfig(fixtureWorkspaceFolder())
  })

  describe('LinkHoverProvider', () => {
    const provider = new LinkHoverProvider()

    it('shows the link description as markdown', async () => {
      const document = await openFixtureDocument('refs.txt')
      const hover = await provider.provideHover(document, linkPosition(document))

      assert.ok(hover)
      assert.ok(markdownValue(hover).includes('## File Link'))
    })

    it('returns null outside of link ranges', async () => {
      const document = await openFixtureDocument('refs.txt')
      const hover = await provider.provideHover(document, new vscode.Position(0, 0))

      assert.strictEqual(hover, null)
    })

    it('returns null for links without a description', async () => {
      const document = await openFixtureDocument('notes.md')
      const hover = await provider.provideHover(document, linkPosition(document))

      assert.strictEqual(hover, null)
    })
  })

  describe('LinkButtonHoverProvider', () => {
    const provider = new LinkButtonHoverProvider()

    async function buttonHoverMarkdown(): Promise<string> {
      const document = await openFixtureDocument('refs.txt')
      const hover = await provider.provideHover(document, linkPosition(document))
      assert.ok(hover)
      return markdownValue(hover)
    }

    it('renders a plain markdown link for url buttons and escapes the title', async () => {
      const markdown = await buttonHoverMarkdown()
      assert.ok(markdown.includes('[Docs \\[external\\]](https://example.com/docs)'))
    })

    it('renders command links for :line:column and action buttons', async () => {
      const markdown = await buttonHoverMarkdown()
      const tokens = commandTokens(markdown)

      assert.strictEqual(tokens.length, 2)
      for (const token of tokens) {
        assert.strictEqual(typeof getButtonActionHandler(token), 'function')
      }
    })

    it('invokes the registered action handler for action buttons', async () => {
      const markdown = await buttonHoverMarkdown()
      const countToken = commandTokens(markdown)[1]

      // The fixture config's "Count" action increments this global counter.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const counter = globalThis as { __vsclActionCount?: number }
      const before = counter.__vsclActionCount ?? 0
      getButtonActionHandler(countToken)?.()
      assert.strictEqual(counter.__vsclActionCount, before + 1)
    })

    it('opens the target file at line and column for :line:column buttons', async () => {
      const markdown = await buttonHoverMarkdown()
      const jumpToken = commandTokens(markdown)[0]

      getButtonActionHandler(jumpToken)?.()

      const editor = await pollUntil(() => {
        const active = vscode.window.activeTextEditor
        return active?.document.fileName.endsWith('target.md') && active.selection.active.line === 2
          ? active
          : undefined
      }, 'target.md to open at line 3')
      assert.strictEqual(editor.selection.active.character, 4)
    })

    it('returns null when the hovered link has no buttons', async () => {
      const document = await openFixtureDocument('notes.md')
      const hover = await provider.provideHover(document, linkPosition(document))

      assert.strictEqual(hover, null)
    })

    it('returns undefined for unknown action tokens', () => {
      assert.strictEqual(getButtonActionHandler('no-such-token'), undefined)
    })
  })
})
