import { globSync } from 'node:fs'

import { build } from 'esbuild'

// c12 pulls in jiti's ESM entry, whose lazy babel-transform loader calls
// createRequire(import.meta.url) — import.meta is empty once esbuild bundles
// to CJS, so loading any TS config crashes at runtime. jiti's CJS entry
// requires babel statically, which esbuild can bundle, so force `jiti` to
// resolve through its `require` export condition.
/** @type {import('esbuild').Plugin} */
const jitiCjs = {
  name: 'jiti-cjs',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^jiti$/ }, async (args) => {
      if (args.pluginData === 'jiti-cjs') {
        return undefined
      }
      return pluginBuild.resolve('jiti', {
        kind: 'require-call',
        resolveDir: args.resolveDir,
        pluginData: 'jiti-cjs',
      })
    })
  },
}

const minify = process.argv.includes('--minify')
const tests = process.argv.includes('--tests')

await build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/main.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  minify,
  sourcemap: !minify,
  plugins: [jitiCjs],
})

if (tests) {
  const testEntryPoints = globSync('src/test/**/*.test.ts')

  await build({
    entryPoints: testEntryPoints,
    bundle: true,
    outdir: 'out/test',
    outbase: 'src/test',
    external: ['vscode', 'mocha'],
    format: 'cjs',
    platform: 'node',
    sourcemap: true,
    plugins: [jitiCjs],
  })
}
