# FR: CCAP auto-session-ök monitoringja

> **Forrás: a user szövege (2026-05-12).** STT-bizonytalan: "autószessionök"
> = valószínűleg **auto-sessionök** (a CCAP-ben futó automatikus session-ök
> — Cron Job, Dev Agent, esetleg egyéb).

## A user szövege

> Majd azt is bele kéne építsük a rendszerünkbe, hogy időről időre rá kéne
> nézni az autószessionökre.

## Cél

Rendszeres (időről időre) **automatikus ellenőrzés** a CCAP-ben futó
auto-session-ek állapotán:
- Élnek-e (heartbeat)
- Mikor volt az utolsó tick
- Mit produkáltak (verdict, action-count)
- Vannak-e hibák / failing tick-ek

## Mit jelent

A CCAP-ben legalább **2 auto-session** fut (lásd `system-components.md`):
- **#6 Assistant Agent Cron Job** — óránként
- **#1 Development Agent** — ritkábban / event-driven

Plus esetleg egyéb (jövőbeli) auto-session-ök.

Az ellenőrzés forrása: `ccap status` + `ccap sessions` (lásd
`__agent/references/ccap/REFERENCE.md`).

## Megoldás

Két szint:

### A) Cron Job (#6) input-bővítés

A Cron Job entrypoint-jába felvenni egy új input-forrást:
- `ccap status` output (rendszer + session-state)
- `ccap sessions` output (session-lista + utolsó-aktivitás)

Ha az auto-session-eknél anomália van (24h-nál régebbi tick / failing
status), a Cron Job `user-input-new` blokkot ír.

### B) Automatizmus script (#7) cron-task

Külön scripted cron-task ami ne-LLM módon nézi a CCAP-status-t, és ha
gond van, action-log error + USER_INPUT [NEW] blokk.

## Status

🅿️ Parkolva — felírva. Implementáció:
- Phase 1: Cron Job input-bővítés (egyszerű — entrypoint módosítás)
- Phase 2: Külön script (#7-be tartozik, B-mode automation)

## Kapcsolódik

- `__agent/references/ccap/REFERENCE.md` — `ccap status`, `ccap sessions`
- `__agent/triggers/assistant-agent-cron-entrypoint.md` — bővítendő input-lista
- `__agent/plans/assistant-agent-automation-scripts.plan.md` — B-mode #7 task-jelölt

## Open kérdések

❓ Q-ccap-mon-1: Mennyi időnként nézzünk rá (óránként a Cron Job tick-jén belül elég, vagy külön cron)?
❓ Q-ccap-mon-2: Mi az "anomália" definíciója (utolsó tick > N óra / failing status / error count > threshold)?
❓ Q-ccap-mon-3: Mit csináljunk anomáliánál (notify-cast / ccap notify / user-input-new)?
❓ Q-ccap-mon-4: Lehet-e egyszerűsíteni: csak a `ccap status --json` outputot beépíteni a Cron Job input-jába és nyersen átadni az LLM-nek?
