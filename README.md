# VSCode Links

## Setup

- Install the extension [here](https://marketplace.visualstudio.com/items?itemName=web-dev-sam.vscode-links)
- Create a config file `Ctrl+Shift+P` -> `VSC Links: Create Config File`
- _Optional_ `npm i -D vscl@latest` (Adds typings for easier config editing)

## Debugging your config

- Open the output panel
- Select `VSCode Links` from the dropdown
- Errors will be shown here
- If the links dont work/update, try `Ctrl+Shift+P` -> `VSC Links: Restart` _(can happen when renaming/moving config file)_

## Config

### `links`

- **include:** Glob pattern to include files. _(string | string[])_
- **exclude:** Glob pattern to exclude files. Will exclude even if a file is included. _(string | string[])_
- **pattern:** Regex pattern to match links. Use `(?<link>ClickableText)` to define the clickable area if its different from the whole regex match. _(RegExp)_
- **handle:** Function to handle the link. _(Function)_
  - **linkText:** Text matched by the pattern. _(string)_
  - **file:** Template literal tag to get the file path based on the current file and os.
  - **workspace:** Template literal tag to get the workspace file path based on your relative path and os.

## Examples

### Git Issue Links

You could create a config to open git issues in your browser like this:

```js
import { type Config } from "vscl"

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
} satisfies Config;
```

### API Methods in Frappe

Here is a config to open the python file based on an api route in frappe:

```js
import { type Config } from "vscl"

export default {
  links: [
    {
      include: "*",
      pattern: /"(?<link>frappe(\.[^"'`]+)+)"/g, // Clickable: "frappe.core.doctype.user.user.get_timezones"
      handle: ({ linkText, workspace }) => {
        const parts = linkText.split(".")
        const apiName = parts.pop()
        return {
          target: workspace`${parts.join("/")}.py`,
          tooltip: `Open python file for the "${apiName}" API.`,
          jumpPattern: `def ${apiName}(`, // Jump to the function definition
        }
      },
    },
  ],
} satisfies Config;
```

## Contribute

Feel free to open an issue or PR.
