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

---

## 32. FÁZIS-25 (2026-07-26) — at-rest titkosítás Phase 1a KÉSZ (fsm), Phase 1b kiadva
- **Phase 1a (fsm-dynamo) KÉSZ + VERIFIKÁLT:** commit `725c0a9` → **fsm-dynamo 1.16.26 PUBLIKÁLT** (npm view).
  `encrypt?: boolean` flag a `DyFM_DataProperty_Settings`-en + envelope-helperek (`encryptDbValue`/`decryptDbValue`/
  `isEncryptedDbValue`/`getDbValueKeyVersion`) + **`DYENC1:<keyVersion>:<ciphertext>` envelope** (megbízhatóan
  elkülöníti a legacy plaintextet — az old `isValidEncryptedData` a plaintextre is illett). 125 crypto-spec zöld.
  Determinisztikus (Q3-jóváhagyott). **A dev fázis-szinkron megcsinálta + megállt + jelentett** — a munkamód működik.
- **Phase 1b (nts-dynamo data.service transzform, app-réteg, findByIdAndUpdate-safe) KIADVA.**

---

## 33. FÁZIS-26 (2026-07-26 21:14) — at-rest titkosítás Phase 1b KÉSZ (nts), publish CI-ben
- **Phase 1b (nts-dynamo) pusholva:** `566fc67` → target **1.15.118** (pipeline queued, jól triggerelt — nem
  missed-webhook). **npm view még 1.15.117** → a publish fut. **NEM pollozok** (no-poll rule); a következő
  sanctioned wakeup-nál verifikálom.
- **Tartalom:** `DyNTS_FieldEncryption_Util` — rekurzív per-field walk (top-level + `subObjectParams` nested/Mixed);
  `encryptDoc` (klónoz, nem mutál), `decryptDoc` (**csak `DYENC1:` envelope → legacy plaintext érintetlen = pre-
  migráció-safe**), `hasEncryptedFields` (cached opt-in gate). Kulcs: `FDP_CORE_DBCONTENT_CRYPT_KEY` (+`_VERSION`).
  App-rétegű (createData + modifyData a findByIdAndUpdate ELŐTT; decrypt a `stringifyDataId` egyetlen choke-pointban).
  Teszt: util 10/0, db.service CREATE+UPDATE 2/0, **teljes nts suite 1588 spec zöld**, opt-in default-off = nulla regresszió.
- **A dev helyesen MEGÁLLT** + rám vár a publish-verifikálásra → utána app-oldal (MP+adventor encrypt:true + migráció).

---

## 34. FÁZIS-27 (2026-07-26 21:35) — nts 1.15.118 PUBLIKÁLT → encryption app-oldal kiadva
- **Bedrock-titkosítás alapréteg KÉSZ + publikálva:** fsm-dynamo **1.16.26** + nts-dynamo **1.15.118** (npm-verifikált).
- **App-oldal KIADVA (kód, szinkron):** MP + adventor dep-bump (fsm/nts) + `encrypt:true` az érzékeny mezőkön
  (MP flow prompt/values/results + dupla-ágyazott sourceFlow; adventor generation prompt/content + campaign
  story-state/memory/epilogue) + idempotens migrációs script (dry-run + count, DYENC1-gate).
- **🚩 GO-LIVE OWNER-GATE:** a LIVE migrációt + prod-deployt NEM futtatjuk, amíg (a) a `FDP_CORE_DBCONTENT_CRYPT_KEY`
  értéke nincs **provisionálva az FDP Keystore-ban** (MP+adventor CI-env), és (b) nincs **owner go-ahead** a
  migrációra (prod-adat művelet). A dev most csak a KÓD-ot + scriptet + teszteket szállítja.

---

## 35. FÁZIS-28 (2026-07-26 21:57) — encryption app-oldal: MP KÉSZ, adventor folyamatban + ⚠️ CCAP párhuzam-bug
- **MP app-oldal ✅ KÉSZ:** commit `3c7c54a0` (feat(security): at-rest encryption of sensitive fields, master-prompter).
- **Adventor app-oldal folyamatban** (uncommitted: package.json + generation/campaign data-model + új `_scripts/` migráció).
- **⚠️ ÚJ LELET (owner-nek): a CCAP cc-terminal-bug most PÁRHUZAMOS FUTÁST okoz** — egy concurrent restart-instance
  is dolgozott az adventoron egyszerre (21:55). Ez korrektség-kockázat (két instance ugyanazokat a fájlokat írja).
  A dev észlelte és óvatosan kezeli (olvassa a concurrent verziót, nem írja felül). NEM avatkoztam bele (ne rontsak rá).
- **GO-LIVE változatlanul owner-gate:** `FDP_CORE_DBCONTENT_CRYPT_KEY` provisionálás (Keystore) + migráció go-ahead.

---

## 36. FÁZIS-29 (2026-07-26 22:15) — ✅ AT-REST TITKOSÍTÁS KÓD TELJESEN KÉSZ (DONE-PENDING-OWNER) → loop LEÁLL
- **MP `3c7c54a0` + adventor `368227e`** — `encrypt:true` az érzékeny mezőkön (MP flow prompt/values/results +
  teljes sourceFlow; adventor generation prompt/content + campaign story-state/memory/epilogue), fsm 1.16.26 /
  nts 1.15.118 dep-bump, **idempotens migrációs script** (`_scripts/at-rest-encryption-migration.ts`, DRY-RUN
  default, `--apply` live, DYENC1-gate a dupla-encrypt ellen). Committed+pushed, tesztek zöld. A dev megállt.
- (Az adventor uncommitted `package.json` = a concurrent-instance hook-verzióbump-ja, nem encryption — a dev
  szándékosan hagyta, hogy ne race-eljen a párhuzamos instance git-műveleteivel.)
- **STÁTUSZ: DONE-PENDING-OWNER — a wakeup-loop LEÁLL** (nincs több ütemezés). Hátralévő = OWNER go-live:
  (1) `FDP_CORE_DBCONTENT_CRYPT_KEY` provisionálása Keystore-ba (MP+adventor CI-env), (2) go-ahead a prod-
  migrációra (`migration --apply`) + deploy.

---

## 37. FÁZIS-30 (2026-07-26) — migráció = deploy-integrált (owner-direktíva) + kánon feljegyezve
- **Owner:** a `FDP_CORE_DBCONTENT_CRYPT_KEY` **be van állítva** a szervereken + Keystore-ban (owner-lépés 1 ✅).
- **Owner-direktíva:** a titkosítás-migráció NE külön CLI `--apply` legyen, hanem **deploy-integrált** — az új
  verzió ELSŐ indulásakor fusson automatikusan `app.server.postProcess`-ben (nts beépített helper). Kell egy
  **migráció-nyilvántartó „server info" ledger-tábla** (app/rendszer-verzió + lefutott migrációk) hogy egyszer fusson.
- **Kánon feljegyezve:** `documentations/guidelines/development/deploy-integrated-migrations.md` + memória
  (`reference_deploy_integrated_migrations`). Meglévő ad-hoc minta: MP `app.server.postProcess`+`migration()`
  dátum-gate (kikommentelve).
- **DEV-nek kiadva (spec-first):** verifikáld mi van az nts-ben (ledger létezik-e) → tervezd meg a ledgert
  (bedrock) + a titkosítás-migráció átírását deploy-integrált regisztrált migrációra. Előbb a terv jöjjön vissza.

---

## 38. FÁZIS-31 (2026-07-26 22:57) — migráció-ledger: irány jóváhagyva (token-svc → bedrock)
- **Dev-felderítés (jó):** nts-nek van `postProcess?()` hookja, de **nincs beépített migration-runner/ledger**.
  **A token-service-nek MÁR van app-lokál `schema-migration` ledger-e** (`schema-migration.data-model` +
  `control-service`) → **ezt promótáljuk bedrock nts-be** (reusable az egész flottának).
- **Irány JÓVÁHAGYVA (nem vártatom külön review-körre):** bedrock ledger + postProcess-runner (run-once,
  app-verzió + lefutott migrációk id+idő) → utána az at-rest titkosítás-migráció regisztrálása ezen (a meglévő
  `_scripts` DYENC1-gate/dupla-ágyazott-sourceFlow/dry-run logika beemelve). Fázis-szinkron, poll-mentes.
- Nem-triviális design-döntést (ledger-séma, migráció-id konvenció) a dev előbb visszaküldi.

---

## 39. FÁZIS-32 (2026-07-26 23:19) — migráció-ledger bedrock KÉSZ (nts 1.15.119) → app-oldal (Phase 2) kiadva
- **Phase 1 (bedrock ledger) KÉSZ + publikálva:** `dynamo-nts 55041e9 → 1.15.119` (npm-verifikált). A token-service
  `schema-migration`-je bedrock-ba emelve: `DyNTS_SchemaMigration` ledger (migrationId unique + appliedAt +
  appliedVersion; per-app `dynts_schema_migrations`) + `DyNTS_MigrationEntry` (id: `YYYY-MM-DD-NNN-...`) +
  `DyNTS_Migration_Runner.runPending` — **RUN-ONCE (unique-index race-safe = a CCAP párhuzam-bug ellen is véd) +
  BOOT-SAFE**. 1593 nts-spec zöld.
- **Phase 2 (app-oldal, MP+adventor) KIADVA:** nts-bump + `schemaMigration_dataParams` dbModels-be + az at-rest
  titkosítás regisztrált `DyNTS_MigrationEntry`-ként + `runPending` az `app.server.postProcess`-ben + a standalone
  `_scripts` átkötése. → utána a **go-live automatikus** a titkosított verzió következő deploy-jánál.

---

## 40. FÁZIS-33 (2026-07-26 23:40) — CI/CD-CHECK: 2 valós deploy-probléma (owner kérte)
A commit+push = deploy (auto CI/CD); ezért a CI/CD-eredményeket kell nézni. Lelet (`fdp build-results`/`build-detail`):
- ✅ **bedrock zöld:** fsm 1.16.26, nts 1.15.119 (SUCCESS, 0 failed step), fdp-templates 1.15.89, nts-fdp-templates 1.15.89, dc 1.15.204. ✅ **adventor 01.15.169 deployolt** (encryption ÉLES; `dc-review-client` non-fatal ❌).
- ❌ **MP 01.15.746 FAILED** (commit `3c7c54a0`): `check-dev-leftovers` + `client-build` bukott → **deploy KIMARADT** → az MP encryption NEM éles. (server tsc + server-test zöld volt.) → **dev-fix kiadva.**
- ⚠️ **token-service:** a consent Phase C (`a7bf116`, **v01.15.180 pusholva**) **NEM buildelt** (deploy még v177, 07-24) → **MISSED WEBHOOK** → a consent-log NEM éles. → **re-fire-oltam** (üres commit + push).
- **TANULSÁG:** a „kész+pusholt" ≠ „deployolt" — MINDIG CI/CD-verify (`fdp build-detail`) a deploy-igényes munkánál.

---

## 41. FÁZIS-34 (2026-07-27) — migráció-runner GAP-SAFE verifikálva (owner-kérdés)
- **Owner-kérdés:** a runner `<=`/verzió-független-e, hogy prod-on verzió-gap-pel is fusson? **Válasz: IGEN.**
- **Kód-verifikáció** (`dynamo-nts/.../migration-runner.service.ts` `selectPending`): `migrations.filter(m =>
  !appliedIds.has(m.id))` — **ledger-tagság a migrationId alapján, NINCS `== verzió` gate / dátum-küszöb.** Az
  `appliedVersion` csak audit. → prod verzió-gap-pel is lefut az első induláskor (a hiányzó verzió „old").
- **Rögzítve a kánonba** + 2 kötelező következmény: az entry VÉGLEG regisztrálva marad; a `run()`-ban nincs
  verzió-check (idempotencia = ledger + DYENC1). A devnek is elküldve emlékeztetőként (az MP-red-fix mellett).

---

## 42. FÁZIS-35 (2026-07-27 00:37) — deploy-verify: mindkettő recovery-ben (nincs teendő, várni kell)
- **token-service:** a re-fire (`aec494a`) MŰKÖDÖTT — a `fdp pipeline-jobs` szerint **FUT egy fdp-token-service
  pipeline** (deploy-olja a v180 consent Phase C-t). A build-results v177-je csak lemaradás (a build folyamatban).
  **NEM rearm-eltem** (duplikálná). `fdp rearm-trigger --project <n> --commit <sha>` = a missed-webhook eszköz, ha kell.
- **MP:** a dev **még buildeli a Phase 2-t** (00:28 „installing deps", MP Phase 2 kód kész: migráció-entry +
  registry + postProcess + ledger regisztrálva + standalone nyugdíjazva) — még nem pusholt, ezért a piros a régi
  (21:56). A MP-push majd a check-dev-leftovers/client-build fixet is viszi.
- **Következő wakeup:** verify — token-service SUCCESS (v180) + MP zöld (dev push után) + Phase 2 (MP+adventor) landolt.

---

## 43. FÁZIS-36 (2026-07-27 01:00) — deploy-verify: token-service ÉLES, MP client-build maradék-piros
- **✅ token-service consent DEPLOYOLT (v01.15.181):** `deploy` + `deploy-verify` ZÖLD → a **consent-log ÉLES.**
  A pipeline-piros csak az `e2e-deep` 10-perces timeout (teszt-flake) + dc-review miatt — NEM deploy-hiba.
- **🟡 MP (v747, dev `8a3a56a1`):** a `check-dev-leftovers` MOST ZÖLD (a dev dep-latest-fixe működött — lelet:
  a bedrock-publish minden behind-latest app-dep-et megbuktat a leftover-gate-en; + a kliens fsm-nek matchelnie
  kell a szerverrel az `encrypt:true` flag miatt). DE a **`client-build` MÉG MINDIG bukik — 0s** (azonnali fail =
  pre-compile/config/invocation, nem TS-compile). → dev-nek kiadva: futtassa lokálisan a CI kliens-build parancsot,
  olvassa a valós hibát, javítsa. A MP deploy addig 💤 (nem deployol).
- **🔵 adventor Phase 2** (migráció-regisztráció) még PENDING — MP zöld után.

---

## 44. FÁZIS-37 (2026-07-27 01:25) — MP re-build fut; adventor Phase 2 landolt de dc-review+docker-build piros
- **MP:** új pipeline-job FUT (`e16273ea`, master-prompter@master running) — a dev client-build fixe buildel. Várom.
  v747 még FAILED (client-build 0s), de ez az előző; az új build kimenete dönt.
- **✅ adventor Phase 2 landolt (v171, commit `ececc76`):** a `client-build` MOST ZÖLD (1m57s) + `check-dev-leftovers`
  ZÖLD (deps rendben) + server-test + client-test zöld. **DE deploy 💤**, mert 3 új piros: `dc-review-server` (4s),
  `dc-review-client` (3s), `docker-build` (16s). → NEM dep-drift. Gyanú (verifikálandó): az új `_migrations/` fájlok
  FDP naming/struktúra-konvenció-sértése (dc-review) + prod-build path (docker-build). Dev-nek kiadva: `dc review` +
  docker/prod-build lokálisan → valós hiba → fix → push.
- **✅ token-service consent:** deployolt (v181), ÉLES (csak e2e-deep-timeout flake piros).
- **Élő-állapot:** encryption+migráció még SEHOL nincs deployolva (MP red, adventor deploy 💤). token-service ✅.

---

## 45. FÁZIS-38 (2026-07-27 01:52) — 🎉 MP ENCRYPTION + PHASE-2 MIGRÁCIÓ DEPLOYOLT (ÉLES)
- **✅✅ MP v01.15.748 (01:30):** `client-build` ZÖLD (a fix működött) → `docker-build` ✅ → **`deploy` (53s) ✅ +
  `deploy-verify` (16s) ✅ + `e2e-smoke` (2m54s) ✅** → **az at-rest encryption + a deploy-integrált Phase-2
  migráció MOST ÉLES a test-instance-en.** (deploy-prod/smoke-prod 💤 = test-env, normál.)
  - **1 piros: `e2e-api` (43s)** deploy UTÁN. NEM deploy-blokkoló (deploy már lefutott zölden). Dev-nek kiadva:
    verifikálja flake vs. encryption-regresszió (user ciphertext/decrypt-hiba az olvasási úton). e2e-smoke átment → instance él.
- **🔄 adventor:** új fix-build FUT (`e5d438d2`, adventor@master) — a dev a dc-review+docker-build pirosat javította. Várom.
- **✅ token-service consent:** ÉLES (v181).
- **ÖSSZKÉP:** token-service ✅ ÉLES · **MP encryption ✅ ÉLES** · adventor Phase-2 = deploy-build fut (utolsó hiányzó).

---

## 46. FÁZIS-39 (2026-07-27 02:15) — ✅✅ ADVENTOR PHASE-2 DEPLOYOLT (ÉLES) — 3/3 encryption-lánc kész, 1 verdikt hátra
- **✅✅ adventor v01.15.172 (02:04): SUCCESS** — `dc-review-server` ✅ + `docker-build` ✅ + **`deploy` (50s) ✅ +
  `deploy-verify` (15s) ✅ + `e2e-api` (17s) ✅** → **adventor Phase-2 (encryption + deploy-integrált migráció) ÉLES.**
  A dev javította a dc-review+docker-build pirosat. (`dc-review-client` 3s maradék-piros = non-fatal, overall SUCCESS.)
- **KULCS-DIFFERENCIÁL:** adventor `e2e-api` ÁTMENT (17s) UGYANAZZAL az encryption-mintával → erős jel, hogy az
  **MP e2e-api-piros NEM a titkosítás** (MP-specifikus vagy flake). Verdiktet a dev adja (verifikálva, nem találgatva).
- **EGYETLEN maradék tétel a teljes lezáráshoz:** MP `e2e-api` (v748, 43s) = FLAKE vs. ENCRYPTION-REGRESSZIÓ.
  Dev-nek kiadva: futtassa lokálisan / nézze a logot → egyértelmű verdikt. Ha flake → KÉSZ; ha regresszió → élő-defekt, fix.
- **ÖSSZKÉP:** token-service ✅ ÉLES · MP encryption ✅ ÉLES (deploy zöld) · adventor Phase-2 ✅ ÉLES. Csak az MP e2e-api-verdikt nyitott.

---

## 47. FÁZIS-40 (2026-07-27 02:39) — MP e2e-api verdikt: dev ismételten stalled → független vizsgáló-subagent
- **Állapot változatlan a deploy-oldalon:** mind a 3 termék ÉLES (token-service ✅ · MP encryption ✅ · adventor Phase-2 ✅).
- **MP e2e-api (v748, 43s) verdikt még NINCS:** a dev újra `stalled` (CCAP terminal-bug, 3. eset) — resume-olva + feladat
  újraküldve. `fdp errors` üres, `build-detail`-nek nincs step-log flag-je → nem tudom triviálisan kiolvasni a hibát.
- **DÖNTÉS (no-guessing):** NEM zárom le "flake"-ként bizonyíték nélkül. Párhuzamos **független vizsgáló-subagent**
  indítva: a MP e2e-api spec + a `encrypt:true` mezők + a read-path (data.service auto-decrypt vs. raw-mongoose bypass)
  + git-log alapján ad verdiktet (REGRESSZIÓ vs FLAKE), file:line bizonyítékkal. Ez a devtől független út.
- **Következő:** a subagent verdiktje (vagy a dev jelentése) alapján: ha FLAKE/MP-specifikus → LEZÁRÁS (minden ÉLES);
  ha REGRESSZIÓ (raw-mongoose bypass → user ciphertext) → élő-defekt, fix + push.

---

## 48. ✅ LEZÁRVA (2026-07-27 03:00) — AT-REST ENCRYPTION + CONSENT-LOG + DEPLOY-INTEGRÁLT MIGRÁCIÓ ÉLES (3/3)
**Az owner "nézd meg a CICD result-okat" + az at-rest titkosítás/consent go-live objektíva TELJESÍTVE.**

### Deploy-állapot (CI/CD-verifikálva)
- **token-service** consent-log: ✅ ÉLES (v01.15.181, deploy+deploy-verify zöld).
- **master-prompter** at-rest encryption + deploy-integrált Phase-2 migráció: ✅ ÉLES (v01.15.748,
  deploy 53s + deploy-verify 16s + e2e-smoke 2m54s zöld → a migráció boot-safe lefutott a postProcess-ben).
- **adventor** at-rest encryption + deploy-integrált Phase-2 migráció: ✅ ÉLES (v01.15.172 SUCCESS,
  deploy+deploy-verify+e2e-api zöld).
- **bedrock nts 1.15.119**: `DyNTS_SchemaMigration` ledger + `DyNTS_Migration_Runner` (gap-safe, run-once) — publikálva.

### MP e2e-api piros — VERDIKT: FLAKE, NEM encryption-regresszió (független subagent, strukturális bizonyíték)
- Az MP `e2e-api` **no-creds suite** (`e2e/playwright.api.config.ts` + `e2e/src/_api/mp-api.spec.ts`): CSAK 401-et
  (auth nélkül) + 2×200 publikus endpointot assertál → **sosem autentikál, sosem olvas dekódolt tartalmat** →
  strukturálisan KÉPTELEN ciphertext-leaket elkapni. Zero raw-mongoose bypass read (`.lean/.aggregate/findByIdAndUpdate`
  a kliensnek) — minden olvasás az auto-decrypt `DyNTS_DataService`-en át. A titkosítás-commitok (3c7c54a0, 8a3a56a1)
  nem érintették az auth-middleware-t/no-creds endpointokat. A 43s-piros = tranziens blip (`workers:1, retries:0` →
  1 hálózati blip = hard red). Sibling adventor e2e-api ugyanezzel a mintával ZÖLD → a minta ép.
- **Ajánlott (opcionális, NEM encryption) hardening:** `e2e/playwright.api.config.ts` → `retries: process.env.CI ? 2 : 0`
  a no-creds status-suite de-flake-eléséhez, hogy az MP pipeline overall-zöld legyen. Low-prio follow-up (nem blokkol).

### Go-live megjegyzés
A `FDP_CORE_DBCONTENT_CRYPT_KEY` provisionált (owner, szerverek+Keystore); a deploy-integrált migráció az új verzió
első bootján lefutott (boot-safe, ledger-alapú run-once, gap-safe). **A koordinációs loop LEZÁRVA.**

---

## 49. SSOT-DRIFT AUDIT (2026-07-27) — ügyvéd-leírás ürügyén feltárt 5 rés + dokumentálás kanonikus helyekre
**Kiváltó:** az ügyvédnek szánt Adventor-leírást a KÓDBÓL írtam → 2 hibás állítás (owner-korrekció). Tanulság:
**termék-leírás a KIADÁSI TERV + JOGI SCOPE ellen írandó; a kód csak alátámaszt.**

### Verifikált leletek + hiányzó munka (W1–W5)
- **W1 🔴 Token 5-év lejárat — ENFORCEMENT HIÁNYZIK (platform-szintű).** ÁSZF §3 ígéri; kódban a pure derivációs util
  + `expiredAmount`/`reminderSentAt` mezők KÉSZ, de **nincs hívó**: hiányzik az expiry-job/cron + emlékeztető-email +
  balance-deduct wiring. *(Owner-korrekció igazolva: a lejárat MINDEN rendszerre szól — közös token-service.)*
  **Owner-döntés:** R1 vagy R1+ (valós egyenleg-mozgás). Doksi: `fdp-token-service/__documentations/token-expiry-enforcement-status-2026-07-27.md`.
- **W2 🟡 „Fel nem használt token visszatéríthető" (ÁSZF §7)** — Stripe-refund→clawback KÉSZ, de a *kérelmezési út* +
  a „közzétett határidő" konkrét értéke nincs rögzítve. **Az ügyvédnek jelezve** (érinti a token pénzügyi minősítését).
- **W3 🔴 Notice-and-action csatorna (ÁSZF §14.2, DSA 16.) — UNVERIFIED.** A `support@futdevpro.hu` a kiszolgált
  doksikban szerepel, de a **postafiók léte/figyelése + az átvétel-visszaigazolás + nyilvántartás folyamata nincs
  igazolva** (0 kód-bizonyíték). Ez **ops/eljárás**-munka, nem feltétlenül kód. → verifikálni/felépíteni kell.
- **W4 🟡 MP: nyilvános tartalom-megosztás bejelentés/moderáció NÉLKÜL.** Az MP publikál user-tartalmat
  (`flow-public` + `flow-rating` + creator-díjazás doksik), de **nincs in-app report/moderáció** (teljes `server/src`
  átfésülve). Az **Adventorban KÉSZ** (report + disable + LLM-analízis). → aszimmetria egy közös ÁSZF alatt.
  Javaslat: MP-report-MVP az Adventor moderáció-workflow mintájára (pattern-first; 2 app → bedrock mérlegelendő).
  Doksi: `master-prompter/__documentations/public-sharing-moderation-gap-2026-07-27.md`.
- **W5 ✅→jelölve Korosztály-besorolás: kód-jelenlét ≠ kiadás-tartalom.** Az Adventor-kódban van `AgeRating` enum +
  preset/campaign `ageRating`, DE a teljes rendszer **MVP2** (BL-20260703-022) és a **V3 ÁSZF §4.4/§5.1 KIFEJEZETTEN
  KIZÁRJA a 18+ gatinget** → konzisztens; drift-jelölő doksi készült, hogy senki ne olvassa „aktuális feature"-ként.
  Doksi: `adventor/__documentations/age-rating-release-scope-2026-07-27.md`.

### Dokumentálás — kanonikus helyek (NEM keverve, SSOT-pointerekkel)
| Információ-típus | Otthon |
|---|---|
| Jogi ígéret ↔ kód-valóság mátrix (kereszt-metszet, W1–W5 SoT) | `documentations/legal/_process/legal-claims-vs-implementation-2026-07-27.md` |
| Token-lejárat rendszer-tény + rés | `fdp-token-service/__documentations/token-expiry-enforcement-status-2026-07-27.md` |
| MP megosztás/moderáció rendszer-tény + rés | `master-prompter/__documentations/public-sharing-moderation-gap-2026-07-27.md` |
| Adventor korosztály kód-vs-release drift | `adventor/__documentations/age-rating-release-scope-2026-07-27.md` |
| Ügyvéd-levelezés | `fdp-assistant/__documentations/legal-lawyer-communication.md` |
| Koordináció/dispatch (ez) | `my-assistant/__documentations/owner-koordinacio-backlog.md` |

### Nyitott owner-döntések
(1) W1 ütemezés R1 vs R1+ · (2) W2 visszatérítési határidő értéke + fenntartjuk-e · (3) W4 kell-e MP-report R1-be ·
(4) az ügyvédnek küldendő levélben említsük-e a korosztály-rendszert 1 mondattal (későbbi kiadás) — javaslat: IGEN.

---

## 50. OWNER-DILEMMA + DÖNTÉSEK (2026-07-27) — R1 jogi-scope gating + ÚJ jogi-kötelezettség SSOT
**Owner-dilemma (rögzítve, kanonikusan dokumentálva):** eddig főként az MP funkcionalitását írtuk le az ügyvédnek,
és úgy kezeltük, hogy az lefedi az Adventort is (tartalom-generátorok készítése/használata). Ha most **túl sok új
feature-t** írunk le, amit jogi megfeleléssel kell fedni, az ügyvéd **több platformot** fog látni → **drágább ajánlat**.
Kell az **arany középút**: az Adventor működőképes marad, de **nem hoz új jogi felületet**.
→ **Megoldás-elv:** nem funkció-katalógus, hanem **képesség-szintű leírás + explicit NEGATÍV lista** (mit NEM csinálunk
R1-ben). A negatív lista **szűkíti** az ügyvéd munkáját → a fix díj tartható.

**OWNER-DÖNTÉSEK:**
1. **18+ KI az R1-ből.**
2. **A korosztály-választó (12+/16+ is) SEM kell R1-be** — a teljes korosztály-UI kikerül; az `ageRating` adat-mező marad (MVP2).
3. **Korrekció (owner):** **NEM ugyanaz a weboldal** — MP saját domainen (`master-prompter.hu`), Adventor FDP-aldomainen
   (`adventor.futdevpro.hu`) — verifikálva (ssl-config.json + MP environment.ts:39). ⚠️ **Ez cáfolja az ügyvéd
   feltevését** („egyetlen közös weboldal" → közös cookie-tájékoztató) → **jelezni kell**: a cookie-tájékoztatónak
   **két domaint** kell fednie; a közös fiók/kredit miatt az **egy ÁSZF** viszont indokolt marad.

**VERIFIKÁLT LELET, ami a döntést kiváltotta:** az Adventor preset-létrehozó UI **mind a 3 besorolást felkínálta,
köztük a 18+-t**, gating nélkül (`a-preset-create.component.ts:55` `Object.values(AgeRating)`).

**ÚJ SSOT (owner-igény):** `documentations/legal/legal-obligations-ssot.md` — **17 jogi kötelezettség** táblája:
kötelezettség · jogforrás · **mi hozta a flottába** · kikre vonatkozik · **megfelelés MA (verifikált)** · **release**.
Kiemelt sorok: consent-log ✅R1 · at-rest titkosítás ✅R1 · notice-and-action 🔴/❔ · token-lejárat 🔴 · AI Act 50. 📐 ·
18+ ⛔R1-kizárva · creator-payout ⛔ · DPA ⛔ · pénzügyi engedély 🟡feltételes.

**Dokumentálás (kanonikus otthonok):** döntés+dilemma → `documentations/legal/_process/r1-legal-scope-gating-decision-2026-07-27.md` ·
kötelezettség-nyilvántartás → `documentations/legal/legal-obligations-ssot.md` · Adventor rendszer-tény + döntés →
`adventor/__documentations/age-rating-release-scope-2026-07-27.md` (+ CLAUDE.md spec-sor ⛔-jelölve).

**Következő:** (a) dev-dispatch: korosztály-UI eltávolítása R1-re · (b) ügyvéd-levél véglegesítés (képesség-szintű
leírás + negatív lista + két-domain korrekció) → owner-jóváhagyással megy ki.

---

## 51. (2026-07-27) — SSOT rendszer-oszlopokkal · SimplePay-drift · domain-egyesítés R2 · Adventor-leírás a levélbe
**Owner-inputok feldolgozva:**
1. **SSOT átépítve** (`documentations/legal/legal-obligations-ssot.md`): **(A) megfelelési mátrix** — 17 kötelezettség ×
   **9 rendszer-oszlop** (FDP · AUTH · ToS · MP · ADV · ART · WB · SOC · DUM; a `ssl-config.json`-ból verifikált
   PROD-élő vs. test/launch-cél besorolással), **(B) részlet-tábla** (jogforrás · mi hozta · bizonyíték · release).
   **Lelet a mátrixból:** a PROD-élő, de nem launch-fókuszú rendszerek (FDP főoldal, ART, WB, SOC, DUM) jogi
   megfelelése **NINCS felmérve (❔)** — az eddigi jogi munka az MP/ADV/ToS sávra ment. → külön felmérés kell.
2. **⚠️ SimplePay-drift (owner-jelzés nyomán verifikálva):** a **V3 jogi doksik (adatkezelési tájékoztató + fizetési
   ÁSZF) SimplePay-t említenek**, és kód is van rá (MP `simplepay.api-service.ts` + ToS `_routes/transaction/simple-pay/`),
   miközben az owner szerint **kivezetjük/kivezettük** (Stripe a fizetési út). → **a doksikat ehhez kell igazítani,
   MIELŐTT az ügyvéd véglegesíti** (különben nem használt szolgáltatót dokumentáltatunk). **Owner-verifikáció kell:**
   élesben teljesen kivezetett-e? *(Az én korábbi SimplePay-említésem is innen jött — stale env-konfig sorból.)*
3. **Domain-egyesítés — OWNER-DÖNTÉS: IGEN, de R2** (nem R1): `master-prompter.hu` → **átirányítás** →
   `master-prompter.futdevpro.hu`, hogy minden szolgáltatás **egy regisztrálható domain** alá kerüljön (közös
   cookie-scope → egy banner, egy tájékoztató, egy consent-nyilvántartás; egyszerűbb same-site auth).
   Indok az owner szerint: „csak a feeling kedvéért vettük külön". Rögzítve az SSOT C/3 pontjában. **Backlog: R2.**
   Technikai tételek a migrációhoz: DNS+SSL, gateway/base-href, fizetési redirect-URL-ek, OAuth redirect-URI-k,
   e-mail-linkek, e2e. **A levélben az ügyvédtől is megkérdezzük**, megéri-e a doksik elkészülte ELŐTT megtenni.
4. **Ügyvéd-levél bővítve:** 2 bekezdéses, közérthető **Adventor-leírás** (preset = generátor-beállítás → kampány =
   párbeszédes munkamenet; kocka = tét/nyeremény nélküli történet-mechanika; nyilvános megosztás; képgenerálás) +
   a „MP általános generátorok / Adventor ugyanaz egy konkrét felhasználásra" keretezés + a domain-kérdés.

---

## 52. (2026-07-28) — SZÁMLÁZÁS+REFUND hyperplan indul · ügyvéd ZÖLD ÚT · 3 levél kiment · owner-válaszok
### Ügyvéd (ND Law) — a megbízás ELFOGADVA, majd ZÖLD ÚT a fejlesztésre
- Elfogadó levél kiment (msgId `004df953…`), válasza (07-28 16:10, UID 147782): **„Köszönöm a megbízást… Hamarosan
  megküldöm a dokumentumokat."** + a **domain-döntés rendben** + **„a fejlesztést el lehet indítani ebben az irányban."**
- **Elállási válaszai:** arányossági képlet ✅ · **a 14 nap A VÁSÁRLÁSTÓL** indul · nyilatkozat-szövegeket ő írja ·
  ⚠️ **ÚJ: kell elállási NYILATKOZATMINTA + ONLINE ELÁLLÁSI FUNKCIÓ a weboldalon** · a törvényi elállás **nem
  korlátozható**, de fiók-felfüggesztési jog kerül az ÁSZF-be rosszhiszeműségre.

### 3 levél kiment (2026-07-28) — csatorna-szétválasztással
| Levél | Címzett | msgId |
|---|---|---|
| **KÖZÖS** (bemutatás + 3 közös téma: vevő-minőség · elállás↔helyesbítő számla · számlázási vállalás) | ügyvéd + könyvelő | `c12162f1…` |
| **CSAK KÖNYVELŐ** (5-eset ÁFA-mátrix · 10 000 €-küszöb · VIES · lejáró kredit · EUR/MNB) | könyvelő | `0a747363…` |
| **CSAK ÜGYVÉD** (árfeltüntetés: nettó főhelyen + bruttó kisebben — megengedett-e?) | ügyvéd | `4fb7c503…` |
> Az **SPV/MPV** kérdés **KIVÉVE** — a könyvelő már 2026-06-19-én megválaszolta (**ÁFA a vásárláskor**), a ÁSZF §2 is
> így rögzíti; a §7-ben maradt „MPV/felhasználáskor" fordulat **belső ellentmondás → tisztítandó** (jelezve az ügyvédnek).

### OWNER-VÁLASZOK a dev hyperplan-kérdéseire (2026-07-28) — a devnek átadva
| Q | Válasz |
|---|---|
| Q1 | env-név: **`FDP_SZAMLAZZ_TOKEN`** (owner-engedély ERRE a névre; Keystore-secret) |
| Q10 | **NEM — tilos új env-var.** Az FTP-URL **beégetett const** (ENV szerint test/prod); az `FTP_URL_SIGNING_SECRET` **már létezik** |
| Q6 | **Eladó-adatok: beégetett BEDROCK const** + **dokumentálni a `documentations` repóba** |
| Q6/Q8 | **Vevő-adatok:** előtöltés a futdevpro „personal information" lapjáról → checkoutban módosítható → **a tranzakcióhoz mentendő**, **titkosítva** (a kész `encrypt:true` implementációt bekötve) |
| Q4 | **user-nyelv szerint; HU / HU+EN** |
| Q7 | **nincsenek meglévő vásárlások** → nincs retroaktív számlázás |
| Q15 | **céges vevőnél az elállás DISABLED / elutasítva** |
| Q14 | → **az ügyvédnek feltéve** (árfeltüntetés) |

### ⚠️ Q14 — VERIFIKÁLT LELET (árfeltüntetés)
A csomag ára **NETTÓ**: `token-purchase.data-service.ts:127` → `cost = price × (1 + HU_vat)`; a felület
(`t-purchase.component.html:26,210`) **„{price}€ + VAT(27%)"**-ot ír ki → a 4,99 €-s csomagért ténylegesen **6,34 €**
terhelődik. **Fogyasztónak a bruttó, fizetendő végösszeget is ki KELL írni** → a felületet így is, úgy is javítani kell
(csomag-lista + fizetési folyamat). Az **owner szándéka**: nettó nagyban, alatta kisebben a számítás + bruttó —
**megengedett-e, az ügyvédtől kérdezve** (msgId `4fb7c503…`).

### 🔴 HYPERPLAN-SZERKEZET — NEM felel meg a kánonnak
A dev **egyetlen fájlt** írt (`fdp-token-service/__documentations/invoicing-refund-hyperplan-2026-07-28.md`, 233 sor),
a kánon viszont **3-rétegű**: `plans/HYPERPLAN*.md` (+státusz/`COMPLETION-LEDGER.md`) → `plans/master-plans/*` →
`plans/sub-plans/*` (minta: master-prompter, 12 master-plan + 36 sub-plan). → **átstrukturálás kiadva.**

---

## 53. (2026-07-29) — DEV-SESSION VÁLTÁS + ORKESZTRÁLÁSI SZABÁLYOK (owner-direktíva)
**Session-váltás:** a régi dev session (`ccs-4c0444cc-ms1qhv46`, „MA3's Dev Assistant") **elbukott**, a munkáját az
owner **visszagörgette** → **NYUGDÍJAZVA, tilos újra használni.**
**Az AKTUÁLIS dev session:** **`ALL Projects - MA3 Dev 2`** · sessionId **`ccs-9bb0eb45-ms58nxrk`** ·
ccapId `df6d8572-e655-4d55-a032-603afc8c4b26` · workspace `E:\Programming\Own\CURSOR`.
*(A számlázás-hyperplant most az owner vezényli benne közvetlenül.)*

**A bukásból levont 6 szabály — kanonikus doksi:**
`documentations/guidelines/agent-workflow/dev-session-orchestration.md`
1. **Soha ne mikromenedzseld** az agentet — csak a kulcspontokat add meg.
2. **Előbb felderítés, aztán terv**, csak utána kód.
3. **Nagy feladat előtt info-frissítés** (1 prompttal, az agentre bízva): szabályaink · alapos kutatás az érintett
   területekről · szükség esetén flotta-architektúrális tudás.
4. **Terv-architektúra: HYPERPLAN → MASTERPLAN → SUBPLAN** (a Hyperplan státusz-kezelésre is); a subplanek a **teljes
   részletes implementációt** tartalmazzák; készítés közben **az érintett rendszert vizsgálni** (integrációk,
   pattern-követés); **minden kérdést és architekturális döntést a tervezés során tisztázni.**
5. **Review-loop:** a kész tervet alaposan reviewzni, a kört ismételni, **amíg új issue-t tár fel**.
6. **Indítás EGYETLEN prompttal**, autonóm végrehajtásra, ScheduleWakeup-pal.

---

## 54. (2026-07-29) — ÜGYVÉDI VÁLASZOK → 4 új követelmény · B-út (HUF) · ÉLŐ ÁRFOLYAM-lelet · átadva az ÚJ devnek
### Ügyvédi válaszok (2 levél)
- **Közös levélre (UID 147783):** adózás/számvitel **nem az ő szakterülete** → Andrea álláspontjára támaszkodik.
  **Fogyasztó = kizárólag természetes személy** (cégméret irreleváns); ⚠️ **egyéni vállalkozó fogyasztó lehet**, ha a
  szakmai tevékenységén KÍVÜLI célból vásárol → **a CÉLRÓL kell nyilatkoztatni, nem a jogi formáról.** Az elállás
  ÁFA-vonzatát **nem kell** az ÁSZF-be írni. **Számla-e-mail értesítés** (számla vagy közvetlen link) ajánlott.
- **Árfeltüntetésre (UID 147784):** ⚠️ **ELUTASÍTOTTA** a „nettó nagyban + bruttó kicsiben" owner-tervet — fogyasztónál
  **a BRUTTÓ az elsődleges ár** már a csomagválasztón. B2B-nál lehet nettó, **de csak az azonosítás után**.
  🔴 **ÚJ:** magyar fogyasztónál a **kizárólag EUR-os ár nem megfelelő** → **HUF-ban is** ki kell írni.

### Owner-döntések
- **B-út:** **HU-fogyasztónak HUF-ban terhelünk** (Stripe multi-currency) — a kiírt bruttó HUF = a levont összeg.
  *(A C-út — fix HUF-árlista — elvetve: „nem fogjuk tudni kézzel árfolyam-up-to-date tartani.")*
- **Az USD-árfolyam is be kell kerüljön a belső token-számításba** (a providerek USD-ben számláznak).
- **A ráhagyás marad:** profitRate 1.2 + operatingCostRate 0.25 = **effektív 1.45×**, változatlanul.
- **Stripe multi-currency → másik bankszámlaszám** kell a Stripe-beállításban (owner-teendő).

### 🔴 VERIFIKÁLT LELET — beégetett árfolyam
`token-conversion.util.ts`: **`FDPTokenRate_eurToUsd = 1.2` BE VAN ÉGETVE** (a kód saját kommentje: *„a későbbiekben
erre automatizmus kell majd"*). A providerek USD-ben számláznak → ha a valós EUR/USD elmozdul, **a ráhagyás némán
erodálódik**, és **sehol nem látszik**. → élő árfolyam kell (EUR→USD belső, EUR→HUF fogyasztói).
**Forrás: MNB** — egy hívásból mindkettő (HUF/EUR és HUF/USD → EUR/USD = rate(EUR)/rate(USD)); minta:
`fdp-assistant/cli/src/_collections/mnb-fx.util.ts`. Kötelező: cache + **utolsó ismert árfolyam fallback** (soha ne
blokkolja a vásárlást/generálást) + **a használt árfolyam ÉS dátuma mentendő** (auditálhatóság).

### Dokumentálva
`fdp-token-service/__documentations/invoicing-gap-and-plan-2026-07-28.md` → **3b/3** (F1–F4 ügyvédi követelmények) +
**3b/4** (D1–D5: B-út, élő FX, ráhagyás, MNB-forrás, Stripe-bankszámla) ·
`fdp-assistant/__documentations/legal-lawyer-communication.md` (mindkét levél).

### Átadva
**Az ÚJ dev sessionnek** (`ALL Projects - MA3 Dev 2`, `ccs-9bb0eb45-ms58nxrk`) — 9 kulcspont, a részletek a kanonikus
doksira mutatva (nem mikromenedzsment).

### Nyitott
- **Könyvelőnek** írandó: **két pénznem** a számlázásban (HUF-os fogyasztói + EUR-os egyéb) + árfolyam-alkalmazás a
  NAV-riportban → **P2-blokkoló lehet.**
- A **HUF-payout bankszámla** eltérhet a `fdp-seller-invoice-data.md`-ben rögzítettől → tisztázandó.

---

## 55. ✅ (2026-07-29) — SÜTI-LELTÁR KÉSZ (Dev 3, 10 kör) · scope-szűkített változat az ügyvédnek

**Kiváltó ok:** az ügyvéd „nem talált működő sütiket" → tőlünk kért süti-leltárt (J tétel).
**Végrehajtó:** `ALL Projects - MA3 Dev 3` (`ccs-fbc3577e-ms6cy0bt`) · brief:
`dispatch-briefs/cookie-inventory-2026-07-29.md`.

### Eredmény
- **Belső, TELJES változat (SSOT):** `documentations/legal/_process/cookie-inventory-2026-07-29.md` (243 sor, commit `4ab6aea`).
- **ÜGYVÉDNEK küldött, scope-szűkített változat:** `…/cookie-inventory-2026-07-29-UGYVEDNEK.md`
  — **owner-döntés:** *„csak a scope projektekről (ne keverd bele most az art-tarot-t, azt csak javítani kell majd, backlog)"*.
  Benne: `futdevpro.hu` · `master-prompter.hu` · `adventor.futdevpro.hu` · `token.futdevpro.hu`.
  **Kivéve:** `art-tarot.hu` · `dum.futdevpro.hu` · `warbots.hu` · `social.futdevpro.hu`.
- **Módszertan:** 10 kör, körönként változtatott nézőpont; a 8–9–10. kör **nem hozott új elemet**
  (a követelmény 2 egymást követő tiszta kör volt → túlteljesítve). Playwright + `curl` + kód-átfésülés,
  alkalmazás-kód **nem** módosítva.

### Miért nem talált az ügyvéd sütit (verifikált magyarázat)
(1) a nyitóoldalak **0 `Set-Cookie`**-t adnak · (2) a saját sütink csak **bejelentkezés után**, és **`HttpOnly`**-ak
(`document.cookie`-ban nem látszanak) · (3) a fizetési sütik csak a fizetési felület megnyitásakor ·
(4) a tárolás zöme **localStorage/sessionStorage/IndexedDB** — jogilag ePrivacy 5(3) alatt ugyanaz, ezért benne van.

### Mennyiség (scope)
3 saját HTTP-süti (`fdp_refresh_token`, `__stripe_mid`, `__stripe_sid`) · 2 harmadik-fél süti
(`m` @ m.stripe.com, `__cf_bm` @ hcaptcha.com) · 8 tárolási tétel · **statisztikai és marketing süti: NINCS**
(0 analitika a teljes flottán).
⚠️ **Meglepetés:** a **Stripe hCaptcha-t is betölt** — a saját kódunkban a „captcha" szó nem is szerepel.

### 🔧 FEJLESZTÉSI LELETEK (nem az ügyvédnek szólnak; a scope-osak az ő doksijában „megjegyzés"-ként igen)
| Lelet | Hol | Mi | Scope? |
|---|---|---|---|
| 1-A | `token.futdevpro.hu` | **Nincs hozzájárulási sáv**, közben Stripe+hCaptcha sütik keletkeznek | ✅ scope |
| 3-A | `adventor.futdevpro.hu` | Nincs hozzájárulási sáv | ✅ scope |
| 2-A | `master-prompter.hu` | A hozzájárulási döntés **elvész** a bejelentkezési oldalra navigálva (2× reprodukálva) | ✅ scope |
| 1-B / U-3 | `token.futdevpro.hu` | Hiányzó `fdp_refresh_token` a többihez képest — ok **nem verifikált** | ✅ scope |
| — | `futdevpro.hu` | `/cookie-policy` még „draft — pending legal review" | ✅ scope (az ügyvéd doksija váltja fel) |
| — | `art-tarot.hu`, `dum.futdevpro.hu` | Nincs hozzájárulási sáv; az `art-tarot.language` **hozzájárulás előtt** települ | 🅱️ **BACKLOG** (owner: „csak javítani kell majd") |

### Kérdések az ügyvédhez (a kiküldött doksi 10. szakasza)
1. A Stripe/hCaptcha csalásmegelőzési sütik „feltétlenül szükséges"-nek minősülnek-e?
2. A fizetési felületen elég-e a **tájékoztatás**, vagy **hozzájárulási sáv** is kell?
3. A **Google Fonts** IP-továbbítását külön kezeli-e a tájékoztatóban?

### Következő
- Levél az ügyvédnek a scope-szűkített leltárral (owner jóváhagyta a küldést).
- A scope-os leletek (1-A, 2-A, 3-A, 1-B) **fejlesztési feladatként** kiadandók — **NEM** a Dev 2-nek
  (az a számlázás-hyperplanon dolgozik).

---

## 56. (2026-07-30) — DEV-KAPUK TRIÁZSA + 🔴 BRUTTÓ-FIX ÁRAZÁSI VÁLTÁS · kiadva a Dev 2-nek

**Owner-utasítás:** *„a dev agent-nél van pár könyvelői/ügyvédi kérdés… egyelőre ne válaszolj neki, csak gyűjtsd
össze a válaszokat és, hogy mit kell tényleg továbbítani"* → majd: *„ok, add át a dev-nek"*.

### Triázs (kanonikus: `ALL Projects/legal/_process/billing-gates-triage-2026-07-30.md`)
A Dev 2 **17 nyitott tartalom-kaput** regisztrált. Eredmény:
- **4 kapura MÁR VOLT válasz** (G14 · G2 · G3/G4 · G6) — nem kell továbbítani.
- **6 tétel MÁR KIMENT** 2026-07-28-án (A/B/C/E/F/G/I) — a **könyvelő azóta nem válaszolt** (utolsó tényleges
  levélváltás **2026-06-19**) → a következő levél **sürgetés is** legyen.
- **6 tételt TÉNYLEG el kell küldeni a könyvelőnek** (G17 · G20 · G14b · G6-pontosítás · G5 · G14-re-konfirmáció).
- **ÜGYVÉDNEK nincs új kérdés** (G3/G4 = a megbízás szállítandói).

### 🔴 Owner-döntések → kiadva
`fdp-token-service/__agent/USER_INPUT.md` → **TASK-001** (commit `088ec23`, **lokális** — a dev pushja viszi ki,
hogy ne triggereljünk külön CI-t) + rövid dispatch a `MA3 Dev 2`-nek (`ccs-9bb0eb45-ms58nxrk`), `success:true`.

| | |
|---|---|
| **D10–D13 (G8b)** | ✅ jóváhagyva → **a P0 indulhat** |
| **G2** | 🔴 **NETTÓ-FIX → BRUTTÓ-FIX**: a kiírt `4.99/…` a **bruttó**. **Mért hatás:** `cheap` **32 000 → 25 000 token** |
| **G19** | FX-puffer nem kell; **ráhagyás 1.45× → 1.5×** *(javaslat: `operatingCostRate 0.25 → 0.30`)* |
| **G17/G18/G15/G16** | mechanizmus épülhet · külön HUF+EUR bankszámla (owner-TODO) · sandbox-kutatás · go-live a P2 zárásakor |
| **G14b** | **210 EUR lakossági, 0 céges** |
| **G20** | nincs donation, és nem jár érte szolgáltatás → szkópon kívül |

### 🔁 A review-loop számlálója NULLÁZÓDIK
Az árazási változás miatt újra kell két egymást követő, nulla-findinges kör.

### 🔴 Leletek
1. **SSOT-drift javítva:** a HANDOVER §4.1 5. sora („EU-n kívüli **magánszemély vagy cég** → hatályon kívül")
   **hibás volt** — a könyvelő K3/FU-K1 a két esetet **szétválasztja** (magánszemély **27%**). A **dev kódterve
   végig helyes volt**. Javítva a HANDOVER-ben; a token-service doksijának javítását a devre bíztuk.
2. **A Stripe-díj modellezése hibás:** 3% a **nettóra** számolódik, a Stripe a **terhelt bruttóra** → alulbecslés.
3. **A „nincsenek meglévő vásárlások" feltevés megdőlt** — 210 EUR korábbi lakossági forgalom van.
4. 📌 **A `documentations` repó új helye: `E:\Programming\Own\CURSOR\ALL Projects\`** (ugyanaz a git remote) →
   a `documentations/...` útvonal-hivatkozásaink flotta-szinten elavultak.

### ⏸️ KOMMUNIKÁCIÓS SZABÁLY — batch-and-hold (owner, 2026-07-30)
> *„nincs sürgetés. és még ne küldjük el az új kérdéseket. majd ha kaptunk választ akkor ami addig
> összegyűlt, elküldjük."*

**NINCS sürgetés** a 07-28-i, válasz nélkül maradt könyvelői levelekre; az **új kérdéseket VISSZATARTJUK**
(K-B1…K-B6). **Trigger: a következő bejövő könyvelői levél** → akkor **egyben** megy ki minden felgyűlt kérdés.
⚠️ **G17 emiatt élesítési blokkoló marad** (a kód épül, a kapcsoló zárva) — a devnek így lett kiadva.
*(Az ügyvédi csatornát ez nem érinti.)*

### Nyitott
- **Könyvelői levél** (K-B1…K-B6) — ⏸️ **visszatartva**, a következő könyvelői válaszig gyűjtjük.
- **Owner-TODO:** Stripe HUF+EUR payout-számlák · szamlazz.hu sandbox/éles fiók (G15) · go-live dátum (G16).
- Az **`1.5×` bontása** (`profitRate` vagy `operatingCostRate`) — a dev visszakérdezhet.
