# ⏳ A KÖTEG-KAPU ZAJ-IMMUNITÁSA — „miért nem mennek át az üzeneteim?"

**Mérve és megépítve:** 2026-09-12 · **Tétel:** 19. *(MAGAS)* · **Állapot:** ✅ kész
*(élesben a következő listener-indulástól)*

> **Owner, 2026-09-12 03:17:** *„Most miért nem kerülnek elküldésre az üzeneteim?"*
> **Owner, 04:22 — MÁSODSZOR:** *„Most miért nem kerülnek elküldésre az üzeneteim, még **türelmi
> időben** vagyunk?"*

---

## 🔬 A MÉRÉS — a napi akció-naplóból, ⛔ nem hipotézisből

Forrás: `__agent/log/actions/2026-09-12.jsonl`, a teljes éjszaka *(01:22–04:52)*.

| Mit mértem | Érték |
|---|---|
| `speaking start` jel *(ez hívja a `noteStarted`-et)* | **757** |
| ebből **lezárás-jelet kapott** *(felvétel-kimenetel)* | **295** |
| 🔴 **LEZÁRATLAN** *(mindegyik 180 mp-ig tartja a kaput)* | **462** |
| a köteg-kapu **zárva** volt | **90,0 perc** — a 3,5 órás ablak **43%**-a |
| ebből **valódi felvétel feldolgozása** alatt | **9,4 perc** |
| 🔴 ⇒ a zárás **90%-a** puszta **észlelésből** jött, ⛔ nem feldolgozásból | **80,6 perc** |

### ⭐ ÉS PONTOSAN ODA ESIK, AHOL KÉRDEZTE

```
03:17 (első kérdés)   →  a kapu 03:11:54 óta ZÁRVA, folyamatosan   9,0 perc
04:22 (második)       →  a kapu 04:21:01 óta ZÁRVA, folyamatosan   4,8 perc
a leghosszabb zárás   →  01:22:37 – 02:01:11                      38,6 perc
```

🔴 **A SZERKEZETI HIBA:** a kaput a Discord **`speaking start`** eseménye tölti *(egy megszólalás
alatt is többször)*, de a **felvétel-kimenetel** üríti *(felvételenként egyszer)*. ⇒ A kettő
**nem 1:1** *(757 vs 295)*, és a maradék **saját jogán**, 180 mp-ig zár. Nyitott mikrofonnál a
detekciók **2 másodpercenként** jöttek *(medián)* ⇒ a kapu **sosem** nyílt ki magától.

### ⚠️ AMIT A MÉRÉS MEGCÁFOLT A SAJÁT ELSŐ FELTEVÉSEMBŐL

Először az **elcsendesedési ablak** újraindulására gyanakodtam *(„minden új üzenet nullázza")*.
Megmértem: a kötegbe jutó tételek **72** darab volt ma, a legutóbbi tételek közti köz **mediánja
30,0 mp**, és a leghosszabb megszakítás nélküli lánc **60 másodpercig** nyújtotta az ablakot.
⇒ Ez **valós, de kicsi** hatás. A 9-38 perces zárást a **megszólalás-kapu** adta, ⛔ nem az ablak.

### ⏱️ ÉS AMI MIATT A JAVÍTÁS BIZTONSÁGOS

A **valódi feldolgozás** rövid: 279 felvétel párosítva a kimenetelével — **median 2,0 mp**,
p90 **4,0 mp**, **max 11,0 mp**. ⇒ Egy „épp feldolgozás alatt" tartás ⛔ nem tud perceket enni.

---

## ✅ A SZABÁLY — ⛔ NEM az ablak rövidítése

> **Owner:** *„NE az ablak rövidítésével oldd meg — a cél nem gyorsabb, hanem **zaj-immunis**."*

```
(1) egy VALÓDI FELVÉTEL feldolgozása alatt a kapu ZÁRVA      — mérve: median 2 mp, max 11 mp
(2) ZAJ-ÖZÖN alatt a puszta ÉSZLELÉS NEM zárja a kaput       — a 19. tétel maga
(3) egyébként (normál nap) minden VÁLTOZATLAN                — a 2026-09-11-es viselkedés
```

⭐ **A hossz-küszöbök érintetlenek:** `collectWindowMs` **30 mp**, `maxHoldMs` **15 perc** —
a javítás **kizárólag** azt változtatja meg, hogy **mi számít** „folyamatban lévő megszólalásnak".

| Rész | Honnan a szám |
|---|---|
| zaj-özön = **12 zaj-tétel / 10 perc** | ⭐ **ugyanaz a MÉRT küszöb**, amit a nyitott-mikrofon szignál használ *(normál csúcs 4 / buli 42-84 ⇒ a 12 a 10× üres sávban)*. **Egy SSOT, két fogyasztó** — `VoiceNoiseBurst_Util` |
| 180 mp elévülés | **változatlan** — egy hosszú, valódi monológot végig kell tartania |

### 🔗 A LÁNC — ahol a zaj-jelölés megszületik, onnan tájékozódik a kapu

```
onSpeechAttempt  → noteStarted()                 (puszta észlelés — zaj-özönben NEM tart)
onProcessingStart→ noteProcessingStarted(fájl)   (valódi felvétel — MINDIG tart)
onHandled        → noteSettled({ fájl, isNoise })(⭐ a zaj-jelölés IDE fut be)
```

⚠️ **A fájlnév a kulcs, ⛔ nem a sorrend:** a feldolgozás **párhuzamos**, és vannak kimenetelek,
amik a feldolgozás ELŐTT keletkeznek *(idegen beszélő, olvashatatlan fájl)*. Egy sor-alapú
párosítás ilyenkor **más** tétel tartását engedné el.

---

## 📊 A TESZT — pontosan az, amit az owner kért

> *„1 valódi üzenet + 50 zaj 10 percen át" ⇒ a köteg kimegy a valódi üzenet után.*

`cli/src/discord/discord.batch-noise-immunity.spec.ts` — a **kaput és a döntést együtt** járatja,
léptetett órával *(a hibát egyik modul sem „tartalmazta": a kettő találkozásában volt)*.

| Állítás | Eredmény |
|---|---|
| 1 valódi + 50 zaj / 10 perc ⇒ a köteg **kimegy** | ⭐ **+144 mp**-nél, a **12. zaj-tétel** után *(amikor az özön MÉRHETŐ lesz)* — ⛔ nem a 15 perces szelepből |
| 🔴 **POZITÍV KONTROLL**: zaj-jelölés NÉLKÜL ugyanez | **BENT RAGAD** *(10 perc alatt egyszer sem megy ki)* |
| az ablak hossza | **30 mp / 15 perc — változatlan**, és egy 10 mp-es üzenet továbbra sem mehet ki |
| egy **valódi** felvétel feldolgozása zaj-özönben | ⭐ **visszatartja** a köteget *(a 09-11-es viselkedés megmarad)* |

⭐ **A szimuláció ÓVATOS:** 50 zaj / 10 perc = 12 mp-enként egy; a **mért** buli-sűrűség **84 /
10 perc** volt. A detekció/kimenetel arány a mért **2,6**-ból felfelé kerekítve **3**.

---

## 🔇 A LÁTHATÓSÁG — az elnyomás ⛔ nem lehet néma

Új napló-kód: **`MA-VOICE-BATCH-GATE-NOISE`**, és **csak állapot-váltáskor** *(a kaput 15
mp-enként kérdezzük — körönkénti sor ⛔ nem kell)*:

```
MA-VOICE-BATCH-GATE-NOISE: 🎤 ZAJ-ÖZÖN (50 zaj-tétel 10 perc alatt, küszöb: 12): a 45 nyitott
észlelés NEM tartja vissza a köteget. Nyitott mikrofonnál a puszta észlelés nem bizonyít
megszólalást — a valódi üzenetek nem ragadhatnak bent miatta.
```

🔴 **MIÉRT KELL:** egy néma elnyomás ugyanolyan láthatatlan hiba lenne, mint amilyen a **90
perces zárás** volt. A kapu állapota mostantól **indoklással** kérdezhető *(`diagnose()`)*.

---

## ⚠️ AMI MEGMARAD — kimondva

| Maradék | Miért |
|---|---|
| a **zaj saját feldolgozása** *(median 2 mp, max 11 mp)* alatt a kapu zárva | hogy egy megszólalás zaj-e, az **csak a felismerés után** derül ki. ⛔ Ez elvileg sem kerülhető meg — de 2 mp, nem 180 |
| az **első ~12 zaj-tétel** még zár *(a buli sűrűségével ~2,4 perc)* | az özönt **MÉRNI** kell, ⛔ nem feltételezni |
| a `sttInFlight` *(hangüzenet-út + újrapróbálás)* továbbra is zár | egy **futó felismerés** valódi ok. ⚠️ Ha az újrapróbálási sor **zaj-felvételekkel** van tele *(ma: 242 tétel)*, ez is nyújt — ⛔ **nem mértem meg külön**, mert a naplóban nincs „retry-próba indult" esemény. 🙋 Ha az owner ezt is látni akarja, előbb **mérőpontot** kell tenni rá |

---

## A rétegek

| Fájl | Mit tesz |
|---|---|
| `cli/src/voice/voice-speech-inflight.ts` | ⭐ **a kapu** — észlelés / feldolgozás / zaj-özön, `diagnose()`-zal |
| `cli/src/voice/voice-noise-burst.ts` | a **mért** özön-küszöb *(12 / 10 perc)* — SSOT |
| `cli/src/discord/discord.listener.ts` | a bekötés + a napló-sor az állapot-váltásnál |
| `cli/src/voice/voice-channel-recorder.ts` | az `onProcessingStart` mostantól a **fájlnevet** is átadja |
| `cli/src/discord/discord.bridge.ts` | **változatlan** — a döntés hét kapuja nem mozdult |

## 📊 Igazolás

| Ellenőrzés | Eredmény |
|---|---|
| CLI-tesztek | **1231 / 1231** zöld *(+12 új)* |
| szerver-tesztek | **119 / 119** zöld |
| `tsc --noEmit` | tiszta |
| `dc rev` | **2404 → 2404** — ⭐ **0 új találat** |

🔇 **A HÉTVÉGI KIKÖTÉS BETARTVA:** ⛔ nulla élő hangszóró-kísérlet, ⛔ egyetlen üzenet sem ment az
ownernek. Minden mérés **olvasás** volt *(napló, megőrzött hang, köteg-tár)*; a teszt **fixtúrából**
fut.
