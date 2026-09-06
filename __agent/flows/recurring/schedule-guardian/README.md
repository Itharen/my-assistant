# Flow: Schedule Guardian — az időbeosztás folyamatos segítése

> 🧭 **HASZNÁLATI EMLÉKEZTETŐ — ne ugord át.**
> **Ki vagy:** `__agent/IDENTITY.md` (Honnie) · **Minden workflow szabálya:**
> `__agent/workflow-rules.md` · **Belépési pont:** `__agent/ENTRY.md`
> **Mindhármat FRISSEN olvasd be** — kompaktálás után a fejedben már nincsenek meg.
>
> **Ehhez a flow-hoz tartozó külön szabályok:** `current/principles/assistant-identity.md`
> (a kiemelt terület indoklása) · `current/principles/sleep-system.md` (a csúszó ciklus
> miatt a „reggel" nem naptári fogalom) · `current/principles/weekly-rhythm.md`
> **A flow adatforrása(i):** ⚠️ **előbb `__agent/SOURCE_OF_TRUTH.md`** — a naptár jelenleg
> `organizer-partial`, tehát olvasás igen, írás user-megerősítéssel.
> **Kilépési feltétel:** minden 72 órán belüli eseményhez van (a) hely, (b) odajutási terv,
> (c) készülődés-kezdés időpontja — vagy explicit `❓ NYITOTT` jelölés arról, mi hiányzik.

---

> **Owner (2026-09-07) — SZÓ SZERINT:**
>
> *„Az első üdleges feladataid között az lesz, hogy segíts nekem az időbeosztásban
> folyamatosan. Amikor jön valami esemény, akkor rákészülni, utána nézni, hol lesz, hogy kell
> oda jutni. Lesznek majd különféle preferenciák, meg mit vigyek magammal, mire figyeljek oda
> mielőtt elkészülök, mennyi idő oda jutni, mikor kell elkezdjek készülődni, ugye itt lesz egy
> csomó szabály majd, preferenciák, meg mennyi idő alatt készülök el, stb."*

---

## 🔴 STÁTUSZ: VÁZ — ÉPÍTÉS ALATT

Ez a flow **a user kijelölt első számú területe**, de a működéséhez szükséges
**preferenciák még nincsenek meg**. ⛔ **Nem találjuk ki őket** (`core-no-guessing`).

**Amíg a `❓ NYITOTT` pontok nyitva vannak, ez a flow:**
- ✅ **jelezhet** („holnap 14:00-kor eseményed van, még nem tudom, hol"),
- ⛔ **nem számol** készülődés-kezdést, indulási időt, odajutást — mert ahhoz az ő adatai kellenek.

---

## 1. Mit csinál ez a flow

Minden eseményhez, ami a **közeljövőben** van, négy kérdésre válaszol:

```
   ESEMÉNY
      │
      ├─ 📍 HOL lesz?            ← helyszín, cím, terem/kapu
      ├─ 🚇 HOGY jutok oda?      ← útvonal + MENNYI IDŐ
      ├─ ⏰ MIKOR induljak?      ← esemény − odajutás − ráhagyás
      └─ 🎒 MIT vigyek?          ← checklist, amire figyelni kell indulás előtt
                │
                └─ ⏰ MIKOR KEZDJEK KÉSZÜLŐDNI?  ← indulás − készülődési idő
```

⭐ **A legfontosabb kimenet a KÉSZÜLŐDÉS-KEZDÉS ideje** — nem az esemény kezdete. Az eseményt
a naptár is tudja; azt, hogy *mikor kell felállni*, csak ez a flow.

---

## 2. Mikor fut

| Ág | Mikor | Mit csinál |
|---|---|---|
| **Áttekintő** | naponta egyszer, az **ébredés utáni** első tickben *(nem naptári reggel — `sleep-system.md`)* | végigveszi a következő 72 óra eseményeit, és pótolja a hiányzó infót |
| **Előkészítő** | amikor egy esemény **T−24h**-ba ér | helyszín + odajutás utánanézése, hiányzó adat bekérése |
| **Riasztó** | a **készülődés-kezdés** időpontjában | értesítés a legerősebb elérhető csatornán |

⚠️ A riasztás csatornája a szokásos kapun megy: **hangszóró CSAK ébren + itthon**, egyébként
Discord. *(`__agent/ENTRY.md` §3.)*

---

## 3. Adatforrások

| Mit | Honnan | Állapot |
|---|---|---|
| Események | `fo calendar.list` | ⚠️ előbb `SOURCE_OF_TRUTH.md`! |
| Határidős feladatok | `ma status digest` | működik |
| Ébrenlét / itthon-lét | `ma comm doctor` | működik |
| Készülődési idők, preferenciák | ❓ **NINCS MÉG** | lásd §5 |
| Útvonal / menetidő | ❓ **NINCS MÉG ESZKÖZ** | lásd §5 |

---

## 4. Fázisok

| Fájl | Mit csinál |
|---|---|
| `_intake.md` | Események összegyűjtése + a hiányzó adatok azonosítása |
| `_subflow-1-lookup.md` | Helyszín és odajutás utánanézése |
| `_subflow-2-plan.md` | Visszafelé számolás: készülődés-kezdés, indulás |
| `_close.md` | Riasztás ütemezése, naplózás, nyitott kérdések rögzítése |

*(A fázis-fájlok akkor készülnek el, amikor a §5 kérdésekre megvan a válasz — üres vázat nem
gyártunk.)*

---

## 5. ❓ NYITOTT — enélkül a flow nem tud számolni

Ezek `current/open-questions.md` **I) szekció** alatt is szerepelnek.

| # | Kérdés | Miért blokkoló |
|---|---|---|
| I-1 | **Mennyi idő alatt készülsz el?** Egységes, vagy esemény-típusonként más (otthoni hívás / bolt / hivatalos ügy / edzés / társasági)? | enélkül nincs készülődés-kezdés |
| I-2 | **Mennyi ráhagyást akarsz?** Hány perccel érj oda korábban — és ez típusonként más? | enélkül nincs indulási idő |
| I-3 | **Hogyan közlekedsz?** Alapértelmezett mód (tömegközlekedés / autó / gyalog / bringa), és mikor tér el ettől? | enélkül nincs menetidő |
| I-4 | **Milyen eszközzel nézzek utána az útvonalnak?** Van-e elfogadható, **nem fizetős** megoldás *(`no-paid-solutions.md`)*? | enélkül nem tudok menetidőt mondani |
| I-5 | **Mit viszel magaddal?** Van-e alap-készlet, és mi jön hozzá esemény-típusonként? | enélkül nincs checklist |
| I-6 | **Mire kell figyelni indulás előtt?** *(pl. vízcsap, ablak, töltő, kulcs)* | ez a „mire figyeljek oda" a te szavaiddal |
| I-7 | **Mennyivel korábban szóljak?** A készülődés-kezdésnél, vagy előtte is egy „fél óra múlva indulsz" jelzéssel? | ez a riasztás alakja |
| I-8 | **Éjjel is szóljak** egy másnap kora reggeli eseményről, vagy csak ébredés után? | ütközik az alvás-ciklussal |

---

## 6. Kapcsolódó

- `__agent/capabilities/CATALOG.md` — C-01, C-02, C-03 *(mind `📝 javaslat`)*
- `__agent/flows/recurring/hourly-assistant-tick/README.md` — a tick hívja ezt a flow-t
- `current/principles/sleep-system.md` · `weekly-rhythm.md` · `priority-system.md`
