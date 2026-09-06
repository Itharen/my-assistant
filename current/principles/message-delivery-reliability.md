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
