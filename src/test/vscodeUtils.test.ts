import assert from 'assert'

import * as vscode from 'vscode'

import { askWorkspace } from '@/utils/vscode'

describe('askWorkspace', () => {
  it('returns the only workspace folder without prompting', async () => {
    const folder = await askWorkspace()
    assert.strictEqual(folder, vscode.workspace.workspaceFolders?.[0])
  })
})
