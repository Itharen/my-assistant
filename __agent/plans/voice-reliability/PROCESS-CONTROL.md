# 🎛️ PROCESS-CONTROL — hang-csatorna megbízhatóság (+ LinkedIn profil-felület)

> 🔴 **NO-CACHE belépési pont.** Minden ébredéskor **frissen** olvasandó.
> **Feladat-leírások:** `__agent/DEV-HANDOFF.md` *(a 2026-09-11 01:20 / 01:24 / 01:30 / 01:33 /
> 01:55 / 02:00-as szakaszok)* — ⛔ a tartalmuk **nem másolódik ide**, itt csak az **állapot**
> és a **sorrend** van.
> **Ez a fájl az enyém (DEV).** A `DEV-HANDOFF.md` az asszisztensé — ⛔ oda nem írok státuszt.

**Létrehozva:** 2026-09-11 02:05 · **Utoljára frissítve:** 2026-09-11 02:35

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
| **1** | 🎙️ **MEGŐRZÉS** — nyers hang + nyers átirat + látható veszteség | 02:00 + 01:33 (B) | ✅ **KÉSZ** — CLI 917/917, pozitív kontroll lefuttatva | 2026-09-11 02:32 |
| **2** | 🔢 **FIFO SOR** a felolvasásra | 01:33 (A) | ⏳ **SORON** | — |
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

## ✅ 1. TÉTEL — MI KÉSZÜLT EL (2026-09-11 02:32)

**A mért gyökér:** a `handleFinishedRecording` *bizonytalan* ágán *(`result.ok &&
result.suspicious`)* **semmi nem hívódott** — a WAV-ot az átemelt felvevő takarítása törli, a
nyers átirat pedig a `detail` szövegén kívül nem maradt meg sehol. ⇒ Nem a felismerés volt a
hibás, hanem **az eldobás**.

| réteg | hol |
|---|---|
| 1. a nyers HANG, a felismerés **előtt** | `voice-utterance-archive.ts` → `keep()` · bekötve: `discord.listener.ts` → `archiveUtterance` |
| 2. a nyers ÁTIRAT, bizonytalanságnál is | `annotate()` *(`status: 'uncertain'`)* · bekötve: `annotateUtterance` |
| 3. a veszteség LÁTHATÓ | `voice-missed-speech.ts` → `composeHeardLines` *(mit értettem + miért bizonytalan)* |

⭐ **Pozitív kontroll lefuttatva:** a megőrzés-hívást kivéve **pontosan a két helyes teszt**
bukott *(sorrend + bizonytalan ág)*; visszaállítva újra zöld.

⚠️ **Review-adósság, amit a változás okozott és amit MEGJAVÍTOTTAM:** két `max-file-lines`
*(recorder 450→504, spec 424→546)*. ⛔ A szabály nem lett kikapcsolva — **bontottam**:
`voice-recording-outcome.ts` *(a kimenetel-szókincs, 4 fogyasztóval)* és
`voice-channel-recorder.preservation.spec.ts`. A recorder most **420** sor.
⭐ Ráadás: a beinjektált fájl-olvasó szerződése leszűkült arra, amit tényleg használunk ⇒ a hamis
olvasónak **többé nincs szüksége `as` átcímkézésre**.

**Repo-szintű review-találat: 2393 → 2388.** Az új fájljaimon **1** marad
*(`one-export-per-file` a típus-szókincsen — ugyanaz a kódbázis-szintű minta, ami a szomszéd
voice-modulokon is áll; AGB-2026-09-09-01 szerint owner-kapus)*.

🔀 **ÜTKÖZÉS — MÁSODSZOR:** a munkám az **asszisztens session** `9d3ff7d` *(„fix(stt): MASODIK
izlandi hallucinacio…")* commitjába került be, mert megosztott worktree-ben `-A`-szerűen
stage-elt, amíg az én fájljaim staged-ek voltak. ✅ **A tartalom helyes és HEAD-ben van**, a
tesztek zöldek, fel van tolva — csak a commit-üzenet félrevezető. *(Az első eset: `be95eb6`.)*
⛔ `shared-file-collision.md`: csak a **saját** káromat vonom vissza — itt semmi nem sérült.

---

## ➡️ A KÖVETKEZŐ KONKRÉT LÉPÉS

**2. tétel *(FIFO sor)*, 1. lépés:** a mért gyökér már megvan —
`voice-speaker.ts:85` szerint ha a lejátszó **nem `Idle`**, a felolvasás
`spoken: false`-szal **elesik** *(„Épp szól valami")*. A `voice-read-aloud-watcher.ts`
`await`-el a `speak`-re, de a `speakInVoiceChannel` a `player.play()` **után azonnal** visszatér
⇒ nincs, ami megvárja a lejátszás **végét**. ⇒ A sornak az `AudioPlayerStatus.Idle`-re kell
várnia, ⛔ nem eldobni.
