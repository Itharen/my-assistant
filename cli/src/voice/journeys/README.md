# Hang-csatorna journey-katalógus (T-22)

> Kötelező artefakt (`core-e2e-user-journey`): a journey-coverage **ez ellen** mérendő, nem
> spec-darabszámra. A traceability **mindkét irányban** áll: feature → journey és journey → feature.

## Journey-k

| Journey | Belépés → érték → folytatás | Business-assertek | Automata gazda |
|---|---|---|---|
| **Beszéd → köteg** | megszólalás → WAV keletkezik → felismerés → **Discord-köteg** + tükör a **hang-csatornába** → a tölcsér méri | a szonda látja a felvételt; az átirat **ténylegesen a köteg-fájlban** van, `🔊 HANGCSATORNA` jelöléssel; a tükör a **hang-csatorna** azonosítójára ment (⛔ nem a fő chatbe); a szonda **nem** jelent veszteséget; a siker hangja szól; a tölcsér 100%-ot mér **`attempts: 1`-gyel** | `voice.journey-e2e.spec.ts` |
| **Néma eldobás** *(veszteség-variáns)* | 3 mp beszéd → a felvevő eldobja → **látható** összefoglaló → a tölcsér mutatja | az eldobás oka `discarded-by-recorder`; a **másodperc** mérve (3 mp); az összefoglaló a **hang-csatornába** megy és tartalmazza a mp-et; a tölcsér `lostAudioSeconds: 3`, arány **0%** | `voice.journey-e2e.spec.ts` |
| **Idegen + duplikátum** *(megszakítás-variáns)* | idegen beszélő → owner → **ugyanaz** a szegmens újra | idegennél nincs feldolgozás; a duplikátum **nem** kerül a kötegbe és **nem** küld második tükröt; ⭐ mindkettőnél **csend** (se hang, se „nem jutott át"); a tölcsérben `skipped: 2`, az arány **100% marad** | `voice.journey-e2e.spec.ts` |

## A hat kötelező tulajdonság — hol teljesül

| # | Tulajdonság | Hogyan |
|---|---|---|
| 1 | cross-feature | felvevő-szonda → STT → híd → köteg-tár → kiesés-jelentő → tölcsér-jelentés |
| 2 | sorrendhelyes | `serial` lépések, valódi user-sorrendben |
| 3 | **állapot-továbbadás** | a 2. lépés **az 1. lépésben létrehozott** WAV-on dolgozik; a tölcsér **a lépésekben kiírt** napló-sorokat olvassa |
| 4 | lépésenkénti business-assert | nem URL/render: a **köteg tartalma**, a **cél-csatorna**, a **másodperc**, az **arány** |
| 5 | az értéket adó kimenetig | a szöveg a kötegben ⇒ eljut hozzám · a veszteség **látható** az ownernek |
| 6 | cleanup | temp-gyökér `rm -rf` az `afterEach`-ben |

## 🔴 A legfontosabb assert: a napló-szókincs ODA-VISSZA

Az **író** (`classifyRecordingOutcome`, a figyelő) és az **olvasó** (`buildVoiceFunnelReport`)
külön modul. Ha a kód-sztringek elcsúsznának, a tölcsér **nem hibázna — NULLÁT jelentene**, és
úgy nézne ki, mintha nem veszett volna el semmi.

⇒ A szókincs egyetlen forrása: `voice-log-codes.ts`, és a journey a kört **végigviszi**.

⭐ **Pozitív kontrollal igazolva (2026-09-08):** egy szándékosan elírt kód **10 tesztet** buktat.
A védelem tehát valódi, nem látszat.

## Feature → journey traceability

| Feature | Modul | Fedő journey |
|---|---|---|
| bent ülés a hang-csatornában | `voice-channel-presence.ts` | *(élő próbán igazolt; unit-teszt fedi)* |
| felvétel + felismerés | `voice-channel-recorder.ts` | Beszéd → köteg |
| köteg + tükör | `voice-channel-bridge.ts` | Beszéd → köteg · Idegen + duplikátum |
| néma eldobás mérése | `voice-drop-probe.ts` | Néma eldobás |
| kiesés láthatósága | `voice-missed-speech.ts` | Néma eldobás |
| visszajelzés-tábla | `voice-feedback-plan.ts` | mindhárom |
| hangjelzések | `voice-cues.ts` | ⚠️ **nincs journey-ben** — a lejátszás élő hang-kapcsolatot igényel; unit-teszt + futásidejű ffmpeg-igazolás fedi |
| átviteli arány | `voice-funnel-report.ts` | mindhárom |

## ⛔ Amit a journey NEM állít

Nincs benne **valódi Discord-hang** és **valódi STT** — azok élő mérést igényelnek
(`ma comm voice-funnel`). A journey a lánc **összekötöttségét és szerződéseit** igazolja,
⛔ **nem az átviteli arányt**. *(Épp ez a kettő keveredett össze 2026-09-07 21:49-kor, amikor egy
átjutott mondatot „élőben átment"-nek neveztem.)*
