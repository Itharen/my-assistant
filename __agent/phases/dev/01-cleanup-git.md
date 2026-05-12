# Phase 01 — Cleanup git

> Git working tree konzisztencia + foreign pending detekció.

## Mit csinálj

1. **`git fetch origin`** — frissítsd a remote info-t (NO-CACHE)
2. **`git status`** — listázd a pending changes-t
3. **`git log -10`** — utolsó 10 commit
4. **`git diff HEAD --stat`** — pending stats

## Foreign pending detekció (17. alapelv)

Ha van pending change ami:
- NEM a Dev Agent által committed file-modification (action-log alapján
  ellenőrizd)
- NEM ismert chat-edit (action-log `actor: claude` recent entry-vel)

→ **foreign pending**. Lépések:

| Cycle | Akció |
|---|---|
| 1. | `STATUS_DEV.foreign_pending` mezőbe írd: first_seen_cycle, files, fingerprint (git diff hash első 16 char) |
| 2. | Még tűrés — nézd meg újra a következő cycle-ben |
| 3+ | **Takeover** — investigate / befejezés / revert. `phase_notes`-be log. |

## Pending change kategorizálás

| Pending típus | Akció |
|---|---|
| Saját workflow-doc edit (`__agent/`, `current/`) ami nincs commitolva | A 10-commit-push fázis fogja committolni — folytasd |
| Build-output / generated file (`dist/`, `node_modules/`) | Igazítsd a `.gitignore`-t ha kell |
| Foreign change | Lásd fent |
| Konfliktus marker (`<<<<<<<`) | `events/dev/on-merge-conflict.md` |

## Action-log emit

```json
{ "kind": "note", "summary": "Cleanup-git: N pending change, M foreign",
  "extra": { "pending_count": N, "foreign_count": M } }
```

## Kilépés

`STATUS_DEV.phase` → `audit`
