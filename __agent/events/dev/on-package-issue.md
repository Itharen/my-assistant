# Event — on-package-issue

> npm/pnpm dep konfliktus, missing module, ENOENT, peer-dep warning.

## Mit csinálj

1. **Olvasd be** a hiba-kontextust (`pnpm install` / `pnpm run build` output)

2. **Kategorizáld:**
   - **Missing module** → `pnpm install` re-try; ha nem old fel → user-needed
   - **Peer-dep konflikt** → review `package.json`-okat (workspace szinten)
   - **Lock-file inkonzisztencia** → `rm pnpm-lock.yaml && pnpm install`
   - **Build script hiba** → script konkrét hibája — fixáld vagy user-needed
   - **`ERR_PNPM_IGNORED_BUILDS`** → `pnpm approve-builds` (lokál user-action) — `user-input-new` Tier 3 approval

3. **Sose** csinálj `rm -rf node_modules` autonóm — előbb dokumentálj a phase_notes-ban

4. **Maximum 2 javítási próbálkozás** — utána `events/dev/on-user-needed.md`

## STATUS_DEV update

```yaml
phase_notes: |
  Package issue: <hiba>. Próbálkozás N/2.
```

## Action-log emit

```json
{ "kind": "error",
  "summary": "Package issue: <hiba típus>",
  "extra": { "command": "...", "error": "..." } }
```
