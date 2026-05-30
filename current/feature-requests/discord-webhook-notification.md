# FR: Discord webhook notification — mobil + cross-device (első kör)

> **Forrás: user 2026-05-22** — "Első körben jó lesz a Discord, tetszik az ötlet."

## Miért Discord (első körben)

| Kritérium | Discord webhook |
|---|---|
| FOSS | ⚠️ Discord NEM FOSS, **de a webhook-integráció ingyenes** és nem igényel külön telepítést |
| Mobil app | ✅ user-nek **már fent van** (telefonon + asztalon) |
| Setup | ✅ **5 perc**: új csatorna → új webhook URL → POST a my-assistant-ből |
| Notification | ✅ telefonon natív push, hangos opcionális, mention `@user` is lehet |
| Akcionálhatóság | ✅ üzenetbe gomb / link helyezhető (bár interaktív gomb nem trivi) |
| Cost | $0 |

**Discord vs ntfy.sh vs Google Home:**

| | Discord | ntfy.sh | Google Home |
|---|---|---|---|
| Telefonon | ✅ már fent | új app install kell | ❌ |
| Otthon | ✅ hangos opcionálisan | ✅ alkalmazás-push | ✅ már shipped, hangos |
| Cross-device | ✅ telefonon + asztalon szinkronban | ✅ | ❌ csak otthon |
| User-engagement | ✅ szerver/csatorna struktúra (későbbi: agent-IO bot) | ⚠️ csak push, nincs csatornázás | ⚠️ csak ki-irány |
| Setup-idő | **5 perc** | ~15 perc (app install + topic) | ✅ 0 (shipped) |

→ **Első körben Discord — minimum-effort, maximum-reach.**

## Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a FR | chat ✅ |
| 1 | User: új Discord szerver / csatorna létrehozása + webhook URL generálás | user (1 perc) — ⏳ user-feladat (env-var beállítás) |
| 2 | `cli/scripts/agent-handlers/src/handlers/notify-discord.ts` (új handler) — POST a webhook URL-re, args: `title message priority color mention throttleId` | Dev Agent ✅ **cycle 130** |
| 3 | `MA_DISCORD_WEBHOOK_URL` + `MA_DISCORD_USER_ID` env-var beolvasás | Dev Agent ✅ **cycle 130** |
| 4 | `communication-forms.md` dispatcher bővítés: `discord` mint új channel | Dev Agent (Phase 3 — későbbi) |
| 5 | Recurring miss-check → Discord push (mátrac, takarítás, séta, stb.) — sleep-aware-gate kötés | Dev Agent |
| 6 | Discord-bot opcionális (későbbi: button-response, slash command, agent-IO panel) | későbbi |

## Phase 2 anchor (most indítható, ORTOGONÁLIS)

```ts
// cli/scripts/agent-handlers/handlers/notify-discord.ts
// Tier 1 (notify cluster)
// args: { title, message, priority, color?, mention? }
// → POST ${MA_DISCORD_WEBHOOK_URL} body {
//     content: mention === 'user' ? `<@${MA_DISCORD_USER_ID}> ${message}` : message,
//     embeds: [{ title, description, color }]
//   }
```

**Master-prompter pattern:** a `ccap-notify` handler (FR #1 Phase 1 shipped) mintáját kövesd.

**E2E:** mock-szerver (httpbin / nock) + real-Discord smoke (1 üzenet a user csatornájába).

## Status

🟢 **Phase 2+3 SHIPPED — cycle 130 (2026-05-29)**. A `notify-discord` handler kész:
HTTP POST embed-formátum, `priority`→szín, `mention: user` ping, közös throttle,
strukturált `MA-DISCORD-*` error-code-ok. typecheck zöld + E2E mock-server smoke
(POST-payload + no-env error + HTTP-400 error mind PASS).

**⏳ User-feladat (Phase 1):** Discord csatorna + webhook URL → `MA_DISCORD_WEBHOOK_URL`
env-var beállítás, majd real-smoke (1 próba-üzenet a csatornádba). Addig a handler
`MA-DISCORD-NO-WEBHOOK-URL`-lel jelzi a hiányt (szándékolt, strukturált).

**Hátralévő:** Phase 4 (`communication-forms.md` dispatcher `discord` channel) + Phase 5
(recurring miss-check → Discord push, sleep-aware-gate). Külön cycle.

Eredetileg: 🔴 **TOP PRIO 2026-05-22** — user-prio "csináljunk legmagasabb prioritású
feladatot, amit odaadunk a DevAgentnek".

Backlog **#5b-DISCORD** (a `#5b` ntfy.sh előtt — Discord olcsóbb és gyorsabb).

## Kapcsolódik

- `current/feature-requests/ntfy-push-notification.md` — alternatíva, második kör
- `current/feature-requests/communication-forms.md` — dispatcher
- `current/feature-requests/sleep-aware-notifications.md` (#5) — disturb-gate
- `current/principles/no-paid-solutions.md` — Discord webhook ingyenes ✅
