/** @type {import("vscl").Config} */
export default {
  links: [
    {
      include: "*",
      pattern: /vscode-link/g,
      handle: () => {
        return {
          target: "https://github.com/webry-com/vscode-links#readme",
          tooltip: "Go to VSCode ReadMe.",
          description: "## VSCode Links\nClick to go to the README.",
          buttons: [
            {
              title: "To the README, wooo",
              target: "https://github.com/webry-com/vscode-links#readme",
            },
          ],
        }
      },
    },
  ],
}
