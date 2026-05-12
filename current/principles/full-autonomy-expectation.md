# Teljes autonómia-elvárás

> **Forrás: a user szövege (2026-05-11).** Top-level rendszer-elvárás.

---

## 2026-05-11 — alaptézis

> Teljes autonómiát fogok elvárni a rendszertől, amit ezeken a csateken
> keresztül fogunk vezényelni.

---

## Mit jelent

A my-assistant rendszer **teljes autonómiával** működik:
- **Az Assistant Agent Cron Job** (#6) önállóan tickel, dönt, akciókat ad ki
- **A Development Agent** (#1) önállóan dolgozik FR-ekkel, plan-ekkel, build-tel
- **Az Assistant Agent automatizmus scriptek** (#7) önállóan futnak cron-szerűen
- **A Server** (#2), **Client** (#3), **CLI** (#4) önállóan kiszolgálja a kéréseket

A **chat session** (#5, én) ezeket a komponenseket **VEZÉNYLI** — itt adunk
irányt, prioritást, döntést, principle-t, FR-t. Innentől a rendszer
**önállóan végrehajt**.

---

## Kapcsolat a Tier-rendszerrel

**Tier 3 tiltás megmarad** (`production-deploy / package release / fizetős API` nem autonóm), de **`commit` + `push` Tier 2-be került** (autonóm) — user-engedély 2026-05-11 "bátran commit and push every pending changes".

A "teljes autonómia" itt **a vezénylés-után** értendő: a chat-en kiadott
parancs / approval / principle a rendszer mind a 7 komponensében
**áthat**, és onnan a megfelelő tier-szabályok szerint **önállóan** megy
végbe.

```
┌─────────────────┐
│ Chat (én — #5)  │ ──> ad iránymutatást, OK-t, principle-t, FR-t
└────────┬────────┘
         │ vezénylés
         ▼
┌───────────────────────────────────────────────────────────┐
│ Rendszer (#1-#4, #6-#7) — TELJES AUTONÓMIÁBAN végrehajt   │
│                                                            │
│ Tier 0-1: önállóan auto                                    │
│ Tier 2:   önállóan auto + clear-rule forrás-hivatkozás     │
│ Tier 3:   nem auto — chat-en át user-OK kell               │
└───────────────────────────────────────────────────────────┘
```

---

## Következmények a my-assistant rendszerre

### Az én szerepem (#5 — Assistant Agent / chat)

**Vezénylő, nem operátor.** A jövőben **kevesebb manuális end-to-end
végrehajtás** kell tőlem (file-edit-ek, organizer-task-create-ek,
fo-CLI-hívások), **több vezénylés** (principle-rögzítés, FR-deklarálás,
priorizálás, döntés-koordináció).

### A Development Agent (#1) feladata

Önállóan veszi át a `current/feature-requests/`-ben szereplő FR-eket,
megnézi a `__agent/plans/`-ben az aktív plan-eket, és **önállóan
implementálja** a Tier 0-2 lépéseket. Tier 3-at chat-javaslat-módban
ad át.

### Az Assistant Agent Cron Job (#6) feladata

Önállóan dönt a user-state alapján, **autonóm** notify-ot küld
(Tier 1, sleep-aware gate-elt), **autonóm** task-create-et csinál
(Tier 2, clear-rule), **autonóm** USER_INPUT [NEW] blokkot ír.

### Az automatizmus scriptek (#7) feladata

Önállóan futnak cron-ütemben, frissítik a state-et, log-rotálnak,
miss-detect-elnek, diary-template-elnek.

### A Server (#2) feladata

24/7 autonóm — bárki (CLI / Client / Cron Job / Dev Agent / Chat)
hív, kiszolgálja.

---

## Indok

A user **CC-limitet** ütött (4 párhuzamos account), a chat-szinten
korlátozott a sebesség / költség. A jövőben **a chat csak vezényel**,
a tényleges végrehajtás **autonóm** a többi komponensben.

Hosszú távon: a user **napi 1-2-szer** beszélget a chat-szel, közben a
rendszer (Cron Job + Dev Agent + scriptek) **folyamatosan** dolgozik.

---

## Implikációk

1. A `system-components.md` #5 (Assistant Agent) szerepe **kibővül**: vezénylés.
2. A Tier rendszer **változatlan** — csak az autonómia-hangsúly nő.
3. A `working-style.md` "én karbantartom a workflow-doc-okat" kiegészül: **én vezénylek**, a Dev Agent **épít**.
4. A Cron Job + Dev Agent **építése sürgősebb** mint korábban gondoltuk — most fejlődik az autonóm rendszer.
5. **Hosszú távon a chat-tel kevesebbet beszélek** — a tickeléses agentek átveszik a folyamatos figyelést.

---

## Anti-pattern (ezt KERÜLD)

- ❌ "Csinálok minden file-edit-et a chat-ből" → vezényelj, ne operátorkodj (kivéve ha tényleg ad-hoc azonnali kell)
- ❌ Várom a user-OK-t minden Tier 2 actionre → ha clear-rule van, **menjen autonóm**
- ❌ "A Dev Agent ne épüljön, majd a chat csinálja" → fordítva: minél előbb épüljön, hogy autonóm lehessen

---

## Kapcsolódik

- `current/principles/system-components.md` — 7-komponens, ki mit csinál
- `current/principles/two-domains.md` — Domén 1/2 elhatárolás
- `current/principles/working-style.md` — én = vezénylő + workflow-doc karbantartó
- `current/feature-requests/triggering-system-architecture.md` — autonóm tick-rendszer architektúra
- `__agent/plans/assistant-agent-cron.plan.md` — Cron Job autonóm tick
- `__agent/plans/development-agent.plan.md` — Dev Agent autonóm fejlesztés
