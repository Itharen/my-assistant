# Az ÉLŐ, keretenkénti színes sáv — mért diagnózis (T-52)

**Dátum:** 2026-09-08 07:13–07:30 · **Feladat:** T-52 (konzol-visszajelzés a hang-feldolgozásról)
**Állapot:** 🔍 **a mechanizmus feltárva** — ⛔ **nem építettem**, mert owner-döntést igényel

---

## 0. 🔴 ELŐSZÖR: a saját korábbi mérésem ÉRVÉNYTELEN volt

2026-09-08 06:24-kor ezt állítottam:

> *„az LDP konzol-kimenetében a beszéd-feldolgozásról **NULLA** sor van"*

⛔ **Ez a mérés nem bizonyított semmit.** Az LDP log-fájljai **rotálódnak**
*(`log.runtimeMaxBytes: 102400`)*, és mérve **07:13-kor** a két fájl együtt csak a
**06:37–07:13** ablakot fedte. Az owner beszéde **01:29–01:35**-kor volt — az a tartalom
akkor már rég nem volt a fájlban.

⇒ Olyan ablakban grepeltem, ahol **eleve nem hangzott el semmi**. A „0 sor" ott triviálisan
igaz, és **semmit nem mond** arról, hogy a naplózás eljut-e a konzolra.

📌 **Ugyanaz a hiba, amit egy nappal korábban magam írtam le:** *„a »mértem« önmagában nem elég
— milyen körülmények között mértem, az is a mérés része."* Leírtam, és megismételtem.

---

## 1. A sáv LÉTEZIK, és BE VAN KAPCSOLVA

Az átemelt kódban megvan pontosan az, amit az owner leírt —
`cv-analysis.control-service.ts:33`, `_logCompactAudioAnalysis`:

```
🟢 zöld  |   ha  zcr >= zcrGate          (beszédnek ismerte fel)
🟡 sárga |   ha  zcr >  zcrGate * 0.9    (határeset)
🔴 piros |   egyébként                    (nem beszéd)
```

- **Keretenként** hívódik: `setupSpeechDetection` → `logAnalysisDebug` → minden audio-chunknál
  *(gate: `volume > 0.005 || isSpeech`)*.
- **Be van kapcsolva**: `compactAudioAnalysisLog = true` *(`cv-analysis.control-service.ts:20`)*.
- **Helyben rajzol**: `process.stdout.write(`\r${label}${buffer}`)` — kocsivissza, `\n` nélkül.

⇒ ⛔ **Nem kell megépíteni. Már megvan.**

---

## 2. ✅ A `DyFM_Log` ÍR a stdout-ra — mérve

Külön kísérlet *(nem feltételezés)*: a `@futdevpro/fsm-dynamo` `DyFM_Log`-ját közvetlenül
meghívva a `log` / `info` / `warn` / `error` mind **megjelent**, ANSI-színekkel együtt.

⇒ A naplózás **nem néma**. A korábbi „a konzol néma" következtetés **alaptalan volt**.

---

## 3. 🔴 AMI VISZONT ELRONTJA — három mért ok

### 3.1 A stdout NEM terminál

Mérve: `process.stdout.isTTY: undefined` · `columns: undefined`, amikor a kimenet **csővezetéken**
megy *(márpedig az LDP így fogja be)*. ⇒ A `\r` **nem rajzol felül** — csak bekerül a folyamba.

### 3.2 A log-fájlban a sáv OLVASHATATLAN

A `\r`-ek megmaradnak, `\n` viszont nincs ⇒ a fájlban **egyetlen, hatalmas sor** lesz, tele
kocsivissza-karakterekkel. Terminálban ez helyben-rajzolás; fájlban **káosz**.

### 3.3 ⭐ A KÖZBEÉKELŐDŐ SOR ÖSSZERONTJA A SÁVOT — ez a legfontosabb

Kísérlettel igazolva: ha a sáv rajzolása közben bármi mást kiírunk *(pl. a **60 mp-enkénti
pulzus-sor**)*, az **ugyanarra a sorra ragad rá**, mert a sáv sosem zárul `\n`-nel:

```
🎤 Audio Analysis: |||||🫀 07:15 · fut 2p │ 💬 Discord ✅ │ 📬 köteg üres
```

…majd a következő sáv-rajzolás **felülírja a pulzus-sort**. ⇒ A kettő **kölcsönösen tönkreteszi
egymást**.

---

## 4. ⛔ MIÉRT NEM JAVÍTOTTAM MAGAMTÓL

**A sávot az ÁTEMELT kód írja.** A rendering megváltoztatása = az átemelt kód módosítása,
amit az owner kifejezetten tiltott *(`transplant-not-rewrite`)*.

⚠️ **És a kézenfekvő megkerülés sem járható:** „akkor a pulzus ne ékelődjön be" — de mérve a
**két írás két KÜLÖN FOLYAMATBÓL** jön:

| Ki ír | Folyamat |
|---|---|
| a sáv *(átemelt felvevő)* | a **figyelő**, `pid 299872` |
| a pulzus-sor | az **LDP/szerver**, `pid 286248` |

⇒ A szerver **nem tudhatja**, hogy a figyelő épp sávot rajzol. Az ütközés **szerkezeti**, nem
egy elfelejtett `\n`.

---

## 5. 🙋 AMI OWNER-DÖNTÉST IGÉNYEL

A sáv megvan és megy — a kérdés az, **hova** menjen, hogy tényleg látható legyen:

| Opció | Mit jelent | Ár |
|---|---|---|
| **A) Saját ablak a sávnak** | a figyelő külön konzolablakban fut, ott rajzol | egy ablakkal több; a sáv **tiszta**, semmi nem ékelődik be |
| **B) A pulzus költözik** | a pulzus-sor nem a konzolra megy, hanem pl. a kliensre | a konzolon **csak** a sáv marad; a pulzust máshol kell nézni |
| **C) Marad, ahogy van** | tudomásul vesszük, hogy percenként egyszer megtörik | ingyen; a sáv 59 másodpercig ép |

⭐ **Az ajánlásom: (A).** A sáv **folyamatos** jelzés, a pulzus **pillanatkép** — a kettő
természeténél fogva nem fér meg egy sorban. Külön ablakban a sáv azt adja, amit az owner kért:
*a döntés folyamatát, keretenként*, megszakítás nélkül.

⛔ **Amit egyik opció sem igényel: az átemelt kód módosítását.**

---

## 6. ⏳ Ami még nincs igazolva

A sáv **élő** megjelenését nem láttam — ahhoz beszéd kell. Amit igazoltam: a sáv **kódja
létezik és be van kapcsolva**, a naplózás **eljut a stdout-ra**, és a `\r`-alapú rendering
**ütközik** a többi kimenettel. ⛔ Azt **nem** állítom, hogy tudom, mit lát az owner a saját
ablakában — azt csak ő látja.

---

## 7. Kapcsolódó

`__agent/TASKS.md` T-52 · `__agent/CONTINUATION.md` ·
`cli/src/_modules/voice/_services/cv-analysis.control-service.ts` *(⛔ nem módosítandó)* ·
`server/src/_services/system-pulse.service.ts`
