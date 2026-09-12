# 👁️ Rá kell néznem a DEV-re — magamtól, időnként

> **Owner, 2026-09-10 23:53:** *„Valamint ne feledkezz el időnként **ránézni a devre**, hogy
> **folynak-e a fejlesztések**, amiket kértem. Most már jó lenne, ha meg tudnál szólalni lassan."*

⭐ **A kérés lényege:** attól, hogy egy feladatot **átadtam** a DEV-nek *(AGENT_BUS-bejegyzés)*, az
még **nincs elvégezve**. A bejegyzés **nem bizonyíték a haladásra** — csak a kérés bizonyítéka.

---

## ⛔ A hibamód, ami ezt kiváltotta

A DEV **csendben leállhat**, és a csend **pontosan úgy néz ki**, mint a munka:
nincs hibaüzenet, nincs értesítés, a bejegyzés `[OPEN]` marad — ahogy egy **elkezdett** munkánál is.

🔴 **Mérve 2026-09-11 00:06:** a DEV utolsó életjele **2026-09-10 20:31** *(action-log)*, utolsó
commitja **20:28**. A hang-hibát **21:40-kor** adtam át — a DEV **azelőtt** állt le, és a kód
azóta **bájtra változatlan**. ⇒ **3,5 óra telt el úgy, hogy semmi nem történt, és ez sehol nem
látszott.**

---

## ✅ A NÉGY ELLENŐRZÉS — ebben a sorrendben

| # | Mit mérek | Hogyan | Mit jelent |
|---|---|---|---|
| 1 | **Milyen ÁLLAPOTBAN van a session** | `GET http://localhost:39050/api/cc-session/ccs-d5027942-mtroz7ve/inspect` | ⛔ **NEM `ListAgents`** — l. a lenti hibát. `waiting-input` + üres sor = **készen áll, küldenem KELL** |
| 2 | **Van-e friss életjel** | `__agent/log/actions/<ma>.jsonl`, `session` = a DEV CC-session-id-je *(`__agent/config/session-roles.json`)* | mikor volt az utolsó tool-call |
| 3 | **Van-e commit** | `git log --format='%h %ad %s' --date=format:'%m-%d %H:%M'` | a haladás **kézzelfogható** nyoma |
| 4 | **Mozdult-e a KÉRT kód** | a bejegyzésben megnevezett fájl/sor **felolvasása** | ⭐ **ez az egyetlen igazi bizonyíték** — a többi csak aktivitás |

⚠️ **A 4. lépés nem hagyható ki.** A DEV lehet aktív **más** feladaton — az „dolgozik" látszat,
de **nem az én kérésemen**.

---

## ⏱️ Mikor

- **Minden körben, amikor a DEV-nek átadott tétel a témám** *(pl. az owner rákérdez)*.
- **Üresjáratban**, ha van nyitott `[OPEN]` bejegyzés a DEV felé.
- ⛔ **Nem polling** *(`core-no-polling`)*: ez **alkalomhoz kötött ránézés**, nem futó figyelő.

## 📣 Mit jelentek

Az ownernek a **mért állapot** megy, nem a bejegyzés státusza:
*„a DEV áll 20:31 óta, a kód nem mozdult"* ✅ — ⛔ nem *„átadtam a DEV-nek"*.

Kapcsolódó: [[post-development-verification]] · [[focus-support]] · [[discord-message-style]]

---

## 🔴 ÉN DELEGÁLOK — ⛔ ÉN NEM VESZEM ÁT (owner, 2026-09-11 00:08)

> *„Ezt már egyszer megbeszéltük, hogy **te kezeled a devet, te delegálsz neki mindent**… **TE NE
> VEGYED ÁT!**"* · *„**TE DELEGÁLOD A FELADATOKAT A DEV-nek!!**"*

⚠️ **Ezt másodszor kellett elmondania** — tehát a hiba nem az „elfelejtettem", hanem hogy a
szabály **nem volt jól összerakva**. Ezért van itt, mérhető formában.

### ⛔ Amit NEM szabad

- ⛔ **Nem veszem át a fejlesztést**, akkor sem, ha a DEV áll, akkor sem, ha sürgős, és akkor sem,
  ha „a saját repóm".
- ⛔ **Nem kérdezem meg az ownertől, hogy átvegyem-e.** 🔴 **Mért lebukás 2026-09-11 00:07:**
  megkérdeztem *(„indítod a DEV-et, vagy átvegyem én?")* — ez **álruhás átvétel**, mert a kérdés
  felajánlja azt, ami tilos, és **rá tolja** a döntést, ami az enyém lett volna: **delegálni**.
- ⛔ **A `roles/assistant.md` „kivétel, ha a kommunikációs csatorna maga áll" kitétele NEM
  hívható be** erre. A hang-csatorna **funkció**, nem az én kommunikációs csatornám — a Discord él.

### ✅ Amit HELYETTE

```
1. megírom a handoffot   → __agent/DEV-HANDOFF.md
2. elolvasom a küldés szabályait → __agent/references/ccap-session-messaging.md  (MINDEN körben)
3. lekérdezem az állapotát → GET :39050/api/cc-session/<devId>/inspect
   ├─ waiting-input + isBusyProcessing:false + queue.items ÜRES → ⭐ KÜLDÖK (POST …/prompt)
   ├─ running / busy / van sorban tétel                        → ⛔ NEM küldök, következő kör
   └─ nem él                                                    → jelentem az ownernek
4. ellenőrzöm, hogy FELVETTE: az eventSequence nő és status→running
5. ellenőrzöm a KIMENETET (a fenti négy mérés)
```

⭐ **A 3. lépés a lényeg: a `waiting-input` NEM „halott", hanem „RÁM VÁR".** Az indítás
**az én dolgom** — owner-jóváhagyás 2026-09-07 22:30 óta, `__agent/IDENTITY.md`.

## 📮 A KÉT CSATORNA — ⛔ ne keverd össze őket

| Irány | Csatorna | ⚠️ |
|---|---|---|
| **én → DEV** | **`__agent/DEV-HANDOFF.md`** | ez a DEV **feladat-forrása** *(`__agent/roles/dev.md` 12. sor)* |
| **én → DEV, ha ÉL** | `SendMessage` a session-nevére | **kiegészítés**, nem helyettesítés — a fájl akkor is kell |
| **DEV → én** | **`__agent/AGENT_BUS.md`** | jelentés / kérdés / blokkoló |

### 🔴 A MÉRT HIBA, ami ezt a szakaszt kiváltotta

A hang-hibát *(elavult `xi-api-` kulcs-ellenőrzés)* 2026-09-10 **21:40**-kor megmértem, és az
**`AGENT_BUS.md`-be** írtam `AGB-2026-09-10-03` néven. ⇒ **A visszirányba tettem egy feladatot.**
A `DEV-HANDOFF.md` utolsó szakasza **19:52-es** maradt.

**Következmény:** a munka **sosem ért el a DEV-hez**, de a bejegyzés `[OPEN]`-ként **úgy nézett ki,
mintha át lett volna adva**. Négy óra veszett el, és a hiba **csak azért derült ki**, mert az owner
rákérdezett. 📌 **A tanulság:** *„átadtam" akkor igaz, ha a **címzett feladat-forrásába** került —
nem akkor, ha én írtam róla valahol.

⇒ Pótolva: `DEV-HANDOFF.md`, 2026-09-11 00:20-as szakasz.

---

## 🔴 A MÁSODIK MÉRT HIBA — rossz műszerrel mértem, és rossz szabályt írtam rá

> **Owner, 2026-09-11 00:34:** *„Miért nem fut? Hát **indítsd el**… **mindened adott!!** már ezt is
> elfelejtetted?"*

**Amit tettem 00:07-kor és 00:22-kor:** `ListAgents` → a DEV nincs a peer-listában → *„nem fut"* →
jelentettem az ownernek, hogy **indítsa el ő**.

**Amit a valóság mutatott 00:37-kor**, a HELYES műszerrel:

```
GET :39050/api/cc-session/ccs-d5027942-mtroz7ve/inspect
  status: waiting-input · isLive: true · isBusyProcessing: false · queue.items: 0
```

⇒ A session **végig élt**, és pontosan abban az állapotban volt, ahol a szabály szerint
**küldenem KELL**. Nem „állt" — **rám várt**.

### A két hibám, külön

| # | Mi | Miért történt |
|---|---|---|
| **1** | **Rossz műszer** | A `ListAgents` a **peer CC sessionöket** mutatja *(SendMessage-elérhetőség)*. A DEV **CCAP-menedzselt** session — a `:39050`-es `inspect` látja. A „nincs a listában" ⇒ **NEM** „nem fut". *(Ugyanaz a hibaosztály, mint a `lastActivityAt` vagy a `serverRunning` félreolvasása: **egy mező hiánya nem a jelentése**.)* |
| **2** | **Rossz szabályt írtam** | 00:22-kor a receptbe azt írtam, hogy *„NEM FUT → az indítás az ő gombja"* — ez **ellentmond egy 2026-09-07 óta élő owner-jóváhagyásnak** *(`__agent/IDENTITY.md`: a DEV-session orkesztrációja **rám** van bízva)*. ⛔ **Szabályt nem írok anélkül, hogy a meglévő kanonikus forrásokat elolvasnám** — különben a saját tévedésemet betonozom be. |

📌 **A tanulság, ami túlmutat ezen:** amikor „nincs / nem elérhető / nem fut" következtetésre
jutok, **a műszert kell először megkérdőjeleznem**, nem a világot. És ha ebből **szabály** lesz,
a szabály megírása előtt kötelező végigolvasni, mi van már rögzítve ugyanerről.

✅ **Elindítva 00:37:** a prompt kiment *(`{"success":true}`)*, az `eventSequence` 16182 → 16189,
`status: running`, `isBusyProcessing: true`. A DEV dolgozik.

---

## 🔁 MIÉRT ÁLL LE A DEV — és mi a három dolog, amit MINDIG mondani kell neki

> **Owner, 2026-09-11 02:01:** *„a dev megint leállt, és azért is állt le, mert **hosszabb idő
> kihagyás után emlékeztetni kell**, hogy frissítse a szabályokat a FAM-ból, meg hogy **készítsen
> tervfájlt**, ami mentén halad, és **tartsa magát mozgásban Schedule Wake-up-pal**."*

⭐ **A leállás nem véletlen, hanem HIÁNY.** A DEV akkor áll le, ha nincs, ami továbbvigye —
és a wakeup-hurok magától nem indul újra.

### A HÁROM, ami MINDEN indító promptba kell

```
1. FRISSÍTSD A SZABÁLYOKAT FAM-BÓL      (hideg kontextusból indul, a szabályok változhattak)
2. HA NINCS TERV-FÁJLOD, HOZZ LÉTRE     ⭐ ez hiányzott eddig az IDENTITY.md-ből
   ÉS VEZESD                            (státusz + következő lépés + ciklus-protokoll)
3. TARTSD MAGAD MOZGÁSBAN ScheduleWakeup-pal, amíg van munka
```

⚠️ **A 2. pont a kulcs.** Terv-fájl nélkül minden ébredés **nulláról** kezdi az orientációt, és
az első bizonytalanságnál megáll. A fájl az, ami **átviszi az állapotot** a körök között —
⛔ nem a prompt, mert az befagy a kiadás pillanatában *(`core-wakeup-state-file`)*.

### Mikor kell ezt észrevennem

A `waiting-input` + üres sor **nem** azt jelenti, hogy „kész" — azt jelenti, hogy **rám vár**.
📌 **Mérve 2026-09-11 02:02:** `waiting-input`, `busy: false`, `queue: 0`, `eventSequence: 16978`
⇒ küldtem, és **felvette** *(`running`, `busy: true`, 16987)*.

⛔ Ha az owner szól, hogy „a DEV megint leállt", az azt jelenti, hogy **én nem néztem oda**.
A négy mérés *(fent)* pont ezért van.



---

## 🔴 A HANDOFF MEGÍRÁSA NEM KIADÁS — kétszer buktam el rajta (2026-09-12)

**Mérve, ugyanazon a napon kétszer:**

| Mikor | Mi történt | Mennyi ideig állt a DEV |
|---|---|---|
| 03:20 → 04:47 | megírtam a **18.** és **19.** szakaszt, de **nem küldtem ki** | **~50 perc** |
| 05:35 → 06:00 | megírtam a **20.** szakaszt, a kapu **zárva** volt *(`busy`)*, és **ott maradt** | **~25 perc** |

🔴 **Az elsőt az OWNER vette észre**, nem én: *„Na ezért nem mennek át az üzenetek, **nem is
dolgozik a dev**."* ⚠️ Ez szégyenletes: a DEV felügyelete **az én egyetlen orkesztrációs
feladatom**.

### ⭐ A HIBA SZERKEZETE — ⛔ nem feledékenység

```
handoff megírása  →  commit  →  push  →  ✅ "kész vagyok"   ⛔ HAMIS
                                          └─ a DEV MÉG SEMMIT NEM TUD RÓLA
```

⚠️ **A commit+push „befejezettség-érzetet" ad** — pedig a `DEV-HANDOFF.md` **passzív**: a DEV
**csak akkor olvassa**, ha **promptot kap**. ⭐ A fájl az **üzenet**, a prompt a **kézbesítés**.

### ✅ A SZABÁLY

**Handoff-szakasz írása után KÖTELEZŐ a kapu-ellenőrzés, és a kimenet CSAK KÉT ÁLLAPOT lehet:**

```
✅ KIADVA        — a POST /prompt visszaadta a {"success":true}-t
⏳ KIADÁSRA VÁR  — a kapu zárva volt  ⇒  BE KELL ÍRNI a CONTINUATION.md-be,
                   és a KÖVETKEZŐ kör ELSŐ dolga a kiadás
```

⛔ **Harmadik állapot nincs.** Ha a kapu zárva *(`busy` / nem üres sor)*, a feladat ⛔ **nem
„megvan"** — **függőben van**, és **láthatóvá kell tenni**, különben a következő körben
**láthatatlan**.

📌 **Miért pont ez a két állapot:** mindkét mai elbukás **ugyanott** történt — a kapu zárva volt,
én meg **továbbléptem**, és a következő körben a handoff **már „réginek" tűnt**.
