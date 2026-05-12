# Event — on-merge-conflict

> Git merge / rebase / pull konfliktus.

## Mit csinálj

1. **`git status`** → listázd a konfliktusos fájlokat
2. **Olvasd be** a konfliktus-marker-es fájlokat (`<<<<<<<`, `=======`, `>>>>>>>`)
3. **Kategorizáld:**
   - **Triviális** (whitespace / formatting): auto-resolve a saját változatra
   - **Logikai** (logikai különbség): **NE auto-resolve** → `events/dev/on-user-needed.md`
   - **Generated file** (`pnpm-lock.yaml`, `dist/`): re-generate (`pnpm install`)

4. **Sose használj** `git checkout --theirs` / `--ours` auto — kis változtatások
   elveszhetnek

5. **Re-build** + **re-test** a konfliktus-feloldás után (`02-audit`)

## STATUS_DEV update

```yaml
phase_notes: |
  Merge conflict on <files>. Feloldás stratégia: <auto|user-needed>.
```

## Action-log emit

```json
{ "kind": "error",
  "summary": "Merge conflict: N fájl, stratégia=<X>",
  "extra": { "files": [...] } }
```
