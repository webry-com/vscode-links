/** @type {import("vscl").Config} */
export default {
  links: [
    {
      include: '**/*.md',
      pattern: /TICKET-(?<link>\d+)/g,
      handle: ({ linkText }) => ({
        target: `https://tickets.example.com/${linkText}`,
        tooltip: `Open ticket ${linkText}`,
      }),
    },
    {
      include: ['**/*.txt'],
      exclude: '**/excluded.txt',
      pattern: [/open:(?<link>[\w./-]+)/g],
      handle: ({ linkText, workspace }) => ({
        target: workspace`${linkText}`,
        description: '## File Link',
        buttons: [
          { title: 'Docs [external]', target: 'https://example.com/docs' },
          { title: 'Jump to line', target: workspace`target.md` + ':3:5' },
          {
            title: 'Count',
            action: () => {
              globalThis.__vsclActionCount = (globalThis.__vsclActionCount ?? 0) + 1
            },
          },
        ],
      }),
    },
    {
      include: '**/jump.txt',
      pattern: /jumpstr:(?<link>[\w./-]+)/g,
      handle: ({ linkText, workspace }) => ({
        target: workspace`${linkText}`,
        jumpPattern: 'Section Two',
      }),
    },
    {
      include: '**/jump.txt',
      pattern: /jumpre:(?<link>[\w./-]+)/g,
      handle: ({ linkText, workspace }) => ({
        target: workspace`${linkText}`,
        jumpPattern: /Section Three/,
      }),
    },
    {
      include: '**/jump.txt',
      pattern: /jumpmissing:(?<link>[\w./-]+)/g,
      handle: ({ linkText, workspace }) => ({
        target: workspace`${linkText}`,
        jumpPattern: 'THIS TEXT EXISTS NOWHERE',
      }),
    },
    {
      include: '**/jump.txt',
      pattern: /goto:(?<link>[\w./:-]+)/g,
      handle: ({ linkText, workspace }) => ({
        target: workspace`${linkText}`,
      }),
    },
    {
      include: '**/edge.txt',
      pattern: /invalid:(?<link>\w+)/g,
      handle: () => ({ tooltip: 'response without a target' }),
    },
    {
      include: '**/async.txt',
      pattern: /asyncbad:(?<link>\w+)/g,
      handle: async () => ({ target: 'https://example.com/async' }),
    },
  ],
}
