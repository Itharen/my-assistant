# 🎤 A NYITOTT MIKROFON — zaj-felismerés a felismerés UTÁN

**Mérve és megépítve:** 2026-09-12 · **Állapot:** ✅ kész *(élesben a következő listener-indulástól)*

> **Owner, 02:43:** *„Na mi a fék van? **Semmi nem megy** most már."* · **02:51:** *„most
> elkezdte nekem itt feldolgozni a My Assistant rendszere az **összes a buliból származó
> zajt**."* · **02:53:** *„minden ami **angol és nem magyar**, az mind zaj."*

📌 **Ez nem szűrési szépséghiba, hanem KAPACITÁS-probléma.** Mérve: **722 érzékelés / 259
felvétel / 16 valódi input** egy este alatt *(egy normál nap: 123 / 9 / 96)*; ugyanabban az
ablakban a `comm doctor` **120 s fölé** nyúlt és a memória **100,5/127 GB**-on állt.

---

## 🔬 A MÉRÉS — labelled korpusz, ⛔ nem intuíció

> **Owner, 02:51:** *„itt van a minta alap, meg a zaj alap, na ebből aztán fogsz tudni tanulni."*

A kötegbe jutott átiratokat felcímkéztem, és megmértem, **mi választja el** a zajt a valódi
inputtól:

| | ZAJ | VALÓDI |
|---|---|---|
| **magyar betű** *(á é í ó ö ő ú ü ű)* | **0 / 21** | **15 / 15** |
| **gyakori magyar szó** | **0 / 21** | **15 / 15** |
| karakter | 3-94 *(medián 7)* | 33-325 *(medián 110)* |
| szó | 1-19 *(medián 1)* | 7-47 *(medián 21)* |

🔴 **A HOSSZ ÖNMAGÁBAN NEM VÁLASZT EL** — a 33-94 karakteres sávban **átfedés** van. A
**magyar-jel** viszont ezen a korpuszon **hibátlanul** szétvágja a kettőt.

## ✅ A SZABÁLY — a mért mintából vezetve

```
ZAJ  =  NEM magyar   ÉS   (≤ 30 karakter  VAGY  ≤ 6 szó)
```

| Rész | Miért pont ez |
|---|---|
| **NEM magyar** *(nincs magyar betű ÉS nincs gyakori magyar szó)* | a **szükséges** feltétel — ez az, ami mér |
| **≤ 30 karakter** | a mért valódi **minimum 33** ⇒ a küszöb **alatta** van |
| **≤ 6 szó** | a mért valódi **minimum 7 szó** ⇒ ugyanígy |

⛔ **AMIT SZÁNDÉKOSAN NEM SZŰR** *(az owner kikötése)*: *„az owner használ angol szakszavakat,
és egy hosszabb angol mondat lehet valódi."* ⇒ A **hosszú**, nem magyar szöveget **átengedjük**.
⚠️ Vállalt csere: a mért korpuszon ez **2 zaj-tételt** átenged — a fordított hiba *(egy valódi
mondat eldobása)* **drágább**.

⭐ **A magyar-jel megvédi a RÖVID magyar válaszokat is** — *„Igen, csináld."*, *„Jó lesz."*,
*„Nem megy a dolog"* *(ékezet nélkül is!)*. A hossz-fék **csak** nem-magyar szövegre él.

---

## 📊 VISSZAMÉRÉS — 427 minta, több nap

| Korpusz | átirat | magyar | zajnak jelölve | 🔴 **MAGYAR zajnak jelölve** |
|---|---|---|---|---|
| ma éjjel *(tükör)* | 88 | 35 | 49 *(56%)* | **0** |
| teljes tükör-archívum | 217 | 151 | 56 *(26%)* | **0** |
| megőrzött hang-archívum | 122 | 96 | 21 *(17%)* | **0** |

🔴 **AZ INVARIÁNS TARTOTT: egyetlen magyar szöveg sem esett a zaj-ágba** — sem ma éjjel, sem a
korábbi napokon.

⭐ **A labelled korpuszon:** 19/21 zaj elkapva *(90,5%)*, **0 valódi** kiesés.

### És amit a szűrő a retry-úton javít

A ma éjjeli **„✅ Megvan, amit a hang-csatornában mondtál"** értesítések szövegeit visszamérve:
**47 / 60**-at a szűrő megfog. Az owner panasza *(02:45)* pontosan ezekről szólt:

```
„Go."  ·  „Kiitos."  ·  „- Good night."  ·  „Thank you very much."
„All keep on with. All right."  ·  „I think I have a fun match."
```

> **Owner:** *„az nem is egy valid találat."*

⭐ **A javítás automatikus:** a retry-út már eddig is ellenőrizte a `suspicious` jelzőt
*(`if (!result.ok || result.suspicious)`)* ⇒ a zaj-jelölés miatt az **érvénytelen találat
innentől nem megy ki sikerként**. ⛔ Nem kellett hozzá új kapu.

⚠️ **A maradék 13** *(amit átengedünk)*: hosszú nem-magyar szöveg *(szándékos)*, illetve
**magyarnak látszó halandzsa** *(„Nincs más, hogy", „A keresem van.")* — az utóbbi magyar, tehát
a szűrő **elvileg sem** nyúl hozzá. 🙋 Ez **külön tétel**, ha az owner kéri.

---

## 🎤 A NYITOTT MIKROFON SZIGNÁLJA

⛔ **Ez csak JELZÉS** — a hangos figyelmeztetés az asszisztens dolga *(a handoff kikötése:
„a `cast notify`-t NE te hívd")*.

A sűrűséget mértem a napi naplókból *(eldobott megszólalás / 10 perc)*:

```
NORMÁL ablakok (09-08 … 09-11):   1 · 2 · 3 · 3 · 3 · 3 · 4 · 4     ⟵ max 4
A BULI ablakai (09-12 01:20-01:59):  66 · 84 · 63 · 42              ⟵ min 42
```

🔴 **10× üres sáv** van a kettő között ⇒ a küszöb **12 / 10 perc**: a normál csúcs **3×**-a, a
zaj-minimum **3,5×** alatt. ⭐ **Csúszó** ablak, ⛔ nem fix negyedórák — különben egy határon
átnyúló özön kettévágódna, és mindkét fele a küszöb alatt maradhatna.

A jelzés a tölcsér-jelentésben jelenik meg:

```
🎤 NYITOTT MIKROFON GYANÚJA: 84 zaj-tétel 10 perc alatt (küszöb: 12, mért normál csúcs: 4).
   A környezet beszéde megy a hang-csatornába — ez KAPACITÁS-probléma is…
   ⇒ Szólni kell az ownernek, hogy zárja a mikrofont.
```

---

## 🔇 AMI A ZAJRA NEM TÖRTÉNIK — és ez a lényeg

| | Zaj esetén |
|---|---|
| 🔊 hangjelzés a hang-csatornába | ⛔ **NINCS** |
| 🔇 kiesés-jelentés az ownernek | ⛔ **NINCS** |
| 📊 tölcsér-sor | ⭐ **VAN** — `🎤 buli-zaj (megszűrve)` |
| 💾 a hang megőrzése | ⭐ **VAN** *(változatlanul)* |

🔴 **MIÉRT:** egy este **243** ilyen tétel keletkezett. Ha mindegyikről jelentés vagy hangjelzés
menne, **a zaj-szűrő maga lenne a legnagyobb zajforrás** — éjjel, vendégek mellett.

⚠️ **És a zaj NEM a veszteség-sorba kerül:** saját napló-kódot kap *(`MA-VOICE-SPEECH-NOISE`)*,
és **kimarad az átviteli arány nevezőjéből**. ⛔ Ez nem a metrika szépítése: ugyanaz az elv,
mint az üres felvételnél és a duplikátumnál — **nem az owner megszólalási kísérlete**. Ha
beszámítanánk, egy bulis este „6%-os átviteli arányt" adna, ami ⛔ nem arról szólna, mennyi
jutott át **tőle**, hanem arról, mennyit beszéltek **a szobában**.

---

## A rétegek

| Fájl | Mit tesz |
|---|---|
| `cli/src/stt/stt.transcript-guard.ts` | ⭐ **a szabály** — a mért küszöbök és a magyar-jel |
| `cli/src/voice/voice-noise-burst.ts` | ⭐ **a szignál** — csúszó ablak, mért küszöb |
| `cli/src/voice/voice-feedback-plan.ts` | 🔇 zajra **teljes csend** *(se hang, se jelentés)* |
| `cli/src/voice/voice-recording-outcome.ts` | a saját napló-kód osztályozása |
| `cli/src/voice/voice-funnel-report.ts` | a zaj-sor + a gyanú kiszámolása |
| `cli/src/voice/voice-funnel-render.ts` | ⭐ **ÚJ**: a tábla — a `max-file-lines` miatt kiválasztva |

---

## 📊 Igazolás

| Ellenőrzés | Eredmény |
|---|---|
| CLI-tesztek | **1219 / 1219** zöld *(+33 új)* |
| szerver-tesztek | **119 / 119** zöld |
| `tsc --noEmit` | tiszta |
| Visszamérés | **427 minta**, 3 korpusz ⇒ **0** magyar kiesés |
| `dc rev` | **2404 → 2404** — ⭐ **0 új találat** |

⚠️ **A tölcsér `buli-zaj` sora MOST 0-t mutat** — és ez **helyes**: a 244 ma éjjeli veszteség a
**régi** kóddal lett naplózva. A zaj-kód a **következő listener-indulástól** kezd gyűlni.
⛔ Nem indítom újra magamtól *(a szerver a gazda)*.

🔇 **A HÉTVÉGI KIKÖTÉS BETARTVA:** ⛔ nulla élő hangszóró-kísérlet, ⛔ egyetlen üzenet sem ment
az ownernek. Minden mérés **olvasás** volt *(megőrzött hang, napló, tükör-archívum)*.

## ⚠️ AMI NEM KÉSZÜLT EL — és miért

🙋 **A harmadlagos „a retry-értesítés legyen REPLY az eredeti hibára"** *(owner, 02:50)*
**nincs megépítve**. ⭐ A megoldás útja **feltárva**, a hiányzó lépés **pontosan** ismert:

1. a `sendDiscordMessage` ⛔ **nem adja vissza** az elküldött üzenet azonosítóját *(csak a
   visszaolvasásnál van `id`)*;
2. a `MissedSpeechReporter` ezért nem tudja, **melyik** üzenet lett a kiesés-jelentés;
3. a retry-bejegyzés így nem tud rá hivatkozni.

⇒ A lánc **3 fájlt** érint, köztük a **mindenki által használt kimenő utat**, és a működését
⛔ **csak élő üzenet-küldéssel** lehetne igazolni — ami ezen a hétvégén **tilos**.
🔴 Ezért ⛔ **nem építettem félkész, igazolhatatlan változatot**: a dead-code rosszabb, mint a
kimondott hiány. *(A `{ to: 'reply' }` terv-ág és a `fetchReplyTarget` már létezik — a
populálás hiányzik.)*
