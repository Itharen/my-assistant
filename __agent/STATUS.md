# STATUS

## 🎉 EGY belépési pont: `dc ldp` — alatta minden figyelő él — 2026-09-07

**Owner-elv (új):** *„amúgy is ez kéne legyen az alap/default LDP működés… Azt a jelenlétfigyelőt
is vagy integrálni kéne a My Assistant szerverbe, vagy neki kéne indítania."*
⇒ `current/principles/ldp-default-runtime.md`.

```
dc ldp  →  szerver  →  Discord-figyelő  +  Jelenlét-figyelő
```

- **`PresenceMonitor_Service` (új)** — a szerver futtatja és felügyeli a `logger.ps1`-et.
  A Win32-es mérést NEM írtuk újra; az ütemezett feladat innentől **tartalék**.
- **`SupervisedChild` (új, közös váz)** — a felügyelet (lassuló újraindítás, kimenet-megőrzés,
  „fut-e már máshol?") egy helyen, mert most már **két** felügyelt gyermek van.
- **LDP-blokkoló feloldva** — a duplikált `getImageUrl` **összevonva** (nem választva).
  A teljes kör **1370 mp, minden lépés zöld**.
- **Teszt:** CLI **345/345**, szerver **28/28**.

✅ **ÉLŐBEN IGAZOLT (2026-09-07 01:30):** a szervert az LDP indította, az pedig **magától
elindította mindkét figyelőt** — a `Jelenlét-figyelő elindítva (pid=267292)` bejegyzés a
napló szerint a `supervised-child.start`-ból jött. Reggel 06:26-kor a `ma comm doctor`
**10 zöld / 0 hibás**; a 112 napja piros jelenlét-sor **zöld lett**.

⏳ **Owner-műveletre vár:** ❓ a nyitott kérdések **H) I) J) K)** szekciói — kiemelten a
**képesség-jóváhagyások** (J1/J2) és az **időbeosztás 8 preferenciája** (I1–I8).
*(A jelenlét-figyelő élesítése MÁR NEM owner-lépés — a szerver csinálja.)*

---

## 🎉 A Discord-csatorna ÖNMŰKÖDŐ — a szerver a gazda — 2026-09-06 (este)

**A figyelő gazdája mostantól a `my-assistant` szerver** (owner-kérés). Nincs külön indítandó
folyamat: ha a szerver fut, a csatorna él. A szerver a figyelőt gyermek-folyamatként futtatja,
összeomlás után **újraindítja**, és a gyermek utolsó kimeneti sorait a hiba-bejegyzésbe teszi.

🔴 **Közben kiderült egy kritikus, csendes hiba:** a figyelő eddig **csak gyűjtött** — a köteg
átadásához kézzel kellett `ma comm flush`-t futtatni. Vagyis futó figyelő mellett is a
köteg-fájlban álltak volna az üzenetek. **Javítva: a kiküldés automatikus, 15 mp-enként.**

⌨️ **Új: „gépel…" visszajelzés** a Discordon, amíg van várakozó üzenet vagy válasz-tartozás —
7 mp-enként frissül, 15 perc után biztonsági szeleppel leáll.

✅ **Élő igazolás 22:33-kor:** szerver indul → figyelőt indít → a 2 kimaradt üzenet
**automatikusan** átment a CC sessionbe, emberi beavatkozás nélkül. **344/344 CLI-teszt zöld.**

⚠️ **Az LDP jelenleg NEM tud végigfutni:** a `cli/src/interfood/interfood.api-client.ts`-ben két
`getImageUrl` van (TS2393 — másik session commitolatlan munkája), a `tsc-cli` lépés pedig `fatal`.
Ezért a szervert most közvetlenül indítottuk. **Owner-döntésre vár.**

⏳ **Owner-műveletre vár:** ① `pwsh -File scripts/install-autostart.ps1 -Mode apply` (jelenlét-figyelő
→ enélkül a hangszóró tiltva marad; egyben tartalék Discord-figyelő) · ② döntés a törött
`interfood.api-client.ts`-ről (ez blokkolja az LDP-t) · ❓ **7 kérdés**: `current/open-questions.md` H).

---

## Kommunikációs csatorna — a DISCORD ÉLŐBEN MŰKÖDIK, mindkét irányban — 2026-09-06

A Discord kétirányú csatorna hyperplanjának (`HP-DSC-001`) minden olyan darabja elkészült, ami nem
igényel owner-műveletet. Megépült és élőben igazolt: **CC session-önazonosítás** (`ma ccap whoami`),
**Discord-kötegelő** (N üzenet → EGY prompt a CCAP hivatalos `prompt` végpontján), **Discord-figyelő**
(`ma comm listen`, csak az owner üzenetei, visszhang-hurok kizárva), **életjel + életjel-ellenőrzés**
(a `doctor` megmondja, hogy a figyelő tényleg FUT-e), **hangszórós kapu** (`ma cast notify` csak
ÉBREN + ITTHON; ismeretlen ⇒ tilt), **csatorna-diagnosztika** (`ma comm doctor`), **státusz-kivonat**
(`ma status digest`) és az **Assistant-tick száraz futása** (`ma tick plan`, Daytime/Nighttime az
ébrenléthez kötve). **78 teszt zöld** *(a Discord/comm rész; a teljes CLI-suite azóta 344 zöld)*.

A `core-review-until-clean` kapu **MINDKÉT szakaszra teljesült**: 1. szakasz **8 kör / 11 javítás**,
a figyelő **7 kör / 10 javítás** — mindkettőnél az utolsó **kettő tiszta**. A legsúlyosabb megtalált hibák:
a státusz-kivonat **nem lapozott** (131 feladatból 10-et látott) · a hangszórós kapu **összeomlott
volna** olvasási hibánál · egy **naplózási hiba megölte volna a figyelőt** · a figyelőnek **nem volt
életjele**, tehát csendben elhalhatott volna.

✅ **2026-09-06 este: a Discord-csatorna ÉLŐBEN IGAZOLT.** A bot `Honnie#6234` néven csatlakozik
(csak a bot-tokennel — se Client Secret, se OAuth-link). Az owner üzenete végigment a teljes láncon
a CC sessionig, és a válasz vissza is ment Discordra (`ma comm say`).

⏳ **Owner-műveletre vár:** ① ~~Discord bot-token~~ **KÉSZ** ·
② `pwsh -File scripts/install-autostart.ps1 -Mode apply` (enélkül a hangszóró tiltva marad) ·
③ döntés a `cli/src/interfood/interfood.api-client.ts` duplikált metódusáról (idegen félkész munka,
a teljes CLI-buildet blokkolja). ❓ **7 kérdés** vár válaszra: `current/open-questions.md` H) szekció.

Kanonikus: `__agent/plans/discord-two-way-hyperplan/hyperplan.plan.md` · állapot:
`__agent/CONTINUATION.md` · szabályok: `__agent/flows/recurring/hourly-assistant-tick/README.md` ·
beállítás: `__documentations/dev/DISCORD_BOT_SETUP.md`.


## Kommunikációs csatorna — Discord az első kör, Cast élőben igazolva — 2026-09-06

Owner-döntés: a **Discord** az első köri kommunikációs csatorna, **két iránnyal** — üzenetküldés
ÉS az owner válaszainak olvasása. Mért megállapítás: a meglévő webhook-alapú megoldás **egyirányú**,
a válaszok olvasására alkalmatlan → ahhoz Discord-**bot** kell; kész minta a `ccap-revisioned`
`discord-toolkit` moduljában. A Google Home / Cast csatorna **élőben igazolt** ma 12:14-kor
(`ma cast notify ok`, 36 679 ms, 6 hangszóró, nulla hiba). A telefonos push (ntfy) és a Discord
handler egyaránt **kész kódban, de beállítás híján sosem élesedett**.

⏳ **Owner-feladat, ez blokkolja az első kört:** Discord-csatorna + webhook-cím → `MA_DISCORD_WEBHOOK_URL`
(+ opcionálisan `MA_DISCORD_USER_ID` a ping-hez), majd a bot-token az olvasás-irányhoz.

Kanonikus: `__documentations/developments/2026-09-06-communication-channel-analysis-and-cast-live-test.md`
· FR: `current/feature-requests/discord-webhook-notification.md`.


## Interfood W37 cart draft applied — 2026-09-05

Az owner által jóváhagyott W37 review v6 teljes kosárdraftja alkalmazva és authoritative readbackkel ellenőrizve:
10 sor / 10 adag / 19 500 HUF, napi két főétel. A friss order sync szerint W37-re előtte nem volt leadott rendelés;
a kiinduló kosár üres volt. A reconcile utáni és a külön megismételt diff is pontos egyezést, nulla további effektet
adott. Checkout/rendelésleadás nem történt. A hétfői két Last Minute tétel véglegesítése nem lemondható, ezért ahhoz
új élő inventory-read és külön közvetlen owner-megerősítés kell. Kanonikus receipt:
`current/interfood/proposals/2026-W37-cart-receipt-1.md`.

## LinkedIn vezetett kézi küldési munkamód — 2026-09-05

A `/linkedin` inbox/thread/draft felület, a külön MV3 Chrome Side Panel companion és a health-gated TypeScript
indító elkészült. A tényleges LinkedIn-küldés és CV-csatolás továbbra is owner-művelet a LinkedIn natív lapján;
`manual-send-reported` kizárólag helyi owner-jelentés. Kanonikus runbook:
`__documentations/dev/LINKEDIN_WORKSPACE.md`. MP-LI-06 lezárva: a tiszta cold start és az idempotens újrahívás
élőben zöld; a szerver csak a stabil-ID-jű saját extension számára és csak a side-panel nézetet engedi frame-elni.

## Új heti feladat — 2026-09-03

LinkedIn-posztolás: `org:task:6a98e83e482367e7f640c1d4`; heti (7 napos) ismétlődési
minta elmentve. Nap/időpont és első esedékesség megerősítésére vár, emiatt még nincs
időzített példány vagy aktív külön emlékeztető. Külön a blokkolt LinkedIn-üzenetküldéstől.
Részletek: `current/tasks/inbox.md`, `current/principles/recurring-tasks.md`.

## Feladatállapot — owner-frissítés, 2026-09-02

- Tesco átvétel és készletre vétel: kész; augusztus 27-i dokumentáció alapján az Organizer-task szeptember 2-án lezárva.
- LinkedIn teljes üzenetkezelés: blokkolt, mert olvasás/fogadás működik, személyes üzenetküldés nem.
  Hivatalos partnerhozzáférési kutatás és még el nem küldött angol megkeresés elkészült 2026-09-02-án:
  `__documentations/developments/2026-09-02-linkedin-messaging-access-research.md`. Compliance felvétel zárt;
  más program/jogosultság tisztázása Developer Supporttal javasolt, nem igazolt hozzáférés.
- Munka: folyamatban, a user most többnyire ezzel foglalkozott; a kedd/csütörtök sorozat változatlan, nincs egyedi példány készre jelentve.
- Interfood setup: folyamatban; a fejlesztési terv és a lent rögzített jóváhagyási kapuk változatlanok.
- Új zenei előadói történetszál: Suno-generált zenék fontos témákról; artist-rebrand lezárása után helyenkénti tisztítás, normalizálás és újrafeltöltés. A rebrand készültsége megerősítendő.
- Organizer-refek és részletek: `current/tasks/inbox.md`. Zenei task: `org:task:6a982b8de7e7e729f544b6b7`.

## Fejlesztési flow snapshot

```yaml
state: awaiting-approval
active_flow: interfood-integration-hyperplan
active_phase: live-calibration
last_event: 2026-09-05T23:26:14+02:00
last_event_type: interfood-w37-cart-reconcile-applied-and-read-back
next_action: "A kosárdraft pontosan összeállt. Checkout előtt friss cart + Last Minute readback és külön közvetlen owner-megerősítés kell, mert a hétfői Last Minute tételek végleges megrendelése nem lemondható. A live removal/cleanup mutációs láb továbbra sincs külön canaryval hitelesítve; a kívánt kosarat emiatt most nem bontjuk vissza."

active_plans:
  - "__agent/plans/interfood-integration-hyperplan/hyperplan.plan.md"  # HP-IF-001 — implementation complete, live calibration pending
  - "__agent/plans/linkedin-integration-hyperplan/hyperplan.plan.md"  # HP-LI-001 — planning + execution in progress
  - "__agent/plans/browser-workflow-hyperplan/hyperplan.plan.md"  # HP-BRW-001 — execution in progress
  - "__agent/plans/assistant-agent-cron.plan.md"  # ex-"A-mode" — Phase 1 MVP shipped
  - "__agent/plans/assistant-agent-automation-scripts.plan.md"  # ex-"B-mode" — v1 plan, NEM épült
  - "__agent/plans/development-agent.plan.md"  # 🆕 v1 vázlat, Phase 1 user-OK-ra vár
  - "__agent/plans/two-agent-system.plan.md"  # felülírja a system-components.md kanonikus névvel
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
