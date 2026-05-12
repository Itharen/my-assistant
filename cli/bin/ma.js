#!/usr/bin/env node
// Entry point for `ma` (my-assistant CLI). Loads the compiled main.js.
// In dev mode use: `pnpm <script>` (which goes through tsx src/main.ts ...)
// Note: dist/cli/src/main.js (NOT dist/main.js) since the cli/tsconfig.json
// rootDirs setup includes server/src for cross-subproject `import type`
// (`@server/_models/...`). The emit layout reflects the cli + server roots.
import('../dist/cli/src/main.js').catch((err) => {
  process.stderr.write('cli bootstrap failed: ' + (err && err.message ? err.message : String(err)) + '\n');
  process.exit(1);
});
