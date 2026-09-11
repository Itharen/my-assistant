# 🔒 A BESZÉD-ÉSZLELÉS — hogyan dönti el, hogy beszélek-e

> **Owner, 2026-09-11 04:11 (szó szerint):** *„a voice inputunknál, amit **importáltunk a
> CCAP-ból**, hogy **mikor beszélek, mikor nem**, az **kurva jól működik** — azt amúgy **nagyon
> alaposan rögzítenünk is kéne, körbeírni, nagyon alaposan tesztekkel fixálni a
> funkcionalitást**."*

**Készült:** 2026-09-11 07:00 · **A leszögező teszt:**
`cli/src/_modules/voice/voice-speech-detection.characterization.spec.ts` *(28 spec)*
**A lánc egésze:** `VOICE_CONTROL_REFERENCE.md` *(ez a doksi annak a **részletezése**, ⛔ nem
váltja fel)*

---

## 🔴 MIÉRT KELLETT EZ A DOKSI — a mért állapot

| mérés *(2026-09-11 06:52)* | érték |
|---|---|
| `cli/src/_modules/voice/` — fájlok | **37 db, 6 681 sor** |
| ebből `cv-recording.control-service.ts` | 1 322 sor |
| 🔴 **spec-fájl ebben a fában** | **0** ← *nulla* |
| a `VOICE_CONTROL_REFERENCE.md` említései a ZCR-ről | **2** |

⇒ **A rendszer legjobban működő darabja volt a legvédetlenebb**, és a **döntési logikája**
*(„mikor beszélek")* sehol nem volt leírva. Bármely jövőbeli mozdulat **némán** elronthatta.

⛔ **A HATÁR (`transplant-not-rewrite`):** ez a doksi és a teszt **leszögez**, ⛔ nem takarít.
A `cv-*.ts` fájlokon a `git diff` **ÜRES** — ellenőrizve.

---

## A LÁNC — ki mit dönt el

```
Discord opus-folyam
   │
   ├─▶ @discordjs/voice  receiver.subscribe(…, AfterSilence 1000 ms)   ← 🔴 A SZEGMENS-HATÁR
   │        (cv-recording.control-service.ts:113)                          NEM A MI KÓDUNK
   │
   ├─▶ prism.opus.Decoder (960 keret, 2 csatorna, 48 kHz) → WAV-író
   │
   └─▶ keretenkénti ítélet:  extractSamples → calculateRMS  ← hangerő
                             calculateZeroCrossings          ← ZCR
                             filterLongNonGreenSequences     ← ZCR-szűrés
                             validateMajorityGreenZCR        ← többségi-zöld kapu
```

### ⚠️ AMIT NEM MI DÖNTÜNK EL — és miért fontos tudni

A *„mikor ér véget egy megszólalás"* kérdést a **Discord SDK** válaszolja meg:

```ts
receiver.subscribe(userId, { end: { behavior: EndBehaviorType.AfterSilence, duration: 1000 } });
```

⇒ **1000 ms csend zárja a szegmenst**, és ezt a `@discordjs/voice` méri, ⛔ nem a mi kódunk.

🔴 **Ezért a *„beszéd → 1 s csend → beszéd → két szegmens"* teszt NEM a mi viselkedésünket
tesztelné**, hanem a Discordot — és élő hang-kapcsolat nélkül nem is futtatható.
⭐ Amit **mi** döntünk el, az a **keret-szintű** ítélet és a **szűrés** — azt szögezi le a teszt.

---

## 1️⃣ A HANGERŐ — RMS

**Mért képlet** *(`cv-voice.utils.ts` → `calculateRMS`)*: `sqrt( Σ(x²) / n )`, ahol az `x` a
`-1..1`-re normalizált minta *(`readInt16LE(i) / 32768`)*.

| érték | mért | miért így |
|---|---|---|
| `speechThreshold` | **0,008** | ⭐ **Szándékosan alacsony** *(a forrás kommentje: „ALACSONYABB")* — a halk beszédet is elkapja. Az álpozitívokat a **ZCR** szűri, ⛔ nem a hangerő |
| üres minta-lista | **0** | ⚠️ ⛔ **Nem `NaN`** — egy `NaN` minden küszöb-összehasonlításon elbukna, és a beszéd **soha** nem érné el a küszöböt, **némán** |

⚠️ **Mért különcség:** a **páratlan** utolsó bájt **kimarad** *(a ciklus `i + 1 < length`-et
követel)*. Egy jövőbeli „javítás" itt **csendben** megváltoztatná a minta-számot.

## 2️⃣ A ZCR — nulla-átmenet

**Mért képlet** *(`calculateZeroCrossings`)*: azokat a szomszédos minta-párokat számolja, ahol
`prev < 0 && cur >= 0` **vagy** `prev > 0 && cur <= 0`.

🔴 **MÉRT KÜLÖNCSÉG: a pontos `0` átmenetnek számít.** Negatív minta után a `0` „nem-negatív",
tehát átmenet; pozitív után szintén *(`cur <= 0`)*. ⚠️ Egy néma *(csupa nulla)* keret így egy
negatív keret után **egy átmenetet ad** — és a ZCR-alapú ítélet ezen áll.

**Mire jó a ZCR:** a beszéd ZCR-je egy **középső sávban** van. A túl alacsony ZCR búgás/hum, a
túl magas sziszegés/fehérzaj. **Mért sávok** *(`cv-speech-analysis.const.ts`)*:

| sáv | min | max |
|---|---|---|
| „jó" *(good)* | 0,05 | 0,8 |
| „elfogadható" *(acceptable)* | 0,03 | 0,9 |

## 3️⃣ A ZCR-SZŰRÉS — ⚠️ a legkevésbé kézenfekvő viselkedés

`filterLongNonGreenSequences(zcrBuffer, volumeBuffer, zcrGate)`

| mért érték | |
|---|---|
| `zcrFilteringCount` | **10** keret |

**A mért viselkedés, három lépésben:**

1. végigmegy a pufferen, és a **kapu alatti** *(„nem-zöld")* kereteket **futamokba** szedi;
2. ha egy futam **< 10** keret ⇒ ⭐ **megtartja** *(a beszéd közbeni rövid szünet ⛔ nem zaj — ha
   kidobnánk, szétesne a szegmens)*;
3. 🔴 ha egy futam **≥ 10** keret ⇒ **`break`-kel kilép, és MINDENT eldob attól a ponttól**.

🔴 **A 3. pont a csapda:** a függvény ⛔ **nem csak a zajos futamot** veszi ki — a **mögötte lévő
ép beszédet is**. Aki ezt nem tudja, azt hiszi, csak a zaj esik ki.
⇒ Ezt a teszt **külön** szögezi le, a `removedCount`-tal együtt.

⚠️ **A hangerő-puffer a ZCR-rel EGYÜTT szűrődik.** Ha szétcsúsznának, a hangerő-statisztika
**más keretekre** vonatkozna, mint a ZCR — és az ítélet két különböző dologból állna össze.

## 4️⃣ A TÖBBSÉGI-ZÖLD KAPU

`validateMajorityGreenZCR(zcrBuffer, zcrGate)` → `{ isValid, goodRatio, goodCount, totalCount }`

| mért szabály | |
|---|---|
| zöld keret | `zcr >= zcrGate` *(az egyenlőség **zöld**)* |
| érvényes | `goodRatio > 0.5` — 🔴 **SZIGORÚ**: a pontosan 50% **elbukik** |
| üres puffer | `isValid: false`, `goodRatio: 0` — ⛔ nincs nullával osztás |

⚠️ Egy `>=`-re váltás itt **csendben** megváltoztatná, mi számít beszédnek.

## 5️⃣ ÁLLAPOT-KEZELÉS és időzítés — mért értékek

| beállítás | érték | miért |
|---|---|---|
| `speechConfirmationFrames` | **2** | ⭐ **Aszimmetrikus a csenddel, és ez szándékos:** a beszéd **kezdetét** gyorsan akarjuk elkapni |
| `silenceConfirmationFrames` | **3** | …a **végét** viszont óvatosabban — különben a szó közbeni **levegővétel** szegmenst zárna |
| `volumeBufferSize` | 50 keret | a gördülő statisztika ablaka |
| `minSpeechDuration` | 100 ms | ennél rövidebb nem megszólalás |
| `maxRecordingDuration` / `maxSpeechDuration` | 30 s | felső korlát |
| `silenceDuration` | 300 ms | belső csend-számláló |
| `minLengthByte` | 2 500 *(≈0,1 s)* | ennél kisebb WAV-ot nem dolgozunk fel |
| `chunkLength` | 10 s | darab-hossz |
| formátum | 48 kHz · 2 csatorna · 16 bit | a Discord formátuma |

### 🔴 MÉRT LELET: a `zcrValidationThreshold` KI VAN KAPCSOLVA

A feladat-leírás a *„`zcrValidationThreshold` szerepét"* kérte. ⭐ **A valóság:** az érték a
forrásban **kikommentezve** áll *(`cv-voice-recording.const.ts:35`)*, tehát **nincs hatása**:

```ts
/* zcrValidationThreshold: 0.3, */  // Minimum átlagos ZCR érték Whisper küldéshez (0-1)
```

⇒ A Whisper-küldés előtti ZCR-validáció helyét a **többségi-zöld** ellenőrzés vette át.
⚠️ Ugyanígy kikommentezve: `zcrMaxRedGapLength`, `zcrMinGreenBlockLength`.
⛔ **Nem kapcsoltuk vissza** — a teszt azt rögzíti, ami **VAN**.

### Az adaptív ZCR — mért értékek

| beállítás | érték |
|---|---|
| `zcrAdaptiveHighRatio` / `…Multiplier` | 0,8 / 0,8 |
| `zcrAdaptiveMediumRatio` / `…Multiplier` | 0,6 / 0,9 |

⇒ Ha a keretek **80%-a** zöld, a kapu **80%-ára** enged; ha **60%**, akkor **90%-ára**. ⭐ Vagyis
**minél tisztább a jel, annál engedékenyebb** a kapu.

---

## 🧪 A LESZÖGEZŐ TESZT — hol van, és MIÉRT ott

`cli/src/_modules/voice/voice-speech-detection.characterization.spec.ts` *(28 spec)*

⚠️ **A név szándékosan NEM `cv-` előtagú:** az a prefix az **átemelt** kódot jelöli; ez a fájl
**a miénk**. Csak azért van **ebben** a könyvtárban, mert a fő build `strict` programja
⛔ **kizárja** a `src/_modules`-t, a jellemző-teszt viszont **ugyanazzal a laza szerződéssel**
kell forduljon, mint a leszögezett kód *(`tsconfig.transplanted.json`)*.

### 🔴 A BUKTATÓ, AMIT KÖZBEN MEGMÉRTEM — és ami majdnem néma tesztet adott

```
build-base  =  rimraf ./dist && tsc -p tsconfig.json      ← a dist-et TÖRLI
                                  (és a _modules KI VAN ZÁRVA belőle)
npm test    =  build-base && jasmine  dist/**/*.spec.js
```

⇒ A `_modules`-beli spec **lefordítva sem lett volna** a `dist`-ben ⇒ jasmine **nem találja** ⇒
🔴 **a teszt némán NEM FUT**, miközben a fájl ott van, és a „spec-szám > 0" kritérium teljesül.
⚠️ Pontosan az a hibafajta, ami ellen az egész munka szól.

⭐ **A megoldás:** új npm-szkript, és a `test` **átfogja**:

```json
"build-transplanted": "tsc -p tsconfig.transplanted.json && tsx scripts/transplanted-build-fix.ts",
"test": "npm run build-base && npm run build-transplanted && jasmine --config=…"
```

⚠️ **A vállalt következmény:** ha egy jövőbeli `@types/node` bump elrontja az átemelt fa
fordítását, a `npm test` **piros lesz**. ⭐ **Ez a helyes viselkedés:** ilyenkor a tesztek
tényleg **nem tudnak lefutni**, és ezt **kimondani** jobb, mint zölden hazudni.
*(A CDP-pipeline ugyanezt a lépést `fatal: false`-szal futtatja — ott a fejlesztés folytatása a
cél; itt a **teszt-igazság**.)*

### ⭐ Amit a POZITÍV KONTROLL hozott elő — a saját tesztem hibája

Elhangoltam a `speechThreshold`-ot *(0,008 → 0,08)* **és** a `zcrFilteringCount`-ot *(10 → 3)*.

| sabotage | elkapta? |
|---|---|
| `speechThreshold` | ✅ **2 teszt** bukott |
| `zcrFilteringCount` | 🔴 **NEM** — a szűrés-tesztek a tömböt **a configból** építik *(`new Array(zcrFilteringCount)`)*, ezért **adaptálódtak** |

⇒ A tesztek a **kapcsolatot** szögezték le, az **értéket** nem. ⭐ Ezt egy külön, explicit
`toBe(10)` állítás zárta be. **Enélkül a leszögezés hamis biztonság lett volna.**

---

## Ellenőrzés

```
CLI 1049/1049 zöld  (1020 → 1049, +29)
tsc: tiszta a FŐ és a TRANSPLANTED programon is
git diff a cv-*.ts fájlokon: ÜRES   ← a határ
```

## Kapcsolódó

- `VOICE_CONTROL_REFERENCE.md` — a hang-lánc egésze *(ez a doksi annak részletezése)*
- `current/principles/transplant-not-rewrite.md` — a határ kanonikus szabálya
- `__agent/plans/voice-reliability/PROCESS-CONTROL.md` — a 9. tétel státusza
