# Email domain

## Mit fed le

- IMAP mailbox-ok listázása
- levél-metaadatok keresése/listázása
- teljes text/html tartalom olvasása biztonsági limitekkel
- csatolmányok listázása és explicit célmappába mentése
- ad-hoc SMTP-küldés, alapértelmezett IMAP Sent-appenddel

## Source of truth és adat-határ

Az e-mail adatok kanonikus forrása **mindig a külső mail provider**. A My Assistant
repo nem importál és nem tárol mailbox-tartalmat, levéltörzset, címzettlistát,
csatolmányt, credentialt vagy provider-specifikus account-registryt.

- Runtime credential: projekt-root `.env` (gitignored)
- Változónév-séma: projekt-root `.env.example` (placeholder-only, tracked)
- CLI implementáció: `cli/src/email/` + `cli/src/commands/email-*.command.ts`
- Runtime kimenet: stdout JSON envelope; automatikus mailbox-cache nincs
- Attachment write: csak explicit `--save-to <absolute-path>` esetén

## Fiók-elválasztás

Az `--account <name>` dinamikusan saját env-prefixet kap:
`MY_ASSISTANT_EMAIL_ACCOUNT_<NAME>_{ADDRESS|PASSWORD|SENDER_NAME}`.
Ismeretlen/hiányosan konfigurált fiók hibával leáll; másik fiókra nincs fallback.

## Jóváhagyott fiók-szerepek

- `default` — `tahitoth.balazs@gmail.com`: az asszisztens kezelt postaládája. Olvasásra, keresésre és a felhasználó kérésére küldésre használható.
- `sandbox` — `itharen33@gmail.com`: a felhasználó által 2026-08-12-én kifejezetten szabad használatra átadott teszt-/szemétgyűjtő postaláda. Az asszisztens külön engedélykérés nélkül olvashatja, keresheti, tesztleveleket küldhet belőle vagy rá, és e-mail-integrációs próbákra használhatja. A tartós OAuth refresh token helyileg, gitignore alatt tárolandó, ezért normál esetben nem kell újra hozzáférést kérni. Tömeges vagy visszafordíthatatlan törlés továbbra is csak explicit felhasználói kérésre végezhető.
- FŐ fiók — `itharen3@gmail.com`: nincs és nem is adható mailbox-, jelszó-, OAuth- vagy delegált hozzáférés az asszisztensnek. A felhasználó maga végzi a beállításokat; az asszisztens csak vezetést ad.

A fiókok szerepe és engedélyszintje nem öröklődik egymásra.

Mindkét Gmail OAuth-token stabil helye: `cli/config/email-oauth/<account>.json`. Token nem maradhat `dist/` alatt, mert a build-output törölhető.

## Biztonsági invariánsok

- Külső e-mailbe kizárólag a címzettnek szánt, végleges levéltörzs kerülhet. Asszisztensi magyarázat, státuszüzenet, belső jegyzet, prompt, rendszerüzenet vagy tool-kimenet semmilyen körülmények között nem kerülhet a tárgyba, levéltörzsbe, aláírásba vagy csatolmányba. Éles küldés előtt ezt külön ellenőrizni kell.
- A tracked action-log e-mail parancsoknál csak flag-neveket tárol; értékeket nem.
- A source FDP Assistant fióknevei, címei, sablonjai és automatizmusai nincsenek átmásolva.
- Attachment-fájlnév sanitize-olt, a mentés nem ír felül meglévő fájlt.
- A read és attachment parancsok read-only IMAP lockot használnak.
- A teljes levél és attachment mérete CLI flag-gel korlátozott.
- Küldésnél `--dry-run` elérhető; éles küldés csak explicit `ma email send` hívással történik.
