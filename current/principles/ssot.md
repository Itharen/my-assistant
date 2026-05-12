# SSoT — Single Source Of Truth (KRITIKUS)

> **Forrás: a user szövege (2026-05-12).**

---

## 2026-05-12 — alaptézis

> az SSOT!!! Single Source Of Truth.

(Háromszoros felkiáltójellel — maximális hangsúly.)

---

## Univerzális szabály

**Minden adat-elemnek** (egy state, egy szabály, egy konstans, egy konfig,
egy projekt-prio, egy task-státusz, egy felhasználói preferencia) **EGY**
és **csak egy** kanonikus forráshelye van. Minden más másolat / hivatkozás
**oda mutat vissza**, nem **mellé** él.

## Mit jelent gyakorlatban

### Ha egy adatot több helyen használunk

✅ **Helyesen:**
- Egy kanonikus fájl (a SoT)
- A többi hely csak **hivatkozást** tartalmaz az SoT-ra (`Forrás: <path>`)
- Vagy a többi hely automatikusan generálódik az SoT-ból

❌ **Helytelenül:**
- Ugyanaz az érték / lista / szabály több fájlban duplikálva
- "Időről időre szinkronizáljuk" → drift garantált

### Ha egy SoT-fájl frissül

- Minden hivatkozó hely **frissítendő-jelölt** (Dev Agent 09-update-docs
  fázis része)
- A frissítés **automatikus** vagy **explicit task** legyen — soha nem
  "majd észreveszem"

---

## A my-assistant SoT-térképe (KANONIKUS)

| Adat | Kanonikus SoT | Másolatok / cache |
|---|---|---|
| Komponens-elhatárolás | `current/principles/system-components.md` | hivatkozások mindenhol |
| Domén 1/2 elhatárolás | `current/principles/two-domains.md` | hivatkozások |
| Architektúra (5 réteg) | `current/architecture.md` | implementáció-cache: `__agent/references/architecture.md` |
| Tri-tier impl-szerkezet | `__agent/references/architecture.md` | — |
| Cron Job tick-state | `__agent/STATUS_ASSIST.md` | dispatcher-belső cache: `__agent/state/assistant-agent-cron-tick.json` |
| Dev Agent cycle-state | `__agent/STATUS_DEV.md` | dispatcher-belső cache: `__agent/state/development-agent-tick.json` |
| Workspace projekt-prio | `E:\Programming\Own\CURSOR\documentations\live-projects-priorities.md` (külső) | cache: `__agent/references/workspace-projects.md` |
| FR állapot | `current/feature-requests/<fr>.md` (mindegyik FR a saját SoT-ja) | backlog: `__agent/triggers/development-agent-backlog.md` (cache) |
| Plan állapot | `__agent/plans/<plan>.plan.md` | — |
| User életcél | `current/life-goals.md` | hivatkozások |
| Projekt-szorzók | `current/projects.md` | hivatkozások |
| Recurring-szabály | `current/principles/recurring-tasks.md` | — |
| Stock | `current/stock/items.md` | shopping-listák abból generálódnak |
| 3×3 state | `__agent/state/3x3-log.jsonl` (append-only history) + `STATUS_ASSIST.three_by_three.current` (latest cache) | diary jegyzet |
| Action-log | `__agent/log/actions/<day>.jsonl` (append-only) | NINCS cache — minden olvasó frissen olvas |
| CCAP CLI parancsok | `__agent/references/ccap/REFERENCE.md` (generálva `ccap skill-doc`-kal) | — |
| STT-typos | `current/stt-typos.md` | — |
| Open-questions | `current/open-questions.md` | — |
| Diary | `current/diary/diary.md` | — |
| Hookok config | `.claude/settings.json` | — |
| Globális workspace-szabályok | `E:\Programming\Own\CURSOR\CLAUDE.md` (külső) | — |
| Projekt-szintű szabályok | `E:\Programming\Own\CURSOR\my-assistant\CLAUDE.md` | — |

---

## Anti-pattern (NE TEDD)

- ❌ Ugyanaz a 7-komponens lista 3 fájlban másolva (FRISSÍTÉSI POKOL)
- ❌ "Néha kézzel szinkronizáljuk" → drift
- ❌ FR állapota a backlog-ban és az FR-ben **eltérő** — egy az SoT (az FR
  fájl), a backlog cache
- ❌ Több STATUS.md fájl egymástól független állapot-leírással

---

## Kapcsolódás a workflow-ba

A Dev Agent **minden** `09-update-docs` fázis kötelező lépése:
- A cycle-ben módosított adatok SoT-ja kanonikusan frissítve?
- A cache-ek/hivatkozások karbantartva?
- Drift-jelölt fájlok ellenőrizve?

A chat (én) **minden új adat-felvétel előtt** megnézi:
- Van-e már SoT erre?
- Ha igen, oda írok, NEM új helyre
- Ha nincs, létrehozok egy SoT-fájlt, és máshová csak hivatkozást

---

## Kapcsolódik

- `current/principles/system-components.md` — a 7-komponens kanonikus tér
- `current/principles/working-style.md` — én = vezénylő, workflow-doc karbantart
- `__agent/WORKFLOW_DEV.md` 1. alapelv — SSoT a STATUS_DEV.md YAML
- `__agent/WORKFLOW_ASSIST.md` 1. alapelv — SSoT a STATUS_ASSIST.md YAML
