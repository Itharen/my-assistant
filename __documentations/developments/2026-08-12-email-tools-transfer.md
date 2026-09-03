# Email tools transfer — 2026-08-12

## Cél

Az FDP Assistant általános e-mail olvasó/kezelő képességének elérhetővé tétele a
My Assistantben úgy, hogy a két projekt mailbox-adatai teljesen elkülönüljenek.

## Pattern mapping

Átvizsgált forrásminták:

- `fdp-assistant/cli/src/_collections/imap.util.ts`
- `fdp-assistant/cli/src/_collections/email-accounts.const.ts`
- `fdp-assistant/cli/src/_commands/email-{list-mailboxes,read,content,fetch-attachments}.ts`
- `fdp-assistant/cli/src/_commands/send-email.ts`
- `fdp-assistant/__agent/capabilities/email-{reader,sender}/README.md`

My Assistant célminták:

- két-szintű `ma <group> <subcommand>` dispatch a `cli/src/main.ts`-ben
- egy fájl/subcommand a `cli/src/commands/` alatt
- stabil JSON envelope a `cli/src/output/envelope.ts` szerint
- Jasmine colocated `*.spec.ts` tesztek
- minden invocation/error tracked action-log bejegyzése

## Adat-határ

Nem került át:

- `.env` vagy bármely credential
- mailbox/account név-registry és személynév
- e-mail cím, címzettlista vagy provider-specifikus cím
- levéltárgy, levéltörzs, attachment vagy mailbox-cache
- e-mail sablon
- FDP month-closing / invoice / payroll automatizmus

A My Assistant accountok dinamikus env-sémát használnak. A séma placeholder-only
mintája a projekt-root `.env.example`; a valódi értékek a gitignored `.env`-ben
maradnak. A mailbox-adat SSoT-ja a külső provider (`external` status).

## Implementáció

Public CLI:

- `ma email list-mailboxes`
- `ma email list`
- `ma email read`
- `ma email fetch-attachments`
- `ma email send`

Fő biztonsági elemek:

- read-only IMAP mailbox lock
- validált date/integer optionök és felső limitek
- teljes message és attachment méretkorlát
- attachment fájlnév-sanitize + UID/part prefix + `wx` no-overwrite write
- subject/recipient CRLF injection blokkolás
- SMTP-siker + Sent-append hiba explicit partial result és error action-log
- action-log argument-redakció: csak flag-nevek, semmilyen érték
- persisted e-mail hibaszövegben cím/secret redakció

## Verifikáció

- `npx tsc --noEmit` — zöld
- `pnpm test` — 125 spec, 0 failure
- `pnpm run test:coverage` — zöld; e-mail modul 74.82% statement/line, 79.9% branch, 73.8% function
- `ma email --help` smoke — zöld
- source-data leakage sweep az FDP-specifikus account/provider/címzett tokenekre — 0 találat
- automata offline CLI feature-E2E:
  - dry-run happy path teljes dispatch/config/validation/envelope lánccal
  - missing-recipient error variant
  - mailbox/limit/save-path/account validation variantok hálózati hozzáférés nélkül
  - minden ág action-log leak-guarddal

## Verifikációs korlát

Valós IMAP/SMTP connect, mailbox-listázás és éles küldés **unverified**. Ez csak a
My Assistant saját, user által konfigurált mailboxával futtatható; a migráció
szándékosan nem olvasta be sem az FDP Assistant, sem a My Assistant tényleges
e-mail adatait. Első konfigurálás után ajánlott sorrend:

1. `ma email list-mailboxes --pretty`
2. `ma email list --mailbox INBOX --limit 1 --pretty`
3. `ma email send ... --dry-run`
4. külön user-jóváhagyással éles send + Sent-verifikáció

## 2026-08-12 — Gmail OAuth korrekció

A Gmail aktuális hivatalos iránya miatt a Gmail-accountok jelszavas IMAP/SMTP
hitelesítése helyett Desktop OAuth 2.0 (PKCE + rendszerböngésző + loopback
callback) és Gmail API backend készült. A provider-semleges CLI contract
megmaradt; más szolgáltatóknál továbbra is elérhető az IMAP/SMTP adapter.

- Új: `ma email auth`, `ma email status`
- Gmail scope: `gmail.readonly` + `gmail.send` (nem a teljes `mail.google.com`)
- Tokenek: `cli/config/email-oauth/` alatt, gitignored
- Gmail read/list/attachment/send: Gmail API
- App-password nem szükséges; Google-fiókjelszó nem kerül konfigurációba

## Kapcsolódó verifikációs stabilizálás

A coverage-run egy meglévő `safeCall` spec race-et tett láthatóvá: két párhuzamos,
fire-and-forget action-log append sorrendjét a teszt fixnek feltételezte, továbbá
egy ág a temp mappát a háttérírás befejezése előtt törölte. A production helper
viselkedése nem változott; a spec sorrendfüggetlen label-ellenőrzést és explicit
async flush-t kapott. Ezután a randomized coverage-run zöld lett.
