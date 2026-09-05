# SUBPLAN — SP-LI-06-3 Chrome Side Panel

**Status:** complete — 2026-09-05
**Parent:** `../master-plans/mp-06-guided-manual-send-workspace.plan.md`

- [x] Create an independently loadable MV3 extension package with TypeScript source and reproducible build.
- [x] Use only `sidePanel` and `tabs` permissions plus the My Assistant loopback host permission.
- [x] Relay a typed launch request from a loopback-only content script to the service worker.
- [x] Open the own side-panel shell and a normal `https://www.linkedin.com/messaging/` top-level tab.
- [x] Embed only the My Assistant `/linkedin?surface=sidepanel` page in the extension panel.
- [x] Show offline/start/retry guidance without polling.
- [x] Add manifest/bridge/service-worker contract tests, including forged-origin rejection.
