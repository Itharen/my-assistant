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
