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
🔇 **Kikapcsolás kód nélkül:** `MA_VOICE_CUES=off` · ⏱️ fék: 3 s két jelzés között.
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
