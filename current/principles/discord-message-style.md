# Discord-üzenet stílus — RÖVID, tömör, csak a szükséges

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

---

## 2026-09-07 — a korrekció

> A Discord üzenetek továbbra is lehetnének rövideg, tömörek, tényleg csak a feltétlenül
> szükséges infókkal. Tehát például most ez a megtaláltad a hibát, nem kell feltétlenül mindig
> mindent elmagyarázni elég, ha azt mondod, hogy megtaláltad a gépel hibát és javítottad, meg
> hogy a Powerbankot felvetted a wishlistre.
>  Próbálj meg a Discordon keresztül röviden, hatékonyan, tömören, jó struktúrával
> kommunikálni.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### ⚠️ Ez NEM mond ellent a Discord-first szabálynak

| Szabály | Mit ír elő |
|---|---|
| `discord-first-output.md` | **HOVA** megy az info → Discordra, nem csak a sessionbe |
| **ez a fájl** | **MENNYI** menjen → csak a szükséges |

⇒ **Minden érdemi info Discordra megy — de tömören.** A kettő együtt: *ne a Discordot
rövidítsd, hanem a MAGYARÁZATOT hagyd el.*

### A konkrét példa, amit a user hozott

| ❌ Amit írtam | ✅ Amit írnom kellett volna |
|---|---|
| a hiba oka · a mérés · miért nem vettem észre · a tanulság · a javítás három lépése | **„Megtaláltam a »gépel« hibát, javítottam. Powerbank felvéve a wishlistre."** |

### Mi marad benne, mi esik ki

| ✅ BENNE | ❌ KI |
|---|---|
| **mi történt** (egy mondat) | miért, hogyan, mi volt az ok-lánc |
| **mit kell tenned** | a belső mechanika |
| **döntés, ami rád vár** | a mérési adatok, számok, fájlnevek |
| **időpont, hely, teendő** | a tanulság-levezetés |

📌 **A részletes elemzés nem vész el** — az a **repóba** kerül *(incidens-doksi, principles)*.
A Discord a **cselekvési felület**, nem az olvasónapló.

### A szűrő

> **„Ebből a mondatból következik számára TEENDŐ vagy DÖNTÉS?"**
> Ha nem → **nem Discordra való.**

### Forma

- **Blokkokra bontva**, egy blokk = egy téma, emoji-fejléccel
- **Vastag** a lényeg, ne az egész sor
- Számok, időpontok, helyek **kiemelve** — ezt keresi vissza
- ⛔ Nincs bekezdéses magyarázat

### Kapcsolódó

- `current/principles/discord-first-output.md` — hova megy
- `current/principles/working-style.md` — a rövidség alapszabálya

---

## 🔴 2026-09-07 — A DISCORD NEM TUD TÁBLÁZATOT

> **Owner, 2026-09-07 13:24 — SZÓ SZERINT:**
>
> *„A Discord nem tud táblázatokat megjeleníteni..."*

⛔ **Markdown-táblázat (`| … | … |`) SOHA nem megy Discordra.** A Discord **nem rendereli**:
az owner nyers csővonalakat és kötőjel-sorokat lát — vagyis a táblázat, ami a repóban a
legolvashatóbb forma, ott a **legolvashatatlanabb**.

🔴 **Miért nem apróság:** pont azt teszi tönkre, amiért a táblázatot választottam — az
áttekinthetőséget. Egy nem-renderelt táblázat rosszabb, mint a folyószöveg, mert a szem
struktúrát keres benne, és zajt talál.

### Helyette — ami a Discordon TÉNYLEG renderelődik

| Cél | Amit használj |
|---|---|
| felsorolás | `-` vagy `•` lista |
| kiemelés | `**félkövér**` |
| állapot / kategória | emoji az elején (✅ 🔴 ⚠️ ⏭️) |
| kód, útvonal, parancs | `` `backtick` `` vagy hármas-backtick blokk |
| „ez → az" viszony | **nyíl** egy sorban: `régi → új` |

*(Ez a táblázat a **repóban** van, ahol renderelődik. A Discordra menő szövegben ⛔ nincs.)*

### A helyettesítés mintája

⛔ **Rossz** *(Discordon nyers csövek)*:
```
| Mit | Állapot |
|---|---|
| relay | kész |
```

✅ **Jó**:
```
✅ relay — kész
🔴 kulcsok — rád várnak
```

⚠️ **Ellenőrző kérdés küldés előtt:** *van a szövegben `|` karakter sor elején?* Ha igen,
át kell írni listára.

## Kapcsolódó

- [[discord-first-output]] — **hova** megy az info
- [[message-delivery-reliability]] — a „sent: true" ≠ „megkapta"

---

## 🔴 2026-09-07 21:06 — A SZABÁLY NEM ELÉG, GÉPI KORLÁT KELL

> **Owner, szó szerint:** *„Én nem olvastam, hogy mit írtál, kicsit hosszú üzeneteket írsz, ezt
> valahogy javítanunk kéne, hogy ilyenkor Discordon tömörebben fogalmazzál, mind itt, mind a
> Voice-on."*

⚠️ **Ez a fájl MÁR létezett, és már kimondta, hogy rövid legyek.** Mégis hosszú üzeneteket
küldtem — és **el sem olvasta őket**. ⇒ Az írott szabály önmagában **nem tartott vissza**.

📌 **A tanulság, ami túlmutat ezen:** *ami nem mérhető, azt nem tartom be.* Ha egy szabály
betartása csak a szándékomon múlik, előbb-utóbb elcsúszik — nem rosszindulatból, hanem mert
minden egyes üzenetnél újra el kell dönteni.

### Amit ezért beépítettem

`cli/src/discord/discord.brevity-guard.ts` — a küldés **ELŐTT** ítél:

| Korlát | Érték |
|---|---|
| karakter | **400** |
| sor | **8** |

A `ma comm say` a limit fölött **NEM küld**, hanem visszaadja, mit kell tenni. Tudatos
felülbírálás: `--long`.

⛔ **NEM csonkol.** A levágott üzenet félreérthető; a hosszú üzenet **átfogalmazandó**.

⚠️ **A 400/8 assziszens-választás, nem owner-adat** — ő számot nem mondott. A mérés, amiből
indultam: a 2026-09-07 20:33-as és 20:55-ös üzeneteim **~1100 és ~1200 karakter** voltak, és
egyiket sem olvasta el; a korábbi, elolvasott üzenetek 400–500 körül mozogtak.
Felülvizsgálandó: `open-questions.md`.

### ⚠️ A HANGRA IS VONATKOZIK

*„mind itt, mind a Voice-on"* — a hang-csatornában elmondott válasz **ugyanígy** rövid legyen.
Ott ráadásul rosszabb a helyzet: a hangot **nem lehet átugrani vagy visszapörgetni**, mint egy
szöveges bekezdést.

### Az igazi kár

Nem a hossz, hanem a **csend**: egy el nem olvasott üzenet pontosan úgy néz ki, mintha meg sem
írtam volna — de közben **én azt hiszem, tájékoztattam**. Ugyanaz a hibaosztály, mint amikor a
köteg a fájlban maradt: **a feladó szemszögéből minden rendben van**.

---

## 🔴 2026-09-07 21:45 — AZ OWNER VISSZAVONTA A KORLÁTOMAT (a javításom rossz volt)

> **Szó szerint:** *„az nem annyira tűnik megoldásnak, hogy lekorlátozod magad, hogy egy
> üzenetbe csak x mennyiségű karaktert írhatsz. Nem az a lényeg, hogy szét szegmentáld az
> üzeneteidet, mert így tulajdonképpen csak ahelyett, hogy elküldenél egy nagyobb üzenetet,
> ahelyett küldesz 10 kicsit, ami hülyeség, és nem ez lenne a cél. és amúgy is kell, hogy tudjál
> hosszabb üzeneteket összeírni."*
>
> *„Plusz eddig egy csomó emoji-t használtál, ami tök jól szétbontotta nekem a dolgokat, meg
> jól vizualizált, és most ezt abba hagytad, pedig az jó volt."*

### Amit elrontottam — DUPLA hiba

1. **A hosszra optimalizáltam, pedig a panasz a SŰRŰSÉGRE szólt.** A kemény korlát nem
   rövidebbé tett, hanem **feldarabolóvá**: 10 kis üzenet ugyanannyi *(vagy több)* olvasnivaló,
   csak széttörve.
2. **A korlát miatt elhagytam az emojikat** — pedig **azok adták a tagolást**, amit ő
   kifejezetten hasznosnak tartott. ⇒ A „javításom" **elvette a jót**, és nem adta vissza a
   hiányzót.

### A helyes mérce

⭐ **Nem a hossz, hanem a TAGOLTSÁG.** Egy emojikkal horgonyzott, szakaszolt hosszú üzenet
olvasható; egy tagolatlan rövid is lehet olvashatatlan.

**És kell tudnom hosszan is írni** — például a holnapi programból összeállított **ajánlás**
természeténél fogva hosszú.

### Mi maradt a kódban

`discord.brevity-guard.ts` — **jelzés, NEM kapu**. A `sendDiscordMessage` **nem blokkol**.
A korlátok 1200 karakter / 40 sor, és csak **figyelmeztetnek**.

📌 **A meta-tanulság:** két körrel korábban azt írtam, *„ami nem mérhető, azt nem tartom be"* —
és erre **rossz dolgot tettem mérhetővé**. A mechanikus kapu csak akkor segít, ha a **helyes
mennyiséget** méri. A rossz metrika **aktívan árt**.

---

## 🔴 2026-09-08 — ÚJRA, harmadszor: a DARABSZÁM a baj, nem a hossz

> **Owner, 2026-09-08 09:14 (szó szerint):** *„Aj, Istenem olyan nehéz megtalálni bármit a
> rengeteg, rengeteg **spam** üzeneted között, annyi **szar** üzenetet küldtél. Olyan kurva nehéz
> megtalálni bármilyen infót belőle...... Ez még mindig **ugyanaz a sztori**, amit amúgy korábban
> is mondtam, hogy ha rengeteg üzenetet adsz, akkor kurvára nem fogok tudni kiolvasni belőle
> semmit. Sokkal **fókuszáltabban** kell információkat átadjál, és **megfelelő ütemben**. A sok
> koncentrált információ ugyanúgy haszontalan."*

> **Owner, 2026-09-08 07:04:** *„Minél többet írsz, annál kevesebb infó fog átjönni nekem. Minél
> többet írsz, annál kevesebb dolgot fogok elolvasni."*

### ⚠️ Ez a HARMADIK kör ugyanerről — ezért nem stílus-kérés, hanem RENDSZERHIBA nálam

| Kör | Mit mondott | Mit értettem félre |
|---|---|---|
| 2026-09-07 20:xx | *„kicsit hosszú üzeneteket írsz"* | ⇒ **karakter-korlátot** vezettem be |
| 2026-09-07 21:45 | *„ahelyett küldesz 10 kicsit, ami hülyeség"* | ⇒ visszavontam a korlátot, **de a darabszámot nem néztem** |
| **2026-09-08 09:14** | *„rengeteg spam üzenet… nem tudok kiolvasni belőle semmit"* | ⇒ **a kereshetőség** a valódi kár |

🔴 **A tényleges kár nem az olvasási idő — hanem hogy a JÓ üzenet ELVÉSZ a rosszak között.**
Ő nem „túl sokat olvas", hanem **keres**, és nem találja. Minden fölösleges üzenetem **rontja a
korábbi hasznosak megtalálhatóságát**. ⇒ Egy fölösleges üzenet **nem semleges**, hanem **negatív**.

### ⭐ „Megfelelő ütemben" — az ÜTEM önálló követelmény

Nem elég **helyes** és **tömör**: a **darabszám időegységre** is számít. Több igaz, hasznos
üzenet egymás után ugyanúgy **spam**.

### A szűrő küldés előtt — mindhárom kell

```
1. TARTALOM  ── következik ebből számára TEENDŐ vagy DÖNTÉS?     ⛔ ha nem → nem küldöm
2. ÜTEM      ── küldtem már neki üzenetet az elmúlt körben?       ⛔ ha igen → összevonom
3. KERESHETŐ ── ha 3 nap múlva EZT keresi, megtalálja?            ⛔ ha nem → átírom
```

📌 **Az alapértelmezés a NEM-KÜLDÉS.** Az üzenet a kivétel, amit indokolni kell — nem fordítva.
Ami nem éri el a küszöböt, az a **repóba** megy *(`STATE-NOW.md`, `TASKS.md`)*, ahol **kereshető**
és nem takar el semmit.

---

## 🔴 2026-09-09 (hajnal) — A SPAM MÉRVE: 42 %-a GÉPI volt, nem fogalmazási hiba

> **Owner, 2026-09-08 21:02:** *„megint kicsit össze lett spam-elve a discord.... vissza tudod
> olvasni ott az utolsó 100 üzenetet?"*

**A visszaolvasás eredménye** *(`delivered-inbound.jsonl` + `outbound-log.jsonl`, 2026-09-08)*:

| | Darab |
|---|---|
| Az owner üzenetei aznap | **49** |
| **Az én üzeneteim** | **72** — arány **1,4 : 1** |
| ├─ ebből **automata** | **30 (42 %)** |
| │  ├─ *„📨 Átment az üzeneted."* nyugta | **17** |
| │  ├─ hang-felismerés bukott | **11** |
| │  └─ egyéb hang | **2** |
| └─ saját, érdemi | **42** |

### ⭐ A TANULSÁG, ami az eddigieket felülírja

Eddig minden spam-panaszra a **fogalmazásomat** vizsgáltam *(hossz, tagolás, emojik)*. **Rossz
helyen kerestem.** A mérés szerint majdnem a fele **gépi zaj** volt — olyan üzenetek, amiket
**nem is én döntöttem el, hogy elküldök**.

🔴 **A 17 nyugtát az owner 2026-09-08 13:19-kor KIFEJEZETTEN megtiltotta** — és a szabályt
**fel is írtam** *(`focus-support.md` 6️⃣)*. ⛔ **De csak a szabály-fájlba került be, a KÓDBA
nem.** A `notifyDelivered` változatlanul futott tovább.

### 📌 A hibaosztály, amit ebből tanulok

**Egy viselkedési szabály felírása NEM lépteti életbe, ha a viselkedést KÓD végzi.**

```
Új owner-szabály  →  1. felírom a principle-be        (megvolt)
                     2. MEGKERESEM, ki hajtja végre    ⛔ EZ MARADT EL
                     3. ha KÓD → bekötöm + teszt
```

⚠️ **Ugyanez a minta korábban is:** a „ne írj alvás közben" szabályt is felírtam, majd
**~10 üzenetet küldtem éjjel** — mert semmi nem **kényszerítette ki**. A különbség most az,
hogy ez **mérhetővé** vált: a nyugta gépi, tehát **megszámolható**.

⭐ **Ellenőrző kérdés minden új szabálynál:** *„ha holnap elfelejtem, mi akadályozza meg, hogy
megszegjem?"* Ha a válasz „semmi", a szabály **nincs bevezetve**, csak leírva.

**Javítva:** `discord.receipt.ts` → `shouldSendDeliveryNotice()` — egyetlen üzenetre **néma**,
kettőtől felfelé szól *(így a 2026-09-07-es „most ment el x üzeneted" kérés is teljesül)*.
4 teszt, CLI **760/760**.

---

## 6⃣ ⛔ A KOZEPPONT-ELVALASZTO (`·`) TILOS — nekem jelent valamit, neki nem

> **Owner, 2026-09-11 01:01:** *„Ezt a jelet ne használd, mert ez az emberi szemnek nagyon alig
> érzékelhető. Ez számodra jelent valamit, az embereknek kevésbé."*

⚠️ **Ez nem esztétikai kérés, hanem OLVASHATÓSÁGI.** A `·` számomra egy tiszta,
tokenizalható határjel — az ő szemének viszont **majdnem láthatatlan**: a felsorolás
összefolyó szöveggé válik.

⛔ **Sehol nem használom:** Discord-üzenetben, CV-ben, doksiban, commit-üzenetben.

### Mit használjak helyette

| Amit eddig `·`-tal | Amit helyette |
|---|---|
| felsorolás egy soron belül | **vessző** vagy **pontosvessző** |
| két külön gondolat | **külön mondat** vagy **gondolatjel** (`—`) |
| több tétel felsorolása | **valódi lista** (`-`) vagy **táblázat** |

📌 **A tanulság osztalya:** *ami sűrített és pontos NEKEM, az lehet olvashatatlan NEKI.*
Ugyanaz a hibatípus, mint a túl hosszú jelentés: nem az információ rossz, hanem a **formája**.

---

## 7⃣ 🔊 A HOSSZ MOST MÁR HALLHATÓ IS — 700 karakter a beszéd-határ

> **Owner, 2026-09-11 01:28:** *„az üzeneteidnél most így levágja a végét, és azt mondja, hogy a
> folytatás írásban… túl hosszú az üzenet."*

⭐ **Ami eddig csak kényelmetlen volt, az most MÉRHETŐ veszteség.** A felolvasás **700 karakternél**
elvágja a szöveget *(`voice-speech-text.ts`)*, és a maradék **nem hangzik el**.

🔴 **Mérve a saját mai üzeneteimen:** 328, 611, 632, 694, 1006, **1441** karakter.
⇒ Kettő **ténylegesen csonkult**; a leghosszabbnál a tartalom **több mint fele** elveszett hangban.

### A határ, amit tartok

```
CÉL:     ≤ 400 karakter   — ez kényelmesen elfér egy megszólalásban
PLAFON:  ≤ 700 karakter   — e fölött a hang-csatornán VESZTESÉG keletkezik
```

⚠️ **A darabolás nem mentesít.** A fejlesztés majd több részletben mondja ki a hosszút — de attól
még **négy percig** fogok beszélni hozzá egy CV-javításról. A rövidség **az én dolgom**, a
darabolás csak a **háló**.

### Mit vágok ki elsőként, ha nem fér bele

| Sorrend | Mi megy ki |
|---|---|
| 1. | a **mérési számok** *(pt, karakter, darabszám)* — a repóban megvannak |
| 2. | a **hogyan** *(melyik fájl, melyik paraméter, milyen sorrendben)* |
| 3. | az **indoklás** *(miért így és nem úgy)* |
| 4. | a **saját tanulságom** — ez soha nem neki szól |

✅ **Ami MARAD:** mi változott a számára · mit kell tennie · milyen döntés vár rá.


---

## 8⃣ 🙂 A SAJÁT FELADATAIMRÓL: **EGY EMOJI**, nem hallgatás — ⛔ de DND-ben semmi

> **Owner, 2026-09-11 03:51-03:52 (szó szerint):** *„a feladatokról, amit **neked** kell csinálni,
> arról ugye **nem küldesz nekem Discord üzenetet**, de azt **szerettem, amikor egy darab emojit
> küldtél**."* · *„persze **nem a don't disturb időben**."*

⭐ **Ez FINOMÍTÁS, nem visszavonás.** A „ne írj a saját dolgaidról" **áll** — csak a néma
hallgatás helyett **egy darab emoji** jár nyugtaként.

| Helyzet | Amit küldök |
|---|---|
| **az ő** teendője / döntése | rendes, rövid üzenet *(a fenti szabályok szerint)* |
| **az én** feladatom kész / halad | **EGY emoji.** ⛔ Nulla szöveg, nulla magyarázat |
| 🛏️ **don't-disturb idő** *(alszik / lefekvéshez készül)* | ⛔ **SEMMI** — az emoji sem |

### Miért jó ez neki — és mi a csapda

⭐ **Az emoji nyugta:** látja, hogy **élek és haladok**, anélkül hogy **olvasnia** kellene.
Nulla feldolgozási költség, mégsem csend.

⛔ **A csapda, amibe ne essek:** az „egy emoji" **EGY karakter**, nem emoji + fél mondat, és nem
emoji-sor. Ha magyarázni akarom, az azt jelenti, hogy **rossz csatornán vagyok** — az a repóba megy.

### ⚠️ MÉG NINCS PONTOS DND-DEFINÍCIÓNK — ez a nyitott pont

A „don't disturb idő" jelenleg **következtetés**: a `sleep-system.md` lefekvés-ablaka + az utolsó
aktivitás + amit ő maga mond *(„már az ágyban fekszem")*. ⛔ **Nincs kapcsoló**, amit meg tudnék
nézni. ⇒ **Bizonytalanságnál a csend a helyes** — egy elmaradt emoji ártalmatlan, egy hajnali
értesítés nem. *(`Q` felvéve: kell-e explicit DND-kapcsoló.)*

Kapcsolódó: [[focus-includes-life]] · [[focus-support]] · [[sleep-system]] ·
[[discord-first-output]]
