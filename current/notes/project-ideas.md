# Project ideas — jegyzetek (long-term)

> Idea-dump hely. **User szövegek szó szerint őrizve**, alatta rövid
> strukturált jegyzet. NEM "do most" — csak rögzítjük, jövőbeli projekt-jelöltek.
>
> Aktív projektek: `current/projects.md`.
> FR-ek: `current/feature-requests/`.

---

## 2026-05-16 #1 — Végső össz szoftver-fejlesztő rendszer (iframe + node-based)

### User szövege

> A végső össz szoftver fejlesztő rendszer, amiben kéne látni iframekben az
> élő rendszereket, és amin egy node-based felületen lehet nézni a közös
> egységesített komponenseket.

### Strukturált jegyzet

- **Cél:** meta-DevOps környezet, ahol egy felületről látható + szerkeszthető az
  összes projekt
- **2 fő nézet:**
  1. **iframe-grid**: az élő rendszerek (futó kliens-app-ok, dashboard-ok,
     overseer, master-prompter, organizer) párhuzamosan
  2. **node-based component-térkép**: a projekt-keresztmetszetű
     közös/egységesített komponenseket (pl. `@futdevpro/*` package-ek) graph-ként
     mutatja → melyik projekt használja, melyik verzió, függőség
- **Kapcsolódik:** FDP ökoszisztémához (nem my-assistant scope közvetlenül, de
  long-term érték)
- **Tags:** `meta-dev`, `multi-project`, `visualization`, `iframe`, `node-graph`

---

## 2026-05-16 #2 — Autonauts-like programozós játék

### User szövege

> Egy játék, ami ugyanolyan, mint az Autonauts játék, csak jobban néz ki, és
> sokkal többet segít összerakni a programokat. fejlettebb robotokkal, amik
> jól néznek ki, "szexik".

### Strukturált jegyzet

- **Műfaj:** programozós-játék (visual scripting, tanítható robotok)
- **Inspiráció:** [Autonauts](https://store.steampowered.com/app/979120/Autonauts/) —
  open-world automation game, robotokat programozol vizuális blokkokkal
- **Differenciátorok (user-kérés):**
  - **Jobb vizuális design** — modern, esztétikus
  - **Több programozási segítség** — talán AI-asszisztens, hibakeresés,
    pattern-javaslat
  - **Fejlettebb robotok** — vizuálisan vonzók ("szexi" robot-design)
- **Standalone game project** — saját ip lehet
- **Tags:** `game`, `programming-education`, `robots`, `visual-scripting`

---

## 2026-05-16 #3 — Dynamo low-coding Autonauts-stílusban

### User szövege

> A Dynamo low coding rendszerben megcsinálni a logika írásokat úgy, mint az
> Autonauts-ban van.

### Strukturált jegyzet

- **Cél:** a meglévő **Dynamo low-coding** rendszer (`@futdevpro/*` ökoszisztéma)
  logika-írását **Autonauts-stílusú vizuális blokk-rendszerré** alakítani
- **Hatás:** a low-coding olyan vizuálisan élmény-szerű lesz mint egy játék →
  fejlesztők gyorsabban tanulnak, kevesebb hibázás, több user
- **Kapcsolódik:** #2 ötlettel (game-pattern → tooling-pattern transzfer)
- **Scope:** NEM my-assistant — **Dynamo CLI / NPM-packages** projektre tartozik
- **Tags:** `dynamo`, `low-coding`, `visual-scripting`, `tooling`

---

## 2026-05-16 #4 — Opinion / OurOpinion (vélemény-szavazó platform)

### User szövege

> Szeretnék feljegyezni egy projektet a jegyzeteink közé, ami a My Opinion,
> vagy Opinion, vagy Your Opinion, vagy Our Opinion, valami Opinion. Aminek
> a lényege, hogy bárki szavazásokat dobálhat föl. Vektorkereséssel
> összevetjük, hogy van-e már ilyen szavazás. Fontos, hogy mindenki adhat
> hozzá opciókat, Köszönjük a régiekkel. A lényege az egésznek az, hogy
> szavallósdi. Meg lehet nézni a válaszstatisztikákat országosan,
> kontinentálisan és globálisan. és mindenki csak egyszer szavaszat.

### Strukturált jegyzet

- **Working title:** *Opinion* / *MyOpinion* / *OurOpinion* / *YourOpinion* — végleges név TBD
- **Cél:** közösségi szavazás-platform, **bárki** szavazást feldobhat
- **Mechanika:**
  - **Vektor-kereséses dedup**: új szavazás kérelmekor RAG-szerű keresés meglévő
    szavazások között → ha hasonló már van, megajánlja
  - **Crowdsourced opciók**: bárki adhat opciókat egy szavazáshoz (a "régiekkel
    összemerge-elve" — valószínűleg "összevetve" STT-typo: hasonló opciók
    deduplikálva)
  - **One-vote-per-user** (egyszeri voks)
  - **Multi-scope statisztikák**: ország / kontinens / globális
- **Tech-jelölt:**
  - User identification (email / wallet / SSO?) — anti-multi-vote
  - Vektor-store: pgvector / FAISS / Chroma
  - Region detect: IP-geolocation
- **Kapcsolódik:** az **életcél #1** (világ-fejlesztés, 3×3 + Ideology Forum)
  — egyfajta "demokratikus rezonancia-mérő" platform lehet
- **Tags:** `social-platform`, `voting`, `vector-search`, `dedup`, `crowdsource`, `life-goal-1`

---

## 2026-05-16 #1 — kiterjesztés (Opinion mint új típusú social-media)

### User szövege

> Az Opinion platform igazából egy újfajta social media, illetve 9gag hasonló
> dolog lehet. valami, ami úgy váltja fel a jelenlegieket, hogy közben
> tudjunk belőle épülni, tanulni.

### Jegyzet

- Az Opinion **NEM csak voting**, hanem **social-media kategória** is — feed, sharing, content-discovery
- Differenciátor a jelenlegiekkel szemben: a platform alapfilozófiája **építsünk-tanuljunk** (constructive vs viral-rage-bait)
- 9gag-analógia: vizuális content, könnyű részvétel
- Kapcsolódik #4-hez (Opinion voting) — egy **integrált platform** lehet: vote + share + tanuló-feed

---

## 2026-05-16 #2 — kiterjesztés (node-based iframe rendszer + szabályok + RAG microservice)

### User szövege

> A Nódos iframe-es mutatványnak pedig az a lényege, hogy minél inkább könnyen
> és átláthatóan tudjuk majd fejleszteni közös komponenseket.
>
> Plusz nem ártana valahogyan belevarázsolni a fejlesztési szabályrendszert,
> dokumentációs szabályrendszert, meg ilyeneket, ami megjelenhetnének a
> description-ek, meg specifikációk is ezen a felületen. szintén a
> node-based elemekhez és különálló elemekként is akár. Lehet, hogy a
> dokumentumrendszerek kaphatnának saját képernyőket is. de mindenképpen
> az iframes rendszerünkben is meg kell majd jelenjenek.
>
> Vannak olyan alapvetések, mint például, hogy mindig amikor inputunk van,
> akkor az inputunk használjon egységesített komponest, ugyanez a gombokra,
> meg mindenen legyen description gombokon és inputokon, a tartalma az
> legyen mindig elmentve session vagy local storage-ba. kivétel a kulcsok
> és passwordok természetesen. de ezek is legyenek mindig leírva. Ez lesz
> majd a nagy szabályrendszer, a rag szabályrendszer is. illetve valamilyen
> egységes ragrendszert kéne kiépítsünk, amihez minden is tud csatlakozni.
>
> A CCAP-ban lévő ragrendszereknek elérhetőnek kell lenni kívülről, sőt az
> is lehet, hogy önálló ragrendszereket kellene építeni.
> De az is lehet, hogy az egész projektmenedzsment kerülhet neki a CCAP-ból,
> vagy készíthetnénk dinamós elemeket, amivel közös bázisú, közös DB
> használatú, többszörös microservice rendszert építhetünk.
> ( ez most kicsit zavaros ez a pár dolog így egyben)
>
> ó ragrendszereket építhessek, ahhoz legalább 5 különféle táblában 5
> különféle ragrendszertípust kéne kiépítsek, szerviz stílusban más
> rendszereimnek is elérhetőek lennének.
> Szóval ki kell építsem a Dynamo-ba a RAG microservice architektúrámat.
> Aminek a lényege, hogy egy önálló szerver szervisz, ami egy rag típusért
> felel. de olyan dinamós elemekből áll össze, ami lehetővé teszi, hogy
> egységes kezeléssel ezek a táblák belekerülhessenek egy rendszerbe is,
> ha úgy szeretnénk, de több-különféle rendszerbe is, ha arra van szükség.
>
> Minden esetre meg kell tudnom állapítani, hogy hogyan fogom tudni jól
> kezelni különféle rendszerekben a különféle ragrendszereimet.

### Strukturált jegyzet — kibontva 3 al-projektre

**#2.a — Node-based iframe meta-felület (kiterjesztett):**
- Közös komponens-graph + saját képernyők a dokumentum-rendszereknek
- Szabályrendszer ÉS dokumentáció **megjelenik a node-okon**: minden komponensnek van description / spec / pattern-ref ami a node-on belül kibontható
- iframe-grid: minden élő rendszer egyszerre nézhető

**#2.b — Univerzális komponens-szabályrendszer (új scope):**
- **Standard input komponens** (minden input ezt használja)
- **Standard gomb komponens** (minden gomb ezt használja)
- **Minden gombon + inputon description** (UX-szabály)
- **Session/localStorage persist** minden input-tartalomra (kivétel: kulcsok/passwordok — de ezek is **dokumentálva** vannak hogy NEM persist-elve)
- → ez egy új univerzális szabály-csomag (`fdp-templates` szintű) → később
  externalizálni a `current/principles/`-be vagy egy új FDP package-be

**#2.c — RAG microservice architektúra (Dynamo-szinten — KIEMELT):**
- **Cél:** önálló RAG szerver-szerviz **per RAG-típus** (legalább 5 különböző tábla / 5 RAG-típus)
- **Dinamós építőelemekből** (közös DB-kezelés, közös template)
- **Egy szerviz egy rendszerbe vagy több rendszerbe is bekapcsolható** (multi-tenant)
- **CCAP RAG-ját kívülről elérhetővé** kell tenni VAGY önálló RAG-okat építeni
- **Multi-system management:** kell egy felület, amivel **különféle rendszerekben** látom és kezelem a **különféle RAG-ekeimet**
- Tags: `dynamo-package`, `rag`, `microservice`, `multi-tenant`, `vector-db`

→ Ez **kritikus dependency** a `rag-context-injection.md` (FR #7g) megvalósításához.
   A "kell egy RAG" → "kell egy RAG microservice ARCHITEKTÚRA" finomítás.

→ Ez **Dynamo szintű projekt** — NEM my-assistant scope, de **innen használjuk**
   (cliens-oldal).
