# Üzenet-kézbesítés megbízhatósága — az info ne ússzon el

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

---

## 2026-09-07 — a probléma kimondva

> Valamit majd arra is ki kell találni, hogy az üzeneteid nem mindig jutnak el hozzám,
> illetve lehet, hogy el-elúsznak, amit nekem szánsz info. Ez még a Discordon is előfordulhat,
> de Discordot fogom legjobban figyelni. első körben, amíg nincsen egyéb saját megoldás.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### A probléma pontosan

⚠️ **Nem az a baj, hogy nem megy ki az üzenet** — azt már mérjük (`ma comm doctor`, kimenő
napló). A baj, hogy **a kiment üzenet nem biztos, hogy MEGÉRKEZIK a user FIGYELMÉBE**:

| Hibamód | Miért nem látjuk most |
|---|---|
| **Elgörget** — sok üzenet közt elsüllyed | a küldés sikeres volt, tehát „rendben"-nek tűnik |
| **Elolvassa, de nem tud vele mit kezdeni** épp *(úton van, tárgyal)* | és később már nem kerül elő |
| **Nem is nyitja meg** a csatornát órákig | nincs jelünk arról, hogy látta-e |

⇒ **A „sent: true" NEM egyenlő azzal, hogy „megkapta".** Ez ugyanaz a hibaosztály, mint a
csendben elhalt figyelő: **kívülről sikernek látszik.**

### 🔴 2026-09-07 — EZ NEM ELMÉLET VOLT: MÉRT INCIDENS

> **Owner ugyanaznap:** *„tényleg ennyit akartál csak küldeni, vagy itt közben valami hibánk
> is van, ami miatt nem kapom meg a teljes üzeneteket?"* — **volt hibánk.**

**Minden kimenő üzenetem az ELSŐ SORNÁL csonkolódott** *(a Windows `npx`/`cmd` burkoló vágta
le a többsoros argumentumot)*. A mérés:

```
a USER üzenetei:   55, 146, 319, 617, 744 karakter
az ÉN üzeneteim:   29, 46, 62, 63, 73, 75, 78, 82, 105 karakter
```

⚠️ **És a rendszer minden szintje ŐSZINTÉN „sikert" jelentett:** `sent: true`, `partCount: 1`
— mind IGAZ volt arra az egy sorra. A hiba **a mérésünk határán KÍVÜL** történt.

⇒ Teljes elemzés: `__documentations/dev/INCIDENT-2026-09-07-discord-truncation.md`.

### ⭐ A SZABÁLY, AMI EBBŐL LETT: KÜLDÉS UTÁN VISSZAOLVASNI

> **Owner javaslata (2026-09-07):** *„Lehet, hogy vissza is se kéne ellenőrizni időnként,
> hogy sikerülhet-e infókat átadni a Discordon, miután megtörtént."*
> ⭐ **Ez a javaslat fogta meg a fenti hibát.**

| Lépés | |
|---|---|
| 1 | elküldjük az üzenetet |
| 2 | **visszaolvassuk a csatornát** *(Discord REST: `GET /channels/{id}/messages`)* |
| 3 | **összevetjük a HOSSZT**: `elküldött == megérkezett`? |
| 4 | eltérés ⇒ **HIBA**, nem siker — újraküldés + naplózás |

🔴 **Ahol a kimenet elhagyja a rendszerünket, ott vissza kell olvasni.** Nem elég tudni, hogy
elküldtük — azt kell tudni, hogy **megérkezett, és teljes egészében**.

*(A bejövő irányban ez már megvan: a köteg csak IGAZOLT átadás után ürül. A kimenő irányból
hiányzott.)*

### A jelenlegi rangsor (2026-09-07, első kör)

| # | Csatorna | Státusz |
|---|---|---|
| 1 | 💬 **Discord** | ⭐ **ezt figyeli a legjobban** — ez az elsődleges, amíg nincs saját megoldás |
| 2 | 🔊 Hangszóró | csak ébren + itthon; erős, de nem hagy nyomot |
| 3 | 🖥️ Session | csak ha épp fut |

> **A user szava:** *„Discordot fogom legjobban figyelni. első körben, amíg nincsen egyéb
> saját megoldás."*

⇒ Ebből következik: **a saját megoldás megépítése cél**, nem opcionális kiegészítés.

### Az irány (assistant-javaslat — MEGERŐSÍTENDŐ, még nincs jóváhagyva)

A megoldás **két lábon** áll, mert az üzenet-alapú és a tár-alapú kézbesítés más hibát fog el:

**A) NYUGTÁZÁS — tudjuk, hogy eljutott-e**
- minden **fontos** kimenő üzenet kap azonosítót és „nyugtázandó" jelölést,
- nyugta = a user **bármilyen** reakciója rá *(reakció-emoji, válasz, vagy megnyitás)*,
- ha X időn belül nincs nyugta → **ismétlés vagy eszkaláció** másik csatornára,
- ⛔ nem minden üzenet nyugtázandó — a zaj rosszabb, mint az elveszett apróság.

**B) POSTALÁDA — ami nem üzenet, az nem tud elúszni**
- a neki szánt info **perzisztens listába** is bekerül, nem csak üzenetként megy ki,
- ő bármikor átnézheti *(„mi az, amit még nem láttam?")*,
- a görgetés nem tünteti el.

> 💡 **Miért kell mindkettő:** a nyugtázás a *sürgős* dolgot menti meg, a postaláda a
> *nem sürgős, de fontos* dolgot. Külön-külön egyik sem elég.

### ❓ NYITOTT — enélkül nem építem meg

Lásd `current/open-questions.md` **K)** szekció:
mi számít „fontos, nyugtázandó" üzenetnek · mennyi idő után ismételjek · mi legyen a nyugta
formája · hova kerüljön a postaláda *(Discord pinned? kliens-felület? fájl?)*.

### Kapcsolódó

- `__agent/capabilities/CATALOG.md` — C-40, C-41
- `current/principles/error-handling.md` — a néma hiba tiltása (ez ugyanaz az osztály)
- `current/principles/no-paid-solutions.md` · `build-it-ourselves.md` — a „saját megoldás" iránya

---

## 🔧 2026-09-10 16:10 — AMIKOR A SAJÁT ESZKÖZÖM NEM ELÉRHETŐ: közvetlen küldés, de NYOMOT HAGYVA

**A helyzet:** 6 órás kiesés után szólnom kellett az ownernek, és **három döntése 37 órája várt**
— közben viszont a `ma comm say` **nem futott**, mert az LDP `rimraf`-ja letörölte a `dist`-et,
és a `tsc-cli` 200+ másodperce épített *(`BFR-MYASSISTANT-001`)*.

**Amit tettem:** az üzenet **közvetlenül a Discord API-n** ment ki *(`POST /channels/:id/messages`,
HTTP 200)*, a `.env`-ből olvasott bot-tokennel.

### ⚠️ AMIT EZ MEGKERÜL — és ezért pótolni KELL

A `ma comm say` nem csak „küld": **könyvel** is. A megkerülésével kimarad:

| Ami kimarad | Mi romlik el tőle |
|---|---|
| `outbound-log.jsonl` bejegyzés | a **válasz-kötelezettség** *(utolsó bejövő vs. utolsó kimenő)* tévesen „tartozom"-ot mondana |
| a `verifiedIntact` visszaolvasás | nem tudom, **hiánytalanul** érkezett-e meg |
| a saját mennyiség-mérésem | a spam-számlálás **alulmérne** *(a 2026-09-08-i 72 üzenetes mérés ilyen naplóból készült)* |

⇒ **A bejegyzést kézzel pótoltam** ugyanabban a körben. ⛔ Enélkül a megkerülés **csendes
adatromlás** lenne — pont az a fajta, amit egész héten üldözök.

### ⭐ A SZABÁLY

**Az eszköz megkerülése megengedett, ha az eszköz maga nem elérhető ÉS az üzenet nem várhat.**
De három feltétellel:

1. 📝 **Pótold a könyvelést** ugyanabban a körben — ne a következőben, mert az elmarad.
2. 🗣️ **Mondd ki**, hogy megkerülted *(nekem a jelentésben, itt a naplóban)*.
3. ⛔ **Ne váljon szokássá:** ha rendszeresen kell, az azt jelenti, hogy **az eszközt kell
   megjavítani** — nem a megkerülést finomítani. *(Itt: a `dist` atomi cseréje, `BFR-…-001`.)*

📌 **Amit NEM kerülök meg soha:** a **rövidség**, a **hatáskör** és az **alvás-ablak** — azok
nem az eszközben laknak, hanem a döntésben. A `dist` hiánya **nem** ad felmentést alóluk.
