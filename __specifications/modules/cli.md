# Modul: `cli/` — `@my-assistant/cli` (`ma`)

**Pattern partner:** `LIVE-projects/organizer-cli/cli/`
**Implementációs referencia:** `__documentations/ARCHITECTURE.md` 1. szakasz + [`cli/README.md`](../../cli/README.md).

---

## 1. Cél

Egységes CLI a my-assistant ecosystem-hez. Két fő felelősség:

1. **Cast-domain operations** (`ma cast …`) — Google Home / Nest hangszórók discovery, TTS push, volume orchestration, preset menedzsment
2. **Spotify integration** (`ma spotify …`) — OAuth setup és playback diagnosztika

Plus a `cli/scripts/` mappában szerkesztetlen helper scriptek (PS és TS), amik **organizatórikusan** a CLI-hez tartoznak (deprecated DEPRECATED-jelölve, action-log writer trio + agent-handlers dispatcher).

## 2. Két-szintű parancs-fa

```
ma cast    {discover, notify, volume, preset, list-interfaces}
ma spotify {auth, status}
```

Bővítendő: `ma server` és `ma actions` shortcut-ok (BACKLOG).

## 3. Funkcionális elvárások

### 3.1 Output formátum

- **Stdout:** JSON envelope `{ ok, action, requestId, elapsedMs, result | error }`. Az `fo` CLI mintát szóról-szóra követi.
- **Stderr:** verbose / progress logok (csak `--verbose` flag-gel). Soha nem szivárog ide JSON.
- **Exit code:** 0 success, 1 hiba (envelope `ok: false`-szal mutatja a részleteket)

### 3.2 Action-log emit

**Minden** `ma <group> <sub>` hívás emit egy `external-action` típusú entry-t a `__agent/log/actions/<today>.jsonl`-be. Hibára `kind: "error"` envelope. Ez a kötelező log-emit szabály a `CLAUDE.md` "Action log" szekciójában van fixálva.

### 3.3 Cast subcommandok

| Subcommand | Mit csinál |
|---|---|
| `discover` | mDNS discovery `_googlecast._tcp` szolgáltatásra, parallel minden non-loopback IPv4 interface-en |
| `list-interfaces` | helyi non-loopback IPv4 interface-ek (debug) |
| `volume --get / --set / --mute / --unmute` | per-device volume olvasás/beállítás receiver-namespace-en |
| `preset --list / --apply / --capture` | nevesített volume-mátrixok karbantartása (`config/volume-presets.json`) |
| `notify --text "..."` | TTS push: SAVE → UP (0.7 default) → PLAY → RESTORE volume + Spotify resume — `current/principles/cast-notifier-defaults.md` szerint |

### 3.4 Spotify subcommandok

| Subcommand | Mit csinál |
|---|---|
| `auth` | Egyszeri OAuth setup (browser-callback `127.0.0.1:9876`), elmenti a `cli/config/spotify.json`-ba (gitignored) |
| `status` | Diagnosztika: config létezik? token érvényes? aktuális playback? device-list? |

### 3.5 Default értékek (KÖTELEZŐ)

- `--target = "All Speakers"` Cast Group (ha létezik)
- `--voice = "hu-HU-TamasNeural"` (mapped from `--lang hu`)
- `--announcement-volume = 0.7` per device
- Group ön-volume-ját **SOHA NEM** állítjuk — csak a tagokat egyenként

Forrás-szabály: `current/principles/cast-notifier-defaults.md`.

## 4. Technikai elvárások

| Tétel | Érték |
|---|---|
| Stack | TypeScript ESM (`type: "module"`), Node 20+ |
| Dev | tsx (build-mentes futás) |
| Build | tsc → `dist/` (rimraf-tal előtte) |
| Tests | Jasmine 5 + c8 (text + lcov + html reporter) |
| CI/CD | `cli/pipeline.cicd.config.json` 7-step FDP minta |
| Bin | `ma` globális — `npm i -g --force` a `cli/`-ből |

## 5. Fájl-struktúra (FDP-shaped)

```
cli/
├── bin/ma.js                        # entry — runs dist/main.js
├── src/
│   ├── main.ts                      # two-level dispatch (group → subcommand)
│   ├── commands/                    # 1 file per subcommand
│   ├── cast/                        # cast-domain helpers
│   ├── spotify/                     # web API client + OAuth flow
│   ├── output/                      # JSON envelope helpers
│   ├── action-log/                  # writer that walks up to find __agent/log/actions/
│   └── utils/                       # parse-args helpers
├── scripts/                         # ★ organizatórikusan ide tartozó helper PS+TS scriptek
│   ├── update-fo.ps1                # global install/update of `fo` CLI
│   ├── action-log/                  # DEPRECATED writer trio (Claude hookok ezt hívják)
│   └── agent-handlers/              # DEPRECATED A-mode dispatcher
├── spec/support/jasmine.json
├── config/                          # runtime data (groups.json, volume-presets.json, spotify.json)
├── pipeline.cicd.config.json
├── package.json
└── tsconfig.json
```

## 6. Kapcsolódó

- Implementációs referencia: `__documentations/ARCHITECTURE.md`
- Pattern audit: `__agent/references/pattern-audit.md` 4. szakasz
- Forrás-FR-ek: `current/feature-requests/google-home-integration.md`, `current/feature-requests/cross-project-notes-ingestion.md`
- Forrás-szabályok: `current/principles/cast-notifier-defaults.md`, `current/principles/{no-paid-solutions,build-it-ourselves}.md`
