const {defineConfig} = require('@vscode/test-cli');

module.exports = defineConfig({
  files: 'out/tests/**/*.test.js',
  version: '1.92.0'
});
