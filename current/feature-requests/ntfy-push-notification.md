# FR: ntfy.sh push notification — mobil + cross-device

> **Forrás: user 2026-05-22** — "Ki kéne alakítsunk valamilyen notification rendszert minél előbb, amin keresztül tud engem értesíteni a rendszerünk a fontosabb feladatokról."

## Háttér

A meglévő 3 csatorna (Google Home / Client dashboard / CCAP notify, `communication-forms.md`) **OTTHONI** focus-okat ér el. Hiányzó réteg:
**MOBIL push** — amikor a user **nem otthon van**, vagy nem ül a gép előtt.

## Választás: ntfy.sh

**Miért ntfy.sh:**

| Kritérium | ntfy.sh |
|---|---|
| FOSS | ✅ Apache 2.0 |
| Ingyenes | ✅ public server free, **self-host-able** |
| Android app | ✅ F-Droid + Play Store |
| iOS app | ✅ App Store |
| API | ✅ `curl -d "msg" https://ntfy.sh/<topic>` |
| Autentikáció | ✅ HTTP Basic / token (self-host esetén) |
| Topic-alapú | ✅ subscribe to topic, no per-user account |
| Encrypted | ✅ HTTPS + opcionálisan e2e (Push Encryption) |

**Alternatívák (kizárva):**
- ❌ Pushover (paid)
- ❌ Telegram bot (FOSS de Telegram-függés)
- ⚠️ Discord webhook (FOSS-szerű, backup-jelölt)

## Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a FR | chat ✅ |
| 1 | server `notify-push` handler (`cli/scripts/agent-handlers/src/handlers/notify-push.ts`) — POST a ntfy.sh public server-re vagy self-hosted (env: `MA_NTFY_URL`, `MA_NTFY_TOPIC`, opc. `MA_NTFY_AUTH`) | Dev Agent ✅ **cycle 131** |
| 2 | Android app install + topic subscribe (user-side) | user — ⏳ user-feladat |
| 3 | Channel-selection: a `communication-forms.md` `notify` dispatcher tudjon **push**-csatornán is (mellette Google Home + CCAP) | Dev Agent |
| 4 | Sleep-aware + presence-aware gate (mint Google Home) | Dev Agent |
| 5 | Self-host setup (Docker container fdp-devops-hoz, vagy Yoda VM) — opcionális, ha public ntfy.sh-on aggályok | user + Dev Agent |
| 6 | Priority-routing: kritikus = push + Google Home; közepes = csak push; alacsony = csak dashboard | Dev Agent |

## Példa-flow

```
recurring-tasks ellenőrzés
  → matrac NEM volt ma
    → cron-tick: kritikus miss
      → notify-push handler:
         curl -d "💪 Mai matrac NEM volt — még meg lehet csinálni." \
              -H "Priority: high" \
              -H "Tags: warning" \
              "https://ntfy.sh/${MA_NTFY_TOPIC}"
      → telefon push megérkezik
```

## Status

🟢 **Phase 1 SHIPPED — cycle 131 (2026-05-31)**. A `notify-push` handler kész:
ntfy **JSON publish formátum** (emoji-safe — a header-alapú publish ByteString-korlát
miatt 💪-féle title hibát dobna), `priority` name→ntfy 1-5, `tags` string→array,
közös throttle, strukturált `MA-NTFY-*` error-code-ok. typecheck zöld + E2E mock-server
smoke (JSON-payload emoji-safe + no-topic error + HTTP-403 error mind PASS).

**⏳ User-feladat (Phase 2):** Android/iOS ntfy app install + topic subscribe →
`MA_NTFY_TOPIC` env beállítás (+ opc. `MA_NTFY_URL` self-host, `MA_NTFY_AUTH`), majd
real-smoke. Addig a handler `MA-NTFY-NO-TOPIC`-kal jelzi a hiányt (szándékolt).

**Hátralévő:** Phase 3 (`communication-forms.md` dispatcher `push` channel) + Phase 4
(sleep/presence-gate) + Phase 6 (priority-routing). Külön cycle.

Eredetileg: 🟢 **MAGAS prio** — user 2026-05-22 explicit kérés. Backlog **#5b**
(sleep-aware-notifications testvérje, közvetlenül a #5 utánra).

## Kapcsolódik

- `current/feature-requests/communication-forms.md` — 3-csatorna dispatcher, ide új CHANNEL
- `current/feature-requests/sleep-aware-notifications.md` (#5) — disturb-gate logika
- `current/principles/no-paid-solutions.md` + `build-it-ourselves.md` — ntfy.sh FOSS megfelel
- `current/principles/client-visualization.md` — kliens-szintű notif-status indicator a panelen
