import assert from 'assert'

import type { ConfigType } from '@/utils/defaults'
import { createBaseConfig } from '@/utils/defaults'

describe('createBaseConfig', () => {
  const configTypes: ConfigType[] = ['.ts', '.js', '.cjs', '.mjs']

  for (const configType of configTypes) {
    it(`generates a ${configType} template with a working example link`, () => {
      const content = createBaseConfig(configType)
      assert.ok(content.length > 0)
      assert.ok(content.includes('links:'), 'template should define links')
      assert.ok(content.includes('pattern:'), 'template should define a pattern')
      assert.ok(content.includes('handle:'), 'template should define a handler')
      assert.ok(content.includes('vscl'), 'template should reference the vscl types package')
    })
  }

  it('uses TypeScript config typing for .ts', () => {
    assert.ok(createBaseConfig('.ts').includes('satisfies Config'))
  })

  it('uses ESM export for .js and .mjs', () => {
    assert.ok(createBaseConfig('.js').includes('export default'))
    assert.ok(createBaseConfig('.mjs').includes('export default'))
  })

  it('uses CJS export for .cjs', () => {
    assert.ok(createBaseConfig('.cjs').includes('exports.default'))
  })
})
