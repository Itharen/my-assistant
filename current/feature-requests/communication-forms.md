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
| 2 | `notify-cast` handler valódi cast-notifier shell-out | Dev Agent |
| 3 | Csatorna-választó logika a Cron Job entrypoint-ban (mikor-melyik) | én (workflow-doc) |
| 4 | Throttle közös a 3 csatornára | Dev Agent |

## Status

🟢 **Aktív FR.** Phase 1 (`ccap-notify`) shipped cycle 24-ben — plan-doc
`__agent/plans/communication-forms.plan.md`.

## Kapcsolódik

- `current/feature-requests/sleep-aware-notifications.md` — gate
- `current/feature-requests/automatic-status-recording.md` — testvér FR
- `__agent/references/ccap/REFERENCE.md` — `ccap notify` referencia
- `cli/README.md` — `ma cast notify`
