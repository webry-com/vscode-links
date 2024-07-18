export type ConfigType = ".ts" | ".js" | ".cjs" | ".mjs"

export function createBaseConfig(configType: ConfigType): string {
  switch (configType) {
    case ".ts":
      return `
import type { Config } from "vscl";

export default {
  links: [
    {
      include: "*",
      pattern: /vscode-link/g,
      handle: ({}) => {
        return {
          target: "https://github.com/webry-com/vscode-links#readme",
          tooltip: "Go to VSCode ReadMe.",
        };
      },
    },
  ],
} satisfies Config;
`
    case ".js":
      return `
/** @type {import("vscl").Config} */
export default {
  links: [
    {
      include: "*",
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
      return `
/** @type {import("vscl").Config} */
exports.default = {
  links: [
    {
      include: "*",
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
    case ".mjs":
      return `
/** @type {import("vscl").Config} */
export default {
  links: [
    {
      include: "*",
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
