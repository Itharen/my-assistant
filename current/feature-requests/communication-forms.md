# FR: Kommunikációs formák — 3 csatorna

> **Forrás: a user szövege (2026-05-11).** Első fejlesztési feladat a Dev Agentnek.

## A user szövege

> A kommunikációs formákra meg olyasmire gondolok, mint amiket már elkezdtünk
> megcsinálni, hogy a Google Home-on keresztül, illetve az alkalmazáson
> keresztül, és most már a CCAP Notification is opció.

## A 3 csatorna

| # | Csatorna | Hogyan | Jellemző |
|---|---|---|---|
| 1 | **Google Home** | `ma cast notify` (Cast cluster, TTS) | hangos, push, sleep-aware-gate-elt |
| 2 | **Alkalmazás (Client dashboard)** | `client/` Angular UI | vizuális, polled, log-szerű |
| 3 | **CCAP Notification** | `ccap notify send/list/respond` | csendes text, ack-elhető (`--type confirm/option-select/question`, `--wait` long-poll) |

## Új handler a dispatcher-be: `ccap-notify` (Dev Agent Phase 1)

```ts
// cli/scripts/agent-handlers/src/handlers/ccap-notify.ts (új, Tier 1)
// args: { title, type, description?, priority?, options?, wait?, sessionId? }
// → ccap notify send shell-out
```

A `notify-cast` handler (Google Home felé) már megvan placeholder-szinten.
Az `application` csatorna a server-en át megy (`/notification/pending`
endpoint, már implementálva).

## Mikor melyik

| Helyzet | Csatorna |
|---|---|
| User alvása alatt urgens info halmozódik | nem szól semmi, alvás-vége csomagba teszi |
| User éber, kritikus reminder (kaja-rendelés lejárt) | **Google Home** (hangos, mert lehet hogy nem a gép előtt van) |
| User éber, csendesen ack-kéréssel ("rendben elindítsam X-et?") | **CCAP Notification** `--type confirm --wait` |
| User később megnézi mi történt | **Alkalmazás** dashboard |

## Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a FR | én ✅ |
| 1 | `ccap-notify` handler a dispatcher-ben | Dev Agent ✅ cycle 24 |
| 2 | `notify-cast` handler valódi cast-notifier shell-out | Dev Agent ✅ cycle 29 |
| 3 | Csatorna-választó logika a Cron Job entrypoint-ban (mikor-melyik) | én (workflow-doc) |
| 4 | Throttle közös a 3 csatornára | Dev Agent ✅ cycle 30 |

## Status

✅ **FR Dev Agent-szakaszai shipped.** Phase 1 (cycle 24) + Phase 2 (cycle 29)
+ Phase 4 (cycle 30) — plan-doc `__agent/plans/communication-forms.plan.md`.
Phase 3 (csatorna-választó logika a Cron Job entrypoint-ban) chat-felelős,
nyitva.

## Kapcsolódik

- `current/feature-requests/sleep-aware-notifications.md` — gate
- `current/feature-requests/automatic-status-recording.md` — testvér FR
- `__agent/references/ccap/REFERENCE.md` — `ccap notify` referencia
- `cli/README.md` — `ma cast notify`

---

## 2026-05-17 — Kétirányú komm (inbound back-channel + zavarhatóság-szabályok)

### User szövege

> Szóval, hogyha a kétirányú kommunikációs kapcsolatot kéne kiépíteni a My
> Assistant rendszeren keresztül minél előbb, fontos lenne ehhez, hogy a
> Google Home-on keresztül tudjunk kommunikálni. Ennek egy része már megvan.
> De majd kicsit össze kell igazítani a mindenféle szabályozásokkal, mint
> például, hogy mikor lehet zavarni engem, és mikor nem. És hogyha az én
> a kezeléseim, eventjeim hogyan fognak eljutni hozzád?

### Eddigi állapot (kifelé = agent→user)

| Csatorna | Status |
|---|---|
| Google Home cast notify | ✅ Phase 1.5+2 shipped (`ma cast notify`) |
| Client dashboard | ⚠️ alap-UI shipped, **AGB-20 auth-blokkoló** miatt jelenleg üres (várja a fix-et) |
| CCAP Notification | ⚠️ handler shipped (`ccap-notify`), **valós shell-out még pending** |

### Hiányzó scope (befelé = user→agent + agent→chat)

**A — User-event → agent (inbound back-channel):**

| Forrás | Cél | Status |
|---|---|---|
| Google Home **routine** wake/sleep | server `/wake`, `/sleep` endpoint | FR `iot-integration-google-home-routine.md` (#3c), 🟢 ESM-mig collision |
| Google Home **voice** ("Hey Google, tell my-assistant...") | server queue endpoint | FR `hey-google-like-voice-trigger.md` (#7d), research-jelölt |
| Client dashboard form (USER_INPUT új-blokk) | `__agent/USER_INPUT.md [NEW]` append | FR `agent-io-panels.md` (#3g) Phase 4 |
| Mobil-eszköz (jövőbeli) | server REST + push | FR `activity-tracking.md` Phase 3 (#3h) Google Fit integráció |

**B — User-event → chat (én):**

A user event-jei (mood-snapshot, séta-tény, recurring done, stb.) jelenleg **csak** chat-en át érkeznek hozzám. Hogy a TÖBBI csatornán érkező user-event is eljusson:

1. Az event-ek **mind** `__agent/log/actions/*.jsonl`-be íródnak (actor: `user` vagy `assist-agent`)
2. Új chat-session `SessionStart` hook a `RAG context-injection` FR (#7g) **Phase 3** alapján: top-N relevánsabb friss action-log entries **automatikusan inject** a kontextusba
3. Backstop: ha a RAG még nem él, **kézi olvasás** session-start-kor (`__agent/log/actions/<today>.jsonl` legutóbbi 100 sor) — már most működik

**C — Zavarhatóság-szabályok (when-to-disturb):**

| Szabály | Forrás | Aktív? |
|---|---|---|
| **Sleep-window**-gate | `sleep-aware-notifications.md` (#5) + `principles/sleep-system.md` | 🟡 Phase 1 design, dev-side wiring needed |
| **Wave-vector down** → soft channel csak (no Google Home) | `assist-agent` event verdict | ✅ használt (lásd cron-tick decisions) |
| **Vasárnap/szabat** → no urgent push, csak digest | `weekly-rhythm.md` + `fit-system.md` | ⚠️ alapelv kész, gate-impl pending |
| **Presence-throttle** (user offline >N min → batch helyett push) | activity-monitor change-events (#3h) | ⚠️ activity-monitor down kell live |
| **Bedtime ±30p** | sleep-aware Phase 1+ | 🟡 |

### Phase-elés (új scope ehhez a 2-way comm-hoz)

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a kibővítés | chat ✅ |
| 1 | `iot-integration-google-home-routine.md` (#3c) Phase 1 server endpoints — wake/sleep | Dev Agent (ESM-mig után) |
| 2 | `agent-io-panels.md` (#3g) Phase 4 inline-write USER_INPUT-ba | Dev Agent |
| 3 | `hey-google-like-voice-trigger.md` (#7d) research → MVP voice-queue endpoint | Dev Agent + user voice-config |
| 4 | `sleep-aware-notifications.md` (#5) Phase 2+ disturb-gate runtime | Dev Agent |
| 5 | Activity-monitor (#3h) presence-detect → throttle integration | Dev Agent |

### Kapcsolódó (összegzés)

- `current/feature-requests/iot-integration-google-home-routine.md` (#3c)
- `current/feature-requests/hey-google-like-voice-trigger.md` (#7d)
- `current/feature-requests/agent-io-panels.md` (#3g)
- `current/feature-requests/sleep-aware-notifications.md` (#5)
- `current/feature-requests/activity-tracking.md` (#3h)
- `current/feature-requests/rag-context-injection.md` (#7g)
- `current/principles/sleep-system.md`, `weekly-rhythm.md`, `client-visualization.md`, `error-handling.md`
