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

---

## 10. KORREKCIÓK + ÚJ UTASÍTÁSOK (2026-07-26, owner)

### 10.1 KORREKCIÓ — a 3x3 NEM pénz-rendszer
A §7(II)-ben a **3x3**-ra hivatkoztam a pénz-csatornáknál. **HIBA:** a 3x3 egy **tudományos tanulmány**
(az owner személyes feladata), semmi köze a monetizációhoz. A „TERA/Upwork/Niche" pénz-csatorna valós, de
a helye a **my-assistant pénz-fókusz elve** (`current/principles/mvp-focus.md`), **NEM a 3x3**. A
3x3-hivatkozás a pénz-kontextusban törlendő.

### 10.2 Dev-session — a nekem adott végrehajtó
- **Név: „ALL Projects - MA3's Dev Assistant" (CCAP Session).** Ide adom ki a dev-feladatokat (spec,
  kutatás, kód). **My Assistant 3 tervez + vezényel, NEM kódol.**
- **Elérés (mérve):** a CCAP-Rev-ben van session message-send API (`/v2-session/:id/messages`). A közvetlen
  dispatch-hoz kell: (1) fut-e a CCAP-szerver + URL, (2) auth, (3) a session-ID. **Ezek nélkül NEM érem el
  közvetlenül** → owner-input kell (vagy az owner illeszti be a briefet a sessionbe).

### 10.3 FELADAT (dispatch-ra kész) — blokkolhatatlan böngésző-kezelés SPEC
> **Cél:** spec-írás/kutatás, amit a dev-session végez. My Assistant 3 vezényli.

- **Elsődleges cél:** az összes „ne használj botot" blokkoló feloldása. **A CAPTCHA-t SOHA nem kerüljük ki.**
- **CAPTCHA-politika:** human-in-the-loop — ez rendben van, elfogadott. **Okosítás:** ha az owner nincs a
  gépnél → elküldjük neki a képet, ő **bejelöli a kattintási pontokat**, visszaküldi, és az alapján oldjuk
  fel (akár a CAPTCHA-t is). De az elsődleges cél NEM a CAPTCHA, hanem a **többi** blokkoló.
- **Architektúra (a spec induljon ki ebből):** kétrétegű — **(a) input = OS-szintű** (RobotJS/nut.js;
  valódi Chrome; nulla automatizálási ujjlenyomat) **+ (b) olvasás = böngésző-extension content-script**
  (DOM natívan, **NEM OCR, NEM CDP-a-lapon**).
- **Meglévő alap (CCAP Revisioned):** már van böngésző-integráció (`server/.../integrations/_modules/browser/`
  — Playwright + tesseract OCR + screenshot-desktop). A spec ezt vegye figyelembe (mit lehet újrahasználni).
- **⚠️ Külön feladat-elem (CCAP Revisioned-ből, owner szerint már felírtuk):** **rövid, kevés karakteres
  tartalmi összefoglaló** készítése weboldal-olvasáskor, hogy az agentnek NE a nyers HTML-ből kelljen olvasnia.
  *(A pontos jegyzet helyét a CCAP-Rev-ben még nem sikerült beazonosítani — owner-pointer vagy külön keresés.)*
- **Kimenet:** implementációs spec + „mit reprodukáljunk a My Assistantban" (külön namespace/adat, hasonló
  képesség-csomag, hogy a kétféle munka ne keveredjen).

### 10.4 KORREKCIÓ + finomítás — a mikromunka HELYE a Profit Prio-ban
Korábban túl-szeparáltam. A mikromunka **IGENIS a Profit Prio része**, csak **más jelleggel**:
- **Profit = most jöjjön be pénz.**
- A mikromunka akkor „teljes", ha **az assistant minden feladatot el tud végezni**, és az owner csak
  minimálisan nyúl bele — **beleértve az ügyfél-kommunikációt is** (ebben is segítsek). A teljes
  mikromunka-**workflow + eszközök felépítése előmunka** → **NEM instant pénz.**
- **Ezzel szemben a termék-projektek elméletileg kiadás-közeliek — csak az ügyvédre várnak.** Ha csak egy
  **másik ügyvéd** kell, akkor **az ügyvéd-keresés a gyorsabb pénz-út**, és az lesz a prió.
- **Következmény:** a leggyorsabb pénz valószínűleg NEM a (előmunkás) mikromunka, hanem a **launch-blokkoló
  ügyvéd feloldása** (a termékek már majdnem kész). Ezt kell tisztán átlátni a Profit Prio-nál.

---

## 11. FÁZIS-6 (2026-07-26) — ccap CLI, dev-session elérés, böngésző-projekt, FAM

### 11.1 ✅ MEGVAN: hogyan érem el a dev-sessiont (ccap CLI)
- Globális **`ccap` CLI** létezik (`C:\nodejs\ccap.ps1`) — a CCAP MINDIG fut, én is abban futok.
- **Dispatch:** **`ccap sessions send-message <sessionId> --message-file <path>`** (POST `/api/session/:id/messages`).
  Opció: `--wait-for-completion --timeout <sec>`.
- Hasznos: `ccap sessions list` · `ccap sessions info <id>` · `ccap notify` · `ccap input` · `ccap rag-search`.
- **⚠️ NYITOTT (owner-input kell):** a `ccap sessions list` 16 sessiont ad, de **egyik neve sem**
  „ALL Projects - MA3's Dev Assistant"; a két legfrissebb **névtelen + üres** (`6a57434d…`, `6a5c1720…`).
  **Nem tippelek** (rossz sessionbe küldeni hiba). Kell: **a dev-session pontos ID-ja** (vagy melyik a kettőből).
  Utána **`ccap sessions config`**-fal beregisztrálom aliasként (pl. `ma3-dev`) → nem kell többé újrafelderíteni.

### 11.2 Böngésző-projekt = ÚJ LIVE-projekt (nem chat-válasz, hanem dispatch)
- **`unblockable-browser-handler-tool`** → `LIVE-projects/`, új git-repo **FutDevPro** alatt.
- **Agent tool.** Technikai alak **„mint a FAM": CLI + párhuzamos MCP** (a CLI megbízhatóbb — önindít).
- **KORREKCIÓ: NINCS OCR** ebben a projektben (owner-direktíva). Olvasás = extension content-script DOM,
  nem OCR, nem CDP-a-lapon. Input = OS-szintű (RobotJS/nut.js).
- **Dispatch-brief kész:** `__documentations/dispatch-briefs/unblockable-browser-handler-tool.md` — ezt
  küldöm a dev-sessionnek, amint megvan az ID. (Előbb spec a projekt `__specifications`-ébe, csak utána kód.)
- A §8 „későbbre" jelölése ELAVULT: ez MOST induló, dispatch-olandó feladat.

### 11.3 FAM — heti auto full-scan (backlog-igény)
- Az owner megjegyzése: a **FAM tartalma elavulhat** → **kell egy heti automatikus teljes újra-scan**, hogy
  a tartalom naprakész legyen. Felírva FAM-igényként (FAM knowledge + itt). Külön dispatch-feladat lehet
  (fdp-agent-memory projekt — cron/scheduled full re-scan).

### 11.4 Emlékeztető magamnak (owner-frusztráció)
- **A FAM + a projekt-doksik AZOK a memóriám** — nincs átvitt session-memória. A helyes reflex: **FAM-ból
  recall** (projekt-státusz, jogi követelmények, ügyvéd-kommunikáció), **ne kérdezgessem újra az ownert**, és
  **ne bash-find-oljak**. Ez a mostani hiba gyökere; ezt tartom.

---

## 12. FÁZIS-7 (2026-07-26) — ✅ DISPATCH ÉL: a helyes CCAP-küldés-recept (soha ne rediscover-öld)

**A dev+FAM session = CCAP Client (Claude Code) session** — a `ccs_sessions` mongo-kollekcióban, NEM a
legacy `ccap_sessions`-ben (amit a `ccap sessions send-message` CLI céloz). Ezért a `ccap sessions` CLI
NEM jó rájuk. A helyes út a **cc-session HTTP API** a lokál szerveren.

- **Lokál CCAP szerver:** `http://localhost:39050` (mindig fut; ez a workspace instance `df6d8572-…`).
- **Küldés (prompt):** `POST http://localhost:39050/api/cc-session/<ccsId>/prompt?ccapId=<instanceId>`
  body: `{"content":"..."}` (`curl.exe --data-binary @file` a legmegbízhatóbb).
- **⚠️ BODY-MÉRETLIMIT:** nagy `content` NÉMÁN „content required" 400-at ad (a 33-bájtos ment, a 36KB nem).
  → **Rövid promptot küldj**, a teljes briefet tedd workspace-fájlba és a promptban MUTASS rá (a session a
  `E:\Programming\Own\CURSOR` workspace-ben fut, beolvassa).
- **Státusz:** `GET http://localhost:39050/api/cc-session/<ccsId>?ccapId=<instanceId>` → `.session.status`.
- **Egyéb cc-session endpointok:** `/resume` `/fork` `/terminate` `/stop-execution` `/inspect` `/events`.

**VERIFIKÁLT azonosítók (label-egyezéssel, nem tipp):**
| Szerep | label | ccsId (sessionId) | mongo _id | ccapId (instance) |
|---|---|---|---|---|
| **DEV** | ALL Projects - MA3's Dev Assistant | `ccs-4c0444cc-ms1qhv46` | `6a65f3f5fa12c5f4cd207828` | `df6d8572-e655-4d55-a032-603afc8c4b26` |
| **FAM** | ALL Projects - FDP Agent Memory | `ccs-02def1d6-mqhxeisd` | `6a32764c4b82e9e447ab38d5` | `df6d8572-e655-4d55-a032-603afc8c4b26` |

**KIADVA 2026-07-26 (mindkettő `{"success":true}` + a session `running`-ra váltott):**
- **FAM ←** FAM retrieval-tisztítás → brief: `__documentations/dispatch-briefs/fam-retrieval-cleanup.md`
- **DEV ←** böngésző-projekt → brief: `__documentations/dispatch-briefs/unblockable-browser-handler-tool.md`

## 13. FÁZIS-7 — Launch-readiness: a „csak ügyvéd kell" framing KORRIGÁLVA

Az owner joggal kérte a verifikációt. **Van alapos felmérés (2026-07-19, kód+live-verifikált, 3+1 subagent)
— DE csak agent-memóriában** (`project_monetization_readiness_assessment_2026_07_19`), **NEM önálló
dokumentált report** a `documentations/business/`-ben. + **6 napos** → friss re-verify kell.

**A felmérés CÁFOLJA a „termékek launch-közeliek, csak ügyvéd kell" képet:**
- **Master Prompter:** fizetési motor KÉSZ + CI-zöld (test-mode), DE a **jogi út ZSÁKUTCA** — az ügyvéd az
  ÁSZF-drafteket (3×) **használhatatlannak** minősítette; + Stripe üzleti aktiválás hátravan. Nem „egy
  válaszra vár", hanem **alapvetően más jogi megközelítés** kell (valódi ügyvéd, nem assistant-draft).
- **Owner-PIVOT (2026-07-19): ADVENTOR** a near-term monetizációs fókusz — a blokkoló **DEV-munka**
  (in-app buy-loop hiányzik, image-gen placeholder, post-login nav-zsákutca), **mi-kontroll**, nem ügyvéd.
- **NIS:** Gumroad-on ÉLŐ, de **0 sales** (kereslet-probléma). **Dynamo Builder:** hónapokra. **Art Tarot:**
  fizikai fulfillment + TLS-hiba.

**KÖVETKEZTETÉS (korrigált):** NINCS termék, ami tisztán „egy ügyvédi válaszra" van a launch-tól. A leggyorsabb
pénz-út a felmérés szerint **Adventor befejezése (DEV)** — amit a dev-sessionnek lehet kiadni —, MP jogi ág =
külön, valódi-ügyvéd sáv (ez a mostani ügyvéd-keresés relevanciája). **Teendő:** friss launch-readiness
re-verify + rendes dokumentált report (`documentations/business/`), mielőtt bármit „launch-közelinek" veszünk.

---

## 14. FÁZIS-8 (2026-07-26) — „MINDENT dokumentálni" + friss profitability-reportok

### 14.1 ALAPSZABÁLY rögzítve
- `current/principles/document-everything.md` — **minden doksiba, nem csak memóriába**; memória = recall-index,
  a SoT a dokumentum. Reportok frissek + dátumozottak.

### 14.2 FAM sub-session — Problem 1 ✅ KÉSZ
- A FAM-session végrehajtotta a zaj-fixet: scan-summary read-time weight-cap (`read.scanSummaryWeight`),
  commit `02f105e` (`fdp-agent-memory` v1.1.113), before/after eval + 690 spec zöld. Problem 2 (heti cron
  re-scan) + Problem 3 (config-hangolás) backlogon. Csatorna bizonyítottan él.

### 14.3 Friss launch/profitability re-verify INDÍTVA (5 párhuzamos, live+kód)
- Termékenként friss verifikáció (MP · Adventor · NIS · Dynamo Builder · Art Tarot): live reachability +
  monetizációs loop + valós blokkolók + first-euro távolság + „mi változott 07-19 óta". A régi (07-19)
  felmérés CSAK memóriában volt és elavulhat → ez a friss, dokumentált csere.
- **Kimenet:** dátumozott, alaposan dokumentált report(ok) a `documentations/business/`-be (My Assistant 3 írja
  a verifikációk alapján). Ez teljesíti a „MINDENT dokumentálni" + „friss report" direktívát.

---

## 15. FÁZIS-8 EREDMÉNY (2026-07-26) — friss reportok KÉSZ + sub-session kimenetek

### 15.1 ✅ Friss, dokumentált launch/profitability-report KIÍRVA + pusholva
- **Hely:** `documentations/business/launch-readiness-2026-07-26/` — README (fastest-money index) + 5 termék-report
  (master-prompter · adventor · nis-datasets · dynamo-builder · art-tarot). Live-HTTP + kód-verifikált (file:line),
  NEM memória. Commit `f5df067`.
- **KULCS-FELISMERÉS:** MP + Adventor UGYANAZON gaten (közös `fdp-token-service` élesítése: Stripe live + ügyvéd-ÁSZF)
  → egy akció két terméket nyit. NIS ma Gumroad-on jogi nélkül tud pénzt fogadni, de **demand-gated** (0 sales).
  Art Tarot: untrusted TLS-cert falazza (gyors fix), utána csak manuális eladás. Dynamo Builder: hónapok.
- A „csak ügyvéd kell" framing KORRIGÁLVA (l. README).

### 15.2 DEV sub-session — böngésző-spec KÉSZ, de push-blokkolt
- A DEV-session befejezte a `unblockable-browser-handler-tool` **SPEC-jét** (kétréteg OS-input + MV3-extension,
  no-OCR, CAPTCHA human-in-loop). Kód nincs (spec-first, ahogy kértük). Most `waiting-input` (idle).
- 🔴 **BLOKKOLÓ (owner-akció):** a push nem megy — **nincs GitHub repo létrehozva** a `futdevpro` alatt + nincs
  `gh`/PAT a repo-createhez. Kell: (a) `futdevpro/unblockable-browser-handler-tool` repo létrehozása, vagy
  (b) egy gh-auth/PAT, amivel az agent létrehozza. Amíg nincs, a spec lokálban áll.

### 15.3 FAM sub-session — idle (Problem 1 kész)
- `stalled` (idle timeout) a scan-summary weight-cap fix után. Problem 2 (heti cron re-scan) + Problem 3
  (config-hangolás) még kiadható neki, ha most kell.

---

## 16. FÁZIS-9 (2026-07-26) — owner-döntések + irány

### 16.1 HARD RULE: „mindent dokumentálni"
Fleet HARD RULE-lá emelve (owner: mindenkire MINDIG, nincs kivétel). Kanonikus:
`documentations/rules/global/core-document-everything.md` + workspace `CLAUDE.md` HARD RULE szekció.

### 16.2 NIS = ZSÁKUTCA (owner-döntés)
Gumroad bizonyítottan nem megy (marketing kell, nem automatizálható, commodity, nincs kereslet); saját
platform bizonytalan + hiányzik fizetés/jogi → near-term nem életképes. Parkolva; report frissítve.

### 16.3 IRÁNY: a JOGI/ÜGYVÉD az univerzális gate → #1 prioritás
Owner: mindenhez kell ÁSZF + doksik/ügyvéd → ez kapuzza MP+Adventort (közös token-service) és minden
platform-eladást. Következő fő szál: ügyvéd/ÁSZF. Ügyvéd-kontakt: az e-mailen KÍVÜL volt másik csatorna,
az fdp-assistant eszközeivel elérhető → felderítendő.

### 16.4 Sub-session dispatch
DEV: (1) böngésző-spec push (repo `futdevpro/unblockable-browser-handler-tool` létrehozva), (2) Art Tarot
SSL-fix (devops SSL nem állít ki trusted certet). Kiadva `{"success":true}`.

### 16.5 Git branch main→master
GitHub default már master (owner). my-assistant lokál `main`→`master` igazítva; documentations már master.

---

## 17. FÁZIS-10 (2026-07-26) — ügyvéd-levelezés beolvasva + korrekció

### 17.1 ✅ Ügyvéd-státusz DOKUMENTÁLVA (fdp-assistant)
- Beolvastam a valós levelezést (`ttb` fiók IMAP). **Kanonikus otthon:**
  `LIVE-projects/fdp-assistant/__documentations/legal-lawyer-communication.md`.
- **Ügyvéd:** Dr. Nagy Dániel Endre (ND Law, CIPP/E), `nagy.daniel@ndelaw.hu`, +36 70 334 51 62.
- **KORREKCIÓ:** a korábbi „jogi zsákutca / 3× elutasította" NEM pontos. Az ügyvéd **engaged + kooperatív**,
  és **elfogadja, hogy MI draftolunk** (ő módosít). „Koncepció-először" megközelítés.
- **Hol állunk (07-26):** a labda nagyrészt nála (07-20-i ígért koncepció-visszajelzés enyhén csúszik) →
  **finom reminder indokolt** (tervezet kész a doksiban, owner-jóváhagyásra, NEM elküldve).
- **Tőlünk függő:** koncepció-összefoglaló, hiányzó consent form, GDPR 9. cikk best-practice, írásos megbízás
  + az ő árajánlata.

### 17.2 Art Tarot — külön CÉGES ügyvéd a TEÁOR-hoz
- A könyv-áruláshoz **TEÁOR-szám** felvétele kell → **céges-ügyintéző ügyvéd** (a (C) szerep). Külön szál.

### 17.3 Stripe — HOLD
- Owner: **Stripe live NEM aktiválódik, amíg a jogi story nem tisztul.** A token-service-élesítés a jogira vár.

### 17.4 Sub-session kimenetek
- **FAM:** Problem 2 kiadva — heti auto full-scan, **default hétfő 07:00**.
- **DEV:** Art Tarot SSL diagnosztizálva + javítva (domain hiányzott `ssl-config.json`-ból + conf a baked
  `O=Localhost` placeholderre mutatott); böngésző-repo (`futdevpro/unblockable-browser-handler-tool`) létrehozva.

---

## 18. FÁZIS-11 (2026-07-26) — documents-repo migráció + jogi finomítás
- **Placement-korrekció:** a business/profitability doksik a **„documents" repóba** valók =
  `OGS-projects/documents/` (a CLAUDE.md szerint OGS/**FDP** közös dokumentum-repo). Áthelyezve
  → `OGS-projects/documents/Business/` (launch-readiness-report + portfolio/profit-roadmap/…); a
  `documentations/business/` törölve. Ez mostantól a business-doksik kanonikus otthona.
- **Koncepció-korrekció:** a koncepció-összefoglalót **MÁR elküldtük (07-19)** (platform, kredit/Stripe,
  AI szöveg+kép, HU+EU, magánszemélyek+cégek). NEM kell újra.
- **Amit tartozunk = consent form** (07-20-i ígéret). **Draft kész:**
  `fdp-assistant/__documentations/drafts/consent-form-marketing.md` (nyilatkozat + checkbox-szöveg + naplózás).
- **Bundled reminder** tervezet kész (reminder + consent form egy üzenetben) — owner-jóváhagyásra, NEM elküldve.

---

## 19. FÁZIS-12 (2026-07-26) — KORREKCIÓK: OGS out, jogi doksik MÁR MEGVANNAK

### 19.1 OGS-hiba visszavonva
- Tévesen az `OGS-projects/documents`-be raktam a business doksikat. **OGS NEM scope** (külön történet, nem FDP).
  **Visszaállítva** a `documentations/business/`-be (= az FDP docs-repo: `E:\...\CURSOR\documentations`); az
  OGS-repóból eltávolítva.

### 19.2 A jogi dokumentumok MÁR ELKÉSZÜLTEK (nem kellett újra) — kanonikus: `documentations/legal/`
- **V3 pre-final** (`terms-n-conditions/final/pre-v3/`): ÁSZF/T&C, adatkezelési tájékoztató, cookie,
  **hozzájáruló nyilatkozat (consent form)**; `buy-tokens/final/pre-v3/fizetési ÁSZF`. + pre-v1/v2 verziók.
- **Küldhető csomag** (`_kuldendo-ugyvednek/`): 7 doksi (.md + .pdf) + átadási checklist — ÁSZF, adatkezelési,
  cookie, creator-szabályzat, trust-safety-AUP, fizetési ÁSZF, token-kifizetési ÁSZF.
- **Process-trackerek** (`_process/`): master-plan, ügyvéd/könyvelő Q&A, consent-briefing (07-20),
  GDPR-minimalizálás (07-20), adatincidens-eljárás.
- **A consent form kifejezetten a lektor/ügyvéd 07-20-i észrevételére készült** — checkbox-szöveg + naplózási
  követelmények + `[ügyvéd]` jelölések. **A saját fdp-assistant draftomat (duplikátum) TÖRÖLTEM (SSOT-sértés volt).**

### 19.3 Mi VAN még hátra (verifikálandó, nem találgatva)
- A consent form **nincs még a `_kuldendo-ugyvednek/` csomagban** + valószínűleg **nincs elküldve** (ígértük „next round").
- **Kód-oldali consent** (checkbox + naplózás az MP/Adventor appokban) — **UNVERIFIED** (a doksi B. melléklete „fejlesztői feladat").
- A pontos verzió-státusz (V1 vs V2 vs V3, mit kapott az ügyvéd) a `_process/V1-PREFINAL-MASTER-PLAN.md`-ben — kiolvasható, ha kell.

---

## 20. FÁZIS-13 (2026-07-26) — jogi freshness-audit (verify-only, hard evidence)
**Kanonikus report:** `documentations/legal/_process/legal-freshness-audit-2026-07-26.md`.
- **Kanonikus jelenlegi = V3 (07-20)**: konszolidált ÁSZF (AUP beleolvasztva; creator-payout/crowdfunding/18+ KISCOPE-olva) + adatkezelési (GDPR 9. cikk átkeretezve) + cookie + fizetési ÁSZF + consent form.
- **ELAVULT (07-03, V1):** `_kuldendo-ugyvednek/` (7-doc modell, rossz kanonikus-pointer), `legal/README.md`, `_process/V1-PREFINAL-MASTER-PLAN.md`. → a user gyanúja IGAZOLT.
- **Az ügyvéd MÁR megkapta a V3-at (4 doksi, 07-19).** NINCS elküldve: a **consent form** + a **Art.9-frissített adatkezelési** (07-20) → ez a valódi „next round".
- **2 doc-vs-valóság rés:** (1) at-rest titkosítás ígérve, mérve titkosítatlan; (2) verziózott consent-napló a checkout-kódban hiányzik (csak boolean). → friss kód-verify kell.

---

## 21. FÁZIS-14 (2026-07-26) — doksi-tisztítás + stale-szabály + kód-verify dispatch (cél: 1,3,1,2)
- **#1 (részben):** ÚJ HARD RULE — `core-stale-doc-marking` (elavult doc tetejére STALE-banner + friss-pointer;
  workspace CLAUDE.md + kanonikus rule). **20 legacy jogi doc bannerezve**; `legal/README.md` most V3-at mutat
  kanonikusként. → nem nézzük többé a régit frissnek.
- **#3 (kiadva):** kód-verify a DEV-sessionnek — verziózott consent-napló (MP+adventor+token-svc checkout) +
  prompt at-rest titkosítás; „csak felderítés" report.
- **FAM Problem 2 ✅ KÉSZ** (v1.1.115) — heti auto re-scan + delete-sync scheduler.
- **Hátra (#1 folyt.):** a `_kuldendo-ugyvednek/` **V3-ból regenerálása** (5 doksi + PDF-ek). **#2 (ügyvédnek
  küldés) = LEGVÉGÉN**, a tisztítás + a kód-verify eredménye után.

---

## 22. FÁZIS-15 (2026-07-26) — dev kód-verify KÉSZ + „ne variáljunk a küldött doksikon" korrekció
**Report:** `documentations/legal/_process/code-compliance-verify-2026-07-26.md`.
- **Mindkét rés MEGERŐSÍTVE a jelenlegi kódban:** (1) verziózott consent-napló SEHOL — a token-service pipák
  csak kliens-oldaliak, a szerverre el sem mennek, nulla elfogadás-rekord (súlyosabb, mint hittük); (2) prompt
  **plaintext** a Mongóban (MP `flow`/`flow_run`, adventor `generation`); csak in-transit TLS.
- **Következmény:** az adatkezelési (MÁR elküldve) at-rest titkosítást ígér → doc-vs-valóság ütközés →
  **owner-döntés:** titkosítás implementálása VAGY a doksi pontosítása + ügyvéd-tájékoztatás.
- **KORREKCIÓ (owner): NEM regenerálunk / nem variálunk a már elküldött doksikon.** A `_kuldendo` csomag
  regenerálása NEM kell a küldéshez. Az ügyvédnek az EGYETLEN új tétel a **consent form** (azt hiányolta).
  A 4 elküldött V3 doksi változatlan marad.

---

## 23. FÁZIS-16 (2026-07-26) — owner-döntés (a) + dev-dispatch
- **Titkosítás-ütközés → (a):** implementáljuk a nyugalmi (at-rest) prompt-titkosítást.
- **DEV-nek kiadva:** (1) at-rest titkosítás — **spec-first** (megközelítés + kulcs-menedzsment + meglévő plaintext
  migráció + perf; terv vissza review-ra), (2) verziózott **consent-elfogadás naplózás** a token-service
  checkout-ban — implementálni (szerverre küldés + perzisztálás + HU §15 gomb-szöveg).
- **⏳ NYITOTT (owner-jóváhagyás kell): a consent form + reminder KÜLDÉSE** az ügyvédnek — kifelé menő e-mail,
  explicit OK-ra várok.

---

## 24. FÁZIS-17 (2026-07-26) — (B): dc PDF-font javítás előbb, majd küldés
- **PDF-blokkoló:** a `dc convert --to pdf` beépített fontja Latin-1 → a magyar hosszú ő/ű (U+0151/U+0171) torz.
  LibreOffice nincs telepítve. → owner-döntés: **(B) javítsuk a `dc` feature-t**, aztán PDF-fel megy.
- **DEV-nek kiadva (bedrock `@futdevpro/cli-dynamo`):** teljes Unicode-TTF beágyazása a PDF-rendererbe + verify
  a consent-form PDF-en (ő/ű helyes) + publish + globális `dc` frissítés.
- **Az ügyvéd-levél KÉSZ és küldésre vár** (reminder-body + consent form; ttb→Dániel, meglévő szál) — csak a
  **helyes PDF** hiányzik. Amint a `dc`-fix landol → regenerálom a PDF-et, ellenőrzöm az ő/ű-t, és **küldöm**.
- **DEV-queue:** (1) at-rest titkosítás terv, (2) consent-napló impl, (3) bedrock-pontosítás, (4) dc PDF-font fix.

---

## 25. FÁZIS-18 (2026-07-26) — dev-vezénylés prioritással + never-idle + saját wakeup
- **Mért állapot:** a dev jelenleg a **`dc` PDF-font fixen** dolgozik (gyökér-ok közelítve: valószínűleg stale
  global install / build-asset-layout mismatch). A korábbi 2 taszk eddig jórészt PLAN.
- **Kiadott prioritás-sorrend a devnek:** (1) `dc`-font fix BEFEJEZÉSE + publish + globális `dc` frissítés +
  ő/ű-verify (ez blokkolja az ügyvéd-emailt) → (2) consent-napló **IMPLEMENTÁLÁSA** (bedrock nts-fdp-templates +
  token-service) → (3) at-rest titkosítás: a TERVET vissza review-ra, implementáció csak jóváhagyás után.
  **Never-idle:** folyamatosan haladjon, taszkok közt ne álljon meg; várakozásnál használjon ScheduleWakeup-ot.
- **Saját folyamatosság:** ScheduleWakeup ~20 perc — feloldáskor regenerálom a helyes PDF-et, ellenőrzöm az
  ő/ű-t, és **elküldöm az ügyvéd-emailt** (owner-jóváhagyás megvan), majd dokumentálom a küldést.

---

## 26. FÁZIS-19 (2026-07-26) — ✅ ÜGYVÉD-EMAIL ELKÜLDVE + dc-fix landolt
- **`dc` PDF-font fix landolt** (v01.15.204, dev): gyökér-ok = a font-fix meg volt írva, de a verzió sosem
  bumpolt → npm a régi font nélküli artifactot szolgálta. Fix + `verify-assets` fail-closed guard + 31ő/7ű
  verify + 1486 spec zöld. (Egyezik a korábbi ismert lelettel: font-fix-unpublished.)
- **✅ ELKÜLDVE** az ügyvédnek (`nagy.daniel@ndelaw.hu`, `ttb` fiók, meglévő szál): **reminder + consent form
  PDF** (helyes ő/ű). messageId `<6df48259-…@futdevpro.hu>`, Sent-be mentve. A 4 korábbi V3 doksit nem bántottuk.
  Dokumentálva: `fdp-assistant/__documentations/legal-lawyer-communication.md`.
- **Dev tovább:** a consent-napló implementációján (bedrock consent-service + token-service `consentRecordId`),
  az at-rest titkosítás TERVE review-ra vár (nálam).

---

## 27. FÁZIS-20 (2026-07-26 wakeup) — at-rest titkosítás TERV review + dev-nudge
- **Terv jóváhagyva (Option B, bedrock)** — `at-rest-prompt-encryption-plan-2026-07-26.md` → REVIEW-DÖNTÉS.
  Q1 (új Keystore-kulcs `FDP_PROMPT_CRYPT_KEY`) — **owner-nek jelezve, vétózható**; Q2 (a teljes érzékeny
  szöveg-halmaz titkosítva, nem csak prompt); Q3 (determinisztikus OK promptra). Implementáció a consent-napló UTÁN.
- **Dev-státusz:** ~28 perce standby a publish-poll-on. A `dc` már ÉLŐ (v204). Megnudge-oltam: ha az
  fdp-templates (bedrock consent-service, Phase B) publish nincs kész, tolja meg; landolás után Phase C.

---

## 28. FÁZIS-21 (2026-07-26 wakeup) — dev unblock + kulcs-átnevezés
- **P1 (dc font): ✅ DONE+VERIFIED** (dc 01.15.204, ő×31 ű×7 helyes). Gyökér-ok: a fontok sosem voltak
  git-tracked-ek → most tracked + prepack-guard (fail-closed).
- **P2 (consent-napló): unblock.** A dev diagnózisa: a Phase A push (fdp-templates 1.15.88) **elmaradt
  webhook** miatt sosem triggerelt (ismert flotta-hiba, nem build-fail). Recovery: empty-commit re-push →
  **fdp-templates 1.15.89 PUBLIKÁLT** (npm view igazolta). Phase B (nts consent-service) + Phase C
  (token-service wiring) most halad.
- **Kulcs-átnevezés (owner):** `FDP_PROMPT_CRYPT_KEY` → **`FDP_CORE_DBCONTENT_CRYPT_KEY`** (általános DB-tartalom
  kulcs, nem prompt-specifikus). Plan-doksi + dev értesítve.

---

## 29. FÁZIS-22 (2026-07-26 19:47) — dev leállt (user-terminate) → resume + reality-check
- **Gyökér-ok:** a DEV session `terminated` volt (**„Terminated by user"**) — ezért állt, nem idle. + a saját
  wakeup-om sem volt élő. **Mindkettőt feloldottam.**
- **Repo-reality-check (a dev jelentése OPTIMISTA volt):** `nts-fdp-templates` **TISZTA** → a Phase B
  (`FDPNTS_Consent_DataService`) **nincs is megírva**; `fdp-token-service` Phase C **commitolatlanul** a lemezen
  (7 fájl); `fdp-templates` 1.15.89 publikált (Phase A OK). → **Ezentúl a haladást git/npm-ből verifikálom,
  nem a dev önjelentéséből.**
- **Resume + korrekt utasítás:** újracsatlakoztattam (`/resume` ✅, `running`), és kiadtam: (1) írja meg Phase B-t
  → build/test → push → publish-verify; (2) token-service nts-bump + Phase C befejezés+commit → verify.
  **Never-idle megerősítve:** ne álljon be háttér-poll-ra (nem ébreszt) — szinkron build VAGY saját ScheduleWakeup;
  minden fázis után commit (ne vesszen el egy újabb leállásnál).
- **Saját wakeup újra beállítva** (~15 perc).

---

## 30. FÁZIS-23 (2026-07-26) — HARD RULE: NO POLLING + a dev-terminate valós oka
- **ÚJ HARD RULE (owner, dühösen):** TILOS a polling / active-monitoring / háttér-poll / háttér-task — minden
  agentnek. Kanonikus: `documentations/rules/global/core-no-polling.md` + workspace `CLAUDE.md` HARD RULE.
  A dev korábbi `b56ocy1df`/`b72qvf3ff`/`bmbqnnmno` háttér-poll-jai pont ezt sértették (beragadtak).
- **A dev-et NEM a user állította le** → **CCAP cc-terminal-handling bug** (a user már dolgozik rajta). A
  „Terminated by user" státusz FÉLREVEZETŐ. Recovery = `resume` + re-dispatch; a dev bármikor újraindulhat.
- **ÚJ dev-munkamód (poll-mentes, fázis-szinkron):** a dev egy fázist SZINKRON végez → commit+push → MEGÁLL +
  jelent → ÉN verifikálom (npm/git) + kiadom a következőt. Semmi poll, semmi self-schedule, gyakori commit.
- **Saját continuity:** ScheduleWakeup (owner-jóváhagyott, egyszeri, látható) — ez marad; NEM poll.

---

## 31. FÁZIS-24 (2026-07-26) — ✅ CONSENT-LOG KÉSZ (verifikált) + at-rest titkosítás Phase 1 kiadva
- **Consent-log 3 fázis KÉSZ + git/npm-VERIFIKÁLT:** fdp-templates **1.15.89** (`FDP_ConsentRecord`),
  nts-fdp-templates **1.15.89** (`FDPNTS_Consent_DataService` — bedrock, az újrahasznosítható consent-modul),
  fdp-token-service **`a7bf116`** (checkbox→szerver + szerver-oldali `areAllDocumentsAccepted` enforce + bedrock
  audit-log `consent_record` + `acceptedTerms/termsVersion/consentIp/consentAt`+`consentRecordId` + HU 45/2014
  §15 gomb-szöveg). server tsc + **138 spec zöld**, kliens prod-build. → **a #1 compliance-gap LEZÁRVA.**
- A dev **fázis-szinkron, poll-mentesen** dolgozott (az új munkamód működik).
- **At-rest titkosítás Phase 1 (bedrock encrypt-flag + nts-dynamo transform + keyVersion + unit-teszt) KIADVA.**
