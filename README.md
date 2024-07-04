# VSCode Links

## Setup

- Install the extention
- You need to be in a workspace
- `npm i -D vscode-links-cli`
- Create a config file `Ctrl+Shift+P` -> `VSCode Links: Create Config`
- Either add `type: "module"` in your package.json if not already, or rename the config file to `vsc-links.config.mjs`.

## Config

### `links`
- **include:** Glob pattern to include files. *(string | string[])*
- **exclude:** Glob pattern to exclude files. Will exclude even if a file is included. *(string | string[])*
- **pattern:** Regex pattern to match links. Use `(?<link>ClickableText)` to define the clickable area if its different from the whole regex match. *(RegExp)*
- **handle:** Function to handle the link. *(Function)*
    - **linkText:** Text matched by the pattern. *(string)*
    - **workspaceFile:** Function to get the workspace file path based on your relative path. *(Function)*
    - **file**: Function to get the file path based on your path. Example: `file://...` *(Function)*

## Examples

### Git Issue Links
```js
export default {
    links: [
        {
            include: "**/*.js",
            exclude: ["root.js"],
            pattern: /git#\d+/g,
            handle: ({ linkText }) => {
                const issue = linkText.replace("git#", "");
                return {
                    target: `https://github.com/webry-com/vscode-links/issues/${issue}`
                };
            },
        },
    ],
};
```
```js
// Clickable: "git#123"
// Opens: https://github.com/webry-com/vscode-links/issues/123
```

### API Methods in Frappe
```js
/** @type {import("vscode-links-cli").VSCodeLinksConfig} */
export default {
  links: [
    {
      include: "**/*",
      pattern: /["'`](?<link>frappe(\..+)+)["'`]/g,
      handle: ({ linkText, workspacePath }) => {
        const parts = linkText.split(".");
        parts.pop();
        return {
          target: `file:///${workspacePath.replace(/\\/g, "/")}/${parts.join("/")}.py`,
          tooltip: "Go to file.",
        };
      },
    },
  ],
};
```
```js
// Clickable: "frappe.folder.folder.file.get_something"
// Opens: ./frappe/folder/folder/file.py
```


## Contribute
Feel free to open an issue or PR.