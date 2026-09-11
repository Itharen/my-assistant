# ✍️ A LinkedIn POSZT-PISZKOZAT PANEL

**Megépítve:** 2026-09-11 · **Állapot:** ✅ kész *(a HTTP-felület a következő szerver-indulásnál él)*

> **Owner sorrendje:** profil → **posztok** → üzenetek. A profil-vonal kész *(a beillesztés már
> owner-kapu)* ⇒ a posztok jöttek.

## A feladat — ⭐ EGY funkció

**Egy lista a megírt poszt-piszkozatokról + posztonként egy másolható szövegdoboz.**

⛔ **Ami szándékosan NINCS** *(a feladat szó szerinti tiltása)*: ütemezés · automatikus
kiküldés · statisztika · kép-generálás · **szerkesztő**.

🔴 **A poszt szövege nem a DEV dolga.** A tartalmi szabályok az owner/asszisztens oldalán
vannak *(`current/principles/linkedin-post-writing.md`)*; a panel **megjelenít és másol** —
⛔ nem generál és ⛔ nem módosít egyetlen karaktert sem *(teszt őrzi)*.

---

## ⚠️ MÉRT KORREKCIÓ A FELADAT-LEÍRÁSHOZ — a piszkozatok helye

A handoff azt írta: *„A piszkozatok helye: `current/linkedin/drafts/` … Ezt olvasd."*
**Megnéztem, és az a mappa MÁST tartalmaz:**

```
current/linkedin/drafts/README.md   → „# ✍️ LinkedIn VÁLASZ-piszkozatok"
current/linkedin/drafts/*.md        → `thread:` azonosító · „kinek:" · „mirol:"
current/linkedin/drafts/*.body.txt  → üzenet-válaszok (óradíj, telefonszám)
```

⇒ Azok **üzenet-válaszok** a LinkedIn-postaládához *(`ma linkedin reply draft --thread …`)*, és
az owner sorrendjében az **üzenetek a HARMADIK** tétel.

🔴 **Két okból nem olvashattam azt a mappát „posztok" néven:**

1. **Átugrottam volna az owner sorrendjét** — a posztok a másodikak, az üzenetek a harmadikok.
2. **Adat a rossz felületen:** az üzenet-piszkozatokban **óradíj és telefonszám** van. Egy
   „posztok" panelen megjeleníteni őket ⛔ nem elírás-szintű különbség. *(Erre külön teszt van:
   a poszt-válasz ⛔ nem tartalmazhat `EUR/óra`-t vagy `thread:`-et.)*

⭐ **AMIT A HANDOFF VALÓBAN KÉR, ÉS ÁTVETTEM:** a **két-fájlos alakot** — az jó minta:

```
current/linkedin/post-drafts/<azonosító>.body.txt   ← EZ megy ki (a poszt szövege)
current/linkedin/post-drafts/<azonosító>.md         ← az indoklás
```

📌 A handoff maga jelezte, hogy *„a piszkozatok helyéről szólok külön"* ⇒ a hely **nyitott
volt**. Ez a döntés kimondja; a mappa a szerződés-leíró `README.md`-vel **létre is jött**.

---

## A rétegek — ⭐ a profil-panel receptje, változatlanul

| Fájl | Mit tesz |
|---|---|
| `cli/src/linkedin/linkedin-post-drafts.ts` | **SSOT**: a lista-döntés *(limit, túllógás, cím, sorrend, pipa)* — tiszta függvények |
| `server/src/_routes/linkedin/linkedin-posts.data-service.ts` | a fájlpárok olvasása + a pipa mentése |
| `server/src/_routes/linkedin/linkedin-posts.controller.ts` | `GET \| PUT /api/linkedin/post-drafts` |
| `server/…/linkedin-panel-files.util.ts` | ⭐ **ÚJ, közös**: gyökér-feloldás · ismeretlen-törzs olvasás · állapot-fájl |
| `server/…/linkedin-panel-endpoint.util.ts` | ⭐ **ÚJ, közös**: a **loopback-védett** végpont — így a vezérlő puszta deklaráció |
| `client/…/_linkedin-panel.scss` | ⭐ **ÚJ, közös**: a panel-keret mixinként |
| `client/.../l-post-drafts/` | a panel: szövegdoboz, másolás-gomb, pipa, indoklás |
| `client/src/app/app.component.html` | ✍️ **a nav-link** — `/linkedin/posts` |

⭐ **SSOT:** a limit és a „kész"-fogalom a **CLI-ben** dől el; a szerver és a kliens **nem
másolja**. ⛔ Egy második implementáció azt jelentené, hogy a felület más limitet mutat, mint
amit a rendszer ellenőriz.

### Az állapot — hol mi lakik

| adat | hely | miért |
|---|---|---|
| a poszt **szövege** | `current/linkedin/post-drafts/<id>.body.txt` | az **asszisztens** írja, **verziózva** |
| az **indoklás** | `…/<id>.md` | ugyanott, ugyanígy |
| a **pipa** | `~/.config/my-assistant/linkedin/post-draft-state.json` | ⚠️ futásidejű állapot, ⛔ nem a repóba |

---

## 🔴 AMIT A PANEL KIMOND — ⛔ néma állapot nincs

| Állapot | Amit mutat |
|---|---|
| **nincs piszkozat** | *„Még nincs poszt-piszkozat"* + **hova** kell írni a fájlt ⇒ ⛔ nem néz ki elromlottnak |
| **túllógás** | 🔴 a panel tetején + a karakterszám pirosan — ⭐ **a másolás ELŐTT** |
| **olvasási hiba** | `MA-LINKEDIN-POSTS-READ-FAILED` ⇒ a panel **hibát** mutat, ⛔ nem üres listát |
| **a vágólap nem érhető el** | *„jelöld ki és másold kézzel"* — ⛔ nem tesz úgy, mintha másolt volna |
| **a pipa mentése elbukott** | *„a haladás nem őrződött meg"* — ⛔ nem tűnik kipipáltnak |

⚠️ **A legrosszabb kimenetel nem a kivétel, hanem a CSENDES ÜRESSÉG** — ezért a válasz mindig
viszi a `draftsPath`-ot és a `hasDrafts` jelzőt.

---

## ✅ Igazolás

| Ellenőrzés | Eredmény |
|---|---|
| CLI-tesztek | **1176 / 1176** zöld *(+29: 27 új a lista-logikára)* |
| szerver-tesztek | **115 / 115** zöld *(+5 új, az **élő** utat hívják a buildből)* |
| kliens-tesztek | **159 / 159** zöld *(+11 új)* |
| `tsc --noEmit` | tiszta mind a háromban |
| Pozitív kontroll ×2 | a nav-link kivéve → **3 bukás** · az üres állapot elnémítva → **1 bukás** |
| `dc rev` | **2397 → 2397** — ⭐ **0 új találat**, és közben **4 MEGLÉVŐ is elfogyott** |

⛔ **AMIT NEM TUDOK KIMONDANI:** a **HTTP-felület élő próbáját**. Mérve *(18:20)*: a
**39335-ös porton semmi nem figyel** — a szerver épp nem fut, tehát a végpont HTTP-oldala a
**következő szerver-indulásnál** lép életbe. ⛔ Nem indítom el magamtól *(a szerver a gazda,
`ldp-default-runtime`)*.
⭐ Amit **tudok**: a szerver-spec a **valódi** fájlrendszeren, a **buildből** hívja a
`readDrafts()`-ot — pontosan azt az utat, ami a profil-panelnél élesben elbukott.

## ⭐ A REVIEW HÁROM VALÓDI TALÁLATOT ADOTT — és mindhárom JAVÍTVA

A panel első változata **11** találatot hozott. ⚠️ Ebből **3 valódi duplikáció** volt — az
**én** hibám, mert a profil-panel mechanikáját **lemásoltam** a poszt-panelbe:

| Találat | Mit mondott | Javítás |
|---|---|---|
| `code-duplication` *(data-service)* | 70 sor / 373 token azonos *(91% azonos név)* | ⭐ `linkedin-panel-files.util.ts` — **mindkét** panel ezt használja |
| `code-duplication` *(scss)* | 26 sor **bájtra** azonos | ⭐ `_linkedin-panel.scss` mixin |
| `code-duplication` + `thin-controller` *(vezérlő)* | 41 sor azonos + a task-ban `if` volt | ⭐ `linkedin-panel-endpoint.util.ts` — a **kapu** a segédben, a vezérlő **puszta deklaráció** |

🔴 **ÉS EZ NEM ESZTÉTIKAI KÉRDÉS:** a gyökér-feloldás egy **mért, éles hiba** helye volt. Két
példányban a következő javítás **az egyikben** maradna, és a másik panel **csendben** rosszul
működne tovább.

⭐ **RÁADÁS:** az endpoint-segéd a **profil**-vezérlőből is elvitte a `thin-controller` és az
`endpoint-auth-preprocess` találatot *(2+2)* ⇒ a repo összes találata **nem nőtt**, hanem
ugyanott maradt, miközben egy teljes új panel készült el.

⚠️ **AMI MARAD, TUDATOSAN — 3 db `no-dynamic-imports`:** a CLI-modul **futásidejű** betöltése.
🔴 **Mért kényszer:** a `@cli/*` alias **csak fordítási időben** létezik, a `tsx` futásidőben
nem alkalmazza ⇒ a Google- és a Spotify-panel **élesben elromlott** emiatt, zöld `tsc` mellett.
⇒ A szomszéd profil-panel **ugyanezt** viszi; egy statikus importtal a **működő** minta
romlana el.

## ⚠️ Amit tudni kell a limitről

A **3 000 karakteres** poszt-korlát a **handoffból** jön *(2026-09-11 18:05)*, ⛔ nem én mértem
— az a LinkedIn felületén dől el. Ha egyszer elutasít egy ennél rövidebb szöveget, a számot
**mérés alapján** kell javítani *(`linkedin-post-drafts.ts` → `POST_LIMIT`)*, ⛔ nem tippel.
