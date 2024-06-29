# VSCode Links

## Setup

-   You need to be in a workspace
-   Create a new file in root directory of your workspace `vscode-links.config.js` or  `vscode-links.config.mjs`
-   Setup your custom links in the file. Example:

```js
export default {
    resolveLink(link) {
        const parts = link.split(".");
        return {
            target: `file://%CWD%/${parts.join("/")}.py`,
            tooltip: "Go to file.",
        };
    },
    patterns: [/["'`](?<link>X(\..+)+)["'`]/g],
    language: "javascript",
};
```

This makes it so that when you click on a link like `X.Y.Z` in a javascript file, it will open the file `X/Y/Z.py` in the workspace.
