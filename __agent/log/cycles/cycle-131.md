# Cycle 131 — FR #5b Phase 1: notify-push ntfy.sh handler

**Dátum:** 2026-05-31
**Commit:** `49e3177`
**Green-light:** AGB-2026-05-22-01 (chat → dev-agent, 2026-05-22) — a Discord (cycle 130) utáni második kör

## Trigger / kontextus

A `00-orient` teljes `[OPEN] To: dev-agent` rescan (anti-stall tanulság a cycle 130-ból):
csak **AGB-2026-05-22-01 (ntfy.sh)** volt actionable. A többi nyitott To:dev-agent flag stale
(AGB-EXAMPLE = séma; AGB-2026-05-16-05/06/07 a marathon-ban már funkcionálisan ship-elve).

## Mit (Phase 1)

| Fájl | Mit |
|---|---|
| `handlers/notify-push.ts` (ÚJ, ~150 LOC) | HTTP POST ntfy.sh **JSON publish**; `buildNtfyPayload` pure helper; throttle; `MA-NTFY-*` error-code-ok |
| `types.ts` | `NotifyPushAction` interface + `'notify-push'` ActionType + `Action` union |
| `schema.ts` | validáció (title/message req, priority min/low/default/high/max, tags, cooldownMs) + ACTION_TYPES + REQUIRED_TIER |
| `dispatch.ts` | import + switch case |
| `test/sample-push.json` (ÚJ) | smoke sample |
| `package.json` | `smoke-push` script |
| `README.md` | handler-mapping sor + env-var doc + error-code-ok |
| `ntfy-push-notification.md` (FR) | Phase 1 SHIPPED status |

## Design-döntések

- **JSON publish > HTTP-header:** ntfy két publish-mód: header-alapú (Title/Priority/Tags) vagy JSON body.
  A header-mód **nem unicode-safe** (HTTP header = ByteString/Latin-1) → emoji a title-ben (💪) dob.
  Ezért JSON body (`{topic,title,message,priority,tags}`) — UTF-8-safe, ntfy-ajánlott unicode-hoz.
- **priority:** name → ntfy numerikus (min=1, low=2, default=3, high=4, max=5).
- **tags:** vesszővel-tagolt string → array (trim + üres-szűrés).
- **env:** `MA_NTFY_TOPIC` (required), `MA_NTFY_URL` (default https://ntfy.sh), `MA_NTFY_AUTH` (opc. Bearer).
- **throttle + error-handling:** azonos a notify-discord (cycle 130) / ccap-notify mintával.

## 🔴 Bug elkapva a fejlesztés közben (E2E hard rule értéke)

Az **első verzió HTTP-header-rel publikált** (Title/Priority/Tags). Az E2E in-process smoke
azonnal elbukott: `MA-NTFY-POST-FAIL: Cannot convert argument to a ByteString because the
character at index 0 has a value of 55357...` — a 💪 emoji a Title header-ben. **Javítás:**
átírás ntfy JSON publish formátumra. Ha csak typecheck futott volna (ami zöld volt), ez
**élesben bukott volna** az első emoji-s push-nál. → az `e2e-validation.md` univerzális
hard rule pontosan ezt fogta meg.

## Verifikáció

- **typecheck:** `tsc --noEmit -p tsconfig.json` → exit 0 ✅
- **E2E mock-server smoke (4/4 PASS):**
  1. PURE `buildNtfyPayload` — priority name→szám (high=4), tags string→array (trim+szűrés), emoji a title-ben ✅
  2. INTG valódi JSON-POST mock-szerverre — topic/title(💪)/message/priority/tags + Bearer auth helyes ✅
  3. ERR no-topic → throw `MA-NTFY-NO-TOPIC` ✅
  4. HTTP-ERR 403 → throw `MA-NTFY-HTTP-ERROR` ✅
- **Real-ntfy smoke:** user-feladat (FR Phase 2) — app install + topic subscribe + `MA_NTFY_TOPIC` env.

## Hátralévő (külön cycle)

- **FR #5b-DISCORD Phase 4 + ntfy Phase 3** — `communication-forms.md` dispatcher `discord` + `push` channel
  (összevonható: közös dispatcher-bővítés)
- **ntfy Phase 4** — sleep/presence-gate; **Phase 6** — priority-routing
- A **matrac-rész (recurring miss-check → push)** az Assist Agent Cron Job dolga, nem a Dev Agent-é

## Domén-megjegyzés

Az AGB-22-01 "A — Napi matrac" része asszisztensi (Domén 1) — recurring-task + cron-tick.
A Dev Agent csak a **B — Notification rendszer** (handler) szeletet építi. A matrac-push
összekötés akkor él, ha a Cron Job `notify-push` action-t emittál (a dispatcher már kész rá).
