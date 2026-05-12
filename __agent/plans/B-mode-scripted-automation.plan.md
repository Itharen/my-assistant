# Plan: B-mode (scripted automatizmus) — státusz + tervezet

> **Forrás-FR:** `current/feature-requests/triggering-system-architecture.md`
>
> **Status (2026-05-08 reggel):** 🟡 még nincs build. Eddig csak az A mode
> (intelligens periodikus agent) MVP-je áll. Ez a plan az **B mode** scope-ját
> rögzíti.
>
> **Build-ki:** ⚙️ user-döntés — én csináljam vagy egy másik agent? (A
> server-app FR explicit "másik agent" — ezt jellemzően nem.)

---

## 1. Mi a B mode

A 3-session triggering rendszerben:

- **A) Intelligens periodikus** — Claude API-t hív, dönt → ✅ MVP shipped
- **B) Scripted automatizmus** — **NEM hív LLM-et**, "buta" file-syncek, log-rotálás, recurring-rule felvét, etc. → 🟡 ez a plan
- **C) Élő chat** — én (most ez)

A B mode **olcsó és gyakori** lehet (akár percenként is). LLM nélkül.

---

## 2. Mit kéne csinálnia (scope-jelöltek)

### 🟢 Phase 1 — alacsony kockázat, magas érték

| # | Feladat | Trigger |
|---|---|---|
| 1 | **Recurring miss-detect** — átnézi `recurring-tasks.md` táblát + utolsó-elvégzés dátumokat, felvet `[NEW]` blokkot ha 2+ missed cycle | óránként |
| 2 | **Action-log rotálás** — ha egy napi log >10000 sor, gzip-eli az előzőeket | naponta éjfélkor |
| 3 | **STATUS.md sanity** — ellenőrzi hogy a `last_event` ne legyen 24h-nál régebbi → soft-nudge `[NEW]` | 6 óránként |
| 4 | **Open-questions stale check** — `current/open-questions.md`-ben h-fontosság >7 nap "open" → `[NEW]` emlékeztető | naponta |
| 5 | **Sleep-event auto-emit** — ha `activity-monitor` 4h+ folyamatos idle éjszaka → `inferred-sleep` event a (jövő server-app DB-be / addig: `__agent/state/sleep-cache.json`) | percenként |
| 6 | **Diary auto-template** — minden új naptári nap kezdetén üres `## YYYY-MM-DD` szekció a diary-be ha még nincs | naponta éjfélkor |

### 🟡 Phase 2 — több függőség

| # | Feladat | Trigger |
|---|---|---|
| 7 | **Battery-monitor pulling** — `device-battery-monitoring` FR megvalósítva → percenként pull state-et | percenként (after FR done) |
| 8 | **Volume-schedule** — `device-volume-scheduling` FR → időzített cast-notifier volume set | óránként |
| 9 | **Interfood-scraper** — `interfood-scraper` FR → naponta lefuttat egy Playwright-pull-t | naponta |

### ⚪ Phase 3 — server-app utáni

| # | Feladat |
|---|---|
| 10 | DB-archive: file-state → DB sync (after server-app) |
| 11 | Cross-machine sync ha cloud-on fut |
| 12 | Email / social media periodic check |

---

## 3. Hol fut

🟢 Default: **Windows Task Scheduler** + Node/PowerShell scriptek (A-mode-mal párhuzamos).

Nem agent-runtime — sima cron jellegű. Egy script-fájl per feladat,
külön script-tel triggerelve.

---

## 4. Implementációs minta (kódstrukturális javaslat)

```
scripts/scripted-automation/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── tasks/
    │   ├── recurring-miss-detect.ts
    │   ├── log-rotate.ts
    │   ├── status-sanity.ts
    │   ├── stale-questions.ts
    │   ├── sleep-event-emit.ts
    │   └── diary-template.ts
    ├── lib/
    │   ├── action-log.ts (re-use)
    │   ├── recurring.ts (parser a recurring-tasks.md-hez)
    │   └── user-input.ts (re-use a handlers/ verzióját)
    └── run.ts (CLI: tsx run.ts <task-name>)
```

A Task Scheduler minden task-hoz külön ütemezés-bejegyzést kap (nem egy
big-bang script).

---

## 5. Action-log emit (kötelező)

Minden scripted task egy lifecycle action-loggal start/stop/error
(a user explicit szabálya — `CLAUDE.md` "Action log — KÖTELEZŐ").

---

## 6. Mikor csináljuk

Fontossági sorrend (cross-projekt):

| # | Mikor | Miért |
|---|---|---|
| 1 | A-mode kicsit "beül" (1-2 nap valós használat) | tanulság: melyik B-mode task tényleg kell |
| 2 | Server-app FR hand-off megtörtént | a B-mode task-ok már a DB-vel készülhetnek |
| 3 | Phase 2 user-input után | a `notify-cast` valódi handler kell pl. miss-detect-hez |

→ Most még **NEM** kell elkezdeni. Várjon az A-mode tanulságaira.

---

## 7. Open kérdések

| # | Kérdés | Fontosság |
|---|---|---|
| Q-bmode-1 | Phase 1 task-ok közül melyik kell tényleg? Mind 6 vagy szelektálva? | medium |
| Q-bmode-2 | Frequency: óránként-percenként-stb. — task-szinten dönteni vagy egységesen? | medium |
| Q-bmode-3 | Failure handling: 1× hiba = email / 3× hiba = notify? | low |
| Q-bmode-4 | Build-ki: én vagy másik agent? (User-döntés) | high |

---

## Status

📝 **Plan v1 készen.** Várja: A-mode tapasztalatokat + 4 open kérdés döntését.
