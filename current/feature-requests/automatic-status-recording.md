# FR: Státuszok automatikus rögzítése

> **Forrás: a user szövege (2026-05-11).** Első fejlesztési feladat a Dev Agentnek.

## A user szövege

> Az első fejlesztési feladatok azok a kommunikációs formáknak a kialakításai
> kell legyen, meg a státuszoknak az automatikus rögzítése.

## Cél

A rendszer-szinten **minden releváns státusz automatikusan rögzítve**
legyen, anélkül hogy a chat (#5, én) manuálisan írjon `STATUS.md`-t,
action-log-ot, state-fájlt.

## Mit jelent

| Mit | Most | Cél (automata) |
|---|---|---|
| Cron Job tick eredmény | dispatcher írja `assistant-agent-cron-tick.json`-be | ✅ már megvan |
| Dev Agent tick eredmény | dispatcher írja `development-agent-tick.json`-be | 🅿️ Dev Agent Phase 1 |
| Action-log emit | hookok + dispatcher | ✅ már megvan |
| **`STATUS.md` `next_action`** | chat (#5) manuálisan | 🟡 → automatizálandó |
| **`STATUS.md` `last_event` + `last_event_type`** | chat (#5) manuálisan | 🟡 → automatizálandó |
| **`active_plans` lista a STATUS-ban** | chat (#5) manuálisan | 🟡 → automatizálandó (plan-state-watch) |
| User sleep / wake event | chat-ben jelez, chat felveszi diary-be | 🟡 → activity-monitor + Cron Job auto |
| FR status (Parkolva / Aktív / Shipped) | chat / FR fájlt manuálisan szerkeszt | 🅿️ Dev Agent `fr-status-change` handler |
| Plan-step status (TODO / In-progress / Done) | chat / plan-t manuálisan szerkeszt | 🅿️ Dev Agent `plan-step-mark-done` handler |
| CCAP session-state | ccap status / sessions | 🟡 → poll-be |
| Build / test status | manuális `pnpm typecheck` / `pnpm test` | 🅿️ Dev Agent `test-run` handler |
| Git state (branch / pending changes / unpushed commits) | manuális `git status` | 🅿️ Dev Agent auto-input |

## Forrás-térkép (ki látja, ki frissít)

### `__agent/STATUS.md` (kanonikus snapshot)

**Frissít:**
- Chat (#5, én) manuálisan (most a default — jövőben kerülni)
- Cron Job (#6) — `update-status` action (Tier 1, már megvan)
- Dev Agent (#1) — `update-status` action (Phase 1+ után)
- Automatizmus scriptek (#7) — sanity-check (Phase 2+)

**Mezők auto-rögzítésre:**
- `last_event` — minden ship / state-change után
- `last_event_type` — szintén
- `next_action` — a legutóbbi user-iránymutatás / Cron Job dönt
- `active_plans` — plan-state-watch (új plan / shipped plan)

### `__agent/state/*-tick.json` (per-agent state)

Mindkét agent saját tick-state-t ír. Konkurencia: file-lock.
**Már megvan**: `assistant-agent-cron-tick.json` (`schemaVersion: 1`)
**Új**: `development-agent-tick.json` (megvan, üres seed)

### `current/feature-requests/<feature>.md` (FR status)

**Mezők auto-rögzítésre:**
- `Status: 🅿️ Parkolva | 🟡 Aktív | 🟢 Magas prio | ✅ Shipped | ❌ Törölve`
- Dev Agent `fr-status-change` (Tier 1) handler

### `__agent/plans/<plan>.plan.md` (plan-step status)

Plan-fájlokban a "Phase" táblázatok státuszait Dev Agent jelöli ki:
- `plan-step-start` (Tier 2, clear-rule = ref a plan-ben + dependsOn teljesülve)
- `plan-step-mark-done` (Tier 1, evidence kell)

### Server DB (jövőbeli)

A `server/` (My Assistant Server, #2) Phase 2-re átveszi a state-tárolást
file-állományok helyett. A status-rögzítés DB-szinten lesz, a file-state
fallback marad.

## Workflow vázlat (cél-állapot)

```
1. User chat-ben ad iránymutatást ("MVP=pénzkeresés")
   └─> chat (#5) felveszi a principle-be + STATUS.next_action-be

2. Cron Job (#6) óránként:
   ├─> olvas: STATUS, action-log, recurring
   ├─> dönt: van urgens / soft-nudge / no-action
   ├─> action: update-status (next_action, last_event, last_event_type)
   └─> dispatcher: append-only az action-log-ra

3. Dev Agent (#1) event-en / 4h-cron:
   ├─> olvas: STATUS, FR-ek, plans, git
   ├─> dönt: melyik FR / plan-step aktív
   ├─> action: fr-status-change + plan-step-mark-done
   └─> dispatcher: append-only

4. Mindkét agent → STATUS.md + action-log frissül AUTONÓM
   (lásd full-autonomy-expectation.md)

5. Chat (#5) ezeket OLVASSA, nem írja
   (kivéve ha közvetlenül vezényel)
```

## Status

🟢 **Aktív FR** — első fejlesztési feladat. A Phase 1 a Dev Agent Phase 1
után érdemes (mert a Dev Agent maga is rögzít).

## Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a FR (most) | én ✅ |
| 1 | Dev Agent `fr-status-change` + `plan-step-mark-done` handler | Dev Agent ✅ cycle 31 |
| 2 | Cron Job + Dev Agent rendszeresen frissíti a STATUS-t (next_action, active_plans) | Dev Agent |
| 3 | Server DB-be migráció (file-state → DB) | másik agent |
| 4 | Dashboard view a STATUS / active_plans / pending FR-ekhez | Client team |

## Open kérdések

❓ Q-status-1: A STATUS.md `next_action` mezőt ki dönti el ha több agent egyszerre frissítené (Cron Job vs Dev Agent vs chat)? Priorítás-szabály?
❓ Q-status-2: Mennyire részletes legyen az `active_plans` lista (csak path, vagy + Phase / Progress?)
❓ Q-status-3: FR-status enum kanonikálva (Parkolva / Aktív / Magas prio / Shipped / Törölve)?
❓ Q-status-4: Plan-step status formátum (`[x]` / `🟢` / `Done` / progress %)?
❓ Q-status-5: A diary entry auto-emit-elhető-e a fontos events alapján?

## Kapcsolódik

- `current/feature-requests/communication-forms.md` — testvér FR
- `current/principles/system-components.md` — komponens-térkép
- `current/principles/full-autonomy-expectation.md` — autonómia
- `__agent/triggers/development-agent-entrypoint.md` — Dev Agent action-types (fr-status-change, plan-step-*)
- `__agent/plans/development-agent.plan.md` — Phase 1
