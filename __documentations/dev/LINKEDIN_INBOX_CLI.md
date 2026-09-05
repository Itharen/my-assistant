# LinkedIn personal inbox CLI — setup, operations and agent contract

**Status:** live historical inbox and incremental sync verified; unread UI calibration pending  
**Capability:** official read-only Member Data Portability API; local drafts; no current message-send permission  
**Plan:** `__agent/plans/linkedin-integration-hyperplan/hyperplan.plan.md`

**2026-09-02 access research:** [Official messaging eligibility research and unsent enquiry](../developments/2026-09-02-linkedin-messaging-access-research.md).
Developer Support provides a question/routing channel; it is not partner approval. Compliance is closed to new
partners. No send command or permission was added by this research.

## 1. What this tool does

`ma linkedin` gives every terminal-based AI agent the same machine-readable interface for the owner's personal
LinkedIn inbox. It can:

- bootstrap the historical `INBOX` snapshot with complete pagination;
- apply incremental Member Change Logs with an atomic cursor and inclusive-boundary deduplication;
- list thread metadata without dumping message bodies;
- identify unread candidates and deterministic needs-reply threads;
- show an explicitly selected thread;
- create, show, list and delete local reply drafts;
- delete all derived local LinkedIn cache data with explicit confirmation.

It cannot send a personal LinkedIn message. For the current personal-assistant app this is an operational **NO**:
the official Member Data Portability API is read-only, no Messages API partner grant has been verified, and the
restricted partner API is not a self-service or currently actionable access route. There is no browser scraping,
extension, Computer Use or hidden UI-automation fallback in this package.

> **Evidence correction, 2026-09-02:** the earlier token-capability statement was not a token introspection
> result. `ma linkedin auth status` reports configuration metadata with `tokenRead: false`; it does not inspect
> granted scopes. The current no-send conclusion rests on the read-only implementation and the absence of a
> verified partner grant, not on that diagnostic proving the token lacks a particular scope.

Only a future, independently verified LinkedIn approved-partner grant could reopen message sending as a new
owner-approved feature. It is not part of the current roadmap or delivery promise. If such a grant actually exists,
the compliant send extension must preserve this contract:

1. show the complete message, subject and attachments to the owner;
2. allow editing before send;
3. require a fresh affirmative owner action for the specific message;
4. send at the time of that action — never scheduled, background or batch-autonomous;
5. persist the LinkedIn receipt and verify the outbound message on the next inbox sync.

The supported path is therefore draft + attachment checklist + manual send in LinkedIn. UI
automation is not an acceptable fallback because LinkedIn explicitly prohibits unauthorized tools that send or
redirect messages and may restrict the account.

## 2. Official access prerequisites

The live onboarding requires owner actions in LinkedIn's visible developer and consent pages:

1. The LinkedIn profile location must be in the EEA or Switzerland.
2. Create the app through LinkedIn's **Member Data Portability (Member) Default Company**.
3. Request the **Member Data Portability API (Member)** product.
4. Complete member OAuth consent with scope `r_dma_portability_self_serve`.
5. Store the resulting access token in the gitignored project-root `.env` under the owner-approved
   `LINKEDIN_MEMBER_ACCESS_TOKEN` key.

Official references:

- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/member-data-portability-member>
- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/member-snapshot-api>
- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/snapshot-domain>
- <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/member-changelog-api>
- <https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access>
- <https://learn.microsoft.com/en-us/linkedin/shared/integrations/communications/messages>
- <https://www.linkedin.com/help/linkedin/answer/a1341387>
- <https://www.linkedin.com/legal/l/portability-api-terms>
- <https://www.microsoft.com/content/dam/microsoft/mscle/documents/presentations/DMA.100160%20-%20Microsoft%20Compliance%20Report%20-%20Annex%2011%20-%20LinkedIn%20%28Non-Confidential%20Version%29.pdf>

Do not paste an access token into chat, a command argument, source code or a tracked file. The owner explicitly
selected the gitignored project-root `.env` for this personal, non-FDP integration on 2026-08-26.

## 3. Storage and secret boundary

Default local state root:

```text
%USERPROFILE%/.config/my-assistant/linkedin/
  config.json  # non-secret credential-source metadata only
  cache.json   # derived personal messages, cursor, calibration and local drafts
```

The default token source is the project-root `.env`, already excluded by `.gitignore`:

```text
LINKEDIN_MEMBER_ACCESS_TOKEN=<owner-pasted-token>
```

`EnvironmentVariableSecretProvider` reads only the configured key from `process.env`. The CLI loads the root
`.env` independently of the caller's working directory. The value is never copied into `config.json`, cache,
stdout diagnostics or action logs. FDP Keystore remains an optional credential source through
`--credential-source fdp-keystore`, but it is not used by the owner's live setup.

Cache replacement uses exclusive temporary-file creation, file sync and atomic rename. A failed/not-ready
bootstrap or interrupted incremental sync leaves the last complete cache and cursor usable.

## 4. First-time configuration

After the owner has pasted the token into the gitignored root `.env`:

```powershell
ma linkedin configure --pretty
```

This writes only `credentialSource=environment` and the key name
`LINKEDIN_MEMBER_ACCESS_TOKEN` to user-local configuration. The token itself remains only in `.env`.

Optional `--self-id <URN>` may be repeated only when a live payload exposes an additional stable identifier for
the authenticated member. Normally `memberAuthorizations` supplies the canonical member URN.

Verify in increasing order of authority:

```powershell
ma linkedin auth status --pretty
ma linkedin doctor --pretty
ma linkedin inbox bootstrap --dry-run --pretty
ma linkedin inbox bootstrap --pretty
ma linkedin inbox sync --pretty
```

`auth status` never reads the token or calls LinkedIn. `doctor` does both and returns only redacted readiness
evidence. If no bootstrap cache exists, `doctor` reports `cachePresent=false`, null cache metadata and
`unreadSemantics=not-initialized` rather than manufacturing an empty-cache timestamp. `bootstrap --dry-run`
traverses and validates the snapshot without replacing the cache.

### Snapshot states

- `MA-LINKEDIN-SNAPSHOT-NOT-READY`: LinkedIn is still preparing the snapshot; existing cache is preserved.
- Successful `INBOX` envelope with an empty `snapshotData` followed by LinkedIn's documented no-data terminal:
  verified empty snapshot; this is different from first-page not-ready.
- Schema/pagination/network failure: no cache replacement.

The first API call starts LinkedIn's asynchronous data preparation. LinkedIn's published DMA compliance evidence
says profile, connections and messages are generally available around ten minutes after that first call, while
some other domains may take up to 48 hours. A not-ready result immediately after consent is therefore expected;
retry the dry run later instead of treating it as an empty inbox.

The official wire shape is one `elements[0]` domain envelope per page:
`{snapshotDomain: "INBOX", snapshotData: [...]}`. `start` is a page number (`0`, `1`, `2`, …), not a row offset;
the client follows server `next` links when present and otherwise increments one page at a time until LinkedIn's
documented `No data found for this memberId` terminal. `paging.total` is never trusted as terminal evidence.

## 5. Normal operation

LinkedIn retains Member Change Logs for at most 28 days and recommends frequent synchronization. Run sync at least
daily; the eventual automation target is hourly.

```powershell
ma linkedin inbox sync --pretty
ma linkedin inbox needs-reply --offset 0 --limit 20 --pretty
ma linkedin inbox unread --offset 0 --limit 20 --pretty
ma linkedin inbox list --offset 0 --limit 20 --pretty
ma linkedin thread show --id <THREAD_ID> --pretty
```

List results contain thread metadata, last message identity/direction/timestamp and classification evidence, but
not message content. `thread show` is the explicit content-revealing command.

Before the first successful bootstrap, cache-backed reads fail with
`MA-LINKEDIN-CACHE-NOT-INITIALIZED`; an absent cache is never reported as a successfully empty inbox.

### Classification rules

- `needsReply=true`: the newest non-deleted known message is inbound. This is deterministic rule `1.0.0`, not LLM
  judgement. Needs-reply results are ordered oldest unanswered first.
- `unread=true`: at least one inbound cached message has no `readAt` value.
- `unreadConfidence=candidate`: default until one read and one unread live conversation are manually compared with
  LinkedIn. Do not describe candidate results as authoritative.

## 6. Reply drafts

Message bodies are never accepted as inline command arguments because command lines may be persisted by shells and
process inspectors. Use an absolute file or stdin:

```powershell
ma linkedin reply draft --thread <THREAD_ID> --body-file C:\absolute\reply.txt --pretty
Get-Content -Raw C:\absolute\reply.txt | ma linkedin reply draft --thread <THREAD_ID> --stdin --pretty
ma linkedin reply list --thread <THREAD_ID> --pretty
ma linkedin reply show --id <DRAFT_ID> --pretty
ma linkedin reply delete --id <DRAFT_ID> --confirm --pretty
```

`reply list` returns metadata and body length only. `reply show` is the explicit body-revealing command. A draft
receipt always states `sendCapability: not-available-read-only-api`; it never claims delivery.

The CLI stores reply text only; it does not upload or persist LinkedIn attachments. The owner's CV is no longer
downloadable from the profile, so the human-facing workflow requires a verified fresh CV file and a manual
attachment before any opportunity reply can be considered ready. Until then its review status is
`blocked-missing-cv`, and the draft must not claim that the CV is attached.

## 7. Cleanup and recovery

Delete all derived messages, cursors, calibration and drafts while preserving non-secret configuration:

```powershell
ma linkedin cache purge --confirm --pretty
```

Without `--confirm`, deletion fails closed. Rebuild with `inbox bootstrap` after purge. LinkedIn-side consent
revocation is a separate visible owner action in LinkedIn.

## 8. Agent integration contract

Every agent invokes the same installed `ma` executable; no MCP or model-specific adapter is required. Output always
uses the stable envelope:

```json
{
  "ok": true,
  "action": "linkedin.inbox.needs-reply",
  "requestId": "uuid",
  "elapsedMs": 12,
  "result": {}
}
```

Agent rules:

1. Run `doctor`, then `inbox sync`, before presenting inbox state when the last sync may be stale.
2. Follow `nextOffset` until `null`; never assume the first page is complete.
3. Use list/needs-reply first and `thread show` only for user-selected or task-required threads.
4. Treat candidate unread as candidate until calibration is persisted.
5. Draft freely when requested, but never report a message as sent.
6. The approved guided UI fallback is the own localhost workspace + Chrome Side Panel companion. It may open the
   real LinkedIn page, but must never read/manipulate LinkedIn DOM, paste, attach or send.
7. Never log message bodies, participant/thread identifiers or secret values.
8. On any ambiguous live schema, stop classification, retain the raw local row, and add a redacted fixture/test.

Human-facing triage, compatibility analysis, reply tone and batch approval are defined separately from the CLI
transport contract:

- flow: `__agent/flows/on-demand/linkedin-inbox-review/`;
- canonical rules and HU/EN templates: `current/principles/linkedin-message-processing.md`.
- guided manual-send workspace: `LINKEDIN_WORKSPACE.md`.

The deterministic `needsReply` result is only the candidate source for that workflow. It must not bypass full-
thread semantic review, duplicate grouping or owner approval.

## 9. Developer verification

```powershell
cd E:\Programming\Own\CURSOR\LIVE-projects\my-assistant\cli
pnpm run typecheck
pnpm test
node dist/cli/src/main.js linkedin --help
```

Automated coverage includes authorization, snapshot/changelog pagination, Retry-After, request timeout, atomic
state, inclusive-boundary dedupe, partial update merge, needs-reply/unread, local drafts, permission rejection,
interrupted sync retention and confirmed purge. Stateful journeys are in
`cli/src/linkedin/linkedin.journey-e2e.spec.ts`.

## 10. Live rollout state

Live authorization, historical inbox reads and deterministic needs-reply classification are proven. Completion
still requires:

- manual read/unread calibration and three needs-reply spot checks;
- final installed-CLI/runbook handoff;
- redacted persistent evidence only (counts, timestamps, cursor, status; no content).

### 2026-08-26 live-read diagnostic

> **Superseded credential-path note:** the Keystore findings below explain the original blocker. The owner later
> selected the gitignored root `.env`; they are retained as incident history, not as the active setup path.

- The globally installed CLI starts and returns `auth status` in about 0.25 seconds after integrations were made
  lazy-loaded.
- Local state is intentionally untouched: `configured=false`, `cachePresent=false`, `tokenRead=false`.
- `doctor` fails closed with `MA-LINKEDIN-NOT-CONFIGURED` and cache-backed inbox reads fail with
  `MA-LINKEDIN-CACHE-NOT-INITIALIZED`; neither state may be represented as an empty inbox.
- The locally authenticated FDP admin key currently reports read-only scope. `fdp env:list` for the proposed
  `my-assistant/master/prod` lookup is rejected with `MISSING-ISSUER-SERVICE`, so it does not establish whether
  that Keystore project exists and cannot provision a token.
- `fdp project-statuses` lists deployment targets, not the complete Keystore project catalogue; do not use it as
  evidence that a Keystore project exists or is absent.
- At that checkpoint live reads were blocked on LinkedIn app consent and credential provisioning. The app/product
  and OAuth token were subsequently created; root `.env` provisioning is the current checkpoint.

### Live owner onboarding record

- LinkedIn Developer App name: `My Handler Tool`.
- Application creation: owner-confirmed on 2026-08-26; the app product catalogue is reachable.
- Product access: `Member Data Portability API (Member)`, Default Tier, shown under `Added products` on
  2026-08-26. `Share on LinkedIn` remains separate and was not substituted.
- OAuth Token Tools authorization: owner-confirmed successful on 2026-08-26 with the single
  `r_dma_portability_self_serve` scope. The token is stored in the gitignored root `.env` as
  `LINKEDIN_MEMBER_ACCESS_TOKEN`; it was
  never pasted into chat or copied into CLI configuration.
- Live `doctor`: green for configuration, credential lookup and LinkedIn authorization. The observed official
  authorization envelope nests the member identity under `memberComplianceAuthorizationKey.member`; this shape
  is now covered by a redacted regression fixture.
- First `bootstrap --dry-run`: LinkedIn returned snapshot-not-ready and no cache was replaced. A later dry run and
  committed bootstrap completed over 4 pages with 3,394 rows/messages and zero unresolved normalized messages.
- The live INBOX snapshot schema uses uppercase export-style fields. A value-redacted regression test covers
  `CONVERSATION ID`, `SENDER PROFILE URL`, `FROM`, `DATE` and `CONTENT`; the configured self identifiers resolve
  both inbound and outbound directions.
- A repeated incremental sync proved inclusive-boundary idempotency: one duplicate event was received, zero events
  were applied, and both cursor and 3,394-message cache remained unchanged.
- A 2026-05-26 calendar cutoff produced 14 deterministic latest-inbound candidates. Semantic review separated
  them into 6 genuine personal outreach threads, 7 automated/sponsored threads and 1 closed recruiter exchange.
  This distinction is intentionally a review layer above the deterministic `needsReply` rule.
- Read-only changelog canary: green (one response page, zero events since consent, no content/identifier output).
- Global installed `ma`: refreshed; live `auth status` and `doctor` smoke are green. `doctor` correctly reports
  `cachePresent=false` and `unreadSemantics=not-initialized` until the first successful bootstrap.
