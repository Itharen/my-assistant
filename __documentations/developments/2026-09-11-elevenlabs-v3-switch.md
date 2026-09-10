# 2026-09-11 — 🔊 ElevenLabs **V3** váltás: a felolvasás megszólal

> **Owner, 2026-09-10 23:53:** *„Most már jó lenne, ha meg tudnál megszólalni lassan."*
>
> **Owner-korrekció, 2026-09-10 21:46:** *„nem a V3 Eleven Labs lett leimplementálva, hanem a
> régi Fors, ami sosem működött jól. A régi fosnál volt ez a XI, a Pi, mit tudom én micsoda,
> amit hogyha kell, akkor neked kell hozzáfűzni majd."*

**Feladat-forrás:** `__agent/DEV-HANDOFF.md`, 2026-09-11 00:20-as szakasz.

---

## 🔴 A gyökér — és miért nem látszott

Az átemelt `cli/src/_modules/elevenlabs/_services/el.api-service.ts:91-94` a kulcsot **`xi-api-`**
prefixhez kötötte:

```ts
if (!trimmedKey.startsWith('xi-api-')) {
  throw new Error('Invalid ElevenLabs API key format - must start with "xi-api-"');
}
```

Az owner kulcsa **`sk_`**-val kezdődik *(ez az ElevenLabs jelenlegi formátuma)* ⇒ a `configure()`
**dobott** ⇒ `isInitialized = false` ⇒ a `convertTextToSpeechSimple` **minden** hívásra
`{ success: false, error: 'Service not initialized' }`-t adott ⇒ a rendszer **néma maradt**.

⚠️ **Miért nem bukott ki:** a `speakInVoiceChannel` helyesen **nem dob** *(a felolvasás kísérő
funkció)*, csak `detail`-t ad vissza. A hiba tehát a naplóban ült, nem a felszínen.

## ⭐ A mérések, amik a döntést megalapozták

| mérés | eredmény |
|---|---|
| a kulcs az **SDK-val** | `sk_`, 51 karakter — **elfogadja** ⇒ a kulcs jó volt, az ellenőrzés volt elavult |
| elérhető TTS-modellek *(API-tól kérdezve)* | 7 · köztük **`eleven_v3`** *(„Eleven v3")* és `eleven_v3_conversational` |
| `eleven_v3` az owner hangjával | ✅ 12 582 bájt, **3 543 ms** |
| `eleven_multilingual_v2` ugyanarra | ✅ 15 090 bájt, **1 680 ms** |

⇒ **A modell-azonosítót nem tippeltük**: a `client.models.list()` adta meg.

## A megoldás — ⛔ nem prefix-lazítás

`cli/src/voice/voice-tts.client.ts` *(új)* — `VoiceTts_Client`, a hivatalos
`@elevenlabs/elevenlabs-js@2.66` SDK-val.

- ⚠️ **`transplant-not-rewrite`:** az átemelt fához **nem nyúltunk**. Az új kliens **mellé**
  került, és a `voice-speaker` mostantól ezt hívja — a régi utat **nem**.
- A folyamot **pufferbe** gyűjtjük *(a Discord-lejátszó összefüggő forrást szeret)*.
- A **modell benne van** a visszajelzésben: a naplóból ki kell derülnie, hogy tényleg a V3 szólt.
- A modell **felülírható** *(`MA_ELEVENLABS_MODEL_ID`)*, mert a V3 mérve **kétszer lassabb**.
  ⛔ A választás **owner-döntés**; az alapérték a kért V3.

## 🔒 A kulcs értéke soha nem mehet naplóba

A handoff **(b)** pontja. Három egymást erősítő intézkedés:

1. `VoiceTts_Client.describeKey()` — **csak** hossz + 3 karakteres prefix. Teszt állítja, hogy
   sem a kulcs, sem a jegyei nem szerepelnek a kimenetben.
2. A kivétel-szöveg **300 karakterre vágva**, és a kulcs **soha** nem kerül hozzá.
3. ⭐ **A leglényegesebb:** a kulcsot naplózó átemelt sor
   *(`el-text-to-speech.control-service.ts:46`)* **többé nem fut le** — mérve: a saját kódunk
   nem hívja azt a modult *(csak kommentek hivatkoznak rá)*.

⚠️ **Ami megmaradt:** a **korábbi** napló-fájl *(`logs/live-dev-pipeline/server.log`)*
tartalmazza a kulcsot. ✅ Nincs git-expozíció *(a `logs/` gitignore-olt, a fájl nem trackelt)*.
⛔ A kulcs **rotációja owner-döntés** (`core-secret-rotation-owner-only`) — hozzá nem nyúltunk.

## Végponttól végpontig igazolás

**Amit igazoltunk** *(a Discord-lejátszás nélkül)*:

```
nyers üzenet → prepareSpeechText → V3 szintézis → audio-erőforrás → player.play()
  spoken=true · 3 521 ms · „Felolvasva (83 karakter, modell: eleven_v3)."
  lejátszás indult: IGEN · kulcs a detail-ben: NEM
```

**Élő telepítés:** a V3-kód **01:02:48**-kor került be, a figyelő **01:04:19**-kor lépett be
újra ⇒ a futó figyelő már az új kódot viszi, és bent ül a `honnie-place` csatornában.

### 🙋 Ami owner-kapun áll

A `(c)` pont utolsó lépését **csak az owner tudja lezárni**: *hallja-e* a hangot a csatornában.

⛔ **Ezt a DEV nem provokálhatja ki:** a `ma comm say` **üzenetet küldene az ownernek**
*(dev-tilalom: minden owner-kommunikáció az asszisztensé)*, a kimenő napló kézi írása pedig
**meghamisítaná a válasz-kötelezettség** követését.

⇒ A próba menete: az owner belép a hang-csatornába, az **asszisztens** küld egy üzenetet, és a
figyelő felolvassa. A napló `MA-VOICE-READ-ALOUD` sora megmondja, **melyik modell** szólt.

## Érintett fájlok

| fájl | mi történt |
|---|---|
| `cli/src/voice/voice-tts.client.ts` | **új** — a V3 kliens |
| `cli/src/voice/voice-tts.client.spec.ts` | **új** — 11 teszt, köztük a kulcs-szivárgás tilalma |
| `cli/src/voice/voice-speaker.ts` | átkötve a V3 kliensre |
| `cli/src/voice/voice-speaker.spec.ts` | átírva az új szerződésre |

**Teszt:** CLI **892/892** zöld · `tsc` tiszta.

⚠️ **Történet-megjegyzés:** a kódot az asszisztens session `be95eb6` *(„fix(CV): AI GENERATIONS
KI…")* commitja sodorta be, mert megosztott worktree-ben `-A`-szerűen stage-elt. A **tartalom
helyes**, csak a commit-üzenet félrevezető — ez a dokumentum a kanonikus magyarázat.
