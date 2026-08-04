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

## 2. ⚠️ A REPÓ ÁLLAPOTA — AZ ELŐZŐ SESSION MUNKÁJA VISSZAGÖRGETVE
**Owner (2026-07-29): „rollback-eltettem vele mindent."** → az előző session által létrehozott kód/terv-artefaktumok
**NEM tekinthetők meglévőnek.** A korábbi verzióban itt szerepelt „mi van kész" lista (bedrock P0 publikálva, P1
deployolva, 3-rétegű terv) **ÉRVÉNYTELEN** — visszagörgetve.

**KÖTELEZŐ ELSŐ LÉPÉS:** a tényleges állapot **saját verifikációja** (`core-no-guessing`, measure-twice):
- `git log` + `git status` az érintett repókban (`fdp-token-service`, `fdp-templates`, `fdp-templates-nts`),
- npm-en publikált bedrock-verziók, ha bármi kikerült,
- CI/CD állapot (`fdp build-detail --project token-service`),
- takarítanivaló (uncommitted maradékok, log-fájlok).
**Ne építs semmit „már kész"-nek feltételezett alapra.**

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
| 5a | EU-n kívüli **magánszemély** | 🔴 **27% belföldi** — *javítva 2026-07-30* | — |
| 5b | EU-n kívüli **cég** | **ÁFA hatályán kívül** | + import-ÁFA megjegyzés |

> 🔴 **JAVÍTVA 2026-07-30:** a korábbi 5. sor („EU-n kívüli **magánszemély vagy cég** → hatályon kívül")
> **HIBÁS VOLT** — a könyvelő **K3** (2026-06-16) és **FU-K1** (2026-06-19, *svájci magánszemély → 27%*:
> *„Ez így helyes"*) a két esetet **szétválasztja**. A dev `SP-07` 10. esete végig helyes volt.
> *(Egy célzott re-konfirmáció a könyvelőnél felírva — l. `fdp-documentations/legal/_process/billing-gates-triage-2026-07-30.md` D/1.)*

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
6. **Devizanem — FRISSÍTVE (owner 2026-07-29):** **HU-fogyasztónak HUF-ban terhelünk** (Stripe multi-currency; a
   kiírt bruttó HUF = a levont összeg), **nem-HU vevőnél EUR**. ⚠️ **Élő árfolyam kell:** EUR→HUF (fogyasztói ár) ÉS
   **EUR→USD (belső token-számítás)** — ma a `token-conversion.util.ts`-ben az **`eurToUsd = 1.2` BE VAN ÉGETVE**, ami
   **némán erodálja a ráhagyást** (a providerek USD-ben számláznak). **A ráhagyás (profitRate 1.2 + operatingCostRate
   0.25 = 1.45×) VÁLTOZATLANUL marad.** Forrás: **MNB** — egy hívásból mindkét irány (EUR/USD = rate(EUR)/rate(USD));
   minta: `fdp-assistant/cli/src/_collections/mnb-fx.util.ts`. Kötelező: cache + **utolsó ismert árfolyam fallback**
   (soha ne blokkolja a vásárlást/generálást) + **a használt árfolyam ÉS dátuma mentendő** (audit).
   ⚠️ **Stripe multi-currency → másik bankszámla** kell a Stripe-beállításban (owner-teendő).
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

### 4.4 Checkout-nyilatkozatok (3 feltétel) + VEVŐ-MINŐSÉG NYILATKOZAT
⚠️ **A vevő-minőséget a CÉLRÓL kell nyilatkoztatni, nem a jogi formáról** (ügyvéd 2026-07-29): „magánszemélyként"
vs. „vállalkozás / egyéni vállalkozó / más szervezet nevében, **szakmai vagy üzleti célból**" — mert **fogyasztó
kizárólag természetes személy** lehet, DE az **egyéni vállalkozó fogyasztónak minősülhet**, ha a szakmai
tevékenységén KÍVÜLI célból vásárol. A választás **egyben a nyilatkozat** → ez dönti el az elállási jogot.
⚠️ **ÚJ:** a számla kiállításáról **e-mail értesítés** kell (a számlával vagy közvetlen letöltő-linkkel).

(1) hozzájárulás az azonnali teljesítéshez · (2) tudomásulvétel, hogy az elállási jog **a felhasznált kredit
ARÁNYÁBAN** szűnik meg · (3) **e-mailes visszaigazolás** (tartós adathordozó).
**A pontos szöveget az ügyvéd adja** → **verziózottan, cserélhetően** építsd (a meglévő `LEGAL_TERMS_VERSION` +
consent-log mintájára). Céges vevőnél a jogvesztés-nyilatkozat **nem alkalmazandó**.

### 4.5 Árfeltüntetés — ÜGYVÉDI ÁLLÁSFOGLALÁS MEGÉRKEZETT (2026-07-29)
**Fogyasztónál a BRUTTÓ az elsődleges ár — már a csomagválasztón is.** Az ügyvéd a „nettó nagyban + bruttó kicsiben"
tervet **elutasította**. Kötelező sorrend:
```
6,34 €                          <- elsődleges (ténylegesen fizetendő)
4,99 € nettó ár + 27% áfa       <- másodlagos, kisebb
```
A fizetési folyamat végén ismét egyértelműen a **teljes fizetendő összeg**.
**B2B:** a nettó lehet az elsődleges — **de CSAK azután**, hogy a vásárló vállalkozásként **azonosította magát**; a
közös csomagválasztón marad a bruttó.
🔴 **HUF:** magyar fogyasztónál a **kizárólag EUR-os feltüntetés nem megfelelő** → a **bruttó árat forintban** kell
elsődlegesen kiírni (az EUR kiegészítő). *(Mai kód: `t-purchase.component.html:26,210` „{price}€ + VAT(27%)";
`token-purchase.data-service.ts:127` `cost = price × (1 + HU_vat)`.)*

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
  `fdp-documentations/guidelines/development/fdp-seller-invoice-data.md`.
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
| **Elállás/arányos elszámolás terve** | `fdp-documentations/legal/_process/withdrawal-prorata-design-2026-07-28.md` |
| Eladó-adatok SSOT | `fdp-documentations/guidelines/development/fdp-seller-invoice-data.md` |
| Jogi kötelezettségek (flotta) | `fdp-documentations/legal/legal-obligations-ssot.md` |
| Ügyvéd-levelezés (döntések, zöld út) | `LIVE-projects/fdp-assistant/__documentations/legal-lawyer-communication.md` |
| Könyvelői input | `LIVE-projects/fdp-assistant/__documentations/accountant-communication.md` |
| Működő szamlazz.hu minta (élesben számlázott) | `LIVE-projects/fdp-assistant/cli/src/_auto/issue-invoice.ts` |

## 8. ELSŐ LÉPÉSEK (javasolt sorrend)
1. **Állapot-verifikáció:** a fenti „kész" tételek tényleg működnek-e (bedrock npm-verziók használhatók-e a
   token-service-ből; a P1 mezők/titkosítás/FTP-signed-URL tényleg élnek-e a deployolt v01.15.196-on).
2. **Takarítás:** uncommitted sub-plan módosítások + `e2e/deep-timing.log`.
3. **CI zöldre:** `dc-review-server` / `dc-review-client` pirosak.
4. **P2 indítása** (számla kiállítása vásárláskor) — az `FDP_SZAMLAZZ_TOKEN` megérkezése után élő-verifikálható.
