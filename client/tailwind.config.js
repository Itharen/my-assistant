/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
    './node_modules/@futdevpro/ngx-dynamo/**/*.{html,ts,js,mjs}',
    './node_modules/@futdevpro/ngx-dynamo-models/**/*.{html,ts,js,mjs}',
    './node_modules/@futdevpro/ngx-fdp-templates/**/*.{html,ts,js,mjs}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      xs: { max: '599px' },
      sm: { min: '600px', max: '959px' },
      md: { min: '960px', max: '1279px' },
      lg: { min: '1280px', max: '1919px' },
      xl: { min: '1920px' },
      'gt-xs': { min: '600px' },
      'gt-sm': { min: '960px' },
      'gt-md': { min: '1280px' },
      'lt-sm': { max: '599px' },
      'lt-md': { max: '959px' },
      'lt-lg': { max: '1279px' },
    },
    extend: {
      colors: {
        bg:           'var(--ma-bg)',
        'bg-card':    'var(--ma-bg-card)',
        'bg-elevated': 'var(--ma-bg-elevated)',
        fg:           'var(--ma-fg)',
        'fg-muted':   'var(--ma-fg-muted)',
        'fg-subtle':  'var(--ma-fg-subtle)',
        border:       'var(--ma-border)',
        accent:       'var(--ma-accent)',
        success:      'var(--ma-success)',
        warn:         'var(--ma-warn)',
        error:        'var(--ma-error)',
      },
    },
  },
  plugins: [],
};
