# CONTINUATION — állapot-fájl a ScheduleWakeup-hoz

> 🔴 **NO-CACHE belépési pont.** Minden ébredéskor **frissen** olvasandó.
> A **feladat + szabályok**: `__agent/plans/discord-two-way-hyperplan/hyperplan.plan.md`
> (a tetején a progress-blokk). Itt **csak az állapot** van — a terv tartalma nem másolódik ide.

**Utoljára frissítve:** 2026-09-07 09:50

---

## Hol tartunk

```yaml
active_plan: __agent/plans/discord-two-way-hyperplan/hyperplan.plan.md
state: building
review_gate: "MINDKET SZAKASZRA TELJESULT 2026-09-06 — 1. szakasz 8 kor / 11 javitas; figyelo 7 kor / 10 javitas; mindkettonel az utolso KETTO tiszta"
tests: "CLI 392/392 + szerver 42/42 zold; tipusellenorzes zold; lint 0 hiba; comm doctor 10 zold / 1 reszleges (2026-09-07 09:07)"
owner_available: false        # AI Summiton (elindult 07:45); Discordon ir
blocked_on_owner: "Nyitott kerdesek H/I/J/K/L/M - kiemelten: L1 (cimke-alapu session-feloldas: EPITSEM-E MEG), J1/J2 (kepesseg-jovahagyasok), I1-I9 (idobeosztas-preferenciak), M3 (az idegen interfood-osszefesules commitolhato-e). [M1 LEZARVA: megjavitva.]"
```

**Owner-utasítás (2026-09-06):** *„kezd el ennek a Hyperplan-nek a lefejlesztését, és amíg a
végére nem érsz, addig tartsd magad mozgásban a Schedule Wake-up-pal"*.

---

## Tételes státusz

| Munkacsomag | Állapot | Token kell hozzá? |
|---|---|---|
| MP-0 felderítés + tervezés | ✅ **KÉSZ** | — |
| MP-1 saját Discord-alkalmazás | ✅ **KÉSZ + ÉLŐBEN IGAZOLT** — a bot `Honnie#6234` néven csatlakozik | — |
| MP-2 **kötegelő** (mag) | ✅ **KÉSZ, 16/16 teszt zöld** (2026-09-06) | nem |
| MP-2 Discord-figyelő + **backfill** | ✅ **ÉLŐBEN IGAZOLT** — DM-támogatás, 12 órás pótlólagos beolvasás | — |
| MP-2 **kimenő küldés** (`ma comm say`) | ✅ **ÉLŐBEN IGAZOLT** — első válasz elküldve | — |
| MP-3 Discord-válasz kötelezettség | ✅ **KÉSZ** — `ma comm say` + G-1 automatikus ellenőrzés a `doctor`-ban | — |
| MP-2 **automatikus kiküldés** | ✅ **ÉLŐBEN IGAZOLT** — a figyelő 15 mp-enként maga küld; korábban kézi `flush` kellett | — |
| MP-8 **a szerver a gazda** | ✅ **ÉLŐBEN IGAZOLT** — `DiscordListener_Service` indítja/újraindítja a figyelőt | — |
| MP-8 **„gépel…" visszajelzés** | ✅ **ÉLŐBEN IGAZOLT** — 7 mp-es frissítés, 15 perces biztonsági szelep | — |
| MP-5.1 jelenlét-figyelő | ✅ **A SZERVER INDÍTJA** (`PresenceMonitor_Service`) — már NEM owner-lépés | — |
| MP-9 `dc ldp` mint default | ✅ **ÉLŐBEN FUT** — saját terminálablak, 1370 mp-es kör, minden lépés zöld | — |
| MP-4 session-önazonosítás | ✅ **KÉSZ + élőben zöld** (2026-09-06) | **nem** |
| MP-5 hangszórós kapu (megépítve + bekötve) | ✅ **KÉSZ, élő próbán TILTOTT**, 8/8 teszt zöld | nem |
| MP-5.1 jelenlét-figyelő újraélesztése | ✅ **MEGOLDVA** — a szerver felügyeli (2026-09-06), nem ütemezett feladat | nem |
| MP-6 csatorna-diagnosztika | ✅ **KÉSZ, élesben lefuttatva, 9/9 teszt zöld** (2026-09-06) | nem |
| MP-7 státusz-kivonat | ✅ **KÉSZ, élő organizer-adaton**, 12/12 teszt zöld | nem |
| MP-7 a tick maga (Daytime/Nighttime) | ✅ **KÉSZ száraz futásig**, élő adaton, 10/10 teszt zöld | nem |

---

## ✅ 2026-09-07 09:00-09:45 — ELVEGZETT MUNKA

| Mit | Allapot |
|---|---|
| **C-33 STT elo, vegponttol vegpontig proba** | ✅ **SIKERES.** SAPI-val generalt ISMERT mondat -> sajat kliens -> FDP AI -> az atirat SZOROL SZORA egyezett (77,6 mp, `status: processed`). A hallucinacio-or helyesen NEM jelolte gyanusnak. A **timeout-ag is igazolt** (5 perc utan leiro eredmeny, a tukor nem talalgat). |
| **C-44 konzol-pulzus** | ✅ **MEGEPULT ES ELOBEN FUT.** `server/src/_services/system-pulse.service.ts`, 14 teszt. Mar az elso percben dolgozott: o jelezte, hogy 3 uzenet var. |
| **⛔ UJ HARD RULE** | `current/principles/fdp-ai-never-restart.md` — owner: *„Ne inditsd ujra az FDP AI szolgaltatast! Ahhoz soha ne nyulj!"* Regisztralva a CLAUDE.md-ben, az AGENTS.md szinkronizalva. |
| **Doksi-writeback** | `FDP_AI_STT.md` §3 ujrairva (mert szerzodes + RAM-fugges) · `CHANGELOG` uj entry · `SKILLS.md` ket uj szekcio · `CATALOG.md` · `STATUS.md` · `open-questions.md` **M)** szekcio |
| **Review-korok** | 1. kor (korrektseg/edge): 3 finding, javitva · 2. kor (biztonsag/regresszio): **NULLA** · 3. kor (doksi vs. valosag): 1 finding (a SKILLS-ben KITALALT pelda-sor allt, valodira cserelve) · 4. kor (allapot-fajlok): 1 finding (a hyperplan STATUS-blokkja **negyedszer** elavult) · 5. kor: **NULLA**. |

### 🔴 KET SAJAT HIBA, javitva

1. **A CATALOG-ban magamtol allitottam 4 sort `✅`-re.** A `✅` a katalogusban **„a user
   jovahagyta"**-t jelent, nem azt, hogy „megepult". Mind a negy visszaallitva `⏳`-ra, es a
   szabaly kiirva a statusz-tablazat ala, hogy legkozelebb ne tevesszem el.
2. **Hibas diagnozis:** a GPU-t mertem (5%) es abbol „beragadt zarra" kovetkeztettem —
   majdnem a szolgaltatas ujrainditasat kertem. A valodi ok a **93%-os rendszer-RAM** volt
   (owner mondta meg, en megmertem). ⭐ Tanulsag: ha egy alrendszer „var", ne az elsokent
   eszedbe juto eroforrast merd meg, hanem MINDET, mielott kovetkeztetsz.

### 🔴 Ismert hiba, NEM altalam okozva

Az LDP **`startup-test`** lepese mindig elbukott: `'tsx' is not recognized` (bare `tsx` a
PATH-on kivul; a csomag megvan). `fatal:false`, nem blokkolt, de allando piros volt.

> ✅ **MEGOLDVA ugyanezen a napon, 09:45-kor** — lasd a lenti C-33-as szakaszt. Az owner uj
> szabalya (*„Sose egyeztess ha egyertelmu javitasi vagy improvement feladat van"*) pont erre
> az esetre vonatkozik, ezert a `Q-2026-09-07-M1` kerdes **lezarva**. A fenti bekezdes csak
> tortenetileg all itt.

---

## ✅ 2026-09-07 09:45 — C-33 BEFEJEZVE (a Discord-hanguzenet vegig mukodik)

> Owner: *„Folytasd a discord STT fejlesztest amig kesz nincs"*

| Mit | Allapot |
|---|---|
| **A BLOKKOLO feltarva** | 🔴 A Discord-hanguzenet **URES `content`-tel** erkezik; a szuronk ezt *„ures uzenet"*-kent **nemán ELDOBTA**. A hanguzenetek SOSEM jutottak el hozzam. Regresszio-teszt orzi. |
| **`discord.voice-message.ts` (uj)** | hang-felismeres (contentType ES kiterjesztes), csatolmany-valasztas, letoltes, a kotegbe kerulo szoveg **megjelolese**. |
| **A figyelo bekotve** | letoltes -> STT -> **tukor-uzenet** -> megjelolt atirat a kotegbe. |
| **⭐ A legfontosabb dontes** | **bizonytalan/sikertelen felismeresnel a kotegbe SEMMI nem kerul** — a tukor kimegy, es varunk. Egy felrehallott mondat a kotegben mar az owner szo szerinti utasitasanak latszana. |
| **Vedokorlatok** | 25 MB (a **letoltott** meret is merve) · 60 mp idokorlat · ures fajl = hiba · **duplikatum-szures a DRAGA lepes ELOTT** · a halmaznak felso hatara van · a csatolmany-linkek NEM kerulnek a koteg-fajlba. |
| **A backfill is ezen az uton megy** | kulonben a leallas alatt erkezett hanguzenet URES tartalommal kerult volna a kotegbe. |
| **LDP `startup-test` JAVITVA** | bare `tsx` -> `npx tsx`. Allandoan piros volt; most **8 teszt / 0 bukas**. |
| **Teszt** | **CLI 392/392** (26 uj), szerver 42/42. |
| **Review-korok** | 1. kor: 3 finding (a backfill nyersen tette volna be a hangot · duplikatum ujra-felismerne + masodik tukrot kuldene · csatolmany-linkek a kotegben) — mind javitva. 2. kor: 1 finding (korlatlanul novo duplikatum-halmaz) — javitva. |

### ⏳ AMI MEG NINCS IGAZOLVA

**Egy VALODI Discord-hanguzenet** meg nem ment at a rendszeren — ehhez az ownernek kell
kuldenie egyet. Az egysegtesztek a tiszta reszeket fedik, az STT elo probaja megvolt, de a
**valodi csatolmany alakja** (contentType, `duration` mezo) meg **nem merve**.
⛔ Ezt NEM allitom keszen igazoltnak.

### 📌 UJ OWNER-SZABALY (szo szerint rogzitve)

*„Sose egyeztess ha egyertelmu javitasi vagy improvement feladat van. Csinald meg.
(Error handling, descriptive errors, guardrails, fixes always allowed)"*
-> `current/principles/no-approval-for-obvious-fixes.md`

### 📡 A JELENLET-MERES HATARA (owner kerdesere merve)

A monitor **el es friss**, de azt meri, hogy **van-e input EZEN a gepen** — NEM azt, hogy az
owner hol van. Az indulasa (07:45) utan **ket** aktiv mintat mert, az egyiket **09:15:33-kor**
(5 mp-es input), jiggler nelkul. ⇒ Megerositi az owner sajat otletet: **a telefon a halozaton**
kell masodlagos jelnek. ❓ Nyitott: ki generalta a 09:15-os inputot.

---

## ⏭️ A KÖVETKEZŐ MUNKA (owner indulasa utan, ~07:45)

🔴 **L1 — cimke-alapu session-feloldas.** A Discord-bejuttatas jelenleg a
`CLAUDE_CODE_SESSION_ID` env-valtozon mulik, ami az LDP-t INDITO folyamattol oroklodik
(bizonyitva: `env -u CLAUDE_CODE_SESSION_ID ma ccap whoami` -> `MA-CCAP-NO-SESSION-ID-ENV`).
Javitas: konfigba a session **cimkeje** (`My Assistant`), es a feloldas sorrendje
env -> cimke -> leiro hiba. Reszletek: `__documentations/dev/MULTI_SESSION.md`.
⚠️ Kod-modositas = ~23 perces LDP-ujraepites, alatta all a Discord-csatorna - ezert csak
akkor, amikor az owner mar nincs otthon / nem var uzenetet.

## A következő konkrét lépés

1. ~~MP-4 önazonosító~~ ✅ **KÉSZ** — `ma ccap whoami` + `ma ccap runtime` élőben zöld
2. ~~MP-2 kötegelő mag~~ ✅ **KÉSZ** — `cli/src/discord/` (tár + összefűző + híd), **16/16 teszt zöld**
3. ~~MP-6 csatorna-diagnosztika~~ ✅ **KÉSZ** — `ma comm doctor` élesben lefuttatva
4. ~~MP-5 hangszórós kapu~~ ✅ **KÉSZ** — élőben igazoltan TILT, amíg nincs jelenlét-jel
5. ~~MP-7 státusz-kivonat~~ ✅ **KÉSZ** — `ma status digest` élő organizer-adaton
6. ~~MP-7 a tick maga~~ ✅ **KÉSZ** — `ma tick plan` élő adaton, helyes Nighttime/GYŰJT döntés
7. ✅ **Review-kör 1 (korrektség + edge-case) LEFUTOTT — 4 finding, mind javítva:**
   - 🔴 **Súlyos:** a státusz-kivonat **nem lapozott** → 131 feladatból 10-et látott.
     Javítva; élesben igazolva: lejárt 2 → **5**.
   - 🔴 A jelenlét-olvasó csak a legfrissebb napi fájlt nézte → **éjfélkor** hamis
     „nincs mérés". Javítva (3 fájlra visszamegy).
   - 🟡 A tick sürgősség-egyezése objektum-azonosságra épült → ref-alapúra cserélve.
   - 🟡 A Discord-híd kétszer oldotta fel a session-azonosságot → egyszer.
   ⚠️ **A javítás NULLÁZZA a számlálót** → még KÉT tiszta kör kell.
8. ✅ **Review-kör 2 (biztonság + hibatűrés + regresszió) LEFUTOTT — 2 finding, javítva:**
   - 🔴 A **hangszórós kapu összeomlott volna**, ha a jelenlét-olvasás kivételt dob
     (jogosultsági hiba, sérült könyvtár) → most `unknown` ⇒ **TILT**, nem összeomlás.
   - 🟡 Elkerülhető típus-cast a diagnosztikában → inline `instanceof`.
   **Ellenőrzések hiba nélkül:** `cast discover` regresszió-mentes (11 eszköz) · a bot-token
   sehol nem íródik ki (csak a NEVE) · nincs `any` típus · a többi cast JSON-határon védekező.
   **Új:** 8 teszt a jelenlét-olvasóra (éjfél-átfordulás, BOM, csonka sor, elavult mérés).
   ⚠️ **A javítás ismét NULLÁZZA a számlálót** → még KÉT tiszta kör kell.
9. ✅ **Review-kör 3 (szabály-megfelelés) LEFUTOTT — 1 javítás + 2 jelölt hiány:**
   - 🔴 **A tick nem naplózta a döntést**, pedig a szabály kimondja: *„minden döntés az
     akció-naplóba — A CSENDES TICK IS"*. Javítva, élesben igazolva.
     *(Enélkül nem lehetne megkülönböztetni: a tick lefutott és hallgatott, vagy EL SEM INDULT.)*
   - 🟡 **G-1 + G-2** — két kimondott szabály nincs kódban (elmaradt Discord-válasz = hiba;
     reakció nélküli üzenet → eszkaláció hangszóróra). **Mindkettő élő Discordot igényel**,
     ezért a hyperplan MP-3 alatt **KÖVETETT HIÁNYKÉNT** rögzítve — nem elhallgatva.
   ⚠️ Számláló ismét nullázva.
10. ✅ **Dokumentáció-writeback KÉSZ:** `CHANGELOG.md` új entry · `SKILLS.md` új
    kommunikációs szekció (parancsok + mért buktatók) · `.env.example` Discord-kulcsnevek
    (**érték nélkül**) · a workflow-doksi 6. szekciója állapotra írva, a 3.2 mérési
    pillanatkép **stale-jelölve** + új **3.2b friss állapot** · `STATUS.md` új fejszekció.
11. ✅ **Review-kör 4 (dokumentáció ↔ valóság) LEFUTOTT — 1 finding, javítva:**
    - 🔴 **Folyamat-szabályt sértettem:** 7 kérdést tettem fel az ownernek a chatben, de
      **egyik sem került** a `current/open-questions.md`-be — pedig a projekt-szabály
      kifejezetten előírja („ne csak a chatben hagyd", *„sok-sok kérdés elsikkadna"*).
      Javítva: új **H) szekció**, `Q-2026-09-06-01..07`.
    **Ellenőrzések hiba nélkül:** a doksiban rögzített CC session-azonosító **még érvényes** ·
    **nincs titok-szerű minta** a doksikban, az `.env.example` minden kulcsa üres ·
    a `comm doctor` tényleg nem-nulla kilépési kóddal tér vissza · a kapu-tiltás naplózódott.
    ⚠️ A javítás ismét nullázza a számlálót.
12. ✅ **Review-kör 5 (teljes végig-ellenőrzés) LEFUTOTT — 1 finding, javítva:**
    - 🔴 **A HYPERPLAN saját STATUS-blokkja elavult volt** („0/7, az építés nem indult"),
      miközben 5 csomag elkészült. ⚠️ Az **ébresztő-prompt épp erre a fájlra mutat**
      feladat-fájlként → egy friss session **újra elvégezhette volna a kész munkát**.
      Javítva + a tanulság a fájlba írva.
    **Ellenőrzések hiba nélkül:** `ma comm flush` üres kötegre nem hasal el · a `ma --help`
    mind a 4 új csoportot mutatja · 63/63 teszt · típusellenőrzés zöld · a `CONTINUATION.md`
    és a `STATUS.md` **ugyanazt a 3 owner-teendőt** mondja · 7 kérdés rögzítve.
    ⭐ **A 4. és 5. kör NULLA KÓD-hibát talált** — a kód két köre stabil; a találatok
    dokumentációs/folyamat-jellegűek voltak.
13. ✅ **Review-kör 6 (friss szem) LEFUTOTT — 2 finding, javítva:**
    - 🟡 **HOLT KÓD:** a `DiscordBridge.inspect()` létezett, de **senki nem hívta**.
      Bekötve a `comm doctor`-ba — de **csak ha van várakozó üzenet** (üres kötegnél
      fölösleges CCAP-kör). Így a diagnosztika megmondja, **miért** nem ment még ki a köteg.
    - 🟡 A 4 új parancs-csoportnak **nem volt saját `--help`-je**, a globális helpre esett
      vissza. Mind a négy megírva (`ccap` · `comm` · `status` · `tick`).
    **Utóellenőrzés:** 63/63 teszt · típusellenőrzés zöld · mind a 4 parancs fut.
    ⚠️ Számláló nullázva.
14. 🎉 **Review-kör 7 (a legutóbbi változások) — NULLA FINDING. ELSŐ TISZTA KÖR.**
    - ✅ Mind a **8 korábbi csoport-help sértetlen** — a 6. köri javítás nem tört el semmit.
    - ✅ A doctor **új köteg-ága élőben kipróbálva** (ideiglenes próba-üzenettel): helyesen
      megmondja, **miért** vár a köteg („a session dolgozik — gyűjtünk tovább").
    - ✅ A próba-üzenet **maradéktalanul eltakarítva** (a tár üres, nincs maradék).
15. 🏁 **Review-kör 8 (megerősítő) — NULLA FINDING. MÁSODIK TISZTA KÖR.**
    ✅ **A `core-review-until-clean` KAPU TELJESÜLT.**
    Ellenőrizve egy menetben: típusellenőrzés zöld · **63/63 teszt** · mind a **7 parancs
    fut** (a `comm doctor` szándékosan `1`-gyel tér vissza, mert van hibás tétel) · a három
    állapot-fájl **egyezik** · **nincs teszt-szemét** (a Discord-tár üres) · **nincs
    titok-szivárgás** a módosított doksikban.
16. ✅ **Discord-figyelő MEGÉPÜLT** (`ma comm listen`):
    - `discord.js` 14.27 telepítve · `discord.listener.ts` + `discord.message-filter.ts`
    - **8 új teszt** a szűrőre: csak az owner, csak a dedikált csatorna, a **saját botunk
      üzenete kiszűrve** (visszhang-hurok ellen), üres üzenet elutasítva, hiányos
      konfigurációnál **mindent** elutasít.
    - ⭐ **Szerkezetileg** kényszeríti a CCAP-utat: a figyelő **csak a kötegbe tesz**,
      közvetlenül SEMMIT nem küld a CC sessionbe.
    - **Élő próba:** token nélkül **tisztán, leíró hibával** bukik (nincs verem-nyom).
    - ⏳ A tényleges kapcsolódás **csak élő tokennel** próbálható ki.
17. ✅ **Doksi-writeback a figyelőhöz KÉSZ:** `SKILLS.md` (`ma comm listen`) · `CHANGELOG` ·
    hyperplan MP-2 §4.4 · setup-doc **új 6b indító szakasz**.
    🔴 **Közben KÉT elavult doksi-részt is javítottam:**
    - a hyperplan STATUS-blokkja **megint** elavult volt (63 teszt / 4 review-kör) —
      **másodszor** futottam bele ugyanabba;
    - a setup-doc 5. szakasza még azt állította, hogy *„külön gyűjtő-logikát írni TILOS"*,
      ami **ELLENTMOND** az owner későbbi korrekciójának (a kötegelés a MI oldalunkon van).
18. ✅ **Figyelő-review 1. kör (biztonsági határok) — 3 finding, javítva:**
    - 🔴 **SÚLYOS: egy naplózási hiba MEGÖLTE VOLNA a figyelőt.** A `handleMessage`
      `void`-olt hívás volt, benne **nem védett** `await logAction` → `unhandledRejection`
      → a globális kezelő `process.exit(1)`. Egy „mindig élő" csatornánál elfogadhatatlan.
      Javítva: `safeLog` + a hívás is catch-elve; végső mentsvár a stderr (a hiba **látható**).
    - 🟡 A setup-doc **0. szakasza** még az elavult *„már készen van"* állítást vitte a
      kötegelésről — az 5. szakaszt javítottam, a 0-t nem. **Fél-javítás volt.** Feloldva.
    - 🟡 **Harmadszor** rontottam el ugyanazt a `
` escape-et python→TS íráskor.
    **Utóellenőrzés:** 71/71 teszt · típusellenőrzés zöld · `comm listen` továbbra is tisztán bukik.
    ⚠️ Számláló nullázva — két tiszta kör kell.
19. ✅ **Figyelő-review 2. kör (üzemeltetés) — 1 fő finding, javítva:**
    - 🔴 **A figyelő csendben elhalhatott volna, és senki nem vette volna észre.** Nem volt
      életjel, és a `comm doctor` **nem tudta volna megmondani, hogy fut-e** — csak azt,
      hogy be van-e állítva. ⚠️ **Pontosan ettől volt a jelenlét-figyelő 112 napig halott.**
      Megépítve: **életjel-fájl** (60 mp-enként frissül, + minden feldolgozott üzenetnél)
      és a `doctor` a **FRISSESSÉGÉT** nézi — nem a konfiguráció meglétét.
      A `stale` állapot **`broken`**-ként jelenik meg: *„a Discordon írt üzeneteid NEM
      jutnak el hozzám"*.
    - Az életjel **sosem dob hibát**; ha nem írható, a diagnosztika inkább „halott"-nak
      látja — az **óvatos** irányba téved. A hamis „él" lenne a veszélyes.
    **7 új teszt** (friss / elhallgatott / sérült / értelmezhetetlen időbélyeg / körbeírás).
    **Utóellenőrzés:** 78/78 teszt · típusellenőrzés zöld · a doctor élesben helyesen jelzi
    a hiányzó életjelet.
    ⚠️ Számláló nullázva.
20. ✅ **Figyelő-review 3. kör (dokumentáció) — 2 finding, javítva:**
    - 🟡 A setup-doc **5. szakaszának CÍME** még mindig *„MÁR KÉSZ"*-t mondott, miközben a
      törzsét már korrigáltam. ⚠️ **A címet futják át** — a fél-javítás félrevezet.
    - 🟡 Az **ÉLETJEL sehol nem volt dokumentálva**, pedig üzemeltetési szempontból ez a
      legfontosabb új képesség. Új **6c szakasz** + `SKILLS.md` bejegyzés.
    ⚠️ Számláló nullázva. **Tanulság (harmadszor jön elő):** ha egy doksi-részt javítok,
    a **címét és a hivatkozó helyeket is** át kell néznem, nem csak a bekezdést.
21. ✅ **Figyelő-review 4. kör (lefedettség) — 3 finding, javítva:**
    - 🔴 **A hibakeresési térképben nem volt benne a LEGVALÓSZÍNŰBB tünet:**
      *„írtam Discordon, és semmi nem történt"*. Most ez a **legelső sor**, és a
      figyelő-életjelre mutat — mert a leggyakoribb ok az, hogy nem fut a figyelő.
    - 🟡 Az életjel hiányzott a `CHANGELOG`-ból.
    - 🟡 Az életjel hiányzott a hyperplanból (új **2.7** sor + STATUS-frissítés).
    **Utóellenőrzés:** 78/78 teszt zöld.
    ⚠️ Számláló nullázva.
22. ✅ **Figyelő-review 5. kör — 1 finding, javítva + a MINTÁZAT is kezelve:**
    - 🔴 A **`STATUS.md` elavult volt** (63 teszt, se figyelő, se életjel). Ez a **HARMADIK**
      fél-frissítés (hyperplan STATUS **kétszer**, `STATUS.md` **egyszer**).
    - ⭐ **Nem csak foltoztam:** rögzítettem a visszatérő mintázatot és egy **kötelező
      4-pontos ellenőrzőlistát** (lásd fentebb, „VISSZATÉRŐ SAJÁT HIBÁM"), hogy negyedszer
      ne fordulhasson elő. A `ma comm --help` a `listen`-t helyesen mutatja.
    ⚠️ Számláló nullázva.
23. 🎉 **Figyelő-review 6. kör — NULLA FINDING. ELSŐ TISZTA KÖR a figyelőre.**
    - ✅ Típusellenőrzés zöld · **78/78 teszt** · mind a **8 parancs fut** (`comm doctor` és
      `comm listen` szándékosan `1`-gyel — hiányzó jelenlét-figyelő, illetve token).
    - ✅ A **4-pontos állapot-ellenőrzőlista mind a négy pontja friss** (`CONTINUATION` ·
      hyperplan STATUS · `STATUS.md` · doksik).
    - ✅ Nincs teszt-szemét · nincs titok-szivárgás.
    - ⚠️ **Saját mérési hiba, nem kód-hiba:** a `grep -i` ebben a környezetben **nem hajtja
      össze az ékezetes nagy/kisbetűt**, ezért a `CHANGELOG`-ot tévesen hiányosnak mérte.
      **Majdnem „kijavítottam" egy már helyes doksit** — ellenőrzés mentett meg tőle.
24. 🏁 **Figyelő-review 7. kör (megerősítő) — NULLA FINDING. MÁSODIK TISZTA KÖR.**
    ✅ **A `core-review-until-clean` kapu a FIGYELŐRE IS TELJESÜLT.**
    Új nézőpontok ebben a körben: a `discord.js` a **`dependencies`**-ben van (nem dev) ·
    **nincs futásidejű adat vagy titok** a repóban · a `.env` **nem verziózott** ·
    a 27 új modul-fájl mind jogos. **78/78 teszt · típusellenőrzés zöld.**
    - ⚠️ **Második mérési hibám két körön belül:** túl tág `grep`-minta a saját
      forrásfájljaimat jelölte „tiltottnak". **Mindkétszer az mentett meg, hogy a találatot
      ELLENŐRIZTEM cselekvés előtt.** Tanulság: a szűrő-minta maga is hibázhat — a
      **találatot** nézd meg, ne csak a számot.

---

## 🏁 A HYPERPLAN TOKEN-FÜGGETLEN RÉSZE LEZÁRVA (2026-09-06)

Minden megépíthető darab kész, átvizsgálva, mindkét review-kapu teljesítve.
**A további haladás owner-műveletet igényel** — lásd lentebb.

⏳ **Owner-műveletet igényel:** MP-1/2/3 Discord élesítés · MP-5.1 figyelő-autostart ·
a törött interfood fájl döntése.

⚠️ **Sorrendi elv:** minden token-független munkát elvégzek, MIELŐTT az owner-re várnék.

### Amit már használni lehet

```bash
ma ccap whoami --pretty     # melyik CC session vagyok (futásidejű feloldás)
ma ccap runtime --pretty    # foglalt vagyok-e; a CCAP sorának állapota
ma comm doctor              # tételes csatorna-diagnosztika (mi él / mi hiányzik / mi a teendő)
ma comm flush [--force]     # a Discord-köteg kiküldése
ma status digest            # státusz-kivonat: elmúlt / egy órán belül / ma / dátum nélkül
ma tick plan                # a tick SZÁRAZ futása — mit tenne most (nem küld semmit)
```

**A diagnosztika legutóbbi élő futása (2026-09-06 15:33):** **4 rendben** · 3 hiányzik ·
1 hibás (jelenlét-figyelő 112 napja halott) · 1 nem megállapítható (nem fut a szerver).
*(A hangszórós kapu sora ✅-re váltott, mert a kapu-modul megépült — a futásidejű ellenőrzés magától frissült.)*

**Teszt-állás: 63/63 zöld** (7 spec-fájl).

⚠️ Egyelőre `npx tsx src/main.ts …` formában futtatandó a `cli/` alól — a teljes `ma` build
egy **idegen, félkész** fájl miatt bukik (lásd lentebb).

---

## Mire várunk, és mi oldaná fel

| Mire | Mi oldaná fel |
|---|---|
| MP-1 élesítés | az owner hazaér és létrehozza a saját botot + `.env` bejegyzések |
| MP-2/MP-3 **élő** próba | ugyanaz |
| MP-5.1 jelenlét-figyelő | `powershell -File server/activity-monitor/install-autostart.ps1 -Mode apply` — **rendszer-szintű változtatás (ütemezett feladat), ezért owner-jóváhagyást vár**. Ellenőrzés módosítás nélkül: `-Mode check`. |

---

## 🔴 Blokkoló, ami NEM az enyém — idegen félkész munka

`cli/src/interfood/interfood.api-client.ts` — **duplikált `getImageUrl`** (TS2393),
két különböző megvalósítás egymás alatt. Emiatt a **teljes CLI-build bukik**.

- **Nem én okoztam**, és **nem nyúlok hozzá** (megosztott workspace, másik session
  commitolatlan munkája).
- A saját fájljaim külön typecheckkel **zöldek**.
- ⚠️ Amíg ez fennáll, `pnpm run build-base` nem megy → `npx tsx` a kerülőút.
- **Owner-döntés kell:** javítsam-e, vagy a másik session zárja le?

---

## 🔴 VISSZATÉRŐ SAJÁT HIBÁM — a fél-frissítés

**NÉGYSZER** fordult elő ugyanaz: befejezek egy munkacsomagot, frissítem az egyik állapot-fájlt,
és a többi **némán elavul**. Mérve: a hyperplan STATUS-blokkja **háromszor**, a `STATUS.md` **egyszer**.
A negyedik: 2026-09-07 — a hyperplan még `345/345 + 28/28`-at állított a valós `366/366 + 42/42` helyett.
⇒ Az ellenőrzőlista ezért **átkerült az `__agent/ENTRY.md` §5-be** is: ott minden körben elolvasom,
itt viszont csak akkor, ha épp idáig görgetek.

⚠️ **Miért veszélyes:** az elavult állapot-fájl **hitelesnek látszik**. Az ébresztő-prompt épp
ezekre mutat — egy friss session elhiheti, hogy semmi nem készült el, és **újra megcsinálja**.

**KÖTELEZŐ ELLENŐRZŐLISTA minden munkacsomag után — mind a NÉGY:**

1. `__agent/CONTINUATION.md` — a tételes státusz + a következő lépés
2. `__agent/plans/<terv>/hyperplan.plan.md` — a **STATUS-blokk** (teszt-szám, review-kör is!)
3. `__agent/STATUS.md` — a projekt-szintű pillanatkép
4. Az érintett **dokumentáció** — és ott a **CÍMEK + hivatkozó helyek** is, nem csak a bekezdés

---

## Mért csapdák (ne kelljen újra felfedezni)

- A `cat > fájl <<'EOF'` heredoc **elhasalt** hosszú magyar tartalmon → fájlíráshoz a
  dedikált fájlíró eszközt használom, nem shell-heredocot.
- A CCAP `prompt` végpontja **magától sorba tesz** — de az **N külön futás**, ezért
  ⛔ **nem erre hagyatkozunk**; a kötegelés a mi oldalunkon van (hyperplan MP-2 §4.3).
- A `ccap sessions` **CCAP-session**-öket listáz (más azonosító-forma) — a **CC session**-ök
  a `GET /api/cc-session` alatt vannak. A kettő összekeverése korábban téves következtetéshez vezetett.
- ⛔ A CCAP meglévő botjának tokenjét **nem** bántjuk (`Reset Token` leállítaná).
- 🔴 A **Windows PowerShell 5.1 ANSI-ként olvassa a `.ps1`-et** → ékezetes magyar szöveg
  **töri a parse-t**. A szkriptet **UTF-8 BOM-mal** kell írni.
- A `Join-Path` **három**-argumentumos alakja csak PS7+; 5.1-en egymásba kell ágyazni.
- 🔍 A **`grep -i` NEM hajtja össze az ékezetes nagy/kisbetűt** ebben a környezetben
  (`É` ≠ `é`) → hamis „hiányzik" eredmény. Ékezetes szó keresésénél **ékezet nélküli
  töredékre** keress (pl. `letjel` az „életjel"/„Életjel" helyett).
- 🔴 **Kétszer buktam el ugyanazon:** python-heredocból TypeScript-be írt sztringnél a
  `
` escape elveszhet, és **valódi újsort** ír a fájlba → `Unterminated string literal`.
  Megoldás: `chr(92)+'n'` explicit karakterkóddal, vagy dedikált fájlszerkesztő eszközzel.

---

## Kapcsolódó

- `__agent/plans/discord-two-way-hyperplan/hyperplan.plan.md` — **a feladat + a szabályok**
- `__documentations/dev/DISCORD_BOT_SETUP.md` — az owner beállítási lépései
- `__agent/flows/recurring/hourly-assistant-tick/README.md` — a workflow-szabályok
- `__agent/STATUS.md` — a projekt egészének pillanatképe

---

## ⏭️ MUNKASOR — az owner indulása után (2026-09-07 07:30-tól)

> Owner: *„Amúgy építsd meg! ezt az STT feldolgozást. Pontosabban kezdjél bele a
> megépítésébe, amikor elindultam."*

| # | Feladat | Miért ebben a sorrendben |
|---|---|---|
| ~~1~~ | ✅ **KESZ** — C-43 `ma comm say --file` | ez a mai csonkolási incidens végleges javítása; kicsi, és utána minden más küldés biztonságos |
| ~~2~~ | ✅ **KESZ** — C-42 kuldes utani visszaolvasas | a `--file`-lal együtt egy kör; a Python-megkerülés már így működik, csak át kell emelni a CLI-be |
| ~~3~~ | ✅ **KESZ + ELOBEN IGAZOLT** — C-33 STT | ✅ **A SZERZODES VEGIGMERVE** (2026-09-07 09:30): `POST http://127.0.0.1:38321/api/recognition?confidence_threshold=0.55&skip_classification=1`, **NYERS bajtok** + `Content-Type` + `Filename` fejlec — ⛔ NEM multipart. Elo oda-vissza proba: ismert mondat **szorol szora** vissza (77,6 mp). Doksi: `__documentations/dev/FDP_AI_STT.md` §3. ⏳ **Hatra: a Discord-hanguzenet LETOLTESE** es bekotese a figyelobe. |
| ~~4~~ | ✅ **KESZ + ELOBEN FUT** — C-44 konzol-pulzus | owner-kérés: ránézésre látszódjon, mi történik a rendszerben |
| **5** | ⏭️ **KOVETKEZO** — L1 cimke-alapu session-feloldas | a több-session működés feltétele |

⚠️ **Minden fejlesztés után KÖTELEZŐ** a `post-development-verification.md` négy ellenőrzése.
📌 **Az LDP eredményét** a `logs/live-dev-pipeline/status.json` + `output.log` adja.

### 📥 Beérkezett munkacsomagok (owner, 2026-09-07 07:38) — a fenti sor UTÁN

| Feladat | Forrás / állapot |
|---|---|
| **Voice control átemelése** *(nagy!)* | ✅ forrás megtalálva és MÉRVE: `ccap` (a RÉGI) `/discord-bot/src/_modules/voice/` — 37 fájl, ~6681 sor. Kilépési pont: `cv-result-review.control-service.ts` → `reviewResult()`. ⛔ NEM a `ccap-revisioned`. ⚠️ **ElevenLabs: NEM kihagyandó** — owner-korrekció 2026-09-07: a TTS-hez kelleni fog, csak most nincs rajta keret és a kulcs sem jó. Az elsődleges út a saját FDP AI (38321); ⛔ a kulcshoz nem nyúlunk. Doksi: `__documentations/dev/VOICE_CONTROL_REFERENCE.md`. ⚠️ Külön tervet igényel. Organizer: `org:task:6a9e4f0a482367e7f641e628` |
| **GoPrint — póló** | emlékeztető hazafelé (ma vagy holnap). Organizer: `org:task:6a9e4f09482367e7f641e621` |
