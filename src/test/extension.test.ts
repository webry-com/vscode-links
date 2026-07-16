import assert from 'assert'

import * as vscode from 'vscode'

import { openFixtureDocument, pollUntil } from './helpers'

const EXTENSION_ID = 'webry.vsc-links'

async function ticketLinks(document: vscode.TextDocument): Promise<vscode.DocumentLink[]> {
  return pollUntil(async () => {
    const links = await vscode.commands.executeCommand<vscode.DocumentLink[]>(
      'vscode.executeLinkProvider',
      document.uri,
    )
    const ours = links.filter((link) => String(link.target).startsWith('https://tickets.example.com/'))
    return ours.length >= 2 ? ours : undefined
  }, 'the extension to provide ticket links')
}

describe('extension (end to end)', () => {
  it('is packaged under the expected id and activates', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID)
    assert.ok(extension, `extension ${EXTENSION_ID} not found in the test instance`)
    await extension.activate()
    assert.ok(extension.isActive)
  })

  it('registers all contributed commands', async () => {
    await vscode.extensions.getExtension(EXTENSION_ID)?.activate()
    const commands = await vscode.commands.getCommands(true)

    for (const command of [
      'vsc-links.createConfig',
      'vsc-links.restartVSCodeLinks',
      'vsc-links.refreshVSCodeLinksProviders',
      'vsc-links.linkButton',
    ]) {
      assert.ok(commands.includes(command), `command ${command} is not registered`)
    }
  })

  it('provides document links through the VS Code API', async () => {
    await vscode.extensions.getExtension(EXTENSION_ID)?.activate()
    const document = await openFixtureDocument('notes.md')

    const links = await ticketLinks(document)
    const targets = links.map((link) => String(link.target)).toSorted()
    assert.deepStrictEqual(targets, ['https://tickets.example.com/123', 'https://tickets.example.com/4567'])
  })

  it('provides hovers through the VS Code API', async () => {
    await vscode.extensions.getExtension(EXTENSION_ID)?.activate()
    const document = await openFixtureDocument('refs.txt')
    const position = document.positionAt(document.getText().indexOf('target.md') + 1)

    const hovers = await pollUntil(async () => {
      const results = await vscode.commands.executeCommand<vscode.Hover[]>(
        'vscode.executeHoverProvider',
        document.uri,
        position,
      )
      const matching = results.filter((hover) =>
        hover.contents.some(
          (content) => content instanceof vscode.MarkdownString && content.value.includes('## File Link'),
        ),
      )
      return matching.length > 0 ? matching : undefined
    }, 'the extension to provide the file link hover')

    assert.ok(hovers.length >= 1)
  })

  it('still provides links after refreshing the providers', async () => {
    await vscode.commands.executeCommand('vsc-links.refreshVSCodeLinksProviders')
    const document = await openFixtureDocument('notes.md')
    assert.ok((await ticketLinks(document)).length >= 2)
  })

  it('still provides links after a full restart', async () => {
    await vscode.commands.executeCommand('vsc-links.restartVSCodeLinks')
    const document = await openFixtureDocument('notes.md')
    assert.ok((await ticketLinks(document)).length >= 2)
  })

  it('ignores link button invocations with unknown tokens', async () => {
    await vscode.commands.executeCommand('vsc-links.linkButton', { actionToken: 'does-not-exist' })
  })
})
