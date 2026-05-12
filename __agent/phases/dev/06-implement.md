# Phase 06 — Implement

> A tényleges kódolás.

## Mit csinálj

1. **Pattern-követés**: a `04-investigate` által kijelölt mintát kövesd
2. **Kis lépések**: minden file-edit után `STATUS_DEV.phase_notes`-be 1 sor
3. **Helper-ek / handler-ek build-elési sorrendje**:
   - Először típusok + séma (types.ts / schema.ts)
   - Aztán state / paths / utility
   - Aztán handlers / endpoints / components
   - Aztán dispatcher / wiring / index
4. **Inline test** ha gyors: build-base + smoke próba

## Quick-typecheck checkpoint

Minden ~5 file-edit után:
```
pnpm typecheck    # ahol a változás történt
```
Ha hibás → fixáld azonnal, ne halmozódjon.

## Action-log emit per major-edit

```json
{ "kind": "file-write" | "file-edit",
  "summary": "Created/Modified <path> — <feature>",
  "ref": "<path>" }
```

## STATUS_DEV update

```yaml
last_cycle:
  files_modified:
    - cli/scripts/agent-handlers/src/handlers/...
    - ...
```

## Hibák

| Hiba | Akció |
|---|---|
| Build/typecheck failel | `events/dev/on-build-fail.md` (nem haladsz tovább) |
| Csomag-konfliktus / missing module | `events/dev/on-package-issue.md` |
| Architekturális elágazás (új pattern kell, nincs minta) | `events/dev/on-architecture-decision.md` (user-OK) |

## Kilépés

`STATUS_DEV.phase` → `review`
