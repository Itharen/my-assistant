# ÁTADÁS — Számlázás + (részleges) elállás/refund · ÚJ DEV SESSION-NEK (2026-07-29)

> ⚠️ **AZ ELŐZŐ DEV SESSION ELBUKOTT — TILOS ÚJRAHASZNÁLNI** (owner-döntés 2026-07-29). Az általa hagyott
> **kód és tervek MEGVANNAK a repóban**, de **BEMENETNEK tekintendők, nem igazságnak**: mindent **újra kell
> verifikálni** (`core-no-guessing`, measure-twice).
>
> **Ez a doksi a belépési pont.** Minden más csak hivatkozás — a kanonikus tartalmat NE másold ide vissza.

---

## 1. A FELADAT EGY MONDATBAN
Építsük ki a **kredit-vásárláshoz tartozó teljes számlázást** (szamlazz.hu, bedrock, újrahasznosítható) és a
**fogyasztói elállás arányos elszámolását** — felhasználói és admin felülettel, minden teszttel, kimerítő
hibakezeléssel. **Owner: R1 MUST-HAVE.**

## 2. MI VAN MÁR KÉSZ (verifikálva 2026-07-29) — ezt NE építsd újra
| Réteg | Állapot | Bizonyíték |
|---|---|---|
| **Bedrock POJO/enum + eladó-SSOT** | ✅ **KÉSZ + PUBLIKÁLVA** — `@futdevpro/fdp-templates@1.15.91` (CI ✅) | `803be1b` (FDP_INV POJO+enums) · `e100a1a` (`src/_constants/fdp-seller-invoice-data.const.ts`) |
| **Bedrock szamlazz.hu provider + VAT-resolver + invoicing service-base** | ✅ **KÉSZ + PUBLIKÁLVA** — `@futdevpro/nts-fdp-templates@1.15.93` (CI ⚠️ warning) | `7fa3ca6` |
| **Bedrock szerver-oldali FTP-kliens** (MP-duplikátum konszolidálása) | ✅ commitolva | `7dbd65c` (nts-fdp-templates) |
| **P1 — tárolás a token-service-ben** | ✅ **DEPLOYOLT** (token-service v01.15.196: `deploy` ✅ + `deploy-verify` ✅) | `2b0defe`: additív `TokenPurchase` mezők + **buyer-PII titkosítás** + FTP signed-URL (`ftp-url-signer.util.ts`, `invoice-pdf-storage.control-service.ts`) |
| **3-rétegű terv-struktúra** | ✅ létrejött | `159f0e7`: `__documentations/plans/HYPERPLAN-INVOICING-REFUND.md` + **7 master-plan** (`INV-P0..P6`) + **14 sub-plan** + LEDGER |

**⚠️ Takarítanivaló (a bukott session hagyta):** a token-service-ben **uncommitted** módosítás van 2 sub-planon
(`INV-SP-ftp-pdf-storage.md`, `INV-SP-invoice-pojo-enums.md`) + egy **untracked** `e2e/deep-timing.log`.
→ Nézd át, commitold vagy dobd el; a log-fájl ne kerüljön be.

**⚠️ CI-állapot (token-service v01.15.196): FAILED** — de a **deploy ZÖLD**; a pirosak: `dc-review-server` (5s),
`dc-review-client` (4s), `e2e-deep` (10m timeout — ismert flake). **Ezeket rendbe kell tenni.**

## 3. MI VAN HÁTRA (a te feladatod)
| Fázis | Tartalom |
|---|---|
| **P2** | **Számla kiállítása vásárláskor** — a bedrock service bekötése; 5-eset ÁFA-motor; számla-nyelv; MNB-árfolyam a HUF-ÁFA-riporthoz |
| **P3** | **User felület** — számla-letöltés a vásárlási előzményből (`acc-token-history`) |
| **P4** | **Admin felület** — számla-lista, keresés, újraküldés/újrageneráltatás, **sikertelen számlázások kezelése** |
| **P5** | **Refund + részleges refund (elállás)** — arányos elszámolás + helyesbítő számla + **online elállási funkció** |
| **P6** | **Checkout-nyilatkozatok** — 3-feltételes, verziózott, cserélhető szöveggel |
| **+** | A CI-pirosak (dc-review ×2) rendezése, `e2e-deep` flake |

---

## 4. A SPECIFIKÁCIÓ

### 4.1 ÁFA — a teljes eset-mátrix (mind AKTÍV R1-ben)
| # | Vevő | ÁFA | Számla-követelmény |
|---|---|---|---|
| 1 | HU magánszemély | **27%** belföldi | — |
| 2 | **HU cég** (adószámmal) | **27% belföldi** — ⚠️ *a fordított adózás NEM belföldre szól* | a vevő **adószáma** a számlán |
| 3 | EU (nem HU) cég **érvényes közösségi adószámmal** | **fordított adózás (0%)** | EU-adószám + kötelező szöveg |
| 4 | EU (nem HU) magánszemély | **27% HU** a 10 000 €/év küszöb alatt | — |
| 5 | EU-n kívüli (magánszemély vagy cég) | **ÁFA hatályán kívül** | + import-ÁFA megjegyzés |

- **Ha a vevő nem ad meg adatot → 27%** (könyvelői iránymutatás).
- **Az ÁFA ADATKÉNT** tárolódjon a számlán (kulcs + mód + jogi szöveg-kulcs) — **soha ne beégetett 27%**.
- **A 10 000 € NEM per ügyfél és NEM per ország** → az **összes** más EU-tagállamba irányuló **B2C** értékesítés
  **éves, összesített** összege (magyar vevők nélkül).

### 4.2 Kötelező R1-követelmények
1. **Checkout vevő-adatok:** vevő-típus (magánszemély/cég) · név · cím/ország · cégnél **adószám**.
   Előtöltés a futdevpro „personal information" lapjáról, **a checkoutban módosítható**, és a **tranzakcióhoz
   mentendő** — **titkosítva** (a kész `encrypt:true` bedrock-mechanizmust bekötve). *(P1-ben elvileg kész — verifikáld.)*
2. **VIES-ellenőrzés** a közösségi adószámra (a fordított adózáshoz kötelező).
   **Él-eset:** ha a VIES nem elérhető/timeout → **NE blokkolja a vásárlást**, retry; ha nem igazolható → **27%-kal
   számlázunk**, a vevő utólag kérhet helyesbítést. **A VIES-válasz (konzultációs szám + időbélyeg) MENTENDŐ**
   (jóhiszeműség bizonyítéka).
3. **Vevő-ország + bizonyíték mentése** minden vásárláshoz (Stripe számlázási ország · kártya-ország · IP-ország) —
   a teljesítési hely igazolásához **kötelező** (két, egymásnak nem ellentmondó bizonyíték).
4. **Éves futó számláló** a határon átnyúló EU-s **B2C** bevételre + **riasztás 70% és 90%**-nál (admin + e-mail).
   *(OSS-regisztráció és ország-kulcs tábla feltöltése NEM R1 — csak a riasztás után.)*
5. **Számla-nyelv:** a **user nyelve** szerint; HU / HU+EN.
6. **Devizanem: minden EUR.** A számla pénzneme is EUR; a HUF-ÁFA NAV-riporthoz **MNB-középárfolyam**
   *(minta: `fdp-assistant/cli/src/_collections/mnb-fx.util.ts`)*.
7. **Nincs retroaktív számlázás** — nincsenek meglévő vásárlások.

### 4.3 Elállás — arányos elszámolás (ÜGYVÉD ÁLTAL JÓVÁHAGYVA)
- **Képlet (jóváhagyva):** `visszatérítés(P) = maradék(P) / megvásárolt(P) × a P-ért ténylegesen fizetett ár`.
  A már felhasznált kreditet **NEM** kell utólag magasabb egységáron elszámolni.
- **A `maradék(P)`** a **FIFO** szerinti, még el nem költött rész az **élő egyenlegből** (`tokenBalance + lockedTokens`).
  ⚠️ **A levezetés MÁR LÉTEZIK:** `server/src/_collections/token/token-expiry.util.ts` → `computeTokenExpiry`.
  **Ne írj újat.**
- **A 14 nap A VÁSÁRLÁSTÓL indul** (szerződéskötés napja), nem az első felhasználástól.
- **Csak FOGYASZTÓ** — **céges vevőnél az elállás DISABLED / elutasítva** (owner-döntés). Ezért a vevő-minőséget
  (fogyasztó/vállalkozás) a vásárláskor **rögzíteni kell**.
- **Végrehajtás:** részleges Stripe-refund → **csak a visszatérített mennyiség** clawback-je (⚠️ a mai
  `_routes/admin/refund/refund.data-service.ts` `issueRefundDebit` a **TELJES** `tokensPurchased`-et vonja vissza →
  **átalakítandó**) → esemény-nyilvántartás (`reason: 'withdrawal-refund'`) → **idempotencia a Stripe `refundId`-vel**
  → **helyesbítő számla**.
- ⚠️ **ÚJ ÜGYVÉDI KÖVETELMÉNY:** kell **elállási nyilatkozatminta** ÉS **a weboldalon ONLINE ELÁLLÁSI FUNKCIÓ**
  (a jog online gyakorlására). A pontos tartalmi/működési követelményeket az ügyvéd adja meg.
- **A törvényi elállási jog NEM korlátozható** (visszaélés esetén az ÁSZF fiók-felfüggesztést fog engedni — az ő dolga).

### 4.4 Checkout-nyilatkozatok (3 feltétel)
(1) hozzájárulás az azonnali teljesítéshez · (2) tudomásulvétel, hogy az elállási jog **a felhasznált kredit
ARÁNYÁBAN** szűnik meg · (3) **e-mailes visszaigazolás** (tartós adathordozó).
**A pontos szöveget az ügyvéd adja** → **verziózottan, cserélhetően** építsd (a meglévő `LEGAL_TERMS_VERSION` +
consent-log mintájára). Céges vevőnél a jogvesztés-nyilatkozat **nem alkalmazandó**.

### 4.5 ⚠️ Árfeltüntetés (nyitott — ügyvédi válaszra vár)
**Mai állapot:** a csomag ára **NETTÓ**; `token-purchase.data-service.ts:127` → `cost = price × (1 + HU_vat)`; a
felület `t-purchase.component.html:26,210` **„{price}€ + VAT(27%)"**-ot ír ki → a 4,99 €-s csomagért **6,34 €**
terhelődik. **A bruttó, fizetendő végösszeget a csomag-listán ÉS a fizetési folyamatban IS ki kell írni** — ez
mindenképp fejlesztés. A pontos megjelenítést (nettó főhelyen + bruttó kisebben?) **az ügyvéd válasza dönti el**.

### 4.6 Kimerítő hibakezelés (KIEMELT owner-követelmény)
**Alaptézis: a számlázás bukása SOHA nem boríthatja a fizetést/jóváírást.**
Fedd le legalább: számlázó-API timeout/5xx/rate-limit · **részben sikeres állapot (fizetés OK + számla FAIL)** ·
duplikált számla-kísérlet (**idempotencia**) · sztornó/helyesbítő láncolat · hibás/hiányzó vevő-adat ·
FTP-feltöltés bukás · PDF-letöltés bukás · valuta/kerekítés élek · **párhuzamos refund + számlázás** ·
**retry-sor + dead-letter + admin-láthatóság**. **Minden ágra teszt** (unit + e2e).

---

## 5. AMI BLOKKOL (owner-oldal)
| Blokkoló | Állapot |
|---|---|
| **`FDP_SZAMLAZZ_TOKEN`** — szamlazz.hu fiók + Agent-kulcs (FDP Keystore) | 🔴 **owner-teendő**; ez az egyetlen jóváhagyott ÚJ env-név |
| **IBAN** | ❔ nem található; **nem blokkoló** (Stripe-on megy a fizetés) |
| Könyvelői megerősítés az ÁFA-mátrixra + küszöb-figyelésre + helyesbítő-számla ÁFA-ra | 🟡 levél kiment (2026-07-28) |
| Ügyvédi: nyilatkozat-szövegek + elállási formanyomtatvány + árfeltüntetés | 🟡 folyamatban (a mechanizmust addig is építjük) |

## 6. TILTÁSOK / SZABÁLYOK (nem tárgyalható)
- **TILOS új env-változó** az `FDP_SZAMLAZZ_TOKEN`-en kívül. Az FTP-URL **beégetett const** (ENV szerint test/prod);
  az **`FTP_URL_SIGNING_SECRET` MÁR LÉTEZIK** — ne vegyél fel újat.
- **Eladó-adatok:** **bedrock SSOT const** (`fdp-templates/src/_constants/fdp-seller-invoice-data.const.ts` — **kész**),
  mindenhol onnan olvasva, sehol nem duplikálva. Dokumentáció:
  `documentations/guidelines/development/fdp-seller-invoice-data.md`.
- **Patterns-first · SSOT · fix-forward (no workaround/rollback) · rich-error · dokumentálj mindent · e2e-hard-rule
  (automata feature-E2E, nem smoke) · no-polling · mindig master, commit+push.**
- **Munkamód:** fázis-szinkron — egy fázis → unit+e2e teszt → `dc review` → commit+push → **CI/CD zöld** → **megállsz
  és jelentesz**. Slow and steady.
- **A tervezés 3-rétegű marad:** HYPERPLAN (+LEDGER) → master-plans → sub-plans. A meglévő struktúrát **frissítsd**,
  ne kezdj újat.

## 7. KANONIKUS DOKSIK (ezeket olvasd el először)
| Mi | Hol |
|---|---|
| **A terv (3-rétegű)** | `LIVE-projects/fdp-token-service/__documentations/plans/HYPERPLAN-INVOICING-REFUND.md` + `plans/master-plans/INV-P0..P6` + `plans/sub-plans/` |
| Számlázási rés + döntések + ÁFA-mátrix | `LIVE-projects/fdp-token-service/__documentations/invoicing-gap-and-plan-2026-07-28.md` |
| **Elállás/arányos elszámolás terve** | `documentations/legal/_process/withdrawal-prorata-design-2026-07-28.md` |
| Eladó-adatok SSOT | `documentations/guidelines/development/fdp-seller-invoice-data.md` |
| Jogi kötelezettségek (flotta) | `documentations/legal/legal-obligations-ssot.md` |
| Ügyvéd-levelezés (döntések, zöld út) | `LIVE-projects/fdp-assistant/__documentations/legal-lawyer-communication.md` |
| Könyvelői input | `LIVE-projects/fdp-assistant/__documentations/accountant-communication.md` |
| Működő szamlazz.hu minta (élesben számlázott) | `LIVE-projects/fdp-assistant/cli/src/_auto/issue-invoice.ts` |

## 8. ELSŐ LÉPÉSEK (javasolt sorrend)
1. **Állapot-verifikáció:** a fenti „kész" tételek tényleg működnek-e (bedrock npm-verziók használhatók-e a
   token-service-ből; a P1 mezők/titkosítás/FTP-signed-URL tényleg élnek-e a deployolt v01.15.196-on).
2. **Takarítás:** uncommitted sub-plan módosítások + `e2e/deep-timing.log`.
3. **CI zöldre:** `dc-review-server` / `dc-review-client` pirosak.
4. **P2 indítása** (számla kiállítása vásárláskor) — az `FDP_SZAMLAZZ_TOKEN` megérkezése után élő-verifikálható.
