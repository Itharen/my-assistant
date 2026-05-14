# Cycle 27 — 2026-05-14

**Branch:** main
**Trigger:** plan-folytatás — `error-handling-cleanup.plan.md` Phase 2

## Outcome

**Error-handling cleanup Phase 2 SHIPPED** — `cli/src/cast/` 14 csendes
swallow-ja kategorizálva + tisztítva. Új `safeCall(fn, label)` helper a
teardown-pontokra (11 hely), strukturált `MA-CAST-*` action-log codes a
config-load swallowokra (3 hely).

## Fázis-flow

- **00-orient** → cycle 26→27, aktív plan Phase 2
- **02-audit** → LDP 10/10 ✅, `grep` confirms 14 cast/ swallow + 3 google/spotify
- **04-investigate** → minden swallow kategorizálva:
  - 11 teardown (cleanup paths — `client.close()`, `browser.stop()`, `bonjour.destroy()`, `tts.close()`)
  - 3 config-load (JSON parse fallback)
- **06-implement** →
  - Új helper `cli/src/cast/internal/safe-call.ts` — `MA-CAST-TEARDOWN-NONFATAL` action-log `note`
  - `cast-client.ts`: 5× `safeCall(() => client.close(), 'cast-client.close')`
  - `volume.ts`: 3× `safeCall(..., 'volume.client.close')`
  - `discover.ts`: 2× `safeCall(..., 'mdns.browser.stop' / 'mdns.bonjour.destroy')`
  - `tts.ts`: 1× `safeCall(..., 'msedge-tts.close')`
  - `groups.ts:35`: `MA-CAST-GROUPS-PARSE-FAIL` action-log + fallback `{}`
  - `presets.ts:52`: `MA-CAST-PRESETS-PARSE-FAIL` action-log + fallback `{}`
  - `presets.ts:65`: ENOENT distinguish (first-run silent OK) vs `MA-CAST-PRESETS-READ-FAIL` log
- **08-verify-local** → LDP 10/10, cli-test 26/26 változatlan
- **10-commit-push** → `<pending>`

## Bus state után cycle 27

- AGB-2026-05-14-02 (Phase 2 announcement) → új **OPEN** dev-agent→chat

## Build/test eredmény

- **LDP:** 10/10 ✅
- **cli-test:** 26/26 (változatlan, refactor)
- **Build status:** success
- **Test status:** success

## Open follow-ups

- Phase 3 (google/spotify 3 swallow) — következő cycle
- Phase 4 (server-side `runtime-error-api` FR #3b) — külön plan + green-light

## Stats

- **Files:** 10 (1 új helper + 6 mod + AGB + STATUS + cycle-md)
- **Build:** success
- **Test:** success
