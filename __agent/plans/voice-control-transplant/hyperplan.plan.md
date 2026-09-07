# HYPERPLAN — a voice control ÁTEMELÉSE a régi CCAP-ból (T-22)

> **Owner, 2026-09-07 12:37 (hangüzenetben) — SZÓ SZERINT:**
>
> *„Azt a feladatot is felvehetnénk, ami arról szól, hogy a régi CCAP-ból átemeljük a teljes
> voice communication megoldást. Ezt nagyon szeretném még előbb látni. Nagyon-nagyon fontos,
> hogy semmit nem szabad változtatni a kódban jelenleg, mert nagyon törékeny az a kód, de
> cserében meg egész jól működött."*

**Szabály, ami az egészet vezeti:** `current/principles/transplant-not-rewrite.md`

---

## 📊 STATUS — 2026-09-07 18:05

| | |
|---|---|
| **Fázis** | 🟢 **6. szakasz MEGÉPÍTVE** — a felvétel bekötve; ⏳ **élő próbára vár** (kell hozzá, hogy az owner beszéljen) |
| **Haladás** | **6/6 szakasz megépítve** — a bent-ülés ÉLŐBEN igazolt, a felvétel még nem |
| **Teszt** | CLI **523/523** zöld *(+9 híd, +10 jelenlét, +10 felvétel)*; a fő build **érintetlen** |
| **Következő lépés** | ⏳ **ÉLŐ PRÓBA** — az owner beszél a `honnie-place`-ben, és megnézzük, bekerül-e a kötegbe |

### 🎙️ A 6. SZAKASZ — a lánc, és ami benne DÖNTÉS

```
hang-kapcsolat → ÁTEMELT CCAP-felvevő → kész WAV → a MI STT-nk → VoiceChannelBridge → köteg
```

⭐ **A nehezét az átemelt kód végzi, VÁLTOZATLANUL:** szegmentálás *(mikor ér véget egy
megszólalás)*, hangerő- és ZCR-alapú beszéd-észlelés, duplikált-kiküldés elleni védelem.
Ez az, ami *„egész jól működött"* — ezért nem írjuk újra.

⭐ **A FELISMERÉST viszont NEM az átemelt lánc végzi**, hanem a már **élőben bizonyított**
`transcribeAudio` (FDP AI). ⛔ Ez nem a törékeny kód átírása: a szerzője **hagyott egy hookot**
(`onWavFileReadyForProcessing`), és mi arra ülünk rá. ⇒ **Nincs szükség fizetős kulcsra.**

| Döntés | Miért |
|---|---|
| 🔴 **CSAK az owner hangja** megy tovább | a csatornába más is beléphet, és az ő beszéde nem lehet utasítás — a hangból nem látszik, ki mondta |
| ⚠️ **gyanús átiratra NEM cselekszünk** | ugyanaz, mint a hangüzeneteknél: a félrehallott mondat a kötegben már az owner szó szerinti utasításának látszana |
| ⭐ a **fájlnév az azonosító** | megszólalásonként egyedi ⇒ a híd duplikáció-védelme ingyen működik |
| 🔴 **lusta betöltés** | a hang-lánc hidegindítása **19,5 s** — ez nem mehet a figyelő indulási útvonalára, különben a csatorna ennyivel tovább néma |
| ⚠️ a betöltés **változóban álló** hivatkozással | sztring-literállal a TS **belehúzná** az átemelt fát a `strict` fő buildbe — pontosan azt szüntetve meg, amiért ki van zárva *(mérve: 4 hiba)* |

⏳ **AMI MÉG NINCS IGAZOLVA:** valódi beszéd még nem ment át a láncon. A `handlePcmReceiver`
csak akkor indul, ha valaki **tényleg megszólal** — ezt magamtól nem tudom előidézni.
| **Blokkoló** | nincs — ⭐ **mérve: a 6. szakasz NINCS owner-kapun** (a lánc kulcs nélkül példányosítható) |

### 🔴 2026-09-07 17:38 — AZ ÁTEMELT KÓDBÓL SOHA NEM KÉSZÜLT JS (javítva)

A 4. szakasz „70 fájl bent van"-t állított. **Bent volt — de nem fordult le.**
`noEmit: true` + kizárás a fő buildből ⇒ típus-ellenőrzésen átment, `dist/cli/src/_modules/`
viszont **nem létezett**. ⚠️ A zöld típus-ellenőrzés **elfedte** a hiányt.

🩹 `noEmit: false` · `outDir: "dist/cli"` *(⭐ nem `dist`: az emit máshova esne, és a saját kódunk
nem találná meg a `../_modules/…` hivatkozásokat — mérve az első próbán)* · a fő builddel azonos
`rootDirs` · új build-lépések az LDP-ben (`tsc-transplanted`, `fix-transplanted`).

**Két környezet-különbség, a KIMENETEN feloldva** (`cli/scripts/transplanted-build-fix.ts` —
a forráshoz nem nyúltunk): (1) minimális `package.json` a dist-be *(a `version`-import miatt)*;
(2) JSON-import attribútum + default-import *(a Node 22 ESM-ben a JSON-modulnak csak `default`
exportja van)*. 📌 A kettő **egymást fedte** — külön-külön javítva ugyanaz a hiba maradt volna.

### ⚠️ Mérési hiba, amit magamon kaptam

`timeout 22`-vel bisectelve azt állapítottam meg, hogy a beszéd-kimenet **beragad** import
közben, és majdnem beírtam ide, hogy a 6. szakasz az **owner ElevenLabs-kulcsára vár**.
**Hamis volt** — közben az LDP teljes buildet futtatott. Nyugodt gépen: 2,8 / 7,8 / 9,6 / 19,5 s,
és `{"instantiated":true,"hasHandlePcmReceiver":true,"hasInitDir":true}` **kulcs nélkül**.

📌 A „mértem" önmagában nem elég — **milyen körülmények között** mértem, az is a mérés része.

### ✅ ÉLŐ IGAZOLÁS — 2026-09-07 17:11

```
joined: true · guild: "FDP-Johnnies" · channel: "honnie-place" · stillConnectedAfter8s: true
```

⭐ **A feltételezett blokkoló NEM LÉTEZETT.** A terv korábban azt állította, hogy *„ehhez a bot
hang-jogosultsága kell"* — **mérve 2026-09-07 17:10**: a botnak **megvan** a `ViewChannel` +
`Connect` + `Speak` joga a csatornán. ⇒ Nem kellett owner-kapu. *(Tanulság: a „valószínűleg
jogosultság kell" feltételezés egy egyszerű, olvasás-only próbával eldönthető volt.)*

**Mért azonosítók:** szerver `1467012131378434151` = **FDP-Johnnies** · csatorna
`1489036734632034496` = **`honnie-place`** (voice, type 2). A `.env`-be *(gitignorált)*
`MA_DISCORD_GUILD_ID` + `MA_DISCORD_VOICE_CHANNEL_ID` néven kerültek.

### 🔴 A DÖNTÉS, AMI A TÖRÉKENY KÓDOT VÉDI

Az átemelt `CV_Connection_ControlService` **név szerint** keresi a csatornát
(`Operations.findChannelByName`), a **cache-ből**, `isTextBased()` szűrővel — az owner viszont
**azonosítót** adott, ami stabil *(a név bármikor átírható)*.

⛔ Az átemelt kódhoz **nem nyúltunk** (`transplant-not-rewrite`). Helyette mellé került egy
**vékony, azonosító-alapú belépő** (`cli/src/voice/voice-channel-presence.ts`). A felvételi lánc
a 6. szakaszban **változatlanul az eredeti kódon** fog futni — a `@discordjs/voice`
`joinVoiceChannel`-je guildenként **ugyanazt a kapcsolatot** adja vissza, tehát nem lesz belőle
két párhuzamos belépés.

### Hol él a jelenlét

A **Discord-figyelőben** (`discord.listener.ts`), ugyanazon a kliensen, ami a szöveges üzeneteket
viszi ⇒ **egy** kapcsolat, **egy** életciklus. Külön indítandó folyamat előbb-utóbb nem indulna
el, és a nem-indulás **csendes** lenne (`ldp-default-runtime.md`).

⚠️ A belépés **szándékosan nem fatális és nem várt** (`void`): a szöveges csatorna az elsődleges
út, és egy hang-hiba **nem némíthatja el**. A hiányzó konfiguráció **naplózódik**
(`MA-VOICE-NOT-CONFIGURED`), a bukás is (`MA-VOICE-JOIN-FAILED`) — nincs néma kimaradás.

⚠️ **Leválás-kezelés:** a `Disconnected` állapot **nem azonnal végleges** — 5 mp türelmet adunk a
Discord magától-újracsatlakozásának, és csak utána bontunk. Aki azonnal bont, az egy magától
gyógyuló zökkenőt tesz végleges kieséssé.

### Az 5. szakasz — a KÖTEG-BEKÖTÉS kész (`voice-channel-bridge.ts`)

⭐ **A kulcs-döntés érvényre jutott:** a hang-csatorna **nem külön út**. Ami ott elhangzik,
ugyanabba a Discord-kötegbe kerül, mint a hangüzenetek — és ezzel **ingyen örökli**, amit
azon az úton már megépítettünk **és mértünk**: duplikáció-védelem · válasz-kötelezettség ·
visszanézhetőség · kézbesítési szerződés.

**Kétirányú tükör-szöveg** *(owner 14:13)*: amit ő mond → *„hallottam"*, amit én mondok →
*„mondtam"*. 🔴 A saját oldalam külön indok: ha a beszédszintézis **mást** mond, mint amit
szántam, azt **csak a leírt változat** buktatja le.

**A döntések, amiket a tesztek is rögzítenek:**

| Döntés | Miért |
|---|---|
| ⛔ duplikátumnál **nem** tükröz | az owner másodszor látná, és azt hinné, kétszer mondta |
| 🔴 a **saját** beszédem nem kerül a kötegbe | az a **bejövő** üzenetek tára — különben owner-üzenetként jönne vissza |
| sorrend: **köteg, aztán tükör** | fordítva egy köteg-hiba után a tükör már kiment volna |
| tükör-bukásnál a köteg **akkor is** megvan | a tartalom eljut hozzám; a tükör hiánya külön látszik |
| külön jelölés (`🔊 HANGCSATORNA`) | más bizonytalanság: befejezett felvétel vs. **élő** beszéd |
| azonosító hiányában **tartalom-lenyomat** | így újraindítás után sem kerül be másodszor |

### A 4. szakasz igazolása

**Áthozva:** `voice-output` (19 fájl) · `elevenlabs` (14) · a `voice/` maradék service-ei ·
`agent-3` porcupine (2) · a szükséges CCAP-konstansok. **Összesen 70 fájl.**

**Telepítve:** `@futdevpro/fdp-templates` · `openai` · `@elevenlabs/elevenlabs-js`
*(az utóbbi kettő a fizetős ágak fordításához kell — ⛔ nem lesznek alapértelmezés)*.

**Két típus-váz, kód-változtatás HELYETT:**
- `new-version-context.data-model.ts` — ⭐ mérve: az egyetlen hivatkozás **kikommentelt kódban**
  van, tehát halott import. Az eredeti egy **egész CCAP-alrendszert** húzna magával.
- `porcupine-sdk.d.ts` — a Picovoice **fizetős** SDK típusai. ⭐ A régi kód **maga számít a
  hiányára**: dinamikus import `try/catch`-ben, a szerző megjegyzésével
  *(„This is expected if Agent-3 is not initialized")*.

#### ✅ MEGOLDVA: `Buffer` → `BodyInit` — a TypeScript VERZIÓJA az ok

**A gyökérok MÉRVE (2026-09-07):**

| | régi CCAP bot | my-assistant CLI |
|---|---|---|
| **TypeScript** | **5.5.4** | **5.9.3** |

⭐ A **TS 5.7**-ben lett generikus az `ArrayBufferView`, és attól kezdve a
`Buffer<ArrayBufferLike>` *(a bare `Buffer` alapértelmezése)* **nem elégíti ki** a DOM
`BodyInit` → `BufferSource` → `ArrayBufferView` láncát — mert az `ArrayBufferLike` a
`SharedArrayBuffer`-t is jelentheti.

⇒ 🔴 **A kód nem hibás. A szerszám mozdult el alóla.** Ugyanaz a sor TS 5.5-ön hibátlan.

**Hogyan jutottam ide — és mi vezetett félre:**

| Próba | Eredmény |
|---|---|
| `@types/node` 20 → 22 → 24 *(a régi bot verziója)* | ⛔ nem oldotta meg |
| `lib`-be a `dom` *(a régi bot beállítása)* | ⛔ nem oldotta meg |
| ⭐ **minimális próba-fájl** | ✅ **ez vitt előre** |

A próba buktatta le a saját, **túl durva** diagnózisomat: `Buffer.from([1])` **átmegy**
*(mert `Buffer<ArrayBuffer>`-t következtet)*, a **bare `Buffer`** viszont **nem** — és az
átemelt kódban a paraméter épp bare `Buffer`. Ez szűkítette a keresést a generikus
alapértelmezésre, onnan pedig a TS-verzióra.

#### ⭐ ÉS EZ NEM BLOKKOL SEMMIT — mérve, nem feltételezve

- **A `tsc` HIBA MELLETT IS EMITTÁL:** a `noEmitOnError` nincs beállítva *(alapértelmezés
  `false`)* ⇒ a fordítás **létrejön**, csak a típusellenőrzés panaszkodik.
- **Futásidőben a minta HELYES** — külön próbán igazolva: `Buffer`-t adva a `fetch`
  törzsének a szerver **10/10 bájtot** kapott meg.

⇒ ⛔ **Nem nyúlok a kódhoz**, és nem erőltetek típus-kényszerítést. Ez **típusellenőrzési**
eltérés, nem hiba — és a `tsconfig.transplanted.json` pontosan azért létezik, hogy az
átemelt kód a **saját szerződése** szerint éljen.

⚠️ **Ha valaha zavaró lesz:** a tiszta megoldás nem a kód átírása, hanem hogy az átemelt
projekt a **saját TypeScript-verzióján** forduljon. Addig a 2 hiba **ismert és megmagyarázott**.

### A 3. szakasz igazolása — az illesztő MŰKÖDIK

| | |
|---|---|
| Új fájl | `cli/src/_services/ccap.master-service.ts` + `_services/new-ass/ccap.service-base.ts` |
| ⭐ **Az útvonal-terv bevált** | az átemelt `cv.service-base.ts`-ben **EGYETLEN** változás: a `.js` kiterjesztés |
| Próba | átemeltem a **valódi fogyasztót** (`cv-result-review`) — a típushibák **eltűntek** |
| Maradék | **6 hiba, mind `TS2307`** *(hiányzó modul)* ⇒ tisztán a **4. szakasz** munkája |

⭐ **MÉRT EGYSZERŰSÍTÉS:** a voice **12** szolgáltatása közvetlenül a `DyNTS_SingletonService`-ből
származik, és **EGYETLENEGY** épül a CCAP-ősre — épp a `cv-result-review`, amelynek a feladatát
nálunk **én** látom el. Ezért a 95 soros ős helyett elég volt egy **szűk** illesztő.

⛔ **Az illesztő SEHOL nem hallgat:** ami még nincs bekötve *(`io_CS`, `defaultMessagingProvider`)*,
az **leíró hibát dob**, nem `null`-t ad. Egy néma üres visszatérés itt elnyelné a felismert
szöveget — pontosan azt, amiért az egész hang-út létezik.

### Az 1. szakasz igazolása — mért, nem állított

| | |
|---|---|
| Áthozott fájl | **23** *(`_models` 14 · `_enums` 3 · `_collections` 6)* |
| **Tartalmi változás** | ⭐ **6 import-sor**, kizárólag `.js` kiterjesztés |
| Változatlan | **a maradék 17 fájl teljesen**, és a 4 érintettben **minden más sor** |
| Szigor-hibák | 33 → **0**, a modul saját, lazább `tsconfig.json`-jával — ⛔ **kód-változtatás nélkül** |
| Maradék hiba | 4 db `Cannot find module '@futdevpro/fsm-dynamo'` → **2. szakasz** |

### A 2. szakasz igazolása — a legnagyobb kockázat MÉRVE elhárult

⚠️ **Amitől tartani lehetett:** a régi bot **négy** opus-implementációt vitt, mind **natív**
modul — Windowson ez a leggyakoribb bukási pont *(node-gyp, MSVC build-lánc)*.

⭐ **Amit a mérés mutatott:** a kód **egyetlen opus-csomagot sem importál közvetlenül** — azok
a `@discordjs/voice` futásidejű választásai. ⇒ Elég **EGY, TISZTA JS** implementáció.

**Telepítve:** `@discordjs/voice` 0.19.2 · `prism-media` 1.3.5 · `wav` 1.0.2 ·
`formdata-node` 6.0.3 · `opusscript` 0.1.1 · `@noble/ciphers` 2.4.0

**Élő próba — nem puszta betöltés-ellenőrzés, hanem VALÓDI hang-kör:**

```
opus:  3840 B PCM  ->  486 B opus  ->  3840 B PCM     OK (oda-vissza)
@noble/ciphers (xchacha20poly1305)                    OK
@discordjs/voice  (joinVoiceChannel)                  OK
prism opus.Decoder  /  wav.Writer                     OK
```

🔴 **NINCS natív fordítás.** Ez nem kényelmi kérdés: egy natív lánc a telepítést **és** a
jövőbeli Node-frissítéseket is törékennyé tenné — pont azon a gépen, ahol az egész fut.

---

## 1. A FELMÉRÉS — mért tények, nem becslés

### Mekkora a szállítmány

| Modul | Fájl | Sor | Miért kell |
|---|---|---|---|
| `voice/` | 37 | 6 681 | a magja: felvétel, beszéd-szegmentálás, felismerés |
| `voice-output/` | 19 | 2 633 | 9 hivatkozás a `voice/`-ból — **nem hagyható el** |
| `elevenlabs/` | 14 | 1 937 | 6 hivatkozás a `voice/`-ból |
| **Összesen** | **70** | **11 251** | |

⚠️ Az owner *„teljes voice communication megoldást"* mondott — a felmérés igazolta, hogy ez
**három modul**, nem egy. A `voice/` önmagában nem fordul le.

### Külső csatolási pontok (ezek az illesztés felülete)

| Mire hivatkozik | Db | Mit kell tenni vele |
|---|---|---|
| `@futdevpro/fsm-dynamo` / `nts-dynamo` | 29 | ✅ **megvan** a my-assistantban |
| `discord.js` | 5 | ✅ megvan (`^14.27.0`) |
| `@discordjs/voice`, `prism-media`, `wav`, `formdata-node`, opus-kódoló | — | ✅ **TELEPÍTVE és élő próbán igazolva** *(2. szakasz)* |
| `_collections/consts/settings.const` | 9 | illesztés: my-assistant konfiguráció |
| `_collections/consts/env-keys.const` | 4 | illesztés: `.env` kulcsnevek |
| `_services/ccap.master-service` + `ccap.control-service` + `ccap.service-base` | 6 | ⭐ **mérve: csak 5 tulajdonság** kell belőlük — l. a 3. szakaszt |

### ⭐ A legjobb hír: a felismerés INGYEN mehet

A `cv-local-speech-recognition.api-service.ts` a **`/api/recognition`** végpontot hívja
`confidence_threshold` + `skip_classification` paraméterekkel — ez **pontosan az FDP AI**,
amit már használok az `stt.client.ts`-ben.

⇒ Az alapértelmezett felismerő lehet a **helyi** ág; ElevenLabs- és Whisper-kulcs **nem
szükséges** a működéshez. *(Illeszkedik: `current/principles/no-paid-solutions.md`.)*
A fizetős ágak **kódja átjön** *(nem írjuk át!)*, csak nem ez lesz az alapértelmezés.

### ⚠️ CommonJS → ESM: a modul-rendszer NEM egyezik

| | régi CCAP bot | my-assistant *(CLI és szerver egyaránt)* |
|---|---|---|
| `package.json` `type` | *(commonjs, alapértelmezés)* | **`module`** |
| `tsconfig` `module` | `commonjs` | `ESNext` / `ES2022` |

⇒ A **színtiszta másolás nem elég**: ESM alatt a relatív importoknak **kiterjesztés kell**.

**A tényleges kockázat MÉRVE (2026-09-07) — és jóval kisebb, mint amitől tartani lehetett:**

| Amit kerestem | Db | Jelentése |
|---|---|---|
| `module.exports` | **0** | ⭐ nincs CJS-export |
| `__dirname` / `__filename` | **0** | ⭐ nincs útvonal-függő CJS-idióma |
| `export =` / `import =` | **0** | ⭐ nincs TS-CJS interop |
| `require(` | **5** | mind **Node beépített** (`fs`, `path`, `child_process`) |
| relatív import | **181** | ide `.js` kiterjesztés kell |

⇒ A migráció **GÉPIES, nem szemantikus**: 181 kiterjesztés-hozzáfűzés + 5 `require` →
felső szintű import. ⭐ Az utóbbit a projekt szabálya **amúgy is előírja**
*(„Never use `import()` or `require()` in code")*.

🔴 **EZ A KÉT VÁLTOZTATÁS AZ EGYETLEN, AMIT SZABAD.** Mindkettő „fordítási/futási okból
elkerülhetetlen" — pontosan az a kategória, amit az átemelési szabály megenged. Minden más
sor **bájtra változatlan** marad.

### 🔴 DÖNTÉS: a szigorúsági különbséget KONFIGURÁCIÓVAL oldjuk fel, nem kód-átírással

**Mérve 2026-09-07:**

| | régi CCAP bot | my-assistant CLI |
|---|---|---|
| `strict` | ⛔ **nincs** | ✅ `true` |
| `noUncheckedIndexedAccess` | ⛔ nincs | ✅ `true` |

⇒ Már a **levél-fájlokon** *(23 fájl, csak típusok és állandók)* **33 típushiba** keletkezett —
mind `Object is possibly 'undefined'` jellegű. A teljes 11 251 soron ennek a sokszorosa lenne.

**A két lehetőség, és miért egyértelmű a választás:**

| | **A) A kódot igazítom a szigorhoz** | **B) A modul saját, lazább beállítást kap** |
|---|---|---|
| Mit érint | 🔴 **magát az átemelt kódot** | csak a **build-konfigurációt** |
| Owner-korlát | ⛔ *„semmit nem szabad változtatni a kódban"* — **sérti** | ✅ tiszteletben tartja |
| Kockázat | 🔴 minden `!` és őr egy **igazolhatatlan** viselkedés-változás — nincs mihez hasonlítani | a kód **bájtra változatlan** |

✅ **B) — a `cli/src/_modules/` külön TypeScript-projekt**, a régi bot beállításaival.

⭐ **Ez nem trükk, hanem a helyzet pontos leképezése:** a kód egy **lazább szerződés alatt**
íródott és működött. Beleerőltetni egy szigorúbba nem „javítás" — az **átírás**, mérhető
referencia nélkül. A szigor a **saját** kódunkra érvényes marad; az átemelt modul addig él
lazábban, amíg nincs élő, mérhető viselkedése, amihez képest bármit igazolni lehetne.

⚠️ **Ez adósság, és annak is jelöljük.** Amint az 5. szakasz élő próbája megvan, a szigorítás
**külön kör** lehet — mert onnantól **van** mihez mérni.

### 🔴 A referencia NEM MÉRHETŐ — és ez megváltoztatja a módszert

**Mérve 2026-09-07:** a régi bot **nem fut**, és a `voice/` modul **2026-01-31 óta
változatlan**. Az owner *„egész jól működött"* megállapítása tehát egy **múltbeli** állapotra
vonatkozik, amit **nem tudok élőben megfigyelni**.

⇒ Nincs mihez hasonlítani. Ezért:
- ⛔ **még annyit sem változtatok**, amennyit „nyilvánvaló javításként" egyébként megtennék;
- ⭐ **minden illesztést tételesen felírok** — ha valami elromlik, a listán kell lennie;
- ⚠️ az első cél nem a szépség, hanem hogy **elinduljon és hallgasson** — onnantól már
  mérhető, és minden további lépés ahhoz képest igazolható.

---

## 2. A SZAKASZOK

### 1. szakasz — függőségek + levél-fájlok *(nincs kockázat)*

A `_models/`, `_enums/`, `_collections/consts/` fájlok: **tiszta típusok és állandók**,
külső csatolás nélkül. Ezek 1:1-ben átjönnek.
**Kész, ha:** a CLI lefordul az áthozott típusokkal, `npm test` zöld.

### 2. szakasz — a hang-függőségek telepítése és igazolása

`@discordjs/voice`, `prism-media`, `wav`, `formdata-node`, opus-kódoló.
⚠️ Az opus-kódolók **natív** modulok — Windowson ez a leggyakoribb buktató.
**Kész, ha:** egy minimális próba **igazoltan** felvesz és kiír egy hangfájlt.

### 3. szakasz — a CCAP-csatolás LESZAKÍTÁSA

⛔ **Nem a modult írjuk át**, hanem **illesztő réteget** adunk alá: ugyanaz a felület,
my-assistant-implementációval.

#### ⭐ MÉRVE (2026-09-07): a felület jóval KESKENYEBB, mint a „6 hivatkozás" sugallta

A 6 import mögött **mindössze 5 tulajdonság** tényleges használata áll:

| Amit a `CCAP_MasterService`-ből hívnak | Db | Mi ez |
|---|---|---|
| `llmChat_CS` | 3 | LLM-beszélgetés — 🔴 **ennek NINCS my-assistant megfelelője** |
| `voiceChannel` | 2 | a hang-csatorna kezelője |
| `io_CS` | 1 | be-/kimenet |
| `discordServer` | 1 | a szerver-objektum |
| `defaultMessagingProvider` | 1 | az üzenet-küldő |

**Plusz az ősosztály:** `CV_ServiceBase extends CCAP_ServiceBase` *(95 sor)* — és a `CV_ServiceBase`
**teljes törzse ki van kommentelve**, vagyis ma puszta átnevezés. A leszármazottak egyetlen
öröklött dolgot használnak: `gatherMessagesInChannel`.

⇒ **Ez nem „a legnehezebb rész", hanem egy 5 tagú illesztő** + egy 95 soros ősosztály átemelése.
*(A korábbi becslés a hivatkozások SZÁMÁN alapult — a mérés a tényleges HASZNÁLATOT nézte.)*

#### ✅ MEGOLDVA: mire használja az `llmChat_CS`-t — MÉRVE (2026-09-07)

A `cv-result-review.control-service.ts` **két párhuzamos LLM-kérdést** tesz fel a felismerés
UTÁN:

1. **beleillik-e a beszélgetésbe?** → `OK` / `NOISE` / `OUTOFCONTEXT` / `MISPELLED`
2. **javítsd a helyesírást és a félrehallást** → a javított szöveg

⭐ **EZT A MY-ASSISTANTBAN MÁR MEGCSINÁLJUK — csak máshogy, és jobb helyen:**

| a régi bot | a my-assistant |
|---|---|
| egy LLM dönti el, hogy értelmes-e | ⭐ **ÉN** döntöm el, teljes kontextussal |
| egy LLM javítja a félrehallást | `stt.flags.ts` **megjelöli**, ⛔ nem írja át *(a döntés az owneré)* |
| hallucináció-szűrés az LLM-re bízva | `stt.transcript-guard.ts` — mért mintákra |

🔴 **Ezért az adapter itt SZÁNDÉKOSAN átereszt:** `OK` + a **változatlan** átirat. Az ítéletet
nem egy köztes LLM hozza, hanem az kerül a **Discord-kötegbe**, ahonnan hozzám jut — ahol
megvan az egész beszélgetés, a feladatok és a szabályok. Egy köztes modell ennél
**kevesebbet** tud, tehát rosszabbul dönt.

⚠️ **De NEM néma csonk:** az adapter **naplózza**, valahányszor meghívják. Egy csendes
„mindig OK" pont az a hibafajta, amit a projekt tilt — így viszont **látszik**, ha az ág
mégis számítana.

⭐ **A kód így BÁJTRA VÁLTOZATLAN marad:** ugyanazt a felületet hívja, csak alatta más van.

#### ✅ AZ ILLESZTŐ TELJES SPECIFIKÁCIÓJA — mérve, nincs több ismeretlen

**Az öt tulajdonság my-assistant-megfelelője:**

| CCAP-tulajdonság | Típus | Mi lesz belőle nálunk |
|---|---|---|
| `discordServer` | `Guild` | a figyelő Discord-kliensétől |
| `voiceChannel` | `Channel` | a `V-1` szerint: `1489036734632034496` |
| `defaultMessagingProvider` | `DyNTS_Bot_MessagingProvider_ServiceBase` | a meglévő küldőnk |
| `llmChat_CS` | `DyNTS_AI_LLMChat_ServiceBase` | ⭐ **átereszt** — a felülvizsgálat hozzám tartozik |
| `io_CS` | `CCAP_BotIO_ControlService` | ⭐ **a Discord-köteg** — l. lentebb |

#### ⭐ A LEGSZEBB LEKÉPEZÉS: `io_CS` → a meglévő köteg

Az `io_CS`-ből a voice **egyetlen** dolgot hív:
`handleMessageWithOptionalPreFlag({ …, addPreFlag: '[VOICE|CCAP] 🔊' })`.

Ez az a pont, ahol a felismert szöveg **átadódik az asszisztensnek** — egy előtaggal megjelölve,
hogy hangból jött.

🔴 **Nálunk pontosan ez már létezik:** a `DiscordBatchStore` + a `🎙️ HANGÜZENET` jelölés.
⇒ Az adapter a hang-csatornából jövő átiratot **ugyanabba a kötegbe** teszi, amiben a
Discord-hangüzenetek is érkeznek. Így a hang-csatorna **nem külön csatorna**, hanem
ugyanaz az út — ugyanazzal a duplikáció-védelemmel, ugyanazzal a válasz-kötelezettséggel,
és ugyanazzal a visszanézhetőséggel (`ma comm history`).

#### ⛔ HATÓKÖRÖN KÍVÜL: a folyamatos feldolgozás időzítése — owner, 2026-09-07 14:13

> *„Ezzel a continuous voice feldolgozás időzítéssel most ne foglalkozz. Azt majd én fogom
> egyelőre a mikrofonomat ki be kapcsolni."*

⇒ A korábbi aggályom *(beszéd-tempó ↔ köteg-ütem)* **tárgytalan**: a **mikrofon** lesz a kapcsoló,
nem egy algoritmus. ⭐ Ez a legegyszerűbb megoldás, és **azonnal működik** — a hangvezérelt
szegmentálás finomhangolása ráér, ha egyáltalán kell valaha.

#### 🔴 ÚJ KÖVETELMÉNY: TÜKÖR-SZÖVEG a hang-csatornába, MINDKETTŐNKRŐL

> **Owner, 2026-09-07 14:13:** *„Viszont oda is kell majd mirror text formában mindkettőnknek"*

⇒ Ami a hang-csatornában **elhangzik**, az **szövegként is megjelenik** ott — **az ő beszéde
ÉS az enyém** egyaránt.

| Irány | Mi hangzik el | Mi jelenik meg szövegben |
|---|---|---|
| ő → én | a beszéde | a **felismert átirat** |
| én → ő | a `voice-output` TTS-e | ⭐ az, **amit kimondtam** |

⭐ **MIÉRT EZ A HELYES:** a hang **elszáll**, a szöveg **marad**. Egy félrehallott mondatot csak
akkor lehet elkapni, ha **látható** — és a hang-csatornában ez ma sehol nem látszana. Ugyanaz az
elv, mint a Discord-hangüzenetek tükrénél: *„inkább ne értsük, mint félreértsük"*.

⚠️ **A saját oldalam KÜLÖN indok:** ha a TTS mást mond, mint amit szántam *(rossz kiejtés,
csonka szöveg)*, azt **csak a leírt változat** buktatja le. Ez az én oldalamon ma **nincs meg**
sehol — a `voice-output` eddig csak hangot adott.

**Kész, ha:** a `voice/` fordul, és a CCAP-ra semmi nem hivatkozik.

### 4. szakasz — az api-service-ek + a control-service-ek

A tényleges 11 ezer sor. **Változatlanul**, csak import-utak.
**Kész, ha:** fordul, és a szolgáltatás elindul hiba nélkül.

### 5. szakasz — bekötés + ÉLŐ próba

Belépés a hang-csatornába *(V-1: `1489036734632034496`)*, felismerés a **helyi** ágon, az
átirat a meglévő Discord-kötegbe — **és a TÜKÖR-SZÖVEG mindkét irányban** *(owner 14:13)*.

⛔ **A folyamatos feldolgozás időzítése NEM része** — az owner a mikrofonjával kapcsol.
**Kész, ha:** az owner beszél a hang-csatornába, és az átirat eljut hozzám.

---

## 3. ✅ MEGVÁLASZOLVA — owner, 2026-09-07 13:43

> *„A voice-hoz: server: 1467012131378434151 channel: 1489036734632034496 mindig ülj bent
> amikor megy a my assistant. Jó lenne a beszédes rész is beemelni de másik voice id val kell
> majd menj és ha hazaértem tudok elevenlabs kulcsot adni."*

| # | Kérdés | Válasz |
|---|---|---|
| V-1 | melyik hang-csatorna | **szerver** `1467012131378434151` · **csatorna** `1489036734632034496` |
| V-2 | mindig bent üljön? | ✅ **igen**, amíg a my-assistant fut |
| V-3 | kell-e a `voice-output` | ✅ **IGEN** ⇒ 🔴 **a szállítmány NEM szűkíthető: a teljes 11 251 sor** |

**Ami ebből ÚJ követelmény:**
- 🔑 **Külön voice id** a kimenő beszédhez — *„másik voice id val kell majd menj"*
- 🙋 **ElevenLabs-kulcs**: az owner adja, ha hazaért. ⛔ Én **nem javasoltam** fizetőst
  *(`no-paid-solutions`)* — ez **owner-döntés**, és csak a **kimenő beszédet** érinti.
  A **felismerés** marad a helyi FDP AI-n, kulcs nélkül.
- ⚠️ **A „mindig bent ülök" mérendő terhelés:** folyamatos hang-csatorna-kapcsolat CPU-t és
  sávszélességet eszik, a RAM pedig már ma is szűkös *(mérve: 93%-nál az FDP AI várakozik)*.
  Az 5. szakasz élő próbájánál ezt **meg kell mérni**, nem feltételezni.

---

## 4. Kapcsolódó

- `current/principles/transplant-not-rewrite.md` — ⛔ a régi kódhoz nem nyúlunk
- `current/principles/no-paid-solutions.md` — ezért a **helyi** felismerő az alapértelmezés
- `__documentations/dev/FDP_AI_STT.md` — a felismerő mért szerződése
- `__agent/TASKS.md` **T-22**
