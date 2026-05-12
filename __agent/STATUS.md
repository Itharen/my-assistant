# STATUS

```yaml
state: idle
active_flow: null
active_phase: null
last_event: 2026-05-08T15:30:00+02:00
last_event_type: tri-tier-refactor-shipped
next_action: "Tri-tier refactor (cli/server/client) sikerült — 48 specs zöld minden szinten. Architektúra: __agent/references/architecture.md. Következő: server live-be tétele (start-clean + Phase 2 dual-write a Claude hookoknál) + client fejlesztés (actions, user-input modulok). Phase 1.5 cast-notifier Spotify OAuth még user-tesztelésre vár."

active_plans:
  - "__agent/plans/triggering-A-mode-health-check.plan.md"  # v2 — Phase 1 MVP shipped (file-based)
  - "__agent/plans/refactor-tri-tier.plan.md"  # ✅ SHIPPED 2026-05-08

# IMPORTANT: A finomabb history-t lásd: __agent/log/actions/YYYY-MM-DD.jsonl
# Ez itt csak SNAPSHOT — a részletes session-resume forrás az action-log.

notes: |
  2026-05-07 22:55 — Session-recovery infrastruktúra ship-elve:
  - __agent/log/actions/ + README schema doc (append-only JSONL, retention=végtelen)
  - scripts/action-log/{append.ps1, hook.ps1, lib.ts} writer-trio
  - .claude/settings.json: SessionStart/UserPromptSubmit/PostToolUse/Stop hookok
    -> minden Edit/Write/Bash/PowerShell tool-call automatikusan logol
  - activity-monitor log átmozgatva: __agent/log/activity/ -> activity-monitor/data/
    (gitignored, mert privát + zajos). A lifecycle event-jei viszont a közös
    action-logba mennek.
  - cast-notifier retrofit: src/action-log.ts + emit minden subcommand
    invocation + ok/error envelope-nál
  - activity-monitor retrofit: lifecycle (start/stop/error) action-log emit
  - CLAUDE.md új főszekció "Action log — KÖTELEZŐ" + resume protokoll +
    "új fejlesztés = beépítendő logging" szabály
  - 24 seed entry: 12 history (2026-05-07 délután-este) + 12 mai infra-ship
  - Belépési pont kibővítve: STATUS -> action-log -> USER_INPUT -> SOURCE_OF_TRUTH

  Régebbi notes (2026-05-07 19:30 előtt) áthelyezve az action-logba.
  Innentől a STATUS.md csak a CURRENT snapshot-ot tartja, a history
  az action-logban van.

old_notes_pre_action_log: |
  User egy nagyobb input-set-et adott: korábbi session összefoglaló + new
  szabály-deklarációk (working style, prioritás-rendszer, ismétlődő feladatok,
  stock-rendszer, Google Home integráció kérés).

  Új struktúra:
  - current/principles/ létrehozva 4 fájllal (working-style, priority-system,
    recurring-tasks, stock-system) — user szövegei SZÓ SZERINT őrizve
  - CLAUDE.md bővítve: working style szakasz, időkezelés szakasz, alapelv-rögzítési meta-szabály

  Új organizer task-ok (3 db):
  - org:task:69fca4a1d440d3f484cedef9 — Céges hózárás (P=110, dueDate=ma)
  - {kaja-rendelés ref a diary-ben — P=105, dueDate=ma 22:00}
  - {Google Home research — P=50, no deadline}

  Diary entry 2026-05-07 felvéve a state-info-kkal (runners kész, agentek 2.5/4,
  Niche dataset majdnem kész, hózárás új P1, gamedev extra).

  2026-05-07 20:00 — cast-notifier Phase 2 felépítve:
  - src/spotify.ts: Web API client (token refresh, /me/player getCurrentPlayback,
    listDevices, transferPlayback, resolveResumeDevice)
  - src/spotify-auth.ts: egyszeri OAuth setup CLI (browser-callback localhost:9876)
  - notify.ts: pre-snapshot (Cast getStatus + Spotify Web API) + post-resume
    (transferPlayback) — a music orchestration KÖTELEZŐ minden hívásnál
    (lásd cast-notifier-defaults.md frissített szabály)
  - index.ts: spotify-status subcommand diagnosztikára
  - .gitignore: config/spotify.json (secret)
  - cast-notifier-defaults.md: KÖTELEZŐ szabály felírva — minden bemondás előtt
    volume+music capture, után restore+resume

  pnpm typecheck ✅, pnpm spotify:status pre-auth ✅ (helyes "not configured" válasz).

  Várakozás: USER egyszeri OAuth dance:
  1. https://developer.spotify.com/dashboard → új app, Redirect URI: http://localhost:9876/callback
  2. pnpm spotify:auth → Client ID/Secret + browser autorize
  3. Smoke test: BathCom-on bemondás miközben Spotify megy ott → várjuk a resume-ot

  2026-05-07 19:30 — cast-notifier Phase 1.5 ship (BathCom single-device validated):
  - tts.ts rewrite: msedge-tts + hu-HU-TamasNeural (férfi neural, ingyen,
    Microsoft Edge Read-Aloud WebSocket endpoint)
  - volume.ts (új): receiver-namespace ops (getStatus, setVolume) per-device,
    save/applyAll/restore orchestration helperekkel
  - groups.ts + config/groups.json (új): group→members manuális mapping
    (All Speakers, All plus one, Hubs default-tal)
  - notify.ts: per-device SAVE → UP (0.7 default) → PLAY → RESTORE finally-ben
    Group ön-volume-ját SOHA nem piszkáljuk — csak tagokat egyenként
  - index.ts: új volume subcommand (--get/--set/--mute/--unmute) +
    --announcement-volume, --voice, --no-volume, --volume-targets flag-ek +
    default target = "All Speakers"

  Két új univerzális principle közben rögzítve:
  - current/principles/cast-notifier-defaults.md (operacionális default-ok)
  CLAUDE.md principles index frissítve.

  Smoke test BathCom: save 0.10 → up 0.70 → TTS Tamás 53KB → play 6.4s →
  restore 0.10 ✅. Discovery flakiness látszott (egy retry kellett longer
  timeouttal) — Phase 2-be megy a retry/cache logika.

  Várakozás: Phase 2 (Spotify Web API resume) indítása user-jóváhagyásra.

  2026-05-07 19:05 — cast-notifier discovery FIX: multi-interface support
  hozzáadva (Windows-on 6 IPv4 interface, default-ban Node csak 1-et próbált).
  Új flag-ek: --interface (override), --verbose (stderr log), --host (direct
  IP bypass), list-interfaces subcommand. server.ts subnet-match LAN IP picker
  a target hangszóró subnet-jébe.

  Inventory (11 Cast device a 200.33.0.0/24 hálózaton):
  - 6 hangszóró: HallCom, KitchCom, BathCom (Mini-k), Boomer (Nest Audio),
    Infopanel, Sleep Monitor (Nest Hub-ok)
  - 5 Cast Group: All Speakers ×2, All plus one, Hubs, Livingroom Speakers
  Note: "Sleep Monitor" Nest Hub a sleep-system.md context-jébe illik.

  Új open question parkolva: Q-wear-5 — IoT fake device (Smart Home
  Cloud-to-cloud) routine-trigger hídként; mély research a cast-notifier
  V1-V3 lezárása UTÁN.

  Várakozik: user-döntés melyik hangszórón legyen az első notify smoke teszt.

  2026-05-07 18:50 — cast-notifier PoC felépítve a root-ban.
  Stack: Node + TypeScript (tsx) + castv2-client + bonjour-service +
  Translate TTS REST + beépített http server. ~400 LoC, FOSS only, 0 Ft.
  Struktúra: src/{index,notify,tts,server,discover,cast,envelope}.ts +
  castv2-client.d.ts type-shim. JSON envelope az fo CLI mintáját követi.
  pnpm install ✅, typecheck ✅. Discovery futott (6s timeout), 0 device
  found — várhatóan a hangszórók nem voltak elérhetők vagy mDNS blokkolt.
  User-tesztelésre vár: pnpm discover --pretty mikor a Nest-ek aktívak.

  2026-05-07 18:35 — Google Home research V3 (user push-back: NO PAID +
  build-it-ourselves). Két új univerzális elv rögzítve:
  - current/principles/no-paid-solutions.md
  - current/principles/build-it-ourselves.md
  CLAUDE.md frissítve. Memory feedback rekord-ok mentve.

  Korrekció: az előző szintézis tévesen sugalta hogy nincs ingyenes út.
  Valóság: a Cast protocol-on (FOSS castv2-client / pychromecast) saját
  scripttel megoldható, ~150-300 LoC, my-assistant repo scripts/ alatt,
  zéró cost. gTTS magyar (robotikus de érthető) V1-re elég, Coqui XTTS v2
  V2-re upgrade. Az FR fájl konkrét táblázattal + flow vázlattal frissítve.

  2026-05-07 18:10 — Google Home research V2 lezárva (user clarification +
  natív path follow-up). User megerősítette: hardware megvan (klaszternyi
  Nest), Google Assistant 24/7 fut, voice INPUT alacsony prio, scope = output.
  Új research: Google natív path-ok (Calendar/Reminders/Tasks/Routines/
  Family Bell/Broadcast) — verdict ❌ EGYIK SEM ad programatikusan triggerelhető
  spoken announcement-et. Calendar event = csak LED flash. Reminders = nincs
  REST API. Routines = statikus + manuál setup, nincs server SDK.
  → Végső ajánlás: Phase 0 (manuális fix recurring routine-ok, ingyen) +
  Phase 1 (Home Assistant + Nabu Casa Azure HU TTS + webhook, ~$6.5/hó, 1 nap).
  5 user-döntés vár az FR fájl végén.

  2026-05-07 17:50 — Google Home research V1. Output:
  current/feature-requests/google-home-integration.md (3 párhuzamos research
  agent kombinált eredménye: hivatalos API landscape + TTS push megoldások +
  voice command path-ok). Fő conclusionök:
  - 🏆 PRIMARY recommendation: Home Assistant + Nabu Casa Cloud TTS
    (Azure hu-HU-TamasNeural) + webhook trigger my-assistant-ből
  - ❌ Voice INPUT magyarul Google Home-on NEM praktikus 2026-ban
    (Nest nem érti a magyart, Gemini for Home expansion sem hozza)
  - ⚠️ Google Assistant 2026-03-tól kivezetve, Gemini for Home váltja —
    landscape unstable, az ajánlott stack erre figyel
  - 6 open kérdés a fájl végén (van-e már Nest hangszóró, HA futás, költség, stb.)

  Open kérdések / nyitott szálak:
  - Mikor migráljuk a recurring-tasks szabályokat organizer-be? (most lokál szöveg)
  - Stock-rendszer: első konkrét item-eket mikor kezdjük felvenni?
  - Google Home: user-döntés a 6 nyitott kérdésre az FR fájl végén,
    utána implementációs terv készíthető
  - Google Home research task (org:task:69fca4a9d440d3f484cedf05) description-je
    organizer-ben még a régi rövid szöveg — frissíteni érdemes user-jóváhagyással
    az FR fájlra mutató pointerre (organizer-partial → write-confirm kell)
```

## Állapot átmenetek

- `idle` → új flow indítható (lásd `WORKFLOW.md` belépési pontok)
- `flow-active` → `active_flow` és `active_phase` ki van töltve
- `awaiting-input` → `USER_INPUT.md`-ben várok `[NEW]` blokkra
- `awaiting-approval` → user jóváhagyásra várok valamit (plan, action)
- `paused` → manuálisan szüneteltetve

## Mezők

| Mező | Típus | Leírás |
|---|---|---|
| `state` | enum | `idle` / `flow-active` / `awaiting-input` / `awaiting-approval` / `paused` |
| `active_flow` | string\|null | Pl. `recurring/daily-review`, `on-demand/month-closing` |
| `active_phase` | string\|null | A flow aktuális fázisa (`_intake`, `_subflow-1-...`, `_close`) |
| `last_event` | ISO timestamp | Utolsó esemény ideje |
| `last_event_type` | string | Pl. `user-input`, `flow-start`, `flow-complete`, `bootstrap` |
| `active_plans` | array | Aktív terv-fájlok listája (`plans/` alól) |
