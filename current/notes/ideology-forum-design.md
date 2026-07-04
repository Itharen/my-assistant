# Ideológia Fórum — rendszer-architektúra (design)

> **Életcél #1 sarokköve.** Forrás: user 2026-05-29 (hosszú stream).
> Verbatim raw-capture a fájl alján. Kapcsolódó tartalom-tézisek:
> `current/notes/ideology-thoughts.md`. Voting-mechanizmus testvér:
> `current/notes/project-ideas.md` 2026-05-16 #4 (Opinion platform).
> 🔗 **Org-tükör:** `org:note:6a2b8fcaca5f063c4e662f8d` (synced 2026-05-29, miután
> az `fo` CLI újra-buildelve lett).

---

## Cél

| | |
|---|---|
| 🕯️ **Titkos cél** | Egy **alternatív kormányzási rend** kialakítása. |
| 🌐 **Nyilvános cél** | Platform, ahol az emberek **ideológiákat és filozófiákat vitathatnak meg**, **léjerekben**, kisebb csoportokban. |

**Fontos megkülönböztetés:** a csoportosítás **nem** azok szerint történik, akik
megvitatják, hanem **akikre vonatkozik** az adott ideológia. Egy ideológiát
egészen máshogy kell alkalmazni **szint** szerint:

- 👪 család → 🏙️ város → 🏘️ falu *(STT?)* → 🗺️ megye *(STT?)* → 🇭🇺 ország → 🌍 globál
- köztes rétegek: 🌐 **kontinens**, **Európai Unió**, stb.

---

## Rétegek (layers)

### 1️⃣ Problémafelvetés réteg
- **Bárki** felvethet problémákat.
- A rendszer **csoportosít** + **kiszűri a duplikációkat**, és a duplikációkat
  **összefűzi** (vektor-kereséses dedup, mint az Opinion-platformnál).
- A user **dönt**: „igen, én is erre gondoltam" **vagy** „nem egészen erre".
  - Ha **nem** → **kötelező kifejtenie**: hogyan / miért nem / melyik irány /
    hogyan finomítaná.
- A **végső csoportosítási döntést** azok hozzák, akik a problémát **felvetették**
  (a rendszer megajánlja, a user dönt).

### 2️⃣ Megoldás réteg
- Megoldásokat javaslunk a problémákra. **Fórumosan** működik.
- A **megoldásokat is összekapcsoljuk** (mint a problémáknál): ha többen
  ugyanazt írják → egy csomagba; vagy „hasonló megoldás kis módosítással".

### 3️⃣ Rendszer réteg
- Akkor lép be, amikor kimondjuk: **innentől a törvényeket és törvény-
  módosításokat ennek a rendszernek megfelelően hozzuk** → **tényleges**
  döntések, módosítások, megoldások.
- 📌 **Lábjegyzet:** ha a rendszer **változóképes, formálható, dinamikus**, akkor
  **nem kell félni a rossz döntésektől** — mindig tudunk javítani, tanulni,
  előre haladni; **nem betonozódhat be** a rendszer.

### 4️⃣ Ideológia réteg (állítás / definiálás / vitatás)
- Hasonlóan működik, **DE az ideológiákat kétirányúan kell visszaigazolni**:
  - Ha A állít valamit, és B állít valami hasonlót, és B hasonlít A-éhoz →
    megpróbáljuk **összekötni**.
  - Ilyenkor **mindkettőnek vissza kell jeleznie**, hogy tényleg erre gondolt.
  - Cél: ne kössünk össze valójában nem-kapcsolódó dolgokat („mire gondolt a költő").
- **Mások megtekinthetik** az ideológiákat és **kapcsolódhatnak** hozzá anélkül,
  hogy maguk állítanának bármit („teljesen egyetértek, ehhez én is kapcsolódok").
- Az ideológiák **verziókezelése** korábban már definiálva — itt nem érintve.

---

## Valós-személy verifikáció
- **Mindenki igazolja magát**, **valós személy** legyen.
- **Valós, verifikált profil** alakul ki; a róla szóló infók **megbízhatóak és
  stabilak** kell legyenek.

---

## Szavazás
- A résztvevők **szavaznak**, melyik probléma **fontos / sürgős / égető**.
- **Nem csak igen-nem**, hanem **skála** — pontozás, kb. **−10 … +10**.
- A fontos problémák **előre kerülnek**. A megoldásoknál **ugyanígy**.
- Lehet: problémát felvetni, megoldást javasolni, **alternatívát** mondani, és a
  meglévő ötletekre **szavazni**.

## Liquid democracy (folyékony demokrácia)
- A userek **átadhatják a szavazati jogukat** más usereknek.
- Az átadások **öröklődnek (tranzitív)**: A→B, B→C → **C megkapja A jogát is**.
- **Mindig értesítést** kapnak: (a) a delegálásról, (b) arról, hogy a nevükben
  milyen döntéseket/szavazatokat hoztak.
- **Bármikor visszavehető.** Amíg egy törvény nincs meghozva / egy
  probléma-megoldás nincs leütve, a user **bármikor módosíthatja** a szavazatát.
- **Per-kérdés felülbírálás:** ha oda is adta a jogát, egy adott kérdésben
  **mégis maga dönthet**, máshová helyezheti a szavazatát.
- **Technikai megoldás:** amikor egy képviselő szavaz, **bekerül oda az összes
  általa képviselt user-ID**. A user ezt magának módosíthatja; egy köztes
  képviselő **átmozgathatja** több képviseltjének a szavazatát egy másik válaszra.
- ⚠️ **Hatókör:** a képviseleti (liquid) rendszer **CSAK a probléma- és
  megoldás-rétegben** működik, az **ideológia-rétegben NEM**.

---

## 🔧 Dev-jegyzet — szavazat-tárolás DB-struktúra

> A user explicit fejlesztési megoldás-ötlete (több helyen is fel akarta írni).

- **NE** úgy tároljuk, hogy van egy „kiszavazott" lista, amiben object-enként
  `{ pont, userId }` van.
- **HANEM** egy nagyobb object, amin ott a **−10 … +10 pont-skála** mint kulcsok,
  és minden pont-érték egy **lista**, ami a **userId-ket** tartalmazza.
- → DB-kezelésben **gyorsabban, könnyebben, ügyesebben** kezelhető.

*(Ez egy implementációs jegyzet a jövőbeli fórum-fejlesztéshez.)*

---

## Verbatim raw-capture (STT)

> *(Megőrizve a teljes eredeti gondolatfolyam — strukturálatlan, STT-hibákkal,
> hogy semmi ne vesszen el. A fenti strukturált rész ebből készült.)*

A user 2026-05-29-i szövege a problémafelvetés→megoldás→rendszer rétegekről, az
ideológiák kétirányú összekötéséről, valós-személy verifikációról, −10…+10
skálás szavazásról, liquid democracy öröklődő/visszavonható/per-kérdés
delegálásról, és a szavazat-tárolás DB-ötletéről. *(A teljes nyers átirat a
2026-05-29 USER_INPUT / action-log forrásban; a fenti strukturált verzió a
kanonikus munkapéldány.)*
