# Owner-koordináció — nyers backlog (My Assistant 3)

> **Ki írja:** *My Assistant 3* (a fő workspace-koordinátor session, amit az owner lát).
> **Létrehozva:** 2026-07-26 (vasárnap).
> **STÁTUSZ: ⛔ SEMMI NEM INDULT EL.** Ez a fájl kizárólag a nyers owner-inputok **hű rögzítése**, hogy
> ne vesszenek el. Minden tétel **TISZTÁZÁSRA VÁR** — az owner szerint előbb alaposan ki kell tisztázni a
> nagy képet, mielőtt bármihez hozzákezdenénk. NE tekintsd tervnek/feladatlistának.
>
> **Működésmód:** a fejlesztést NEM My Assistant 3 végzi — külön **CCAP-session** hajtja végre (átlátható),
> ha az owner úgy dönt. (Ez a session-specifikus mód; **NEM** globális memória, hogy más agentekre ne hasson.)

---

## 1. Ügyvéd — HÁROM külön szerep

Az owner szerint **három** ügyvéd/szerep kell (nem feltétlenül három személy, de a szerepek külön):

| # | Szerep | Mire | Állapot |
|---|---|---|---|
| **(A)** | ÁSZF / fogyasztói jog | a kiküldött launch-jogi csomag review-ja | 🟡 kiküldve, **nincs válasz** → sürgetés + alternatíva |
| **(B)** | Szerződés-jog (**fix** kapcsolat) | keret-/együttműködési/vállalkozási szerződések írása + review | ⬜ keresendő |
| **(C)** | **Cégügyintézés** | **cégcím-átírás**, **TEÁOR-szám** felírás, egyéb céges ügyintézés | ⬜ keresendő |

- **(A) jelenlegi ügyvéd:** a `documentations/legal/_kuldendo-ugyvednek/` csomag (ÁSZF, adatkezelés, cookie,
  creator-szabályzat, trust-safety-AUP) kiment, review-ra vár → **ez kapuzza a prod-élesítést.**
  **Következő:** friendly reminder (tervezet lent, owner-jóváhagyásra) **+ párhuzamosan alternatív ügyvéd.**

## 2. Szerződés-backlog (amit meg kell íratni/reviewztatni)

*(Prioritás-sorrend: TISZTÁZANDÓ.)*

1. **Egyszerű vállalkozási szerződés** kis melókhoz (pl. „honlapot készítek valakinek") — rövid, sablonozható.
2. **Együttműködési megállapodás — projekt-behozó jutalék:** aki **hoz egy projektet**, annak
   **profitjából 10%-ot** kap.
3. **OGS játékfejlesztő ↔ cég — hosszú együttműködési megállapodás** *(„majdnem kész", ügyvédi review kell)*.
   ✅ **HELYES forrás:** `OGS-projects/documents/Legal/szerzodes-v1/` — **00-terv · 01-keretszerzodes ·
   02-csatolmany-1-story-pont · 03-csatolmany-2-ogs-mukodes · 04-csatolmany-3-adatkezeles** (+ sablonok).
   *(A `.../source/…coredoc…` csak a KIINDULÁSI forrás volt — NEM ez a dokumentum.)*
4. **Keretszerződések** + további együttműködési megállapodások — jövőbeli, típusonként.
5. **ÁSZF** (l. §1/A).

## 3. Friendly reminder — TERVEZET (owner-jóváhagyásra, NEM elküldve)

> ⚠️ NEM küldtem el. Kell hozzá: (1) szöveg-jóváhagyás, (2) ügyvéd neve + küldés dátuma, (3) melyik
> e-mail-fiókból. *(Az fdp-assistant e-mail-toolkitje elérhető a küldéshez, ha az owner rábólint.)*

```
Tárgy: Friendly reminder — jogi dokumentumok review

Kedves [Ügyvéd neve]!

Röviden jelentkezem a [dátum]-án átküldött jogi dokumentum-csomaggal kapcsolatban
(felhasználói ÁSZF, adatkezelési tájékoztató, cookie-tájékoztató, creator-szabályzat,
trust-safety AUP). Meg tudná mondani, hogy tudott-e már ránézni, illetve körülbelül
mikorra várható a visszajelzés? Az élesítést ez a review kapuzza a mi oldalunkon.
Ha bármi kiegészítő anyag kell, szívesen küldöm.

Köszönöm, üdvözlettel,
[Owner neve]
```

## 4. Bevétel-irány — a „miből lesz leggyorsabban pénz" DOKSI

- **Az owner korábban készített egy doksit** arról, **mi kecsegtet a legnagyobb profit-potenciállal /
  miből lehet leggyorsabban pénz.** Ezt kell megtalálni.
- **VALÓSZÍNŰ találat (owner-megerősítésre):** `documentations/business/portfolio-monetization-priorities.md`
  (2026-07-14, „owner-jegyzet, projektpriorizálás, monetizációs prioritások"). Kapcsolódó:
  `documentations/business/profit-roadmap.md`, `.../temporary-notes/consultations/project-priority-consultation-result.md`.
- ⚠️ **A „mikro-munkák" (Upwork/hasonló) NEM ehhez tartozik** — az egy KÜLÖN, későbbi bevétel-ötlet,
  és **arról nincs doksi** (egyszer belekezdtünk máshol, feljegyzés nélkül).

## 5. Kapcsolódó rendszerek
- **My Assistant** (`LIVE-projects/my-assistant/`) — az assistant-munkák otthona (**ide tartozik ez a fájl**).
- **FDP Assistant** — e-mail-kezelés (TTB kész; az owner tervezi a többi e-mail-fiók hozzáférés-setupját → külön feladat).

## 6. NYITOTT KÉRDÉS az ownernek — böngésző-automatizálás blokk-mentesen
Az owner kérdése: hogyan lehet **blokk-mentes** böngésző-kezelést kialakítani (ne kapjon „ne használj botot"
jelzéseket), akár **saját Chromium-alapú böngészővel**, hogy „mintha az owner kezelné". → My Assistant 3
válasza a chat-ben; ha irányt választunk, ide kerül a döntés.

---

## 7. TISZTÁZVA (FAM-recall, 2026-07-26) — a pénz-szálak szétválasztva

FAM-ból előkerült a keresett doksi-lánc és a mikromunka helye:

**KÉT KÜLÖN pénz-nézet van, ne keverjük:**

- **(I) Termék-portfólió monetizáció** — `documentations/business/portfolio-monetization-priorities.md`
  (2026-07-14). **Forrás-lánc:** a projektpriorizálási **konzultáció** (`documentations/temporary-notes/
  consultations/project-priority-consultation.md` + `-result.md`) volt a *source*, abból lett ez a
  priorizálási doksi. **Üzleti-plafon sorrend:** 1) Dynamo Builder · 2) Master Prompter · 3) NIS Datasets ·
  4) Adventor · 5) Art Tarot. **Art Tarot = a leggyorsabb első-bevételig** (kis plafon). Ez a **„melyik
  TERMÉKből lesz pénz"** kérdés.

- **(II) Személyes bevétel-csatornák** — a 3x3/my-assistant rendszerben (`3x3/drawer/03-personal-context/
  life-goals.md` + `my-assistant/current/principles/mvp-focus.md`): **TERA / Upwork / Niche**. Ez a
  **„miből lesz pénz MOST, amit az owner maga csinál"** kérdés. **A mikromunka (Upwork) IDE tartozik** —
  NEM a termék-portfólióba. A mvp-focus szabály: a pénzkereső taskok mindig a lista TETEJÉN.

> **Következtetés:** a „mikromunka" nem a portfólió-priorizálás része, hanem **külön, azonnali
> bevétel-csatorna** (owner végzi → segítek → automatizáljuk). Mindkettő a céget táplálja, de két külön sáv.

## 8. Böngésző-automatizálás — architektúra-irány (döntésre)

- **MOST (járható, kevés munka):** az FDP Assistant meglévő böngésző-képességének **reprodukálása a
  My Assistantban** — külön adat/namespace (ne keveredjen a kétféle munka), hasonló képesség-csomag.
  ⚠️ Az FDP Assistant tartalma a SAJÁT `__agent/` mappájában van (nem claude-memben) → a reprodukcióhoz
  onnan kell mintát venni. **DEV-feladat → CCAP-session** (nem My Assistant 3 kódolja).
- **„Teljesen blokk-mentes" opció (későbbre, ha kell):** kétrétegű architektúra —
  **(a) input = OS-szintű** (RobotJS/nut.js: valódi egér/billentyű a valódi Chrome-ba → NULLA
  automatizálási ujjlenyomat) **+ (b) olvasás = böngésző-extension content-script** (a DOM-ot natívan
  olvassa, mint bármely bővítmény → nem bot-jel; NEM csak OCR, és NEM CDP-a-lapon). Részletes indoklás:
  My Assistant 3 chat-válasza, 2026-07-26.

## 9. Side-jegyzet — Hermes agent
Megvizsgálandó: **mit tud a Hermes agent** (képességek, illeszthető-e a fenti böngésző/assistant munkába).
Nem sürgős; felírva, hogy ne vesszen el.
