import assert from 'assert'

import { configSchema, handlerResponseSchema, linkButtonSchema } from '@/utils/schemas'

describe('configSchema', () => {
  const validLink = {
    pattern: /x/g,
    handle: () => ({ target: 'https://example.com' }),
  }

  it('accepts a minimal link and applies defaults', () => {
    const result = configSchema.safeParse({ links: [validLink] })
    assert.ok(result.success, String(result.error))
    assert.strictEqual(result.data.links[0].include, '**/*')
    assert.deepStrictEqual(result.data.links[0].exclude, [])
  })

  it('keeps explicit include/exclude values (string and array forms)', () => {
    const result = configSchema.safeParse({
      links: [{ ...validLink, include: ['**/*.md'], exclude: '**/skip.md' }],
    })
    assert.ok(result.success, String(result.error))
    assert.deepStrictEqual(result.data.links[0].include, ['**/*.md'])
    assert.strictEqual(result.data.links[0].exclude, '**/skip.md')
  })

  it('accepts an array of RegExp patterns', () => {
    const result = configSchema.safeParse({ links: [{ ...validLink, pattern: [/a/g, /b/g] }] })
    assert.ok(result.success, String(result.error))
  })

  it('rejects a string pattern', () => {
    const result = configSchema.safeParse({ links: [{ ...validLink, pattern: 'not-a-regexp' }] })
    assert.strictEqual(result.success, false)
  })

  it('rejects an empty pattern array', () => {
    const result = configSchema.safeParse({ links: [{ ...validLink, pattern: [] }] })
    assert.strictEqual(result.success, false)
  })

  it('rejects a pattern array with non-RegExp entries', () => {
    const result = configSchema.safeParse({ links: [{ ...validLink, pattern: [/a/g, 'b'] }] })
    assert.strictEqual(result.success, false)
  })

  it('rejects a link without a handler', () => {
    const result = configSchema.safeParse({ links: [{ pattern: /x/g }] })
    assert.strictEqual(result.success, false)
  })

  it('rejects a non-function handler', () => {
    const result = configSchema.safeParse({ links: [{ pattern: /x/g, handle: 'nope' }] })
    assert.strictEqual(result.success, false)
  })

  it('rejects configs without a links array', () => {
    assert.strictEqual(configSchema.safeParse({}).success, false)
    assert.strictEqual(configSchema.safeParse({ links: {} }).success, false)
  })
})

describe('handlerResponseSchema', () => {
  it('accepts a minimal response', () => {
    const result = handlerResponseSchema.safeParse({ target: 'https://example.com' })
    assert.ok(result.success, String(result.error))
  })

  it('accepts optional tooltip and description', () => {
    const result = handlerResponseSchema.safeParse({
      target: 'https://example.com',
      tooltip: 'tip',
      description: '## docs',
    })
    assert.ok(result.success, String(result.error))
  })

  it('accepts string and RegExp jump patterns', () => {
    assert.ok(handlerResponseSchema.safeParse({ target: 'x', jumpPattern: 'marker' }).success)
    assert.ok(handlerResponseSchema.safeParse({ target: 'x', jumpPattern: /marker/ }).success)
  })

  it('rejects other jump pattern types', () => {
    assert.strictEqual(handlerResponseSchema.safeParse({ target: 'x', jumpPattern: 42 }).success, false)
  })

  it('rejects a response without a target', () => {
    assert.strictEqual(handlerResponseSchema.safeParse({ tooltip: 'tip' }).success, false)
  })

  it('rejects a non-string target', () => {
    assert.strictEqual(handlerResponseSchema.safeParse({ target: 42 }).success, false)
  })

  it('accepts url and action buttons', () => {
    const result = handlerResponseSchema.safeParse({
      target: 'x',
      buttons: [
        { title: 'Docs', target: 'https://example.com' },
        { title: 'Run', action: () => {} },
      ],
    })
    assert.ok(result.success, String(result.error))
  })

  it('rejects buttons without a target or action', () => {
    const result = handlerResponseSchema.safeParse({ target: 'x', buttons: [{ title: 'Broken' }] })
    assert.strictEqual(result.success, false)
  })
})

describe('linkButtonSchema', () => {
  it('accepts a url button', () => {
    assert.ok(linkButtonSchema.safeParse({ title: 'Docs', target: 'https://example.com' }).success)
  })

  it('accepts an action button', () => {
    assert.ok(linkButtonSchema.safeParse({ title: 'Run', action: () => {} }).success)
  })

  it('rejects a button without title', () => {
    assert.strictEqual(linkButtonSchema.safeParse({ target: 'https://example.com' }).success, false)
  })

  it('rejects a button with neither target nor action', () => {
    assert.strictEqual(linkButtonSchema.safeParse({ title: 'Broken' }).success, false)
  })
})
