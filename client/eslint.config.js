// Client ESLint flat config — extends `@futdevpro/dynamo-eslint/ngx`
// (Dynamo NGX ruleset: Angular). Plus ignores for build / generated.
//
// Override: `@angular-eslint/no-host-metadata-property` is set to `off` because
// it was renamed in @angular-eslint v19 (which we use). The dynamo-eslint ngx
// config still lists the legacy name; until that's updated upstream we silence
// the unknown-rule crash here.

const ngxConfig = require('@futdevpro/dynamo-eslint/ngx');

module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.angular/**',
      'coverage/**',
      '**/*.spec.ts',
    ],
  },
  ...ngxConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@angular-eslint/no-host-metadata-property': 'off',
      // Disabled — the auto-fixer for this rule has a critical bug that
      // rewrites `type X = 'a' | 'b' | 'c'` into `type X = X` (self-
      // referential, breaks tsc). Keep manual enum conversions only.
      '@futdevpro/dynamo/prefer-enum-over-string-union': 'off',
      // Disabled — `isJSDocOnPreviousLine` counts ClassDeclaration.loc.start
      // from the `export` keyword (parent ExportNamedDeclaration), so the
      // standard `/** */\nexport class X` form fails. Master-prompter uses
      // this form and is unaffected only because it does not run dynamo-eslint.
      '@futdevpro/dynamo/require-jsdoc-description': 'off',
    },
  },
];
