export type ConfigType = ".ts" | ".js" | ".cjs" | ".mjs"

export function createBaseConfig(configType: ConfigType): string {
  switch (configType) {
    case ".ts":
      return "TODO"
    case ".js":
      return `
/** @type {import("vscode-links-cli").Config} */
export default {
  links: [
    {
      include: "**/*",
      pattern: /vscode-link/g,
      handle: ({}) => {
        return {
          target: "https://github.com/webry-com/vscode-links#readme",
          tooltip: "Go to VSCode ReadMe.",
        };
      },
    },
  ],
};
  `
    case ".cjs":
      return "TODO"
    case ".mjs":
      return `
/** @type {import("vscode-links-cli").Config} */
export default {
  links: [
    {
      include: "**/*",
      pattern: /vscode-link/g,
      handle: ({}) => {
        return {
          target: "https://github.com/webry-com/vscode-links#readme",
          tooltip: "Go to VSCode ReadMe.",
        };
      },
    },
  ],
};
  `
  }
}
