# Plan — Automatic status recording (FR #2 backlog 🟢)

> **Cél:** Dev Agent dispatcher autonóm üzemben tudjon FR `Status:` mezőt
> váltani + plan-step ✅ jelölést végezni — JSON output-on át.
>
> **Forrás-FR:** `current/feature-requests/automatic-status-recording.md`
> **Scope:** Phase 1 — `fr-status-change` + `plan-step-mark-done` handlerek.
> Phase 2-3 külön cycle / FR.

---

## Phase 1 — handler-ek ⚡ (cycle 31)

### 1.1 `cli/scripts/agent-handlers/src/types.ts`

Új `ActionType`-ok: `'fr-status-change'`, `'plan-step-mark-done'`. Tier 1.

```ts
export interface FrStatusChangeAction extends BaseAction {
  type: 'fr-status-change';
  tier: 1;
  args: {
    frPath: string;            // relative or absolute, normalized
    fromStatus: string;        // expected current status (preflight check)
    toStatus: string;          // new status (free-form, e.g. "✅ shipped (cycle 31)")
    reason?: string;           // optional, logged
  };
}

export interface PlanStepMarkDoneAction extends BaseAction {
  type: 'plan-step-mark-done';
  tier: 1;
  args: {
    planPath: string;
    stepRef: string;           // e.g. "Phase 4 — közös throttle"
    evidence?: string;         // optional, logged (commit-sha, cycle, ...)
  };
}
```

### 1.2 `cli/scripts/agent-handlers/src/schema.ts`

- `ACTION_TYPES` set bővítés
- `REQUIRED_TIER` bővítés (mindkettő Tier 1)
- Per-type validation: `frPath`/`fromStatus`/`toStatus` non-empty string; `planPath`/`stepRef` non-empty

### 1.3 `cli/scripts/agent-handlers/src/handlers/fr-status-change.ts` (új)

```
1. Resolve `args.frPath` — abs or rel-from-projectRoot.
2. fs.readFile(frPath, 'utf-8')
3. Preflight: keresd a `## Status` szakasz után az első tartalmas sort
   (vagy: az első sor, ami `## Status` után jön, nem üres, nem heading).
4. Ha a meglévő status NEM tartalmazza `args.fromStatus`-t → throw
   `MA-FR-STATUS-MISMATCH` (preflight fail; az autonóm dispatcher így nem
   ír felül váratlanul módosult fájlt).
5. Replace: a status-sor első előfordulását cseréld `args.toStatus`-ra
   (csak a karaktereket, a sor többi része megmarad).
6. fs.writeFile atomic (tmp + rename).
7. action-log `ship`: `[fr-status-change] <frPath>: <fromStatus> → <toStatus>`
```

Strukturált error codes:
- `MA-FR-FILE-NOT-FOUND` (ENOENT)
- `MA-FR-STATUS-MISSING` (nincs `## Status` szakasz)
- `MA-FR-STATUS-MISMATCH` (preflight fail)
- `MA-FR-WRITE-FAIL`

### 1.4 `cli/scripts/agent-handlers/src/handlers/plan-step-mark-done.ts` (új)

```
1. Resolve planPath.
2. readFile.
3. Find a table row OR list item with `stepRef` text.
4. Mark logic: keress `| Phase N | ... | <stepRef-substring> | Dev Agent |`
   és cseréld az utolsó cella végét "Dev Agent ✅ cycle XX"-re —
   VAGY egyszerűbben: keresd a stepRef-substring sort, és ha még nincs ✅,
   tegyél ✅ a sor végére (fallback minimalista, robust).
5. Atomic write.
6. action-log `ship`.
```

Strukturált error codes:
- `MA-PLAN-FILE-NOT-FOUND`
- `MA-PLAN-STEP-NOT-FOUND`
- `MA-PLAN-WRITE-FAIL`
- `MA-PLAN-STEP-ALREADY-DONE` (idempotens — log + skip, NEM error)

### 1.5 `cli/scripts/agent-handlers/src/dispatch.ts`

- Import 2 új handler
- Switch case bővítés

### 1.6 Verify

- Agent-handlers tsc ✅
- Smoke: kis test JSON pipe-pel, lokál fájl-mock-on (vagy MA_LOG_ROOT-szerű env override)
- LDP unchanged (cli/scripts/ out-of-watch — bg note)

---

## Phase 2 — Cron Job + Dev Agent rendszeres status-update (későbbi cycle)

Phase 1 építőkocka. Phase 2 a CCAP cron-runtime-ban használja őket.

---

## Phase 3 — Server DB migráció (másik agent / külön FR)

`runtime-error-api` FR + saját DB-state plan kombinálja. Külön plan-doc.

---

## Validation summary

| Phase | Verify | Várt |
|---|---|---|
| 1 | agent-handlers tsc + manual smoke | exit 0, FR + plan-fájlok strukturálisan helyesen módosulnak |

---

## Risks & rollbacks

- **Atomic-write race:** tmp + rename pattern (throttle.ts mintára). Single-writer cron-runtime esetén nincs gond.
- **Markdown-parser hiánya:** regex-alapú find+replace. Edge case: ha a `## Status` szakasz nem-standard formátumú → preflight fail, log, NEM ír. UX-preserving.
- **Idempotencia:** plan-step-mark-done többszöri hívás biztonságos (ha már ✅ → skip + log note).

---

## Status

🔄 **Phase 1 cycle 31-ben (folyamatban).**
