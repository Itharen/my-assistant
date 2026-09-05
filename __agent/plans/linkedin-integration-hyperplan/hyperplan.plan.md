# HYPERPLAN — LinkedIn Personal Inbox + Publishing Integration

**ID:** HP-LI-001
**Status:** in-progress — guided manual-send workspace complete; unread calibration pending
**Created:** 2026-08-26
**Last updated:** 2026-09-05
**Owner:** itharen3@gmail.com
**Coordinator:** My Assistant
**Canonical request:** `current/feature-requests/social-media-integration.md`

## STATUS

**2026-09-02 access research:** owner requested investigation of official personal Messages API admission.
[Research and unsent eligibility enquiry](../../../__documentations/developments/2026-09-02-linkedin-messaging-access-research.md)
identify Developer Support as a routing channel, not an access grant; the Compliance program is closed to new
partners. No application was submitted. This does not reopen send implementation or change the read-only
scope/progress below; unknown eligibility must be resolved with LinkedIn first.

| Direct child | Weight | Progress | Status |
|---|---:|---:|---|
| MP-LI-01 — Access, authority and security | 2 | 2/2 (100%) | ✅ complete |
| MP-LI-02 — API client, snapshot and changelog sync | 3 | 3/3 (100%) | ✅ complete |
| MP-LI-03 — Inbox intelligence, drafts and CLI | 3 | 3/3 (100%) | ✅ complete |
| MP-LI-04 — Automated verification and observability | 2 | 2/2 (100%) | ✅ complete |
| MP-LI-05 — Live onboarding and calibrated rollout | 2 | 1/2 (50%) | ⚠️ unread calibration pending |
| MP-LI-06 — Guided manual-send workspace | 4 | 4/4 (100%) | ✅ complete |
| **Overall** | **16** | **15/16 (94%)** | **guided workspace live; unread calibration pending** |

Planning gate: 2/2 consecutive clean reviews ✅ (structure/traceability; API/security/privacy).

## 1. Outcome

Agent- and vendor-neutral TypeScript CLI capability that can read and synchronize the owner's personal LinkedIn
inbox through LinkedIn's official EEA Member Data Portability APIs, identify unread and unanswered conversations,
and maintain reply drafts. Any AI agent can consume the same JSON envelope through the installed `ma` CLI.

Personal-message sending is operationally unavailable for this app, not merely deferred from the first release.
Member Data Portability is read-only, and the restricted Messages API is not a self-service or currently actionable
route. The tool prepares a draft and a user-facing manual-send handoff, but never automates LinkedIn's web UI or
claims a message was sent. A future, actually granted partner permission would require a separate owner decision
and a new plan; it is not an assumption or delivery promise in this Hyperplan.

## 2. Verified official API ground truth

- Eligibility is based on the LinkedIn profile location being in the EEA or Switzerland.
- App creation must use LinkedIn's `Member Data Portability (Member) Default Company` page.
- Product: `Member Data Portability API (Member)`; documented self token scope:
  `r_dma_portability_self_serve`.
- Historical bootstrap: `GET /rest/memberSnapshotData?q=criteria&domain=INBOX`.
- Snapshot API version is centralized and initially `202312`, the only version documented as accepted.
- Incremental events: `GET /rest/memberChangeLogs?q=memberAndApplication`.
- Changelog retains at most 28 days; LinkedIn recommends hourly reads, `count=10`, maximum `50`.
- The next `startTime` is the latest `processedAt`; the boundary event can repeat and must be idempotently deduped.
- Official message events expose `thread`, `author`, `content`, `deliveredAt`, `readAt`, `resourceId`,
  `activityId`, and recent sibling activities.
- Snapshot `paging.total` is not terminal evidence; follow `next` links and LinkedIn's documented no-data terminal.
- Each snapshot page contains one domain envelope; INBOX records are inside `elements[0].snapshotData`, and `start`
  advances by page number rather than record offset.

Official references:

- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/member-data-portability-member>
- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/member-snapshot-api>
- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/snapshot-domain>
- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/member-changelog-api>
- <https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access>
- <https://www.linkedin.com/legal/l/portability-api-terms>

## 3. Architecture

```text
Any agent / terminal
        |
        v
ma linkedin <command>  -- stable JSON envelope + action log
        |
        +--> EnvironmentVariableSecretProvider --> gitignored root .env (never logged)
        +--> optional FdpKeystoreSecretProvider --> fdp env:pull --stdout
        |
        +--> LinkedInPortabilityClient --> official api.linkedin.com/rest endpoints
        |          |-- memberAuthorizations (self URN + consent state)
        |          |-- memberSnapshotData domain=INBOX (historical bootstrap)
        |          `-- memberChangeLogs (incremental message events)
        |
        +--> LinkedInInboxStore --> user-local restricted state root, atomic replace
        |
        `--> LinkedInInboxAnalyzer --> unread / needsReply / thread context / drafts
```

Default non-repository state root: `%USERPROFILE%/.config/my-assistant/linkedin/`.

The cache is LinkedIn-derived personal data, not a secret and not source-of-truth. It is never committed, never
placed under `current/`, and can be deleted/rebuilt from the official API. OAuth access tokens and application
credentials are not stored in this cache.

## 4. Stable CLI contract

```text
ma linkedin configure          # stores only credential-source and key-name metadata
ma linkedin auth status        # no secret values
ma linkedin doctor             # config + token availability + API + cache diagnostics
ma linkedin inbox bootstrap    # complete historical INBOX snapshot
ma linkedin inbox sync         # incremental changelog merge
ma linkedin inbox list         # paged thread summaries
ma linkedin inbox unread       # authoritative only after live readAt calibration
ma linkedin inbox needs-reply  # deterministic latest-author rule
ma linkedin thread show        # complete locally synchronized thread
ma linkedin reply draft        # body/file input; stores draft, never sends
ma linkedin reply list
ma linkedin cache purge        # explicit confirmation; deletes all derived local LinkedIn data
```

Every command returns `{ok, action, requestId, elapsedMs, result|error}`. Message bodies, participant identifiers,
OAuth material and all credential-provider output are redacted from persistent action logs.

## 5. Data and decision contracts

### 5.1 Normalized message

Stable implementation fields: `id`, `threadId`, `authorId`, `direction`, `content`, `createdAt`, `deliveredAt`,
`readAt`, `deleted`, `source`, `sourceActivityId`, `rawFingerprint`. Cache and calibration use schema `1.0.0`.

No unknown API object is trusted. Parsing is boundary-local, type-guarded and fail-closed with a schema error that
contains endpoint, request ID, page cursor and redacted payload shape.

### 5.2 `needsReply`

`true` exactly when the newest non-deleted message in a thread is inbound and no later outbound message exists.
The classification includes evidence: last message ID, direction, timestamp and rule version.

### 5.3 `unread`

Candidate rule: inbound message with absent `readAt`. It remains `unverified` until live calibration proves that
LinkedIn emits the expected create/update transitions. The CLI must not relabel candidate-unread as authoritative
before that calibration record exists.

## 6. Reliability requirements

1. Full snapshot pagination; `paging.total` is advisory only.
2. Changelog pagination and inclusive-boundary deduplication.
3. Cursor-cycle, next-link-cycle and no-progress detection.
4. Atomic cache replacement; interrupted bootstrap preserves the last complete cache.
5. Changelog merge is idempotent by `activityId` and normalized message identity.
6. Partial responses are explicit and carry a resume checkpoint; no silent truncation.
7. API version is a single constant with structured `426` diagnostics.
8. Rate limiting honors `Retry-After`; bounded retries only for safe GET requests.
9. Content and credentials never enter stdout diagnostics unless the user explicitly requests thread content.
10. No LinkedIn browser scraping or DOM/UI automation. The companion extension may frame only the own localhost
    workspace and open the real LinkedIn page as a top-level tab after an explicit user action.
11. Snapshot processing/not-ready is distinct from an empty inbox and never overwrites a complete cache.
12. Local cache purge requires explicit confirmation and removes messages, drafts, cursors and calibration state.

## 7. Security and authority

- The owner-selected live credential source is the gitignored root `.env`; the CLI reads only the approved key and
  never logs or persists its value. FDP Keystore remains an optional provider behind the same injected interface.
- The current FDP CLI exposes project-level pull rather than key-level read. The provider therefore parses only the
  approved key names in memory, never persists/logs the subprocess output, and reports this least-privilege gap in
  diagnostics until FDP provides a key-specific read command.
- The owner approved `LINKEDIN_MEMBER_ACCESS_TOKEN` as the canonical environment key on 2026-08-26.
- `configure` stores only non-secret credential-source metadata.
- No LinkedIn password, session cookie or browser profile is handled.
- Reply drafts are local-only. A future send command requires an official write permission plus action-time approval.
- Disconnect/delete must remove the local cache immediately; LinkedIn-side consent revocation stays a user action.

## 8. Critical user-journey catalogue

| ID | Journey | Required variants |
|---|---|---|
| LI-J01 | Configure → authorize fixture → bootstrap → list historical thread | success, permission denied, no data |
| LI-J02 | Bootstrap → incremental inbound → unread/needsReply | success, duplicate boundary, partial page |
| LI-J03 | NeedsReply → show thread → save draft → later outbound sync clears flag | success, interruption/resume |
| LI-J04 | Existing complete cache → failed refresh → previous cache remains usable | timeout, malformed page, cursor loop |
| LI-J05 | Secret lookup → API call → action-log review | missing key, redaction, token never persisted |
| LI-J06 | Existing cache → confirmed purge → no local LinkedIn data | declined purge, confirmed purge |
| LI-J07 | Start My Assistant → open LinkedIn work mode → inspect thread → save/copy draft → owner reports manual send | app already running, app offline/recovery, extension absent fallback, extension-connected side panel |

Each journey carries state from one step to the next and asserts business state, not only process exit codes.

### Feature ↔ journey traceability

| Feature ID | Feature | Exercising journeys |
|---|---|---|
| LI-F01 | Configuration, credential lookup, authorization and doctor | LI-J01, LI-J05 |
| LI-F02 | Complete historical `INBOX` snapshot bootstrap | LI-J01, LI-J04, LI-J06 |
| LI-F03 | Incremental changelog pagination, dedupe and resume | LI-J02, LI-J03, LI-J04 |
| LI-F04 | Message normalization and thread read model | LI-J01, LI-J02, LI-J03 |
| LI-F05 | Candidate/verified unread and deterministic needsReply | LI-J02, LI-J03 |
| LI-F06 | Reply draft lifecycle with no-send invariant | LI-J03 |
| LI-F07 | Redacted envelope, errors and action logging | LI-J01..LI-J06 |
| LI-F08 | Confirmed deletion of all derived local LinkedIn data | LI-J06 |
| LI-F09 | Local LinkedIn review API and compact side-panel UI | LI-J07 |
| LI-F10 | Vendor-neutral Chrome extension bridge with no LinkedIn DOM permission | LI-J07 |
| LI-F11 | Idempotent My Assistant startup and health-gated opening | LI-J07 |
| LI-F12 | Manual-send acknowledgement that never claims API delivery | LI-J07 |

| Journey ID | Features carried across the journey | Cleanup |
|---|---|---|
| LI-J01 | LI-F01 → LI-F02 → LI-F04 → LI-F07 | delete temporary cache/config/log root |
| LI-J02 | LI-F02 → LI-F03 → LI-F04 → LI-F05 → LI-F07 | delete temporary cache/log root |
| LI-J03 | LI-F03 → LI-F04 → LI-F05 → LI-F06 → LI-F07 | delete draft/cache/log root |
| LI-J04 | LI-F02 → LI-F03 → LI-F07 | delete interrupted/resumed cache/log root |
| LI-J05 | LI-F01 → LI-F07 | delete fake credential/config/log root |
| LI-J06 | LI-F02 → LI-F08 → LI-F07 | assert purge, then remove test root |
| LI-J07 | LI-F11 → LI-F09 → LI-F10 → LI-F06 → LI-F12 → LI-F07 | discard temporary draft/cache and close test tab/context |

## 9. Masterplan ledger

| Masterplan | Subplans | Dependency |
|---|---:|---|
| [MP-LI-01](master-plans/mp-01-access-security.plan.md) | 2 | — |
| [MP-LI-02](master-plans/mp-02-api-sync-store.plan.md) | 3 | MP-LI-01 contract |
| [MP-LI-03](master-plans/mp-03-inbox-intelligence-cli.plan.md) | 3 | MP-LI-02 |
| [MP-LI-04](master-plans/mp-04-verification-observability.plan.md) | 2 | MP-LI-02..03 |
| [MP-LI-05](master-plans/mp-05-live-rollout.plan.md) | 2 | MP-LI-01..04 |
| [MP-LI-06](master-plans/mp-06-guided-manual-send-workspace.plan.md) | 4 | MP-LI-02..05 read-side contracts |

## 10. Delivery gates

- Gate A — plan: two consecutive clean full-plan reviews.
- Gate B — offline: typecheck + feature tests + all five journey variants green.
- Gate C — security: no token/content in tracked files, stdout diagnostics or action log.
- Gate D — live read-only: owner consent, complete INBOX bootstrap, incremental event canary.
- Gate E — calibration: unread result checked against LinkedIn UI manually by the owner.
- Gate F — agent compatibility: installed CLI invoked successfully outside the development shell.
- Gate G — workspace: startup is idempotent, health-gated and opens the own `/linkedin` route.
- Gate H — browser boundary: the extension requests no LinkedIn host permission and performs no LinkedIn DOM read/write.
- Gate I — guided-send journey: thread read, draft persist/copy and owner-reported manual send work with pagination and recovery variants.

Message send is not part of these gates, cannot be marked delivered by this Hyperplan, and has no planned
implementation without a separately verified LinkedIn partner grant and new owner-approved plan.

## 11. Live-read trial evidence — 2026-08-26

- Global installed-CLI read-side startup: green (~0.25 s).
- Offline auth status: correctly reports no config, no cache and no token read.
- Cache-dependent read before bootstrap: fixed to fail closed with
  `MA-LINKEDIN-CACHE-NOT-INITIALIZED`; targeted 28/28 and full 170/170 specs green.
- Live LinkedIn authorization: green. The official response nests the member identity in
  `memberComplianceAuthorizationKey.member`; a value-redacted regression fixture covers the shape.
- Historical Keystore discovery: the available FDP credential had read-only scope and `env:list` rejected the
  proposed lookup with `MISSING-ISSUER-SERVICE`. This route was superseded by the owner's 2026-08-26 decision to
  use the gitignored root `.env` for this personal integration.
- Owner credential path: the gitignored root `.env` contains `LINKEDIN_MEMBER_ACCESS_TOKEN`; CLI configuration
  stores only the key name.
- The initial snapshot-not-ready response was handled without replacing local state. A later dry run and committed
  bootstrap completed over 4 pages with 3,394 rows/messages and zero unresolved normalized messages.
- The observed live snapshot schema uses uppercase export fields (`CONVERSATION ID`, `SENDER PROFILE URL`, `FROM`,
  `DATE`, `CONTENT`). A redacted regression test now covers thread identity, author/direction, timestamp and content.
- The owner identity is configured locally as both profile URL and display name. A repeat incremental sync received
  one inclusive-boundary event, skipped it as a duplicate, applied zero changes and left the 3,394-message cache and
  cursor unchanged, proving idempotent resume behavior.
- A calendar-three-month check from 2026-05-26 found 14 deterministic `needsReply` threads: 6 genuine personal
  outreach threads, 7 automated/sponsored threads and 1 recruiter closure that requires no reply. Owner spot-check
  and read/unread UI calibration remain open.
