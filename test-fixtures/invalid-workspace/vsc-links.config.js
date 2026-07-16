// Invalid on purpose: pattern must be a RegExp, not a string.
export default {
  links: [
    {
      include: '**/*',
      pattern: 'not-a-regexp',
      handle: () => ({ target: 'https://example.com' }),
    },
  ],
}
