# Change Log

## [2.0.0]

- _**Breaking:** The `workspace` and `file` helpers from `vscode-links-cli` will no longer work. Instead they are now arguments to the handle function (see examples)._
- Added Typescript support for the config file
- Added "Restart" command to restart the extension
- Added different formats for the "Create Config" command (.ts, .js. .cjs, .mjs)
- Moved the config loading from `vscode-links-cli` to the extension. The package is now deprecated. In replacement you can optionally install the `vscl` package to get typings and intellisense in your config.

## [1.0.0]

- Initial release
