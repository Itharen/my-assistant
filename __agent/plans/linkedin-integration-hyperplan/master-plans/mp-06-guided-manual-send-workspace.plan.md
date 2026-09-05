# MASTERPLAN — MP-LI-06 Guided manual-send workspace

**Status:** complete — 2026-09-05
**Owner approval:** 2026-09-05 — “nagyon-nagyon alaposan tervezd meg és fejleszd le”
**Parent:** `../hyperplan.plan.md`

## Outcome

One user-owned Chrome window can show the real LinkedIn messaging page as the main tab and a compact My Assistant
review/draft surface in Chrome's Side Panel. My Assistant starts deterministically, exposes only loopback APIs, and
keeps the actual LinkedIn send and CV attachment as explicit owner actions in LinkedIn's native UI.

## Non-negotiable boundaries

- No iframe, proxy or mirrored LinkedIn page.
- No LinkedIn host permission, content script, DOM read, form fill, overlay or send automation in the extension.
- The extension content script runs only on the My Assistant loopback origin and only relays an explicit user click.
- “Kézzel elküldtem” is a local owner report, not an API delivery receipt.
- Message content stays in the existing user-local LinkedIn cache and loopback response; logs remain content-free.
- The app remains usable without the extension: it opens the native LinkedIn messaging page in a normal tab and
  gives a precise installation/recovery message.

## Direct children

| Subplan | Weight | Deliverable | Gate |
|---|---:|---|---|
| SP-LI-06-1 | 1 | Loopback workspace API + shared draft lifecycle | server tests |
| SP-LI-06-2 | 1 | Responsive Angular inbox/thread/draft workspace | client tests + UX QA |
| SP-LI-06-3 | 1 | MV3 Chrome Side Panel extension + app bridge | permission contract + extension tests |
| SP-LI-06-4 | 1 | Idempotent startup, user journey, docs and live smoke | startup health + LI-J07 |

## Ordered execution

1. Freeze DTOs and no-send/manual-ack semantics.
2. Implement server endpoints over the existing CLI cache/analyzer; do not fork LinkedIn storage logic.
3. Implement the Angular workspace with paging, filters, thread selection, editable draft, clipboard and manual ack.
4. Implement the minimal extension and bridge, then connect the UI launch action.
5. Make root startup health-gated and ensure the extension is built by the normal pipeline.
6. Run unit, integration and serial journey tests; then live local startup and naive-user visual QA.
7. Update all affected runbooks, architecture/tooling docs, action log and FAM; perform two clean review passes.

## Failure/recovery design

- Cache absent/corrupt: API returns a structured, actionable error and UI retains a visible recovery panel.
- Server offline: side panel shows the exact startup command and a user-triggered retry; no background polling.
- Extension absent: UI uses a synchronous native LinkedIn tab fallback and explains how to load the unpacked build.
- Extension rejects/throws: LinkedIn remains available; UI reports bridge diagnostics without claiming side-panel success.
- Clipboard denied: draft remains visible/selectable and can be copied manually.
- Restart during draft work: persisted cache/draft is reused; no volatile-only message state is claimed durable.

## Completion evidence

- Every subplan complete with file/test evidence.
- LI-J07 happy path plus already-running, offline/recovery, extension-absent and permission-restricted variants green.
- Manifest audit proves zero LinkedIn host permission and zero code path that touches LinkedIn DOM.
- Production client build, server/CLI typecheck/tests and extension build/tests green.
- Local `/api/healthz`, `/linkedin`, side-panel shell and bridge handshake smoke evidence recorded without PII.

All four subplans and the LI-J07 automated variants are green. A clean launcher run returned a healthy live
workspace, and an immediate second run reused it. The one-time unpacked-extension load remains an operator setup
step documented in the runbook, not an implementation gate.
