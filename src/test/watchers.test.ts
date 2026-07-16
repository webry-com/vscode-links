import assert from 'assert'
import fs from 'fs'

import { disposeConfigWatchers, getConfig, updateConfig, updateConfigs, watchConfigFiles } from '@/utils/watchers'

import { ensureOutputChannel, fakeWorkspaceFolder, fixturePath, fixtureWorkspaceFolder, pollUntil } from './helpers'

describe('config loading', () => {
  before(() => {
    ensureOutputChannel()
  })

  it('loads and validates the fixture config', async () => {
    await updateConfig(fixtureWorkspaceFolder())

    const config = getConfig(fixtureWorkspaceFolder())
    assert.ok(config)
    assert.strictEqual(config.links.length, 8)
  })

  it('also accepts the workspace path as cache key', async () => {
    await updateConfig(fixtureWorkspaceFolder())

    assert.ok(getConfig(fixtureWorkspaceFolder().uri.fsPath))
    assert.strictEqual(getConfig('/no/such/workspace'), undefined)
  })

  it('applies schema defaults to loaded configs', async () => {
    await updateConfig(fixtureWorkspaceFolder())

    const config = getConfig(fixtureWorkspaceFolder())
    // The first fixture link declares no exclude.
    assert.deepStrictEqual(config?.links[0].exclude, [])
  })

  it('updateConfigs loads configs for all open workspace folders', async () => {
    await updateConfigs()
    assert.ok(getConfig(fixtureWorkspaceFolder()))
  })

  it('rejects a config file that fails schema validation', async () => {
    const folder = fakeWorkspaceFolder('invalid-workspace')
    await updateConfig(folder)

    assert.strictEqual(getConfig(folder), undefined)
  })

  it('handles a config file that fails to load without throwing', async () => {
    const folder = fakeWorkspaceFolder('broken-workspace')
    await updateConfig(folder)

    assert.strictEqual(getConfig(folder), undefined)
  })

  it('caches nothing for workspaces without a config file', async () => {
    const folder = fakeWorkspaceFolder('empty-workspace')
    await updateConfig(folder)

    assert.strictEqual(getConfig(folder), undefined)
  })
})

describe('config file watching', () => {
  before(() => {
    ensureOutputChannel()
  })

  afterEach(() => {
    disposeConfigWatchers()
  })

  it('registers and disposes watchers without error', () => {
    watchConfigFiles(() => {})
    disposeConfigWatchers()
    disposeConfigWatchers()
  })

  it('replaces previous watchers when called again', () => {
    watchConfigFiles(() => {})
    watchConfigFiles(() => {})
    disposeConfigWatchers()
  })

  it('fires the callback when the config file changes', async () => {
    let fired = false
    watchConfigFiles(() => {
      fired = true
    })

    const configPath = fixturePath('vsc-links.config.js')
    const original = fs.readFileSync(configPath, 'utf8')
    try {
      fs.writeFileSync(configPath, original + '\n')
      await pollUntil(() => fired, 'the config watcher to fire')
    } finally {
      fs.writeFileSync(configPath, original)
    }
  })
})
