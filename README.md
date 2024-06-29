# VSCode Links

## Setup

-   You need to be in a workspace
-   Create a new file in root directory of your workspace `vscode-links.config.js` or  `vscode-links.config.mjs`
-   Setup your custom links in the file. Example:

```js
export default {
    links: [
        {
            include: "**/*.js",                           // In all .js files (glob pattern)
            pattern: /["'`](?<link>api(\..+)+)["'`]/g,    // Make these patterns clickable: "api.X.Y", ...
            handle: ({ linkText, workspaceFile }) => {    // Make them open a file
                const parts = linkText.split(".");
                return {
                    target: workspaceFile(`${parts.join("/")}.py`),
                    tooltip: "Go to file.",
                };
            },
        },
        {
            include: "**/*.js",                           // In all .js files (glob pattern)
            exclude: ["root.js"],                         // Exclude root.js
            pattern: /git#\d+/g,                          // Make these patterns clickable: git#123
            handle: ({ linkText }) => {    // Make them open a github issue
                const issue = linkText.replace("git#", "");
                return {
                    target: `https://github.com/webry-com/vscode-links/issues/${issue}`
                };
            },
        },
    ],
};
```

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