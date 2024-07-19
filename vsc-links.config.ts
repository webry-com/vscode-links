export default {
  links: [
    {
      pattern: /vscode-links/g,
      handle: ({}) => {
        return {
          target: "https://github.com/webry-com/vscode-links#readme",
          tooltip: "Go to VSCode ReadMe.",
        }
      },
    },
  ],
}
