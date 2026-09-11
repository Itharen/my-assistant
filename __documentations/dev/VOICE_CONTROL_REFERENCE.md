# Voice control — a MEGLÉVŐ, működő megvalósítás átemeléshez

> **Owner-utasítás (2026-09-07 07:38) — SZÓ SZERINT:**
>
> *„ott van egy elég komoly teljes megvalósítás, ami száz százalékos és nagyon jól működött,
> és amit majd úgy kéne átemelni ide magunkhoz, hogy teljes egészében nullában. Aztán ez a
> kb. kilépési pontja ennek az egész voice controlnak, és itt az egész kezelést kéne majd
> alaposan átnézni, ami elmertek úgy működik, hogy belépsz majd egy voice csatornára, és akkor
> ott különféle hangmagasságok, meg hangerő alapján, meg mit tudom én mi alapján már figyeli,
> hogy mi a amikor van beszéd, és akkor azokat feldolgozza, ellenőrzi, hogy van-e benne
> beszéd, van-e köze az egészhez, és akkor ad nekem ilyen hangalapú visszajelzéseket arról,
> hogy hol tartanak ezek a feldolgozások, folynak-e a feldolgozások, stb.
> integrálni: „CV_ResultReview_ControlService.reviewResult" (ccap projekt. a régi (discord bot
> rész). nem a ccap-revisioned.)"*

---

## 1. A forrás — MEGTALÁLVA és ellenőrizve (2026-09-07 07:41)

| | |
|---|---|
| **Projekt** | `E:\Programming\Own\CURSOR\LIVE-projects\ccap` — ⚠️ **a RÉGI**, NEM a `ccap-revisioned` |
| **Rész** | `discord-bot/` |
| **Modul** | `src/_modules/voice/` |
| **Méret** | **37 TS-fájl, ~6 681 sor** |
| ⭐ **A kilépési pont** | `src/_modules/voice/_services/cv-result-review.control-service.ts` → **`reviewResult()`** *(31. sor)* |
| Hívója | `cv-processing.control-service.ts:318` |

## 2. A modul szolgáltatásai (mind megvan)

```
cv-main.control-service.ts                    ← belépés / vezénylés
cv-connection.control-service.ts              ← voice channel csatlakozás
cv-recording.control-service.ts               ← felvétel
cv-segment.control-service.ts                 ← szegmentálás
cv-analysis.control-service.ts                ← hangmagasság / hangerő elemzés
cv-audio-classification.api-service.ts        ← van-e benne beszéd?
cv-processing.control-service.ts              ← a feldolgozási lánc
cv-result-review.control-service.ts           ← ⭐ reviewResult() — a KILÉPÉSI PONT
cv-unified-speech-recognition.control-service.ts
cv-local-speech-recognition.api-service.ts    ← helyi STT  ← ⭐ ez lehet az FDP AI-ra kötés helye
cv-whisper.api-service.ts
cv-elevenlabs-speech-recognition.api-service.ts   ← ⚠️ most nincs keret (lásd §6)
cv-file.service-control.ts
cv.service-base.ts
```

Plusz: `_modules/agent-3/` — `agt3-wake-word-detection` és `agt3-speech-processing`.

⚠️ A `reviewResult` **már most is** ismeri az `OUTOFCONTEXT` és `NOISE` eseteket
*(194. és 208. sor)* — vagyis a „van-e köze az egészhez" szűrés benne van.

---

## 3. Amit az owner elvár a működéstől

```
belépés voice channelre
   ↓
figyeli:  hangmagasság · hangerő · (egyéb jelek)
   ↓
BESZÉD-e?  →  szegmentálás  →  STT
   ↓
VAN-E KÖZE HOZZÁNK?  (OUTOFCONTEXT / NOISE szűrés)
   ↓
feldolgozás  →  ⭐ HANG-ALAPÚ VISSZAJELZÉS:
                „hol tart a feldolgozás, folyik-e még"
```

⭐ **A hang-alapú állapot-visszajelzés a lényeg** — nem elég feldolgozni, **közben szólni is
kell**, hogy hol tart.

---

## 4. Az átemelés szabályai

| | |
|---|---|
| ⛔ **NEM darabolva** | owner: *„teljes egészében nullában"* — a teljes modul jön át, nem szemezgetve |
| ⛔ **NEM a `ccap-revisioned`** | az owner külön kiemelte: a **régi** `ccap` a forrás |
| ✅ **Alapos átnézés** | owner: *„itt az egész kezelést kéne majd alaposan átnézni"* — nem vak másolás |
| ⚠️ **ElevenLabs — NEM kihagyandó, de MOST nem működik** | 🔴 **KORREKCIÓ (owner, 2026-09-07 07:44):** *„a TTS részhez kelleni fog az Eleven Labs, csak most éppen ki van fogyva a keret és valószínűleg a kulcs sem jó amibe van állítva."* ⇒ **megtartjuk a kódban**, de a mai állapotban **nem használható**. |
| ✅ **A helyi út az elsődleges** | STT **és** TTS: a **saját FDP AI** *(port 38321)* — `/v1/audio/transcriptions` és `/api/v1/audio/speech`. Ez ingyenes, helyi, és **most is fut**. |

---

## 6. ⚠️ ElevenLabs — a pontos állapot

| | |
|---|---|
| **Kell-e?** | ✅ **Igen, a TTS-hez** — owner-döntés, nem az én javaslatom |
| **Használható most?** | ❌ **Nem** — kifogyott a keret, és *„valószínűleg a kulcs sem jó, amibe van állítva"* |
| **Mit teszek?** | a kódot **megtartom**, de a működés **nem függhet tőle**: az elsődleges út a helyi FDP AI TTS |
| ⚠️ Kulcs | ⛔ **hozzá NEM nyúlok** — a kulcs-csere/rotáció **kizárólag ownerrel** (`core-secret-rotation-owner-only`) |

📌 A `no-paid-solutions.md` arról szól, hogy **én** ne javasoljak fizetőset. Ha az **owner**
választ egy eszközt, az az ő döntése — de a rendszer **ne álljon meg** attól, hogy épp nincs
keret rajta.

---

## 7. Kapcsolódó

- 🔒 **`VOICE_SPEECH_DETECTION.md`** — ⭐ **HOGYAN dönti el, hogy beszélek-e**: a hangerő-küszöb,
  a ZCR, a ZCR-szűrés és a többségi-zöld kapu — **mért** értékekkel, és 28 leszögező teszttel.
  *(Owner, 2026-09-11 04:11: „nagyon alaposan rögzítenünk is kéne… tesztekkel fixálni".)*
  ⇒ Ez a doksi a **láncról** szól; a **döntési logika** ott van részletezve.
- `__documentations/dev/FDP_AI_STT.md` — a saját STT/TTS szolgáltatás *(ide kötjük)*
- `__agent/capabilities/CATALOG.md` — **C-34** (voice channel), **C-33** (voice üzenet),
  **C-35** (STT/TTS)
- ⚠️ Ez **nagy** munkacsomag *(~6 700 sor)* — külön tervet igényel, nem egy menetben megy.

---

## 8. 🔊 A HANG-LÁNC MEGÉPÜLT ÁLLAPOTA — 2026-09-07 23:05

> Ez a szakasz a **tényleges, kódban lévő** állapotot írja le. A fenti 1–7. szakasz az
> átemelés **előtti** feltárás — történeti értékű, nem elavult, de nem is ez a jelenlegi kép.

### 8.1 A lánc

```
hang-kapcsolat (VoiceChannelPresence)
   → ÁTEMELT CCAP-felvevő (CV_Recording_ControlService)   ⛔ változatlan
   → kész WAV
   → a MI STT-nk (transcribeAudio → FDP AI)
   → VoiceChannelBridge → Discord-köteg + tükör-szöveg a HANG-csatornába
```

### 8.2 A három megfigyelő, ami MELLÉ került *(az átemelt kód érintetlen)*

| Fájl | Mit ad | Napló-kód |
|---|---|---|
| `cli/src/voice/voice-drop-probe.ts` | 🔍 a WAV-életciklus figyelése ⇒ **hány MÁSODPERC** hang veszett el némán | `MA-VOICE-SPEECH-DROPPED-SILENTLY` · `MA-VOICE-PROBE-ERROR` |
| `cli/src/voice/voice-missed-speech.ts` | 🔇 ami nem jutott át, az is **látszik** a hang-csatornában — **összevont** jelentésben | `MA-VOICE-MISSED-REPORT-FAILED` |
| `cli/src/voice/voice-cues.ts` | 🔊 **hangjelzések** a CCAP eredeti hangjaival | `MA-VOICE-CUE-FAILED` |

### 8.2b A kimenetel-kódok — három kimenetel, három kód

| Kód | Mit jelent | Veszteség? |
|---|---|---|
| `MA-VOICE-SPEECH-QUEUED` | bekerult a kotegbe | ✅ nem |
| `MA-VOICE-SPEECH-DROPPED` | az owner beszélt, de nem lett belőle semmi | 🔴 **IGEN** |
| `MA-VOICE-SPEECH-SKIPPED` | duplikátum, vagy nem az owner beszélt | ⚪ nem |

🔴 **MIÉRT KELL A HARMADIK.** Korábban **minden** `queued: false` `DROPPED`-ként naplózódott —
beleértve a duplikátumot és az idegen beszélőt. Egyik sem veszteség, mégis annak látszott volna,
és **épp azt a mérést rontotta volna el**, amiért az egész készült. ⛔ A visszaút sem jó: a
duplikátumot `QUEUED`-nak nevezni azt állítaná, hogy bekerult a kotegbe — pedig nem.
Az osztályozás ezért **tesztelt függvényben** áll: `classifyRecordingOutcome`.

### 8.3 A tölcsér — ez válaszolja meg, hogy „hol vész el a beszéd"

```
speechStarts  →  filesOpened  →  filesDelivered
   (speaking     (WAV nyílt;      (eljutott a
    .start)       a különbség      feldolgozó
                  BELEOLVADÁS,     hookig)
                  nem veszteség)        ↓
                                   filesDropped + lostAudioSeconds
```

⚠️ **A `detected − delivered` önmagában NEM veszteség** — összemossa a beleolvadt megszólalást
a valódi eldobással. Ezért kellett a fájl-szintű mérés.

### 8.3b 📊 A KIOLVASÁS — `ma comm voice-funnel`

```bash
ma comm voice-funnel                    # ⭐ gördülő 12 óra — ÁTÍVEL az éjfélen
ma comm voice-funnel --hours 24         # hosszabb ablak
ma comm voice-funnel --day 2026-09-08   # egy konkrét naptári nap
ma comm voice-funnel --json --pretty
```

🔴 **AZ ALAPÉRTELMEZÉS GÖRDÜLŐ ABLAK, NEM NAPTÁRI NAP** — mért hiba, 2026-09-08 00:51.

Az owner ébrenléte **csúszik** *(fix 18 óra, `current/principles/sleep-system.md`)*, tehát a napja
**nem** a naptári nap. Mérve: a 09-07 21:49-es beszéd a 09-07-es fájlban van, a 09-08-as jelentés
viszont **üres** volt. ⇒ Egy éjfélen átnyúló beszélgetés **kettévágódna**, és **egyik nap sem**
mutatná az igazi arányt — az owner reggel „nem működik"-et látna.

⚠️ **Ez a rosszabbik fajta hiba: nem hibázik, csak nem mond igazat.**
*(„Üres állapot magyarázó hiba nélkül tilos" — `core-rich-error-handling`.)*

⭐ A jelentés **mindig kiírja a saját ablakát** (`windowLabel`) — különben egy üres tábláról nem
dönthető el, hogy *„nem beszélt"* vagy *„rossz időszakot néztem"*.

⭐ **A mérés önmagában nem elég — ki is kell tudni olvasni.** Ha a válaszhoz kézzel kell
`grep`-elni és fejben összeadni, akkor a mérés **gyakorlatilag nincs meg**.

⛔ **A napi akció-naplóból dolgozik, NEM az élő szondából** — az a szerver-folyamatban él, a
CLI nem látná. A napló viszont a **tartós rekord**, és túléli az újraindítást.

🔴 **KÉT BEÉPÍTETT ÓVINTÉZKEDÉS a túlállítás ellen:**

| Óvintézkedés | Miért |
|---|---|
| **5 megszólalás alatt „KEVÉS MINTA"** — és ⚪ jel, nem ✅ | egyetlen sikeres felvétel „100%"-ot adna; **ez** volt a 22:08-as jogos kritika |
| megszólalás nélkül az arány **`null`**, nem 0% | a 0% azt hazudná, hogy minden elveszett |

⛔ **A nevezőből kimarad** az üres felvétel *(nem volt beszéd)* és a `SKIPPED`
*(duplikátum / idegen beszélő)* — egyik sem az owner elveszett mondata.

### 8.4 Hangjelzések — a hozzárendelés és a kockázata

A hangok a CCAP eredetijei (`LIVE-projects/ccap/discord-bot/src/_assets/sounds/`), a
`cli/src/_assets/sounds/` alá másolva. A hosszak `ffprobe`-bal mérve.

| Esemény | Fájl | Eredeti | Hossz |
|---|---|---|---|
| 🎙️ hallak, elkezdtem | `cue-heard.mp3` | `typing.mp3` | 0,44 s |
| ✅ megvan, átment | `cue-understood.mp3` | `11L-subtle,_warm,_mallow…` | 2,09 s |
| 🎚️ a felvevő eldobta | `cue-dropped.mp3` | `skip.mp3` | 0,84 s |
| ❓ nem értettem | `cue-unsure.mp3` | `hmmm.mp3` | 2,64 s |
| ❌ hiba | `cue-error.mp3` | `error.mp3` | 3,32 s |

⚠️ **HANGSZÓRÓ-VISSZACSATOLÁS.** A jelzés az owner hangszórójából is megszólal, és a mikrofonja
**visszaveheti** — pont abba a láncba, aminek a veszteségét mérjük. A `cue-heard` a
legérzékenyebb: az **beszéd közben** szól.
🔇 **Kikapcsolás kód nélkül:** `MA_VOICE_CUES=off`
⏱️ **KÉT SÁV, KÉT FÉK:** a „hallak" *(ambient)* **3 s**, a kimenetel-jelzések *(eldobva / megvan /
nem értettem / hiba)* **0,8 s**. 🔴 **Miért nem egy közös fék:** a valós időzítésben az „hallak"
*(t=0)* és az eldobás *(t≈1,4 s)* egy 3 s-os közös fékbe esik ⇒ az owner **sosem hallaná** a
fontosabbat. Egy hangulatjelzés nem némíthat el egy információt.
❓ Nyitott: `Q-2026-09-07-07` (hozzárendelés) · `Q-2026-09-07-08` (fejhallgató-e).

### 8.5 ⛔ Amihez NEM nyúlunk, és miért

- **Az átemelt felvevő** (`cli/src/_modules/voice/`) — `transplant-not-rewrite`.
- **A szűrő-küszöbök** (`speechThreshold: 0.008` · `minSpeechDuration: 100` · ZCR-sávok,
  `cv-voice-recording.const.ts` / `cv-speech-analysis.const.ts`) — ⛔ **amíg nincs élő mérési
  adat**, az állítgatásuk találgatás (`core-no-guessing`).
- **A transzplantált `playSound`** — mérve: saját CCAP-kapcsolatot építene
  (`CCAP_MasterService`), ami nálunk nem létezik.

### 8.6 Környezeti változók

| Változó | Mire |
|---|---|
| `MA_DISCORD_GUILD_ID` + `MA_DISCORD_VOICE_CHANNEL_ID` | hova lépjen be a bot |
| `MA_DISCORD_USER_ID` | 🔴 **csak az owner hangja** megy tovább |
| `MA_VOICE_CUES` | `off` ⇒ némák a hangjelzések (alapértelmezés: be) |

### 8.7 Build-buktató, ami már megfogott minket

⚠️ A fő `tsc` **önmagában nem elég**: az átemelt fa külön projekt
(`tsconfig.transplanted.json` + `scripts/transplanted-build-fix.ts`). Enélkül a `_modules`
**futásidőben nem létezik**, és a zöld típus-ellenőrzés **elfedi** a hiányt.

---

## 9. 🔌 A KAPCSOLAT-NAPLÓ, A SZÍNES SÁV ÉS A HELYI IDŐ — 2026-09-08 09:50

### 9.1 🔴 A napló-hiány, ami MÉRHETETLENNÉ tette a kiesést

**Mérve 2026-09-08 09:04**, a napi akció-naplóban:

| Kód | Darab |
|---|---|
| `MA-VOICE-JOINED` | **24** |
| `MA-VOICE-RECORDING-STARTED` | 23 |
| `MA-VOICE-SPEECH-DETECTED` | 9 |
| `MA-VOICE-SPEECH-DROPPED` | 8 |
| **bármilyen kilépés-esemény** | **0** — ⛔ *ilyen kód nem is létezett a forrásban* |

🔴 **Az ok:** az egyetlen leválás-kezelő (`VoiceChannelPresence.watchForDrop`) egy **üres
`catch`**-ben semmisítette meg a kapcsolatot:

```ts
]).catch((): void => { this.connection?.destroy(); this.connection = null; });
```

⇒ A bot **kieshetett a csatornából**, és erről **semmilyen nyom** nem keletkezett.
📌 Emiatt állítottam valótlant az ownernek arról, hogy bent voltunk-e.

### 9.2 A hat kapcsolat-esemény

| Kód | Mikor | Szint |
|---|---|---|
| `MA-VOICE-JOINED` | bent vagyunk | `note` |
| `MA-VOICE-LEFT` | **mi** léptünk ki, szándékosan | `note` |
| `MA-VOICE-DISCONNECTED` | elszakadt — de még visszajöhet | `note` |
| `MA-VOICE-RECONNECTED` | ⭐ magától visszajött, a kiesés hosszával | `note` |
| `MA-VOICE-DROPPED` | 🔴 **VALÓDI KIESÉS** — hossz + következmény | `error` |
| `MA-VOICE-JOIN-FAILED` | be sem tudtunk lépni | `error` |

⭐ **A leválás és a kiesés KÜLÖN kódot kap.** Ha egy kódon mennének, a *„hányszor estem ki?"*
kérdésre a napló **hamis, felfelé torzított** választ adna.

**Hol látszik:** ⭐ **a szerver logjában** (`[voice] HH:mm:ss MA-VOICE-… …`) **és** az
akció-naplóban. ⚠️ A `safeLog` **kizárólag** a JSONL-be ír — ezért a konzol-sor **külön** megy
`stdout`-ra. Owner: *„a szerver logjában kell látnom"*.

⭐ **Mellékhatás, ami önmagában is fontos:** a kiesés **frissíti a jelenlét-állapotot**, így a
`ma comm doctor` és a pulzus-sor többé **nem állítja örökre**, hogy bent ülünk.

### 9.3 🎨 Az élő, keretenkénti színes sáv (T-52)

**Owner:** *„`|` színesen, egy sorban, miközben hallja a hangomat, és azok pirosak és zöldek,
és amikor elég sok zöld van egymás mellett, akkor minősítjük azt egy hangszövegű üzenetnek."*

| Szín | Mit jelent |
|---|---|
| 🟢 zöld | ⭐ a felvevő **TÉNYLEGESEN** beszédnek vette *(`isSpeech`)* |
| 🟡 sárga | nem beszéd, de közel volt *(ZCR a küszöb 90%-a fölött)* |
| 🔴 piros | csend / zaj |

⭐ **A zöld a tényleges döntés, nem a mi rekonstrukciónk** a küszöbökből. Ha saját képlettel
színeznénk, a sáv **elcsúszhatna** attól, amit a felvevő csinál — és akkor **hazudna** arról,
amit megfigyel.

**A záró ítélet:** nem a zöldek **száma** dönt, hanem a leghosszabb **megszakítatlan** sorozat
*(`MIN_GREEN_RUN = 8`)*. Szórt zöldek = zaj.

#### ⛔ Az átemelt kódhoz NEM nyúltunk

Az elemző **singleton**, az `analyzeAudio` **publikus** ⇒ a példányra **kívülről** ülünk rá
(`voice-analysis-observer.ts`): meghívjuk az eredetit, továbbadjuk az eredményt a sávnak, és
**változatlanul** visszaadjuk. Az átemelt fájl **bájtra érintetlen**.

#### 🔴 EGY MÉRT ELTÉRÉS AZ EREDETITŐL

Az eredeti `\r`-rel **helyben rajzol**. Itt ez **nem működhet**: a konzolra **két külön
folyamat** ír *(a figyelő a sávot, a szerver a 60 mp-enkénti pulzus-sort)*, és a pulzus
**ráragad** a sosem lezárt sorra. ⇒ **Teljes, `\n`-nel lezárt sorokat** írunk, kötegenként
*(`BAR_WIDTH = 48` keret ≈ 1 mp)*. Az élő jelleg megmarad; a sort a közéékelődő pulzus
**nem tudja elrontani**.

### 9.4 ⏰ Helyi idő minden állapot-kiírásban

**Mérve (owner, 08:55):** a `ma status digest` fejléce `2026-09-08T01:02:38.765Z` volt, amikor
**03:02** volt az owner óráján.

| Parancs | Előtte | Utána |
|---|---|---|
| `ma status digest` | nyers ISO (UTC) | `⏰ 2026-09-08 09:14:29 (Europe/Budapest)` |
| `ma comm doctor` | nyers ISO (UTC) | ugyanaz |
| `ma comm voice-funnel` | ⛔ **semmi** — csak „az elmúlt 12 óra" | ugyanaz |

⭐ **A zóna neve is kiíródik** — enélkül nem lehet megkülönböztetni az UTC-s sortól, és épp ez
volt a mért hiba. ⚠️ A `--json` változat **marad ISO**: a gépi fogyasztók arra számítanak.

### 9.5 Kapcsolódó fájlok

`cli/src/voice/voice-connection-log.ts` · `cli/src/voice/voice-analysis-bar.ts` ·
`cli/src/voice/voice-analysis-observer.ts` · `cli/src/utils/local-time.ts`
