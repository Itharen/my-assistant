# `@my-assistant/cli` — `ma`

CLI for the my-assistant ecosystem. **Self-built, FOSS-only.** Two-level command tree:

```
ma cast {discover|notify|volume|preset|list-interfaces}
ma spotify {auth|status}
```

Output: stable JSON envelope (matches the `fo` CLI minta) with `requestId`, `elapsedMs`, `ok|error`. Every invocation is mirrored to `__agent/log/actions/YYYY-MM-DD.jsonl`.

**Forrás-FR-ek:**
- `current/feature-requests/google-home-integration.md`
- `current/principles/cast-notifier-defaults.md`
- `current/principles/no-paid-solutions.md` + `build-it-ourselves.md`

---

## Architektúra

```
cli/
├── bin/ma.js                       # entry — runs dist/main.js
├── src/
│   ├── main.ts                     # two-level dispatch (group → subcommand)
│   ├── commands/                   # 1 fájl per subcommand
│   │   ├── discover.command.ts
│   │   ├── notify.command.ts
│   │   ├── volume.command.ts
│   │   ├── preset.command.ts
│   │   ├── list-interfaces.command.ts
│   │   ├── spotify-auth.command.ts
│   │   └── spotify-status.command.ts
│   ├── cast/                       # Cast protocol domain
│   │   ├── cast-client.ts          # connect/launch/play wrapper around castv2-client
│   │   ├── discover.ts             # mDNS multi-interface discovery
│   │   ├── mp3-server.ts           # ephemeral HTTP server for the TTS buffer
│   │   ├── tts.ts                  # msedge-tts (hu-HU-TamasNeural neural)
│   │   ├── volume.ts               # receiver-namespace volume ops
│   │   ├── groups.ts               # Cast Group → members mapping
│   │   ├── presets.ts              # named volume presets (apply / capture)
│   │   └── notify.orchestrator.ts  # full SAVE→UP→PLAY→RESTORE flow + Spotify
│   ├── spotify/
│   │   ├── spotify.client.ts       # Web API minimal client (token/playback/devices/transfer)
│   │   └── spotify-auth.flow.ts    # one-time OAuth setup (browser callback)
│   ├── output/
│   │   └── envelope.ts             # JSON envelope helpers
│   ├── action-log/
│   │   └── action-log.client.ts    # write to __agent/log/actions/<today>.jsonl
│   └── utils/
│       └── parse-args.helpers.ts   # numericOption / stringOption / parseList / onLogFor
├── spec/support/jasmine.json       # test runner config
├── config/                         # runtime data (groups.json, volume-presets.json, ...)
├── scripts/                        # project-helper scripts (NOT `ma` subcommands)
│   ├── update-fo.ps1               # global install/update of `fo` CLI (organizer-cli helper)
│   ├── action-log/                 # DEPRECATED writer trio (lib.ts + append.ps1 + hook.ps1) — Claude hookok ezt hívják
│   └── agent-handlers/             # DEPRECATED A-mode dispatcher (CCAP runtime hívja)
├── pipeline.cicd.config.json       # FDP CI/CD pipeline
├── package.json
├── tsconfig.json
└── README.md
```

Naming convention követi az organizer-cli mintáját: `*.command.ts` egy-egy CLI subcommand, `*.spec.ts` test files mindenütt mellettük.

---

## Setup

```bash
cd cli
pnpm install
pnpm run build-base
npm i -g --force      # install `ma` globally
ma --help
```

Or in one-shot (matches FDP `build-n-test` pattern):

```bash
pnpm run build-n-test
```

---

## Quick reference

### Cast

```bash
ma cast list-interfaces --pretty
ma cast discover --pretty
ma cast volume --target "BathCom" --get
ma cast volume --target "BathCom" --set 0.4
ma cast notify --text "Ideje lefeküdni" --pretty
ma cast notify --text "halk" --target "Hálószoba" --announcement-volume 0.4
ma cast preset --list
ma cast preset --capture default-evening
ma cast preset --apply default-evening
```

### Spotify

```bash
ma spotify auth                 # one-time OAuth setup
ma spotify status --pretty      # config + token + playback diagnostic
```

### Common flags

| Flag | Hatás |
|---|---|
| `--pretty` | Pretty-print JSON envelope |
| `--verbose` | Progress logok stderr-re |
| `--interface IP` | mDNS interface override (repeatable / comma-list) |
| `--timeout N` | Discovery timeout ms-ben (default 4000) |
| `--host IP` | Direct cast bypassolja a discovery-t |

### Notify defaults

- `--target = "All Speakers"` (Cast Group, ha létezik)
- `--voice = hu-HU-TamasNeural` (mapped from `--lang hu`)
- `--announcement-volume = 0.7` per device
- Volume orchestration: SAVE → UP → PLAY → RESTORE per device (group-szintű volume-ot SOHA nem érintjük)
- Music orchestration (ha van Spotify config): pre-snapshot → play → resume

---

## Tests + coverage

```bash
pnpm test                    # build-base + jasmine
pnpm run test:coverage       # c8 (text + lcov + html reporter)
```

Test-fájlok: `src/**/*.spec.ts` — a build a `dist/` alá fordít, a jasmine onnan futtatja a `*.spec.js`-t.

---

## CI/CD

`pipeline.cicd.config.json` — FDP Overseer pipeline (install → build → test → coverage → discord-notify). Lokálban a `dc cdp` parancs futtatja, push-on automatikusan.

---

## Action log

Minden `ma <group> <sub>` hívás emit egy `external-action` típusú entry-t a `__agent/log/actions/YYYY-MM-DD.jsonl`-be:

```jsonl
{"ts":"2026-05-08T10:15:32+02:00","actor":"cli","kind":"external-action","summary":"ma cast notify invoked","extra":{...}}
{"ts":"2026-05-08T10:15:38+02:00","actor":"cli","kind":"external-action","summary":"ma cast notify ok (5821ms)","extra":{...}}
```

Hibára `kind: "error"` envelope jön. A schema a `__agent/log/actions/README.md`-ben.

---

## Korlátok

- Magyar TTS minőség: `hu-HU-TamasNeural` férfi neural voice (Microsoft Edge Read-Aloud); robosztus, érthető. Coqui XTTS v2 lokál upgrade-re lehet váltani később (`tts.ts` interface ugyanaz).
- TTS szöveg max ~200 karakter (Translate fallback) / ~500 karakter (msedge-tts) — chunking nincs implementálva.
- Cast Group volume-ot SOHA nem írjuk — csak az individual tagokat egyenként (lásd `current/principles/cast-notifier-defaults.md`).
- VLAN / subnet: a script ugyanazon az L2 segmensen kell legyen mint a hangszórók (mDNS link-local). Avahi reflector kell ha eltérő VLAN.
- Multi-room: jelenleg egy hangszóró v. Cast Group / hívás. Cast Group-ot a Google Home appban hozzá lehet adni — onnan mDNS-en már látszik mint device.
- Windows Defender / firewall: első futáskor engedélyezni kell a Node-nak az inbound 0.0.0.0:* portot.

---

## Spotify config

A `config/spotify.json` titkos (refresh token), a `.gitignore`-ban szerepel. Az `ma spotify auth` paranccsal jön létre (egyszer kell, browser-callback). Az `ma cast notify` automatikusan használja: pre-snapshot → resume.

Phase 2-höz tartozó tudnivaló: a Spotify Connect re-register lassú (~3s) miután a Cast device-t más app vette át. A `notify.orchestrator.ts` ezt kezeli: launch Spotify Receiver app on cast target → wait → re-list devices → transfer.

---

## Roadmap

- [x] V1 PoC — TTS push 1 hangszóróra
- [x] Phase 1.5 — multi-interface discovery, volume save/up/restore, group-aware
- [x] Phase 2 — Spotify Web API resume (OAuth dance + transfer playback)
- [x] Folder restructure → cli/ with FDP pattern + tests + CI/CD
- [ ] V3 — Server integration (POST /actions endpoint, replace file-write)
- [ ] V4 — long text chunking (>200 char), queue management
- [ ] V5 — multi-room policy (per-target preference)
- [ ] V6 (low prio) — voice INPUT (HA Voice / Whisper)
