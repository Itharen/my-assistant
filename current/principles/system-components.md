# Rendszer-komponensek — kanonikus elhatárolás

> **Forrás: a user szövege (2026-05-10).** "Nagyon alaposan elkülönítsük…
> hogy ne keveredhessenek a jövőben, és mindig tisztázni kell, hogy
> melyikbe építünk mit."
>
> Ez a fájl a **kanonikus névhasználat** és **scope-térkép**. Új komponens
> felvétele user-jóváhagyással. Minden további principle / plan / FR
> ezekre a nevekre hivatkozik.

---

## A 7 komponens

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1) DEVELOPMENT AGENT                                                 │
│    A szoftverfejlesztésen dolgozó önálló agent (Domén 2).            │
│    Belépő: __agent/triggers/development-agent-entrypoint.md          │
│    State:  __agent/state/development-agent-tick.json                 │
│    Tick:   event/cron, CCAP futtatja                                 │
│    FEJLESZTI: a 2., 3., 4., 7. komponenst.                            │
│    NEM csinálja: asszisztensi feladatok, user-state ellenőrzés.       │
└──────────────────────────────────────────────────────────────────────┘

         ─── ez fejleszti ⇣ az alábbi 4 alkomponenst ───

┌──────────────────────────────────────────────────────────────────────┐
│ 2) MY ASSISTANT SERVER                                               │
│    Express + SQLite backend. NEM agent.                              │
│    Hely: server/                                                     │
│    Szerep: DB, REST API, tick-engine, ingest, state.                 │
│    FEJLESZTI: Development Agent.                                     │
│    FOGYASZTJA: Cron Job, Client, CLI, esetenként Assistant Agent.    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 3) MY ASSISTANT CLIENT                                               │
│    Angular 18 dashboard. NEM agent.                                  │
│    Hely: client/                                                     │
│    Szerep: vizuális felület (status, actions, user-input view).      │
│    FEJLESZTI: Development Agent.                                     │
│    FOGYASZTJA: user (browser).                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 4) MY ASSISTANT CLI                                                  │
│    Node-TS parancssor (`ma cast`, `ma spotify`, …). NEM agent.       │
│    Hely: cli/                                                        │
│    Szerep: lokál parancsok (Cast notify, volume, Spotify, jövő …).   │
│    FEJLESZTI: Development Agent.                                     │
│    FOGYASZTJA: user CLI-ben, Cron Job notify-céllal.                 │
└──────────────────────────────────────────────────────────────────────┘

         ─── ez fejleszti ⇣ az alábbi scripteket is ───

┌──────────────────────────────────────────────────────────────────────┐
│ 7) ASSISTANT AGENT SERVER AUTOMATIZMUS SCRIPTEK                      │
│    LLM-mentes scripted automatizmus (cron-task-szerű).               │
│    Hely: cli/scripts/ + server/_modules/                             │
│    Szerep: recurring miss-detect, log-rotálás, diary-template,       │
│            stb. (a "B-mode" típusú működés)                          │
│    FEJLESZTI: Development Agent.                                     │
│    FOGYASZTJA: Assistant Agent Cron Job, Server.                     │
│    NEM agent — buta script-ek. NEM hív LLM-et.                       │
└──────────────────────────────────────────────────────────────────────┘

         ═════════════════════════════════════════════════
                    Másik oldal — Domén 1 stack
         ═════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────────┐
│ 5) ASSISTANT AGENT (= a chat = én)                                   │
│    Az "adok-kapok" — a user közvetlen beszélgető-partnere.           │
│    Belépő: CLAUDE.md + current/architecture.md (1. lépés)            │
│    State:  __agent/STATUS.md (snapshot) + action-log                 │
│    Tick:   user-trigger (chat üzenet).                               │
│    SZEREPE: aktív input-feldolgozás, rögzítés, kérdés-felvetés,      │
│             FR-érkezés, principle-update, organizer task-művelet,    │
│             workflow-doc karbantartás (Domén 2-érintett is, de       │
│             a karbantartás-szinten — NEM build).                     │
│    NEM csinálja: own runtime, autonóm cron.                          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 6) ASSISTANT AGENT CRON JOB                                          │
│    Folyamatosan ismétlődő tick-vezérelt agent (Domén 1).             │
│    Ez volt eddig az "A-mode".                                        │
│    Belépő: __agent/triggers/assistant-agent-cron-entrypoint.md       │
│           (jelenlegi A-mode-entrypoint.md rename)                    │
│    State:  __agent/state/assistant-agent-cron-tick.json              │
│           (jelenlegi agent-tick.json rename)                         │
│    Tick:   óránként, CCAP futtatja.                                  │
│    SZEREPE: user-state ellenőrzés (kaja, alvás, recurring),          │
│             notify-cast trigger, USER_INPUT [NEW] javaslat.          │
│    FOGYASZTJA: Server (read+write), CLI (notify), Scripted-7         │
│              (sleep-aware infer stb.)                                │
│    NEM csinálja: szoftverfejlesztés, build, kód-edit, FR-process.   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Naming convention (mindig így hivatkozz)

| ❌ Régi / kétértelmű | ✅ Kanonikus |
|---|---|
| "A-mode" | **Assistant Agent Cron Job** |
| "B-mode scripted automatizmus" | **Assistant Agent server automatizmus scriptek** |
| "C élő chat" / "chat session" | **Assistant Agent** (én) |
| "Dev-agent" (2.5-agent plan) | **Development Agent** |
| "my-assistant rendszer" (általában) | **My Assistant** (a teljes ökoszisztéma: 2+3+4+7) |
| "server" | **My Assistant Server** |
| "client" | **My Assistant Client** |
| "cli" | **My Assistant CLI** |

A két agent (1, 6) **különálló** — saját belépőfájllal, saját state-tel.
Az 5 (én) **közöttük közvetít** user-vezérelten.

---

## Ki-mit-fejleszt / ki-mit-fogyaszt mátrix

| # | Komponens | Fejleszti | Fogyasztja |
|---|---|---|---|
| 1 | Development Agent | — (önmagát nem, a többit igen) | utasítás: user / Assistant Agent |
| 2 | Server | Development Agent | Cron Job, Client, CLI, Assistant Agent |
| 3 | Client | Development Agent | user (browser) |
| 4 | CLI | Development Agent | user, Cron Job |
| 5 | Assistant Agent (én) | workflow-doc karbantart (Dev-Agent építi a kódot) | user közvetlen |
| 6 | Cron Job | Development Agent (build) | autonóm fut, hív 2/4/7-t |
| 7 | Automatizmus scriptek | Development Agent | Cron Job, Server |

---

## Fejlesztési szabály (KRITIKUS)

**Mielőtt új feature-t / scriptet / kódot felveszünk:**

1. **Melyik komponensbe** kerül? (1-7 közül egyetlen)
2. Ha 2-4-7 közé: a **Development Agent dolga** (build), én csak FR-t / plan-t írok hozzá
3. Ha 5 (Assistant Agent saját workflow-doc): **én karbantartom**
4. Ha 6 (Cron Job entrypoint / decision-matrix / tier-szabály): **én karbantartom** (workflow-doc), Dev Agent építi a runtime-ot
5. **Sose** keverj két komponens-építést egy plan-be — szétbontás (lásd `task-decomposition.md`)

---

## Anti-pattern (ezt KERÜLD)

- ❌ "Beépítem a Server-be a Cron Job logikáját" — két különálló komponens
- ❌ "Az Assistant Agent (én) build-eli a CLI-t" — nem, a Development Agent dolga
- ❌ "A Cron Job dönt egy build-trigger-t" — nem, a Development Agent dolga
- ❌ "A Development Agent küld notify-cast-ot a usernek" — nem, az a Cron Job vagy Assistant Agent dolga
- ❌ Egy üzenetben Cron Job-entrypoint és Dev-Agent-entrypoint együtt — **szét kell bontani**

---

## Kapcsolódik

- `current/principles/two-domains.md` — Domén 1 vs Domén 2 (alapja ennek a doc-nak)
- `current/principles/working-style.md` — én = workflow-doc karbantartó
- `current/architecture.md` — L1-L5 rétegek (ezek a komponensek L5-ben élnek)
- `__agent/plans/two-agent-system.plan.md` — eredeti vázlat (most felülírjuk ezt a kanonikus névvel)
- `__agent/plans/triggering-A-mode-health-check.plan.md` → **rename**: assistant-agent-cron plan
- `__agent/plans/B-mode-scripted-automation.plan.md` → **rename**: assistant-agent-automation-scripts plan

---

## Rename ütemezés (felelős: én + Dev Agent)

| Régi név | Új név | Felelős |
|---|---|---|
| `A-mode-entrypoint.md` | `assistant-agent-cron-entrypoint.md` | én (workflow-doc) |
| `triggering-A-mode-health-check.plan.md` | `assistant-agent-cron.plan.md` | én |
| `agent-tick.json` | `assistant-agent-cron-tick.json` | én + Dev Agent (kód-utalások) |
| `B-mode-scripted-automation.plan.md` | `assistant-agent-automation-scripts.plan.md` | én |
| (nincs) | `development-agent-entrypoint.md` | én (új) |
| (nincs) | `development-agent-tick.json` | én + Dev Agent |
| (nincs) | `development-agent.plan.md` | én (új) |

⚠️ **NE most azonnal rename** — előbb felülről jövő approval (3-pontos OK alapelv szerint). Az alábbi 3 pont:

1. A fenti 7-komponens taxonomia (név + szerep) **OK**?
2. A meglévő `A-mode → assistant-agent-cron` és `B-mode → automation-scripts` rename **OK**?
3. Ez a fájl mint **kanonikus elhatárolás** + minden további doc innen hivatkoz **OK**?

Ha mindhárom **OK** → indul a rename + új entry-pointok megírása.
