# Event — on-build-fail

> `pnpm typecheck` vagy `pnpm run build` failel.

## Mit csinálj

1. **Olvasd be** a teljes hibakimenetet (Bash output)
2. **Kategorizáld:**
   - **Saját új kód okozza** (módosított fájlok közt) → fixáld inline
     vissza `06-implement`-re
   - **Külső dependency** (npm error / missing module) → `events/dev/on-package-issue.md`
   - **Pattern-konfliktus** (más fájlt sért az új kód) → `04-investigate` re-iteráció
   - **Ismeretlen ok** (nem tied) → `events/dev/on-user-needed.md` — user-OK kell

3. **NEM folytatsz** `08-verify-local` után amíg zöld nem lesz

4. **Maximum 3 javítási próbálkozás** — utána `events/dev/on-user-needed.md`

## STATUS_DEV update

```yaml
last_cycle:
  build_status: failed
phase_notes: |
  Build fail in <project> at <fájl>:<sor> — <hibaüzenet>. Javítás folyamatban.
```

## Action-log emit

```json
{ "kind": "error",
  "summary": "Build fail: <project>, <hibaüzenet>",
  "extra": { "project": "...", "error": "..." } }
```
