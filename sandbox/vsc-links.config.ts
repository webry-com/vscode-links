import type { Config } from "vscl"

export default {
  // `extends` pulls in rules from other config files (paths relative to this file).
  extends: ["./shared.config"],

  links: [
    {
      // 1. Simplest form: regex + URL target + hover tooltip.
      //    `include` narrows which files are scanned (string or array of globs).
      include: "**/*.ts",
      pattern: /TICKET-\d+/g,
      handle: ({ linkText }) => ({
        target: `https://example.com/ticket/${linkText.replace("TICKET-", "")}`,
        tooltip: `Open ${linkText} in the browser`,
      }),
    },
    {
      // 2. `pattern` as an ARRAY — several regexes share one handler.
      //    The named group (?<link>...) shrinks the clickable hitbox to just the number.
      include: "**/*.ts",
      pattern: [/\bGH-(?<link>\d+)/g, /\bISSUE-(?<link>\d+)/g],
      handle: ({ linkText }) => ({
        target: `https://github.com/webry-com/vsc-links/issues/${linkText}`,
        tooltip: `Open issue #${linkText} on GitHub`,
      }),
    },
    {
      // 3. workspace`` tag (path relative to the workspace folder), markdown
      //    `description`, and every button kind: target, target with :line /
      //    :line:col, and `action` callbacks (log + reload).
      include: "**/*.ts",
      pattern: /\bopen:(?<link>[\w./-]+)/g,
      handle: ({ linkText, workspace, log, reload }) => ({
        target: workspace`${linkText}`,
        tooltip: `Open ${linkText}`,
        description: "Hover supports **markdown**: `code`, *italic*, [links](https://github.com/webry-com/vsc-links)",
        buttons: [
          { title: "Line 7", target: workspace`${linkText}:7` },
          { title: "Line 7, col 4", target: workspace`${linkText}:7:4` },
          { title: "Log to output panel", action: () => log("Button clicked for:", linkText) },
          { title: "Reload config", action: () => reload() },
        ],
      }),
    },
    {
      // 4. :line suffix on the MAIN target (columns only work on button targets).
      include: "**/*.ts",
      pattern: /\bat:(?<link>[\w./-]+:\d+)/g,
      handle: ({ linkText, workspace }) => ({
        target: workspace`${linkText}`,
        tooltip: `Open ${linkText.split(":")[0]} at line ${linkText.split(":")[1]}`,
      }),
    },
    {
      // 5. `jumpPattern` as plain STRING — opens the target file and jumps to the
      //    first occurrence of that substring.
      include: "**/*.ts",
      pattern: /\bdocs:(?<link>[\w-]+)/g,
      handle: ({ linkText, workspace }) => ({
        target: workspace`docs.md`,
        jumpPattern: `## ${linkText}`,
        tooltip: `Open docs section "${linkText}"`,
      }),
    },
    {
      // 6. file`` tag (absolute paths) + `jumpPattern` as REGEX + `log` from
      //    inside the handler (see the "VSCode Links" output channel).
      include: "**/*.ts",
      pattern: /\babs:(?<link>\/[\w./-]+)/g,
      handle: ({ linkText, file, log }) => {
        log("Resolving absolute link:", linkText)
        return {
          target: file`${linkText}`,
          jumpPattern: /## Regex jump .*/,
          tooltip: `Open ${linkText} (absolute path)`,
        }
      },
    },
    {
      // 7. `include` omitted -> defaults to **/* (every file, see docs.md).
      //    `exclude` overrides include — here it stops the rule from matching
      //    its own regex source inside the config files.
      exclude: ["**/*.config.ts"],
      pattern: /vscl-homepage/g,
      handle: () => ({
        target: "https://github.com/webry-com/vsc-links",
        tooltip: "Open the vsc-links repository",
      }),
    },
  ],
} satisfies Config
