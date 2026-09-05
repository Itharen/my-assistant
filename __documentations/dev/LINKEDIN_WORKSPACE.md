# LinkedIn guided manual-send workspace

## What this capability does

`npm start` brings up My Assistant and opens `http://127.0.0.1:39245/linkedin`. The page reads the same local
LinkedIn cache and drafts as `ma linkedin`, so every agent and the human UI see one consistent state. The optional
`My Assistant Companion` Chrome extension opens that page in Chrome's Side Panel while the real
`https://www.linkedin.com/messaging/` remains a normal top-level LinkedIn tab.

The extension and UI do **not** read or manipulate LinkedIn's DOM, paste text, attach the CV, click Send or claim a
delivery receipt. The owner performs those steps in LinkedIn. The local `manual-send-reported` status means only
that the owner clicked the native Send action and reported it locally.

## Architecture and trust boundary

```text
ma linkedin official read-only API
          │
          ▼
%USERPROFILE%/.config/my-assistant/linkedin/cache.json
          │ one canonical store
          ├── server /api/linkedin/* ── Angular /linkedin workspace
          │                                   ▲
          │                                   │ iframe: own localhost only
          └────────────────────────── Chrome Side Panel shell
                                              │
My Assistant localhost click ── loopback-only content script ── service worker
                                              │
                                              └── opens normal LinkedIn messaging tab
```

Manifest permissions are deliberately limited to `sidePanel`, `tabs`, and the two exact loopback origins on port
39245. There is no LinkedIn host permission and no LinkedIn content script. A manifest `key` pins the unpacked
extension ID to `amdkdmdajbhlhfgacbodpnlkjjfioclm`; only that exact extension origin may frame the dedicated
`/linkedin?surface=sidepanel` response. Ordinary My Assistant routes retain `X-Frame-Options: SAMEORIGIN`.

## First setup

1. From the repository root, build the extension:

   ```powershell
   pnpm run build-browser-extension
   ```

2. In Chrome open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select:

   ```text
   E:\Programming\Own\CURSOR\LIVE-projects\my-assistant\browser-extension
   ```

3. Keep the extension enabled. It uses the current Chrome profile and therefore the owner's existing LinkedIn
   login. It stores no LinkedIn password, cookie or token. Chrome should show extension ID
   `amdkdmdajbhlhfgacbodpnlkjjfioclm`; a different ID means the checked-in manifest was not loaded.

4. Start the capability:

   ```powershell
   npm start
   ```

   The launcher is idempotent: if `/api/healthz` is already healthy it reuses the running app. Otherwise it starts
   the canonical LDP, waits for a fresh stable `serverRunning` state with no restart pending, then waits for the
   event-driven HTTP-listening log marker, verifies health once, and opens `/linkedin`.

Agent/headless start without opening a browser:

```powershell
npm run start:agent
```

Dashboard instead of LinkedIn workspace:

```powershell
npm run start:dashboard
```

## Daily workflow

1. The agent refreshes official local data when needed:

   ```powershell
   ma linkedin doctor --pretty
   ma linkedin inbox sync --pretty
   ```

2. Open My Assistant and choose the default **Válaszra vár / 3 hónap** view. Pagination is explicit; use
   **Következő** until the control is disabled if the full result set is needed.
3. Select a conversation and review the complete cached thread.
4. Prepare or adjust the draft and choose **Mentés és másolás**. Clipboard denial is non-destructive: the text
   remains visible and persisted for manual selection/copy.
5. Open the real LinkedIn tab. Pick the matching conversation, paste and verify the message.
6. For an opportunity, choose the current CV file and attach it. The profile is not treated as a downloadable CV.
7. Click LinkedIn's native Send button yourself.
8. Back in My Assistant, explicitly choose either **CV attached** or **CV not required**, then use
   **Kézzel elküldtem…** and the second confirmation. This records an owner report, not delivery proof.
9. A later official inbox sync can independently show a matching outbound message; until then the local status
   must remain described as self-reported.

## UI/API contract

All endpoints enforce the actual socket remote address as loopback and return message content only when the user
opens a specific thread. Forwarded headers cannot turn a LAN request into a local request.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/linkedin/inbox?filter=needs-reply&sinceDays=90&offset=0&limit=12` | paged summaries, no bodies |
| GET | `/api/linkedin/thread?threadId=...` | explicit thread bodies + drafts |
| POST | `/api/linkedin/draft` | create a local draft |
| POST | `/api/linkedin/draft/status` | `copied`, `discarded`, or `manual-send-reported` |

The UI's “Helyi lista frissítése” reloads the cache; it does not call LinkedIn. Live sync stays an explicit
`ma linkedin inbox sync` action so external API activity is visible and agent-neutral.

## Startup diagnostics

If startup fails, inspect:

```powershell
dc ldp-status
Get-Content -Tail 200 .\logs\live-dev-pipeline\output.log
```

The launcher never loops HTTP health checks. It checks once before launch, waits on filesystem status and runtime-
log change events, then verifies health once after the HTTP server reports its listening state.

If the side panel says My Assistant is offline, start the app and click **Újrapróbálás**. The panel does not poll in
the background. If the page says the companion is absent, rebuild the extension and press **Reload** on
`chrome://extensions`; the normal LinkedIn-tab fallback remains available.

## Verification

```powershell
pnpm run typecheck-browser-extension
pnpm run test-browser-extension
pnpm run test-startup
pnpm run typecheck-server
pnpm run test-server
cd client
npx ngc -p tsconfig.app.json
pnpm test
```

The LI-J07 journey carries an actual temporary cached thread through inbox selection, thread read, draft creation,
extension handoff, copied status, manual owner report, restart/resume readback and cleanup. Its restricted-side-
panel variant proves the local draft survives a failed browser handoff.

## Change safety checklist

Any later extension/workspace change must retain all of these gates:

- no LinkedIn host permission or LinkedIn content script;
- the manifest key, pinned extension ID and exact `frame-ancestors` origin stay in sync;
- only `?surface=sidepanel` may drop `X-Frame-Options`; ordinary routes must retain `SAMEORIGIN`;
- no automated paste, attachment or Send interaction;
- no message body/thread identifier in action logs;
- no first-page-only assumption: `nextOffset` is followed to `null`;
- no “sent” claim for `copied` or `manual-send-reported`;
- extension-absent and app-offline recovery remain usable;
- `browser-extension` build/test and LI-J07 stay in the normal root/LDP gates.
