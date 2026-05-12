# FR: IoT integráció — Google Home routine → my-assistant default trigger

> **Forrás: a user szövege (2026-05-12).** Kritikus monitoring-input.

## A user szövege

> ezt is be kéne kötni amúgy. Valahogy be tudjuk kötni azt, hogy a...
> a rendszerünk egy IoT-ként működjön. És be lehessen kötni a Google
> Home rutinba, hogy küldhessek default triggert mint például ugye van
> két fő rutinom amit rendszeresen használok a jó reggelt meg a jó ét
> amit ébredéskor és lefekvéskor indítok és az biztos hogy sokat segítene
> a monitorozásban hogyha azt valahogy be tudnánk kötni.

## Cél

A my-assistant `server/` egy **IoT-szerű virtuális device**-ként jelenik
meg a Google Home Smart Home Cloud-to-cloud-on. A user a saját
ROUTINE-jaiból tudja triggerelni:
- **"Jó reggelt"** routine → wake event POST a server-re
- **"Jó éjt"** routine → sleep event POST a server-re

Plus **egyéb default triggerek** később (pl. "Hey Google, eljutottam haza",
"Hey Google, sétálni megyek").

## Miért fontos

- A **sleep-window detekció** most fallback-on alapul (02-08). Ezzel
  **explicit wake/sleep events** lesznek → pontosabb a Cron Job
  sleep-aware logikája
- A `WORKFLOW_ASSIST.md` 4. alapelv sleep-detekció priority sorrendje
  **(1)** sleep-system formula `wakeAt + 18-20h` — most ehhez kell a
  `wakeAt` valós forrás-jelölés
- Bevezet egy **bidirectional Google Home ↔ my-assistant** kapcsolatot
  (eddig csak my-assistant → Google Home volt: `ma cast notify`)

## Megoldás-jelöltek

### A) Cloud-to-cloud Smart Home (Google "Smart Home" Action)

- Saját Google "Smart Home Action" project a developer console-ban
- A my-assistant `server/`-en új endpoint: `/api/iot/google-home/<intent>`
  (SYNC, QUERY, EXECUTE intents szerint)
- Bejelentkezett user OAuth-on át kapcsolódik
- A Google Home Routine-ban egy "virtuális kapcsoló" eszközünk —
  azt flippeli a routine, és a server megkapja az EXECUTE intent-et

**Pro:** natív Google Home integráció, routine-ban használható
**Kontra:** publikus HTTPS endpoint kell (DNS, SSL), Google OAuth setup,
review-folyamat (esetleg)

### B) Webhook + IFTTT-szerű alternatíva

- Routine action: "Send notification" / "Trigger webhook" (Tasker / SharpTools /
  más Android-bridge)
- Egyszerűbb, de Android-eszköz kell középen

### C) Hibrid: a CCAP / cast-notifier oldalról

- Cast cluster már 24/7 figyel
- "Hey Google" → routine → broadcast egy szólomesszázsra a Cast cluster-re
- A cast-notifier hallgatás (?) — **bizonytalan, lehet hogy nem viable**

## Releváns FR-ek (overlap-jelzés)

- `current/feature-requests/google-home-integration.md` — V1-V3 történet
  (létezik, kibővítendő)
- `current/feature-requests/hey-google-like-voice-trigger.md` — voice-trigger
  research (a wakeword-detekció oldal)
- `current/open-questions.md` Q-wear-5 — IoT fake device research

→ Ezt a 3 FR-t **össze kell konszolidálni** vagy explicit cross-referenciálni.

## Phase-elés

| Phase | Mit |
|---|---|
| 0 | ez a FR + a 3 kapcsolódó FR konszolidáció |
| 1 | Cloud-to-cloud research: Google Smart Home Action setup-feltételek |
| 2 | Új REST endpoint a server-en: `/api/iot/google-home/*` |
| 3 | Új DB-tábla: `iot_events` (wake/sleep/custom triggers) |
| 4 | Cron Job input-bővítés: olvasás a `iot_events` legutóbbi entry-jeiből → wake/sleep detection |
| 5 | "Jó reggelt" + "Jó éjt" routine setup user-oldal (manuál) |
| 6 | Egyéb default-trigger routine-ok |

## Adat-séma (vázlat)

```sql
CREATE TABLE iot_events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,       -- 'google-home' | 'tasker' | …
  intent TEXT NOT NULL,        -- 'wake' | 'sleep' | 'arrived-home' | …
  device_id TEXT,              -- virtual device hivatkozás
  metadata JSONB,
  acted_on BOOLEAN DEFAULT false
);
```

## Open kérdések

❓ Q-iot-1: Google Smart Home Action — már létezik developer account?
❓ Q-iot-2: Publikus HTTPS endpoint kell — DNS + SSL setup?
❓ Q-iot-3: A 3 kapcsolódó FR konszolidálása — egy nagy FR vagy 3 különálló?
❓ Q-iot-4: Wake/sleep events priority: `iot_events` overrideolja a sleep-system formula fallback-et?
❓ Q-iot-5: Mit jegyzünk fel — csak event-ts? vagy bonyolultabb (pl. wake-quality, sleep-duration)?

## Status

🟢 **MAGAS prio** (kritikus monitoring infrastruktúra). Backlog 🟢 sorba.

## Kapcsolódik

- `current/feature-requests/google-home-integration.md` — V1-V3
- `current/feature-requests/hey-google-like-voice-trigger.md`
- `current/feature-requests/sleep-aware-notifications.md` — sleep-state forrás
- `current/principles/sleep-system.md` — wakeAt képlet
- `__agent/WORKFLOW_ASSIST.md` 4. alapelv (sleep-window detekció)
