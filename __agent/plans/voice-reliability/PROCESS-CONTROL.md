# 🎛️ PROCESS-CONTROL — hang-csatorna megbízhatóság (+ LinkedIn profil-felület)

> 🔴 **NO-CACHE belépési pont.** Minden ébredéskor **frissen** olvasandó.
> **Feladat-leírások:** `__agent/DEV-HANDOFF.md` *(a 2026-09-11 01:20 / 01:24 / 01:30 / 01:33 /
> 01:55 / 02:00-as szakaszok)* — ⛔ a tartalmuk **nem másolódik ide**, itt csak az **állapot**
> és a **sorrend** van.
> **Ez a fájl az enyém (DEV).** A `DEV-HANDOFF.md` az asszisztensé — ⛔ oda nem írok státuszt.

**Létrehozva:** 2026-09-11 02:05 · **Utoljára frissítve:** 2026-09-11 02:05

---

## 🎯 A CÉL ÉS A KÉSZ DEFINÍCIÓJA

**Egy mondatban:** amit az owner mond, az **ne veszhessen el**, és amit én mondok, az
**hiánytalanul és egyszerre-beszélés nélkül** hangozzon el.

**Kész, ha** mindhárom igaz: **(1)** nulla veszteség *(sem hangban, sem átiratban)* ·
**(2)** minden veszteség/torlódás **látható** *(⛔ nincs néma számláló)* · **(3)** minden tételre
van automata teszt, és a `dc rev` **0 új találattal** fut a nyúlt fájlokon.

---

## 📊 TÉTELES STÁTUSZ

| # | Tétel | Forrás | Állapot | Dátum |
|---|---|---|---|---|
| **1** | 🎙️ **MEGŐRZÉS** — nyers hang + nyers átirat + látható veszteség | 02:00 + 01:33 (B) | ⏳ **SORON** | — |
| **2** | 🔢 **FIFO SOR** a felolvasásra | 01:33 (A) | ⬜ hátra | — |
| **3** | ✂️ **DARABOLÁS** csonkolás helyett | 01:30 | ⬜ hátra *(a 2-re épül)* | — |
| **4** | 🔇 **SZÜNETELTETÉS**, amíg az owner beszél | 01:20 | ⬜ hátra *(a 2-re épül)* | — |
| **5** | 🌐 **NYELV-PARAMÉTER** a felismerésnek | 01:24 + 01:30 | ⬜ hátra | — |
| **6** | 🔗 **LinkedIn PROFIL-FRISSÍTŐ felület** | 01:55 | ⬜ hátra | — |

### Miért EZ a sorrend — ⛔ nem önkényes

- **Az 1. az első**, mert az owner ezt nevezte meg *(„Miért ez a legfontosabb most")*, és mert
  a veszteség **visszafordíthatatlan**: amit ma eldobunk, azt holnap nem tudjuk megőrizni.
  ⭐ A handoff maga mondja, hogy a 02:00 **2. rétege** és a 01:33 **(B)** pontja *„egy megoldás
  fedi le a kettőt"* — ezért van egy tételben.
- **A 2. a 3. és a 4. ELŐTT**, mert mérve *(`voice-speaker.ts:85`)*: ha épp szól valami, a
  következő **`spoken: false`-szal elesik**. ⇒ Sor nélkül a darabolás a 2..N. darabot **azonnal
  eldobná** — pont az ellenkezője annak, amit a 01:30 kér.
- **A 6. a végén**, mert **más domain** *(`one-function-is-enough`)* és semmi nem blokkol rá.

---

## 🔁 CIKLUS-PROTOKOLL — mi EGY kör

```
1. FAM rule-fetch (a trigger kéri)  ->  ezt a fájlt FRISSEN beolvasni
2. a STÁTUSZ szerinti ELSŐ "⏳ SORON" tétel — EGY tétel, ⛔ nem kettő
3. MÉRÉS előbb: a jelenlegi viselkedést igazolni, ⛔ nem feltételezni
4. tiszta-döntés modul + teszt  ->  bekötés  ->  `npx tsc --noEmit` + jasmine
5. `dc rev` a nyúlt fájlokra — 0 új találatig
6. commit (explicit fájllista) + push  ->  EZT A FÁJLT frissíteni (dátummal)
7. ScheduleWakeup, ha van még "⬜ hátra"; ha nincs: AGENT_BUS-jelentés, ⛔ nincs új ébredés
```

### ⛔ KEMÉNY KORLÁTOK *(a teljes lista a `DEV-HANDOFF.md` 1. és 5. szakaszában)*

- ⛔ Egyetlen tesztet, ellenőrzést, review-t **sem** kapcsolok ki. *(Owner: „NEEE!")*
- ⛔ **Nem írok az ownernek** — minden owner-kommunikáció az asszisztensé.
- ⛔ Az átemelt CCAP-fához *(`cli/src/_modules`, `_collections`, `_enums`)* **nem nyúlok**.
- ⛔ `git add -A` / `git add .` **soha** — megosztott worktree, explicit fájllista.
- 🔒 Hangfelvétel + átirat = **személyes adat** ⇒ gitignore-olt lokál tár, ⛔ nem a repó.
- ⛔ `git stash` tilos · ⛔ nincs polling/háttér-figyelő · ⛔ a `Monitor` eszközt nem hívom.

---

## ⚠️ MÉRT ESZKÖZ-BUKTATÓK *(hogy ne fussak bele újra)*

| Buktató | Mit tegyek |
|---|---|
| `npm test` a CLI-ben `rimraf ./dist`-tel kezd | megosztott workspace-ben egy párhuzamos build kihúzhatja a `dist`-et a jasmine alól ⇒ **külön** `npm run build-base`, majd `npx jasmine` |
| python heredoc + UTF-8 | `PYTHONUTF8=1` **kötelező**, különben cp1250-ben olvas és az ékezetes horgony nem talál |
| fájl-írás pythonból | temp-fájl + `os.replace`, ⛔ soha `open(p,'w')` közvetlenül *(mérve: egy spec 0 bájtra csonkult)* |
| commit-üzenet backtickkel | `git commit -F <fájl>`, ⛔ nem `-m` |
| megosztott markdown *(`AGENT_BUS.md`)* | **mtime-őr** a `read → ír` köré |

---

## ➡️ A KÖVETKEZŐ KONKRÉT LÉPÉS

**1. tétel, 1. lépés:** megmérni a mostani felvétel-útvonalat —
`cli/src/voice/voice-channel-recorder.ts` + a felismerő hívás: **hol** keletkezik a hang-puffer,
és **hol** dobjuk el *(`droppedByRecorder` vs. `droppedAfterTranscribe`)*. Enélkül a megőrzés
rossz rétegbe kerülne.
