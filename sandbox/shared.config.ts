import type { Config } from "vscl"

// Pulled into vsc-links.config.ts via `extends` — its `links` are merged in.
export default {
  links: [
    {
      // Note markers — scanned in .ts AND .md files.
      include: "**/*.{ts,md}",
      pattern: /NOTE\((?<link>[\w-]+)\)/g,
      handle: ({ linkText }) => ({
        target: `https://example.com/notes/${linkText}`,
        tooltip: `Note "${linkText}" (rule from shared.config.ts)`,
      }),
    },
  ],
} satisfies Config
