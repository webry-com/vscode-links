import assert from 'assert'
import path from 'path'

import * as vscode from 'vscode'

import { LinkDefinitionProvider } from '@/providers/linkProvider'
import { updateConfig } from '@/utils/watchers'

import { ensureOutputChannel, fixturePath, fixtureWorkspaceFolder, openFixtureDocument } from './helpers'

type RawLink = vscode.DocumentLink & {
  description?: string
  buttons?: { title: string; target?: string; action?: () => void }[]
  _originalVsclTarget?: string
  _vsclTarget?: vscode.Uri
  _jumpPattern?: RegExp | string
}

type ResolvableLink = Parameters<LinkDefinitionProvider['resolveDocumentLink']>[0]

function getLinks(provider: LinkDefinitionProvider, document: vscode.TextDocument): RawLink[] {
  return provider.provideDocumentLinks(document) ?? []
}

// resolveDocumentLink either resolves via the internal _vscl fields or
// returns links that already carry a target unchanged.
function isResolvable(link: RawLink): link is RawLink & ResolvableLink {
  return typeof link._originalVsclTarget === 'string' || link.target !== undefined
}

// jump.txt has one link definition per line; look links up by line so the
// test stays independent of the order the config patterns ran in.
function linkAtLine(links: RawLink[], line: number): RawLink {
  const link = links.find((candidate) => candidate.range.start.line === line)
  assert.ok(link, `expected a link on line ${line}`)
  return link
}

async function resolveLink(provider: LinkDefinitionProvider, link: RawLink): Promise<vscode.DocumentLink> {
  assert.ok(isResolvable(link), 'link should carry a target or the internal _vscl fields')
  const resolved = await provider.resolveDocumentLink(link)
  assert.ok(resolved)
  return resolved
}

describe('LinkDefinitionProvider', () => {
  before(() => {
    ensureOutputChannel()
  })

  describe('before a config is loaded', () => {
    it('returns null for documents outside any workspace', async () => {
      const document = await vscode.workspace.openTextDocument({ content: 'TICKET-123', language: 'plaintext' })
      const provider = new LinkDefinitionProvider()
      assert.strictEqual(provider.provideDocumentLinks(document), null)
    })

    it('returns null when the workspace has no loaded config', async () => {
      const document = await openFixtureDocument('notes.md')
      const provider = new LinkDefinitionProvider()
      assert.strictEqual(provider.provideDocumentLinks(document), null)
    })
  })

  describe('with the fixture config loaded', () => {
    const provider = new LinkDefinitionProvider()

    before(async () => {
      await updateConfig(fixtureWorkspaceFolder())
    })

    it('finds every pattern match and calls the handler with the named group text', async () => {
      const document = await openFixtureDocument('notes.md')
      const links = getLinks(provider, document)

      assert.strictEqual(links.length, 2)
      assert.deepStrictEqual(
        links.map((link) => String(link.target)),
        ['https://tickets.example.com/123', 'https://tickets.example.com/4567'],
      )
      assert.deepStrictEqual(
        links.map((link) => link.tooltip),
        ['Open ticket 123', 'Open ticket 4567'],
      )
    })

    it('limits the link range to the (?<link>) capture group', async () => {
      const document = await openFixtureDocument('notes.md')
      const links = getLinks(provider, document)

      assert.strictEqual(document.getText(links[0].range), '123')
      assert.strictEqual(document.getText(links[1].range), '4567')
    })

    it('excludes files matched by the exclude pattern', async () => {
      const document = await openFixtureDocument('excluded.txt')
      assert.deepStrictEqual(getLinks(provider, document), [])
    })

    it('builds file targets with the workspace tagged template and attaches description/buttons', async () => {
      const document = await openFixtureDocument('refs.txt')
      const links = getLinks(provider, document)

      assert.strictEqual(links.length, 1)
      const link = links[0]
      assert.ok(link.target, 'plain file target should be set eagerly')
      assert.strictEqual(link.target.scheme, 'file')
      assert.strictEqual(link.target.fsPath, fixturePath('target.md'))
      assert.strictEqual(document.getText(link.range), 'target.md')
      assert.strictEqual(link.description, '## File Link')
      assert.deepStrictEqual(
        link.buttons?.map((button) => button.title),
        ['Docs [external]', 'Jump to line', 'Count'],
      )
    })

    // configSchema wraps handlers during parsing (zod v4 function schemas
    // validate I/O at call time), so a bad handler throws inside
    // provideDocumentLinks instead of reaching the provider's own
    // handlerResponseSchema skip path. VS Code swallows provider errors, so
    // in production this surfaces as "no links" for the affected file.
    it('throws when a handler returns a response without a target', async () => {
      const document = await openFixtureDocument('edge.txt')
      assert.throws(() => provider.provideDocumentLinks(document))
    })

    it('throws when a handler is async', async () => {
      const document = await openFixtureDocument('async.txt')
      assert.throws(() => provider.provideDocumentLinks(document))
    })

    it('defers targets with a jumpPattern or :line:column suffix to resolveDocumentLink', async () => {
      const document = await openFixtureDocument('jump.txt')
      const links = getLinks(provider, document)

      assert.strictEqual(links.length, 5)
      for (const link of links) {
        assert.strictEqual(link.target, undefined)
        assert.ok(link._vsclTarget)
        assert.match(path.basename(link._vsclTarget.fsPath), /^target2?\.md$/)
      }
      assert.strictEqual(linkAtLine(links, 3)._originalVsclTarget?.endsWith('target.md:3:5'), true)
    })

    it('resolves a string jumpPattern to the matching line and column', async () => {
      const document = await openFixtureDocument('jump.txt')
      const link = linkAtLine(getLinks(provider, document), 0)
      const resolved = await resolveLink(provider, link)

      assert.strictEqual(resolved.target?.fragment, 'L3:4')
      assert.strictEqual(path.basename(resolved.target.fsPath), 'target.md')
    })

    it('resolves a RegExp jumpPattern to the matching line and column', async () => {
      const document = await openFixtureDocument('jump.txt')
      const link = linkAtLine(getLinks(provider, document), 1)
      const resolved = await resolveLink(provider, link)

      assert.strictEqual(resolved.target?.fragment, 'L5:4')
    })

    it('falls back to the plain file target when the jumpPattern is not found', async () => {
      const document = await openFixtureDocument('jump.txt')
      const link = linkAtLine(getLinks(provider, document), 2)
      const resolved = await resolveLink(provider, link)

      assert.ok(resolved.target)
      assert.strictEqual(resolved.target.fragment, '')
      assert.strictEqual(path.basename(resolved.target.fsPath), 'target.md')
    })

    it('resolves :line:column targets to a #L fragment', async () => {
      const document = await openFixtureDocument('jump.txt')
      const link = linkAtLine(getLinks(provider, document), 3)
      const resolved = await resolveLink(provider, link)

      assert.strictEqual(resolved.target?.fragment, 'L3')
      assert.strictEqual(path.basename(resolved.target.fsPath), 'target.md')
    })

    it('resolves jump patterns by reading unopened target files from disk', async () => {
      // target2.md is never opened by any test, so this must hit the
      // fs.readFileSync branch of resolveDocumentLink.
      const document = await openFixtureDocument('jump.txt')
      const link = linkAtLine(getLinks(provider, document), 4)
      assert.ok(!vscode.workspace.textDocuments.some((doc) => doc.uri.fsPath.endsWith('target2.md')))

      const resolved = await resolveLink(provider, link)

      assert.strictEqual(resolved.target?.fragment, 'L3:4')
      assert.strictEqual(path.basename(resolved.target.fsPath), 'target2.md')
    })

    it('resolves jump patterns against already-open documents', async () => {
      const targetDocument = await openFixtureDocument('target.md')
      assert.ok(vscode.workspace.textDocuments.some((doc) => doc.uri.fsPath === targetDocument.uri.fsPath))

      const document = await openFixtureDocument('jump.txt')
      const links = getLinks(provider, document)

      const resolvedString = await resolveLink(provider, linkAtLine(links, 0))
      assert.strictEqual(resolvedString.target?.fragment, 'L3:4')

      const resolvedRegExp = await resolveLink(provider, linkAtLine(links, 1))
      assert.strictEqual(resolvedRegExp.target?.fragment, 'L5:4')
    })

    it('returns already-resolved links unchanged', async () => {
      const document = await openFixtureDocument('refs.txt')
      const link = getLinks(provider, document)[0]
      const resolved = await resolveLink(provider, link)

      assert.strictEqual(resolved, link)
    })
  })
})
