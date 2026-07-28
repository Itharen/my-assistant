> ⛔ **ELAVULT / SUPERSEDED (2026-07-29).** Ne ezt add ki. Az ezt végrehajtó dev session **elbukott és nem használható tovább** (owner-döntés). **Friss/kanonikus átadó-spec:** `LIVE-projects/my-assistant/__documentations/dispatch-briefs/invoicing-refund-HANDOVER-2026-07-29.md` (tartalmazza a már elkészült részeket + a hátralévő P2–P6-ot). (Ok: session-bukás → új session, tiszta átadás.)

# DISPATCH BRIEF — Számlázás + (részleges) elállás/refund — HYPERPLAN mandátum (2026-07-28)

> **Kiadó:** My Assistant 3 (koordinátor) · **Végrehajtó:** dev session · **Owner-döntés dátuma:** 2026-07-28.
> **Munkamód:** a szokásos — **alapos HYPERPLAN először**, majd **folyamatos végrehajtás** (ScheduleWakeup-pal
> ütemezve), **slow and steady, alapos, minden teszttel** (unit + e2e). Fázis-szinkron: egy fázis → commit+push →
> **megállsz és jelentesz** → a koordinátor verifikál és kiadja a következőt. **Poll-mentes.**

## 0. Miért (a kiváltó lelet)
**A számlázás TELJESEN hiányzik a rendszerből** — verifikálva 2026-07-28:
- **Nincs magyar számlázó-integráció** sehol a flottában (`szamlazz.hu` / `Billingo` / NAV Online Számla = 0 kód-találat).
- **A Stripe NEM állít ki számlát nálunk:** a fizetés **PaymentIntent**-tel megy (`fdp-token-service/server/src/_routes/stripe/stripe.data-service.ts:505,1333,1604`), nem Checkout Session-nel → nincs Invoice-létrehozás; `invoice_creation` nincs, `receipt_email` nincs. Az `invoice_settings` (`:335`) csak default fizetési mód; az `invoice.*` webhookok csak az **előfizetésekhez**.
- **Nincs felületen elérhető számla** (a kliensben csak az adomány-számlázási űrlap van).
- ⚠️ A Stripe Invoicing önmagában sem elég: a **NAV Online Számla adatszolgáltatást nem végzi el**.

**Owner-döntés:** a **számlakiállítás ÉS a felületen elérhetővé tétel R1 MUST-HAVE**; szolgáltató: **szamlazz.hu**
(már használjuk); a megoldás **FDP-bedrock** legyen, hogy máshol is újrahasználható legyen.

## 1. A HYPERPLAN kötelező lefedettsége
### (a) BEDROCK — újrahasználható számlázási képesség
- Hol: **pattern-mapping alapján dönts** (`@futdevpro/nts-fdp-templates` a valószínű otthon — FDP-üzleti képesség;
  a generikus rész mehet `nts-dynamo`-ba). **Indokold a hyperplanben.**
- **Provider-absztrakció + szamlazz.hu adapter** (ne égess be egy szolgáltatót; később jöhet másik).
- **Működő minta (OLVASD EL, ez már élesben állított ki számlákat):**
  `LIVE-projects/fdp-assistant/cli/src/_auto/issue-invoice.ts` — `szamlazz.js` npm lib, `Client/Seller/Buyer/Item/Invoice`,
  `requestInvoiceDownload: true` → **PDF buffer + invoiceId**. (343 sor; `@types` nincs → runtime-shaped import.)
  ⚠️ Ez CLI-minta, **nem** másolandó változtatás nélkül — bedrock-service kell belőle.
- **Kötelező képességek:** normál számla · **helyesbítő/sztornó számla** · deviza (a csomagárak EUR-ban:
  `fdp-token-packages.const.ts`) · nyelv (HU/EN) · idempotencia (egy fizetéshez EGY számla) · **hibatűrés: a számlázás
  bukása SOHA nem boríthatja a fizetést/jóváírást** → retry-sor + rich-error + admin-riport.

### (b) TÁROLÁS — a saját rendszerünkben
- A számla **azonosítója + metaadatai** a `TokenPurchase` rekordra (additív mezők, migráció-mentes minta).
- A **PDF az FDP-FTP-re** (a generált média mintájára) — **privát tárolás + signed-URL** hozzáférés.
  ⚠️ Flotta-tapasztalat: a signed-URL aláírás-gate-et eddig csak az MP használta — nézd meg, mit kell ehhez bekötni.
- **At-rest szempont:** a számla személyes adatot tartalmaz (név/cím) → a meglévő `encrypt:true` bedrock-mechanizmust
  mérlegeld a metaadat-mezőkre (a PDF-re nem).

### (c) FELÜLETEK
- **User:** számla-letöltés a vásárlási előzményből (`fdp-token-service/client/.../acc-token-history`) — R1 must-have.
- **Admin:** számla-lista + keresés + újraküldés/újrageneráltatás + a sikertelen számlázások kezelése.

### (d) REFUND + RÉSZLEGES REFUND (elállás)
- **Kanonikus terv (OLVASD EL):** `documentations/legal/_process/withdrawal-prorata-design-2026-07-28.md`.
- **Lényeg:** az ügyvéd (2026-07-28) **elutasította** a „csomag megkezdése = teljes jogvesztés" szabályt →
  **ARÁNYOS ELSZÁMOLÁS** kell: `visszatérítés = maradék(P)/megvásárolt(P) × fizetett ár(P)`, ahol a `maradék(P)` a
  **FIFO** szerinti, még el nem költött rész az **élő egyenlegből** (`tokenBalance + lockedTokens`).
- **Újrahasznosítás:** a lot-onkénti FIFO-maradék levezetése **MÁR LÉTEZIK** —
  `fdp-token-service/server/src/_collections/token/token-expiry.util.ts` (`computeTokenExpiry`). Ne írj újat.
- **Átalakítandó:** `_routes/admin/refund/refund.data-service.ts` `issueRefundDebit` ma a **TELJES** `tokensPurchased`-et
  vonja vissza → **csak a visszatérített mennyiséget** vonja le.
- **Részleges Stripe-refund** + **helyesbítő számla** + esemény-nyilvántartás (`reason: 'withdrawal-refund'`) +
  idempotencia a Stripe `refundId`-vel (meglévő minta).
- **Felhasználói folyamat:** elállás-kezdeményezés a fiókban + állapot-visszajelzés + 14 napos határidő.

### (e) CHECKOUT-NYILATKOZATOK (legal `D2`)
3-feltételes nyilatkozat a vásárlás előtt: (1) hozzájárulás az azonnali teljesítéshez, (2) tudomásulvétel, hogy az
elállási jog **a felhasznált kredit ARÁNYÁBAN** szűnik meg, (3) **e-mailes visszaigazolás** (tartós adathordozó).
⚠️ A **pontos szövegezést az ügyvéd adja** — a mechanizmust építsd meg úgy, hogy a szöveg cserélhető/verziózott legyen
(a meglévő `LEGAL_TERMS_VERSION` + consent-log mintájára).

## 2. Owner-döntést igénylő pontok (tedd a hyperplanbe kérdésként, NE találgass)
- Vevő-adatok a checkoutban: minimum (név+cím) vs. céges (adószám) is.
- Számla pénzneme/árfolyam (EUR-árak) — könyvelői kérdés.
- Számla-nyelv logika (user-nyelv vs. mindig HU+EN).

## 3. Nem része ennek a hyperplannek (külön tételek)
- Token 5-év lejárat enforcement (cron+emlékeztető) — `fdp-token-service/__documentations/token-expiry-enforcement-status-2026-07-27.md`.
- MP in-app bejelentés/moderáció, MP domain-migráció, AI Act output-jelölés.

## 4. Elvárt munkamód
1. **HYPERPLAN** (alapos, mindent lefedő, fázisokra bontva, becslésekkel) → commit+push → **jelents, várd a jóváhagyást**.
2. Utána **fázisonként**: implementálás → **unit + e2e tesztek** → `dc review` → commit+push → CI/CD zöld →
   **megállsz és jelentesz**. Nincs polling, nincs háttér-task.
3. Minden fázis után frissítsd a projekt `__documentations/`-ját (document-everything hard rule).
4. **Kapcsolódó kanonikus doksik:** `fdp-token-service/__documentations/invoicing-gap-and-plan-2026-07-28.md` ·
   `documentations/legal/legal-obligations-ssot.md` (16. sor) · a fenti withdrawal-terv.
