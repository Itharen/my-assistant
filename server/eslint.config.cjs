// Server ESLint flat config — extends `@futdevpro/dynamo-eslint/nts`
// (Dynamo NTS ruleset: Node TypeScript). Plus ignores for build artifacts.

const ntsConfig = require('@futdevpro/dynamo-eslint/nts');

module.exports = [
  {
    ignores: [
      'build/**',
      'dist/**',
      'node_modules/**',
      'data/**',
      'logs/**',
      'spec/**',
      '**/*.spec.ts',
    ],
  },
  ...ntsConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // Disabled — the auto-fixer for this rule has a critical bug that
      // rewrites `type X = 'a' | 'b' | 'c'` into `type X = X` (self-
      // referential, breaks tsc). Keep warning surface manual until upstream
      // dynamo-eslint fix lands. Manual enum conversions are still encouraged.
      '@futdevpro/dynamo/prefer-enum-over-string-union': 'off',
      // Disabled — the rule's `isJSDocOnPreviousLine` check uses the
      // ClassDeclaration's loc.start, which the TS parser counts FROM the
      // `export` keyword (parent ExportNamedDeclaration). Standard pattern
      // `/** */\nexport class X` therefore fails (`commentEnd === classStart`
      // instead of `classStart - 1`). Master-prompter uses the standard form
      // and is unaffected because it doesn't run dynamo-eslint. Upstream fix:
      // either count from `class` keyword or accept `commentEnd === classStart`.
      '@futdevpro/dynamo/require-jsdoc-description': 'off',
    },
  },
];
