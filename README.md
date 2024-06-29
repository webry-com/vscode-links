# VSCode Links

## Setup

- Install the extention
- You need to be in a workspace
- Create a config file `Ctrl+Shift+P` -> `VSCode Links: Create Config`

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
```js
export default {
    links: [
        {
            include: "**/*.js",
            pattern: /["'`](?<link>api(\..+)+)["'`]/g,
            handle: ({ linkText, workspaceFile }) => {
                const parts = linkText.split(".");
                return {
                    target: workspaceFile(`${parts.join("/")}.py`),
                    tooltip: "Go to file.",
                };
            },
        },
    ],
};
```
```js
// src/index.js
// Clickable: "api.X.Y"
// Opens: api/X/Y.py
```
---
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
// src/index.js
// Clickable: "git#123"
// Opens: https://github.com/webry-com/vscode-links/issues/123
```

## Contribute
Feel free to open an issue or PR.