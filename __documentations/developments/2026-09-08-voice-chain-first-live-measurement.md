# A hang-lánc ELSŐ élő mérése — és ami megdöntötte a diagnózist

**Dátum:** 2026-09-08 01:29–03:10 · **Feladat:** T-22 (voice control átemelés) ·
**Állapot:** a mérés megvan, a diagnózis megváltozott, három hiba javítva

---

## 1. Az előzmény — egy hipotézis, amit senki nem mért meg

2026-09-07 22:08-kor az owner ezt mondta:

> *„beszéltem, beszéltem, tulajdonképpen annak egy százaléka lett aztán transzkriptálva…
> De leginkább semmi nem ment át."*

Az akkori — **feltételezett** — magyarázatom:

> *„az átemelt `setupSpeechDetection` hangerő/ZCR-validációja dobja el a többit"*

⇒ Vagyis: **a felvevő szűrője** nyeli el a beszédet.

⛔ **Ez a hipotézis soha nem volt megmérve.** Ezért nem is nyúltam a küszöbökhöz — helyette
mérőeszközt építettem (`voice-drop-probe.ts`, `ma comm voice-funnel`).

---

## 2. Az első élő adat (2026-09-08 01:29–01:35)

```
📊 Hang-tölcsér — az elmúlt 12 óra
  ⚪ ÁTVITELI ARÁNY: 25%  (4 megszólalásból)   ⚠️ KEVÉS MINTA

  🎙️  megszólalás érzékelve ......... 9
  📼  felvétel a feldolgozásig ...... 2
  ✅  kötegbe került ................ 1
  🎚️  a felvevő eldobta ............. 0    🔴
  ❌  felismerés után elveszett ..... 3
  🔊 ELVESZETT HANG: 0 másodperc          🔴
```

A három bukás oka, szó szerint a naplóból:

```
01:34:52  MA-VOICE-SPEECH-DROPPED: Gyanús átirat — NEM cselekszem rá:
          A felismerés 5 perc után sem fejeződött be.
01:35:19  (ugyanaz)
01:35:28  (ugyanaz)
```

⚠️ **Ellenőrizve, hogy nem figyelő-újraindítás torzít:** az utolsó
`MA-VOICE-RECORDING-STARTED` **01:17:02**-kor volt, tehát mind a 9 megszólalás és mind a 3
kimenetel **ugyanazon a futáson** belül van.

---

## 3. 🔴 A DIAGNÓZIS MEGDŐLT

| | Feltételezett (22:08) | **Mért (02:03)** |
|---|---|---|
| Hol vész el a beszéd? | a felvevő ZCR/hangerő-szűrőjében | 🔴 **az STT 5 perces időtúllépésénél** |
| A felvevő eldobása | „a többséget eldobja" | ✅ **0 db**, `lostAudioSeconds: 0` |
| Mit kellett volna javítani | a küszöböket | **semmit** — ott nem volt hiba |

⭐ **A 9 érzékelt megszólalás és a 2–3 felvétel közötti különbség NEM veszteség**: a felvevő a
`wavUserStreams.has(userId)` ágon korán visszatér, vagyis a megszólalás **beleolvad** egy már
futó felvételbe. Pontosan ezért kellett a **fájl-szintű** mérés — a `detected − delivered`
különbség ezt összemosta volna a valódi eldobással.

📌 **A tanulság, ami a legfontosabb:** ha mérés nélkül „megjavítottam" volna a küszöböket, egy
**nem létező hibát** javítottam volna — és közben elrontottam volna azt a szegmentálást, ami az
owner szerint *„egész jól működött"*. A `core-no-guessing` itt **konkrét kárt** előzött meg.

---

## 4. Három hiba, amit CSAK az élő adat mutatott meg

### 4.1 ✅ Az időtúllépést „nem értettem"-ként jelentettük

Az `stt.client.ts` **minden** bukásnál `suspicious: true`-t ad vissza — a timeout-ágon is. A
besorolásom ebből `not-understood`-ot csinált, tehát az owner ezt látta/hallotta volna:

> ❓ *„hallottam, de nem értettem biztosan"*

⛔ **Ez nem igaz volt.** Nem volt átirat — a felismerés **el sem készült**. Az owner
megismételte volna tisztábban, ami **semmit nem segít**.

⭐ **A hazug diagnózis rosszabb, mint a néma hiba: rossz irányba küldi azt, aki javítani akar.**

🩹 A `suspicious` mostantól **csak akkor** jelent „nem értettem"-et, ha a felismerés **le is
futott** (`result.ok && result.suspicious`). Különben `recognition-failed` — más hang, más
üzenet, más orvoslás.

### 4.2 ✅ A `delivered` szám strukturálisan alulmért

A `MA-VOICE-SPEECH-DETECTED` sor **csak új megszólaláskor** íródik — a feldolgozás viszont
**percekkel később** fejeződik be. ⇒ Az utolsó megszólalás után befejeződő kézbesítések **sosem**
kerültek naplóba. *(Mérve: `delivered: 2`, miközben 3 kimenetel-sor keletkezett.)*

🩹 A kimenetel-sor is viszi a `deliveredSoFar` értéket.

### 4.3 ✅ A bukott felismerés VÉGLEG elveszett

A `SttRetryQueue` **létezett** *(„a fel nem ismert hang NEM vész el")*, de mérve: a
`cli/src/voice/` alatt **nulla** hivatkozás rá — a hang-csatorna útja **nem használta**.
A WAV-ot a felvevő takarítása törli ⇒ a 3 időtúllépéses felvétel **visszahozhatatlan**.

🩹 Bekötve — de **nem „egy sorral"**: a kézbesítési ágat végigolvasva három dolog tér el a
hangüzenet-úttól, és nyersen bekötve **két hibás viselkedést** kaptunk volna:

| # | Mi lett volna rossz | Miért |
|---|---|---|
| 1 | `🎙️ HANGÜZENET`-jelölés a kötegben | elfedné, hogy **élő beszédről** van szó — ott a szegmentálás is hibázhat |
| 2 | a tükör **nem létező üzenetre** válaszolna | a hang-csatornánál a `messageId` a **WAV fájlneve** |
| 3 | bukásnál a tükör a **fő chatbe** esne | az owner **pont ott nem látná**, ahol beszélt |

⇒ Az `SttRetryEntry` kapott egy **opcionális `source`** mezőt, és a kézbesítés + a feladás-üzenet
is elágazik rajta. A döntés **tesztelt függvényben** áll: `stt.retry-delivery.ts`.
⭐ **Opcionális, mert a lemezen már ott lévő bejegyzéseknek változatlanul kell működniük.**

### ⭐ Szelektív újrapróbálás

| Kimenetel | Újra? | Miért |
|---|---|---|
| `recognition-failed` *(időtúllépés, szolgáltatás-hiba)* | ✅ | a felismerés **le sem futott**; a hang ép |
| `not-understood` *(lefutott, de kétes)* | ⛔ | ugyanaz a bemenet **ugyanazt** adná — csak égetné a szűk erőforrást |

---

## 5. ⛔ Amihez nem nyúltunk

- **Az FDP AI szolgáltatás** — `current/principles/fdp-ai-never-restart.md`, owner: *„Ahhoz soha
  ne nyúlj!"* Az STT lassúsága **nem a mi javításunk**; amit tehetünk, az a **kiesés megelőzése**
  és az **igaz jelentés**.
- **Az átemelt felvevő** — `transplant-not-rewrite`. És most már **mérve** is tudjuk, hogy nem
  ott van a hiba.
- **A szűrő-küszöbök** — mérve: `droppedByRecorder: 0`. Nincs mit állítani rajtuk.

---

## 6. Ami még nyitva van

| | |
|---|---|
| ⏳ **több élő minta** | 4 kísérlet még „kevés minta" — a rendszer maga jelzi, hogy ebből nem lehet következtetni |
| ⏳ **az újrapróbálás élő igazolása** | a bekötés **02:40 óta él** *(dist 02:36 → folyamat 02:36:29 → felvétel 02:40)*; a 01:35-ös bukások **előtte** voltak, tehát **nem hozhatta vissza őket** — ezt nem szabad sikerként olvasni |
| ❓ Q-2026-09-07-07 | jó-e a hangjelzések hozzárendelése |
| ❓ Q-2026-09-07-08 | fejhallgatót használ-e az owner *(hangszóró-visszacsatolás kockázata)* |

---

## 7. Kapcsolódó

`__documentations/dev/VOICE_CONTROL_REFERENCE.md` §8 · `__agent/CONTINUATION.md` ·
`__agent/plans/voice-control-transplant/hyperplan.plan.md` ·
`cli/src/voice/journeys/README.md`
