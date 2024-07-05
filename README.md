# VSCode Links

## Setup

- Install the extention
- You need to be in a workspace
- `npm i -D vscode-links-cli@latest`
- Create a config file `Ctrl+Shift+P` -> `VSCode Links: Create Config`
- Either add `type: "module"` in your package.json if not already, or rename the config file to `vsc-links.config.mjs`.

## Debugging your config

- Open the output panel
- Select `VSCode Links` from the dropdown
- Errors will be shown here

## Config

### `links`

- **include:** Glob pattern to include files. _(string | string[])_
- **exclude:** Glob pattern to exclude files. Will exclude even if a file is included. _(string | string[])_
- **pattern:** Regex pattern to match links. Use `(?<link>ClickableText)` to define the clickable area if its different from the whole regex match. _(RegExp)_
- **handle:** Function to handle the link. _(Function)_
  - **linkText:** Text matched by the pattern. _(string)_
  - **workspaceFile:** Function to get the workspace file path based on your relative path. _(Function)_

## Helpers

- **workspace:** Function to get the workspace file path based on your relative path and os. **Usage:**

```js
import { file } from "vscode-links-cli"

file`c:/absolute/path/to/file.js`
```

- **file:** Function to get the file path based on the current file and os. **Usage:**

```js
import { workspace } from "vscode-links-cli"

workspace`relative/path/to/file.js`
```

## Examples

### Git Issue Links

You could create a config to open git issues in your browser like this:

```js
/** @type {import("vscode-links-cli").Config} */
export default {
  links: [
    {
      include: "**/*.js",
      pattern: /git#\d+/g, // Clickable: "git#123"
      handle: ({ linkText }) => {
        const issue = linkText.replace("git#", "")
        return {
          target: `https://github.com/webry-com/vscode-links/issues/${issue}`,
        }
      },
    },
  ],
}
```

### API Methods in Frappe

Here is a config to open the python file based on an api route in frappe:

```js
import { workspace } from "vscode-links-cli"

/** @type {import("vscode-links-cli").Config} */
export default {
  links: [
    {
      include: "**/*",
      pattern: /"(?<link>frappe(\.[^"'`]+)+)"/g, // Clickable: "frappe.core.doctype.user.user.get_timezones"
      handle: ({ linkText }) => {
        const parts = linkText.split(".")
        const apiName = parts.pop()
        return {
          target: workspace`${parts.join("/")}.py`,
          tooltip: `Open python file for the "${apiName}" API.`,
        }
      },
    },
  ],
}
```

## Contribute

Feel free to open an issue or PR.
