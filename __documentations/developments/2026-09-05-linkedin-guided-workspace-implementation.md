# LinkedIn guided manual-send workspace — implementation record

**Date:** 2026-09-05
**Plan:** `__agent/plans/linkedin-integration-hyperplan/master-plans/mp-06-guided-manual-send-workspace.plan.md`
**User outcome:** keep LinkedIn's real messaging UI as the send surface while My Assistant provides the adjacent
message-review, draft and checklist workspace.

## Delivered architecture

1. `npm start` runs a TypeScript launcher. It reuses a healthy server or starts the canonical LDP headlessly,
   waits on LDP filesystem state, verifies `GET /api/healthz`, and only then opens `/linkedin`.
2. The Angular `/linkedin` route provides a 90-day `needs-reply` inbox, explicit pagination, complete local thread
   reading, persisted drafts, clipboard copy, a CV checkpoint and a two-step owner-reported manual-send state.
3. The server reuses the existing `LinkedInStore` and analyzer instead of introducing a second LinkedIn cache.
   The new message-content endpoints enforce loopback access using the actual socket remote address.
4. The independently loadable MV3 `My Assistant Companion` extension opens Chrome Side Panel and the real
   `https://www.linkedin.com/messaging/` page after an explicit user click. Its content script exists only on the
   two My Assistant loopback origins; the extension has no LinkedIn host permission and never reads or modifies
   LinkedIn DOM.
5. The side-panel shell embeds only the own `/linkedin?surface=sidepanel` page. Offline state shows `npm start` and
   offers a user-triggered retry; there is no background HTTP polling.

## Truthful send boundary

- Draft save and `copied` are local state transitions.
- `manual-send-reported` means only that the owner reported pressing LinkedIn's native Send button.
- There is no API delivery receipt and the UI, DTO and logs never claim one.
- CV attachment remains an explicit owner action in LinkedIn; the local checkpoint prevents accidental completion
  acknowledgement before the owner chooses “attached” or “not required”.

## Reliability and security fixes discovered during rollout

- The first detached Windows `.cmd` launch failed with `spawn EINVAL`; the launcher now delegates through hidden
  `cmd.exe` while remaining a TypeScript entry point.
- The first launcher could accept an LDP server that already had a restart pending. `isPipelineReady` now refuses
  that transitional state.
- The existing client referenced `/api/healthz`, but the server had no such endpoint. A real minimal liveness route
  was added, so startup is based on HTTP evidence instead of a process name.
- CLI e-mail lifecycle specs inherited the owner's Gmail provider from `.env`; the fixture now explicitly declares
  `imap-smtp` and restores the environment afterward.
- Raw LDP `eslint` resolved a global incompatible ESLint. The pipeline now calls each package's checked-in local
  `.cmd` shim and reports zero lint errors (the repository's existing warning backlog remains visible).
- LinkedIn workspace routes now reject LAN/wildcard/spoof-like source addresses with a stable 403 code.
- LDP marked `serverRunning` about 13 seconds before the HTTP listener was actually ready. The launcher now waits
  for the runtime log's listening event before making its single post-start health request; the clean cold start
  then completed successfully.
- The first live route check exposed `X-Frame-Options: SAMEORIGIN` on the side-panel iframe. The extension now has
  a stable manifest key/ID, and a pre-static middleware relaxes framing only for `?surface=sidepanel` and only to
  that exact `chrome-extension://` origin. Normal routes retain the default protection.

## Automated evidence

- CLI: 244 specs, 0 failures.
- Server: 22 specs, 0 failures, including loopback guard, health route and scoped frame-policy contracts.
- Angular: 130 browser specs, 0 failures; the 4 targeted LinkedIn bridge/component safety specs are green;
  production build green.
- Companion extension: build/typecheck green; 5 permission/service-worker contract tests, 0 failures.
- Startup + LI-J07 state-carrying journey: 8 tests, 0 failures, including runtime-readiness, restart-pending and
  restricted-panel variants.
- LI-J07 carries one created thread/draft through read → draft → panel handoff → copy → owner report → persisted
  resume and cleans the temporary cache.

## Operational entry points

```powershell
npm start
npm run start:agent
npm run start:dashboard
```

One-time Chrome setup uses `chrome://extensions` → Developer mode → Load unpacked and selects
`browser-extension/`. Daily operation does not require reinstalling the extension. The canonical runbook is
`__documentations/dev/LINKEDIN_WORKSPACE.md`.

## Live smoke evidence

Recorded after the final pipeline and runtime verification; no message body or participant identifier is written
to this document.

- Final clean `npm run start:agent -- --timeout-ms 900000`: success in 128,227 ms from the launcher; the LDP
  itself completed in 112.7 seconds and returned healthy `http://127.0.0.1:39245/linkedin` without opening a browser.
- Immediate second invocation: success in 97 ms, proving running-server reuse.
- Live health and `/linkedin`: HTTP 200; application response 55,764 bytes.
- Live 90-day `needs-reply` page: HTTP/API success, 12 summaries, `nextOffset: null`; no content or identifiers
  were printed by the smoke script.
- Built MV3 companion: required files present; permissions exactly `sidePanel`, `tabs`; host permissions only the
  two loopback origins; no LinkedIn host permission.
- Scoped frame-policy verification is repeated after the final rebuild: ordinary `/linkedin` keeps
  `SAMEORIGIN`; `?surface=sidepanel` removes it and emits the pinned extension `frame-ancestors` CSP. Deriving the
  Chrome ID from the checked-in manifest key yields the same `amdkdmdajbhlhfgacbodpnlkjjfioclm` value.
