export default {
  links: [
    {
      include: "*",
      pattern: /vscode-link/g,
      handle: ({}) => {
        return {
          target: "https://github.com/webry-com/vscode-links#readme",
          tooltip: "Go to VSCode ReadMe.",
        }
      },
    },
  ],
}
