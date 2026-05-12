#!/usr/bin/env node
// Entry point for `ma` (my-assistant CLI). Loads the compiled main.js.
// In dev mode use: `pnpm <script>` (which goes through tsx src/main.ts ...)
import('../dist/main.js').catch((err) => {
  process.stderr.write('cli bootstrap failed: ' + (err && err.message ? err.message : String(err)) + '\n');
  process.exit(1);
});
