# Cycle 130 — FR #5b-DISCORD Phase 2+3: notify-discord webhook handler

**Dátum:** 2026-05-29
**Commit:** `bfc76ea`
**Green-light:** AGB-2026-05-22-02 (⚠️ TOP PRIO, chat → dev-agent, 2026-05-22)

## Trigger / kontextus

A `00-orient` fázis a teljes `[OPEN] To: dev-agent` scan során **két friss TOP PRIO
green-light-ot** talált, ami **2026-05-22 óta lenn maradt**:
- **AGB-2026-05-22-02** — ⚠️ Discord webhook notification (FR #5b-DISCORD) — "legmagasabb prioritású feladat"
- AGB-2026-05-22-01 — ntfy.sh push (második kör)

⚠️ **Stall-miss:** a cycle 124-129 mind safe-orthogonal spec-coverage-et csinált
(AGB-2026-05-17-02 chat-válaszra várva), de **nem scannelte újra** a teljes
AGENT_BUS-t friss green-light-okért. Így egy explicit TOP PRIO green-light **7 napig**
maradt feldolgozatlanul. Cycle 130 korrigálta.

## Mit (Phase 2 + Phase 3)

| Fájl | Mit |
|---|---|
| `handlers/notify-discord.ts` (ÚJ, ~140 LOC) | HTTP POST Discord webhook embed-formátum; `buildDiscordPayload` pure helper; throttle; `MA-DISCORD-*` error-code-ok |
| `types.ts` | `NotifyDiscordAction` interface + `'notify-discord'` ActionType + `Action` union |
| `schema.ts` | validáció (title/message req, priority/mention/color/cooldownMs) + ACTION_TYPES + REQUIRED_TIER |
| `dispatch.ts` | import + switch case |
| `test/sample-discord.json` (ÚJ) | smoke sample |
| `package.json` | `smoke-discord` script |
| `README.md` | handler-mapping sor + env-var dokumentáció + error-code-ok |
| `discord-webhook-notification.md` (ÚJ FR) | Phase 2+3 SHIPPED status |

## Design-döntések

- **content vs embed:** a `content` csak a mention-ping-et hordozza (`<@id>` mobil push @-jelzés);
  a strukturált tartalom (title + description) az embed-ben — nincs duplikáció.
- **priority → szín:** info=kék, success=zöld, warning=sárga, error=piros; `color` (decimal RGB) override.
- **env:** `MA_DISCORD_WEBHOOK_URL` (required), `MA_DISCORD_USER_ID` (opc., mention-höz).
- **throttle:** közös `throttle.ts` (ccap-notify/notify-cast minta), `throttleId` + `cooldownMs`.
- **error-handling (zero-tolerance):** `MA-DISCORD-NO-WEBHOOK-URL` / `MA-DISCORD-POST-FAIL` /
  `MA-DISCORD-HTTP-ERROR` — mind strukturált throw + action-log `kind:'error'`, semmi csendes swallow.

## Verifikáció

- **typecheck:** `tsc --noEmit -p tsconfig.json` → exit 0 ✅
- **E2E mock-server smoke (4/4 PASS):**
  1. PURE `buildDiscordPayload` — warning-szín, mention-none→üres content, color override ✅
  2. INTG valódi POST mock-szerverre — content `<@id>` + embed title/description/color helyes ✅
  3. ERR no-env → throw `MA-DISCORD-NO-WEBHOOK-URL` ✅
  4. HTTP-ERR 400 → throw `MA-DISCORD-HTTP-ERROR` ✅
- **Real-Discord smoke:** user-feladat (FR szerint) — `MA_DISCORD_WEBHOOK_URL` beállítás után 1 próba-üzenet.

## Env-blocker (megjegyzés)

A lokál `node_modules` elavult symlinkekkel van tele (régi `/e/.../my-assistant/` path,
LIVE-projects nélkül) → `tsx`/`esbuild` broken, a `pnpm run` deps-check is fail-el.
**Workaround:** `tsc.js` közvetlen futtatás a `.pnpm` store-ból + `node dist/` a fordított JS-re.
A child→parent loopback socket is ETIMEDOUT (Windows security product) → a smoke in-process fut.
Reinstall (`pnpm i`) kéne valamikor, de nem blokkol.

## Hátralévő (külön cycle)

- **AGB-22-01 ntfy.sh Phase 1** — második kör, a Discord-handler clone-ja (`notify-push.ts`)
- **FR #5b-DISCORD Phase 4** — `communication-forms.md` dispatcher `discord` channel
- **FR #5b-DISCORD Phase 5** — recurring miss-check → Discord push (mátrac/takarítás/séta), sleep-aware-gate

## Anti-stall tanulság (23. alapelv megerősítés)

Minden `00-orient` → **teljes `[OPEN] To: dev-agent` scan a candidate-döntés ELŐTT**.
A safe-orthogonal pool csak akkor lép életbe, ha NINCS feldolgozatlan green-light/request.
