# Gmail forwarding setup

Last updated: 2026-08-27

## Purpose and access boundary

- Managed destination mailbox: `tahitoth.balazs@gmail.com`.
- Source/main mailbox: `itharen3@gmail.com`.
- Approved sandbox/test sender mailbox: `itharen33@gmail.com` (`--account sandbox`).
- The assistant has Gmail API OAuth access only to the destination mailbox.
- The assistant has no password, OAuth token, delegated access, or mailbox-reading access to the source/main mailbox.
- The user performs every change inside the source/main mailbox. The assistant only supplies reviewed instructions and can process confirmation mail arriving at the destination.
- Passwords, 2FA codes, recovery links/codes, financial, government/tax, health/insurance, and legal/e-signature mail must not be forwarded.

## Current state

### Destination mailbox / Google Cloud

- Gmail API enabled in Google Cloud project `My Assistant`.
- Desktop OAuth with PKCE and local loopback callback.
- Granted scopes: `gmail.readonly`, `gmail.send`.
- OAuth token and client secret remain local and gitignored.
- Stable token storage is `cli/config/email-oauth/`, outside build output; both `default` and `sandbox` tokens survived a clean CLI rebuild.

### Destination mailbox noise filter

- 2026-08-12: Created a narrowly scoped Gmail filter in `tahitoth.balazs@gmail.com` for GitHub Actions failure noise.
- Match: `from:(notifications@github.com) subject:(Run failed:)`.
- Actions: **Skip Inbox** and **Mark as read**.
- No deletion, forwarding, spam action, or broad all-GitHub suppression is configured.
- The filter was also applied to 48 existing matching conversations. Destination Inbox unread count dropped from 53 to 5.
- Security advisories, review requests, mentions, and other GitHub notifications remain unaffected.
- Permanent GitHub notification/routing cleanup is tracked in Organizer task `org:task:6a7c36e3d9038971c29bf5ed`.

### Source/main Gmail

- Forwarding destination added: `tahitoth.balazs@gmail.com`.
- Google forwarding verification completed successfully from the destination mailbox.
- Global automatic forwarding remains disabled.
- Gmail label created: `NO_SAFE_FORWARD`.
- An authentication/security keyword filter applies `NO_SAFE_FORWARD` to matching mail.
- The initial filter was also applied to existing matching conversations; it matched more than 100 conversations.
- A second conservative financial/government/health/legal filter also applies `NO_SAFE_FORWARD` and was applied to existing matching conversations; it matched more than 100 conversations.
- The destination mailbox now receives ordinary mail originally addressed to the source mailbox, so a general safe-forward filter appears to be active. Its exact source-side configuration remains user-owned and has not been independently inspected by the assistant.
- A DODO Tesco delivery-tracking message was forwarded automatically on 2026-08-27.
- The Tesco final order summary was not forwarded automatically; the user forwarded it manually for diagnosis.

## Why the label alone is not the security boundary

Gmail filters are not an ordered rule chain. A forwarding filter must therefore repeat the complete exclusion criteria; it must not depend on another filter having already applied `NO_SAFE_FORWARD`. The label is an audit and tuning aid.

## Authentication/security exclusion query

```text
{"verification code" "security code" "sign-in code" "login code" "authentication code" "confirmation code" "one-time password" OTP 2FA passcode "magic link" "sign-in link" "password reset" "reset your password" "recovery code" "backup code" "verify your email" "confirm your email" "security alert" "new sign-in" "ellenőrző kód" "biztonsági kód" "hitelesítési kód" "megerősítő kód" "belépési kód" "bejelentkezési kód" "egyszer használatos jelszó" "jelszó visszaállítása" "helyreállítási kód" "biztonsági értesítés" "új bejelentkezés"}
```

## Conservative confidential-category query

This is intentionally broad. False positives are acceptable initially and can be relaxed after reviewing the `NO_SAFE_FORWARD` label.

```text
{bank banking transaction transfer payment "credit card" "debit card" "bank statement" "account statement" IBAN SWIFT loan mortgage investment brokerage crypto wallet bankkártya tranzakció átutalás fizetés bankszámla egyenleg hitel befektetés kripto government tax taxpayer "social security" passport "identity card" "national id" "official notice" ügyfélkapu DÁP NAV adó adóbevallás TAJ "személyi igazolvány" útlevél hatóság végzés idézés medical healthcare diagnosis prescription "lab result" patient insurance claim "policy number" egészségügyi diagnózis recept lelet beteg biztosítás kárigény contract agreement "signature request" "electronic signature" DocuSign "Adobe Sign" NDA court lawyer attorney "legal notice" szerződés "aláírási kérelem" bíróság ügyvéd meghatalmazás}
```

## Historical safe-forward rollout plan (2026-08-12)

1. Keep global forwarding disabled.
2. Apply `NO_SAFE_FORWARD` to the conservative category query as a separate audit filter.
3. Test both exclusion groups against historical mail and tune obvious false positives.
4. Create one filter-based forwarding rule to `tahitoth.balazs@gmail.com` whose `Doesn't have` criteria contain both complete exclusion groups.
5. Do not apply the forwarding rule retroactively; Gmail forwarding filters should affect new mail only.
6. Send controlled safe and unsafe test messages and verify that only the safe message reaches the destination.
7. Review `NO_SAFE_FORWARD` periodically and loosen terms only through documented changes.

## Safe-forward search and filter query

The single forwarding filter must use this complete negative query. It forwards only messages that do not match any protected term. The same query is tested as a normal Gmail search before forwarding is enabled.

Important validation caveat: with Gmail Conversation view enabled, a negative search may display an entire conversation when one message matches the safe query even if another message in the same conversation is protected and labelled `NO_SAFE_FORWARD`. Historical validation must therefore be performed temporarily with Conversation view disabled. No forwarding rule may be activated based on conversation-level results.

Further finding: because both audit filters were created with “Also apply filter to matching conversations”, `NO_SAFE_FORWARD` was applied retroactively at conversation scope. Turning Conversation view off does not make those historical labels message-accurate. Therefore the historical label/search intersection is expected and cannot prove or disprove the behaviour of a new-message forwarding filter. The rollout must use controlled new test messages and a temporary sender-restricted forwarding filter before the unrestricted safe-forward filter is created.

Critical test result: the temporary filter was configured by placing the authentication and confidential queries as two separate brace groups in the Gmail “Doesn't have” field. Gmail combined those groups incorrectly for the intended policy, and the fake-2FA test message was forwarded to the destination Spam folder. No real secret was used, but this proves that configuration unsafe. The temporary filter must be deleted. Future testing may use only the documented single combined brace group in `Safe-forward search and filter query`, prefixed with the sender restriction as a direct Gmail query; never paste the two source groups separately into one “Doesn't have” field.

The unsafe temporary filter was confirmed deleted by the user. Revised test method: put the entire direct query (`from:test-sender -{one combined OR group}`) into Gmail's “Has the words” field. Do not split it across advanced-search fields.

```text
-{"verification code" "security code" "sign-in code" "login code" "authentication code" "confirmation code" "one-time password" OTP 2FA passcode "magic link" "sign-in link" "password reset" "reset your password" "recovery code" "backup code" "verify your email" "confirm your email" "security alert" "new sign-in" "ellenőrző kód" "biztonsági kód" "hitelesítési kód" "megerősítő kód" "belépési kód" "bejelentkezési kód" "egyszer használatos jelszó" "jelszó visszaállítása" "helyreállítási kód" "biztonsági értesítés" "új bejelentkezés" bank banking transaction transfer payment "credit card" "debit card" "bank statement" "account statement" IBAN SWIFT loan mortgage investment brokerage crypto wallet bankkártya tranzakció átutalás fizetés bankszámla egyenleg hitel befektetés kripto government tax taxpayer "social security" passport "identity card" "national id" "official notice" ügyfélkapu DÁP NAV adó adóbevallás TAJ "személyi igazolvány" útlevél hatóság végzés idézés medical healthcare diagnosis prescription "lab result" patient insurance claim "policy number" egészségügyi diagnózis recept lelet beteg biztosítás kárigény contract agreement "signature request" "electronic signature" DocuSign "Adobe Sign" NDA court lawyer attorney "legal notice" szerződés "aláírási kérelem" bíróság ügyvéd meghatalmazás}
```

## Tesco final-summary exception — configured 2026-08-27

The Tesco final order summary legitimately contains words and fields caught by
the conservative policy, including payment wording, a partial card reference,
expiry information, and the word `szerződés`. The generic exclusions therefore
worked as configured; they must not be weakened globally.

The user confirmed creating the separate, narrowly scoped positive filter in
the source/main Gmail:

```text
from:(no-reply@mail.tesco.com) subject:("Itt a rendelésed összegzése")
```

Configured action: **Forward it to `tahitoth.balazs@gmail.com`**. The assistant
cannot inspect the source-side filter directly; successful runtime behaviour
will be verified by the next naturally arriving Tesco final-summary message.
The sender+subject constraint must remain unchanged unless a later verified
Tesco template change requires a documented update.

Source Gmail UI procedure:

1. Open **Settings → See all settings → Filters and Blocked Addresses → Create a new filter**.
2. Paste the complete query above into **Has the words**.
3. Run **Search** first and confirm that the result set contains only Tesco final order summaries.
4. Return to filter creation, choose **Forward it to `tahitoth.balazs@gmail.com`**, then create the filter.
5. Leave **Also apply filter to matching conversations** unchecked.

This exception intentionally forwards the delivery address, phone, final order
value and partial payment-card metadata present in this trusted Tesco message
class. It does not authorize a general relaxation for payment, banking or legal
mail.

## Change log

- 2026-08-12: Destination OAuth/API setup completed and live read test passed.
- 2026-08-12: Source forwarding address verified; global forwarding left disabled.
- 2026-08-12: `NO_SAFE_FORWARD` label and authentication/security audit filter created.
- 2026-08-12: Conservative confidential categories accepted as the initial policy; forwarding rule still pending.
- 2026-08-12: Conservative confidential-category audit filter created and applied to historical matches; safe-forward query ready for review.
- 2026-08-12: Safe-query review exposed Gmail conversation-level negative-search behaviour. Forwarding remains disabled pending message-level validation with Conversation view off.
- 2026-08-12: Message view still showed historical `NO_SAFE_FORWARD` labels because retroactive filter application labelled whole conversations. Historical labels were declared audit-only; rollout changed to controlled new-message testing with a sender-restricted temporary filter.
- 2026-08-12: `itharen33@gmail.com` designated as the freely usable sandbox/test mailbox. Persistent local OAuth is authorized; main-mailbox access remains prohibited.
- 2026-08-12: Sandbox OAuth completed and live mailbox listing passed. Fixed token-path resolution, migrated both tokens out of `dist`, then verified 131 tests and post-build authentication for both accounts.
- 2026-08-12: Sent controlled safe and fake-2FA messages from `sandbox` to the main mailbox after the user created the sender-restricted temporary forwarding filter. Neither appeared in the destination Inbox after repeated checks, so the test is inconclusive and forwarding remains unapproved pending source delivery/filter inspection.
- 2026-08-12: Found the fake-2FA test in destination Spam, proving it was forwarded. Root cause: two separate brace groups in one negative field did not express the required single OR exclusion. Temporary filter must be removed; no general forwarding approved.
- 2026-08-12: User confirmed deletion of the unsafe temporary filter. Revised sender-restricted test pending with one direct query in “Has the words”.
- 2026-08-12: Revised sender-restricted filter passed controlled new-message tests. Safe test C was forwarded; fake authentication D, financial E, government/tax F, health G, and legal/e-signature H were all blocked after delayed Inbox and Spam checks. Safe C landed in destination Spam, so destination-side trust/routing must be configured before general rollout.
- 2026-08-12: User chose to defer destination spam/deliverability remediation. No destination filter was created. This is tracked as a separate later issue and does not change the successful confidentiality-filter test result.
- 2026-08-12: Added a destination-only GitHub Actions failure-noise filter (`from:notifications@github.com` + subject `Run failed:`): skip Inbox, mark read, apply to 48 existing conversations, never delete. This does not affect the source forwarding policy.
- 2026-08-12: Browser navigation initially opened the source/main Gmail because it was the default account. The tab was closed immediately without any mailbox mutation. Subsequent browser work used the explicitly selected managed destination account only. The no-access/no-control boundary for the source/main mailbox remains mandatory.
- 2026-08-27: The manually forwarded Tesco final summary was inspected. Its payment/card/footer wording explains the safe-forward false positive. The user then confirmed creating the separate exact sender+subject forwarding exception. Runtime delivery awaits the next natural Tesco final-summary message.
