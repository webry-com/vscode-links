import { defineConfig } from '@vscode/test-cli'

export default defineConfig({
  files: 'out/test/**/*.test.js',
  workspaceFolder: 'test-fixtures/workspace',
  mocha: {
    ui: 'bdd',
    timeout: 30_000,
  },
})
