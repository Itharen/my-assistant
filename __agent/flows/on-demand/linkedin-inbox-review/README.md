# linkedin-inbox-review

**Mikor fut:** amikor a user LinkedIn-üzenetek áttekintését, megválaszolatlan megkeresések kigyűjtését vagy
válasz-draftokat kér.

## Cél

A hivatalos, read-only LinkedIn-adatforrás teljes szinkronjából rövid, dönthető és követhető review-queue készüljön:

1. teljes lapozott sync;
2. determinisztikus `needsReply` jelöltek;
3. teljes thread-alapú szemantikus triage és duplikációkezelés;
4. kompatibilitási ajánlás;
5. közvetlen projektmegbízások kiemelt, egyedi elemzése a normál megkeresések előtt;
6. magyar/angol, rövid válasz-draftok egyetlen owner-review batch-ben;
7. a manuálisan elküldött válasz későbbi API-visszaolvasással történő igazolása.

Kanonikus viselkedési szabály és sablon:
`current/principles/linkedin-message-processing.md`.

## Fázisok

1. `_intake.md` — időablak, cél és aktuális feltételek
2. `_subflow-1-sync-and-collect.md` — doctor, sync, teljes lapozás és jelöltlista
3. `_subflow-2-triage.md` — teljes thread, zaj/lezárás/duplikáció és kompatibilitás
4. `_subflow-3-draft-and-review.md` — sablonválasztás, rövid személyre szabás, batch approval
5. `_close.md` — állapotok, action-log és következő sync

A fázisok sorrendje kötelező, mert mindegyik az előző tényleges kimenetét használja.

## Output

- usernek: összesített lista linkekkel, ajánlással és a kért draftok teljes szövegével;
- user-local LinkedIn cache: szinkronizált adatok és helyi draftok;
- verziókezelt action-log: csak darabszám, állapot és technikai eredmény, üzenettörzs nélkül;
- opcionális task: egy thread/opportunity = legfeljebb egy teendő.

## Biztonsági határ

A flow nem küld LinkedIn-üzenetet, nem kezel LinkedIn-jelszót/session cookie-t, és nem automatizál böngészőt. A
`drafted` vagy `owner-approved` nem jelent `sent` állapotot.
