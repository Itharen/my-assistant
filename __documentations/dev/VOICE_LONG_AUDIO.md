# 🎙️ A HOSSZÚ HANGÜZENET — miért csonkult, és mi javítja

**Mérve és megépítve:** 2026-09-11 · **Állapot:** ✅ kész, élesben igazolva

> **Owner, 2026-09-11 15:54 + 15:55 (élesben, KÉTSZER egymás után):** *„Úgy látom, hogy **még
> mindig levágta az előző üzenetemnek a végét**… Át kéne adni a devnek, hogy a **hosszabb
> hangüzeneteket is fel kell tudjuk dolgozni**."* · *„**Megint levágta a javításomat a
> végéről**…"*

📌 **Miért volt ez a legfontosabb tétel:** az owner **minden** inputja ezen az úton jön — ez a
rendszer **bemeneti szűk keresztmetszete**.

---

## 🔬 A MÉRÉS — ⛔ nem hipotézis

**Alany:** a 01:01-es, **56,9 másodperces** felvétel a hang-archívumból.
⭐ **A megőrzés (1. tétel) nélkül ez a mérés lehetetlen lett volna** — a hang már nem létezne.

### (1) Felezés — ugyanabból a hangból KÉTSZER annyi szöveg

| Bemenet | Átirat |
|---|---|
| teljes fájl *(56,9 mp)* | **295** karakter — vége: *„…ezt megoldja,"* |
| első fél *(28,5 mp)* | 279 karakter |
| második fél *(28,5 mp)* | 348 karakter |
| **együtt** | **627** karakter *(2,1×)* |

⇒ A második fél szövege **egyáltalán nem szerepel** a teljes fájl átiratában.

### (2) Prefix-sorozat — a határ PONTOSAN 30,0 másodperc

```
 15 mp → 148 kar      28 mp → 280 kar      35 mp → 295 kar  ⟵ ugyanaz a vég
 20 mp → 200 kar      30 mp → 295 kar      40 mp → 295 kar  ⟵ ugyanaz a vég
 25 mp → 252 kar      32 mp → 295 kar      56 mp → 295 kar  ⟵ ugyanaz a vég
```

⇒ 30,0 mp-ig **monoton nő**, onnantól **teljesen befagy**. Ez a Whisper-családú modellek
klasszikus **30 másodperces receptív ablaka**, hosszú-hang darabolás nélkül.

### (3) Kizárás — ⛔ NEM a WAV-fejléc

A felvevő fejléce **minden** fájlon **22 369,6 mp**-et állít *(a folyam-írás maradéka)*.
**Javított** fejléccel a válasz **karakterre azonos** *(295 = 295)*. ⇒ A gyanú **kizárva**.

---

## ⭐ AMIT A MÉRÉS KIZÁRT — és miért fontos kimondani

| Feltevés *(a handoff mindhármat felvetette)* | Mérés |
|---|---|
| a **szegmentálás** zárja le korán *(`AfterSilence` 1000 ms)* | ⛔ **NEM** — a 34-57 mp-es felvételek **teljes hosszban** a lemezen vannak |
| a **felvevő** dobja el | ⛔ **NEM** — ugyanaz |
| a **felismerés utáni** út veszíti el | ⛔ **NEM** — a csonka szöveg **hiánytalanul** bekerült a kötegbe |

🔴 **EBBŐL KÖVETKEZIK: a 9. tételben leszögezett beszéd-észlelést NEM kell megváltoztatni.**
⇒ **Nincs szükség owner-döntésre** a szegmentálásról *(a handoff kikötése)*, mert a szegmentálás
**nem a ludas** — és ezt **mérés** mondja ki, ⛔ nem feltevés.

## 🔴 A KÉT KÜLÖNBÖZŐ VESZTESÉG — a handoff összevonta őket

| | Mi ez | Mikor | Mennyi |
|---|---|---|---|
| **A) Csonkolás** *(ez a tétel)* | a 30 mp-en túli beszéd **nem kerül be** az átiratba | 15:53, 15:54 — és minden hosszú üzenetnél | a nap 84 felvételéből **11 volt 28 mp felett** *(13%)*, azok a szövegük **40-50%-át** vesztették |
| **B) A 23 „felismerés után elveszett"** | a **töltelék-szó-őr** *(`„Thank you."` stb.)* elutasította | **01-03 h** *(21 db)* és **13 h** *(2 db)* — ⛔ 15:53/15:54-kor **EGY SEM** | 22 db töltelék-őr + 1 olvashatatlan felvétel |

🔴 **A CSONKOLÁS NEM IS SZEREPELT A MÉRÉSBEN.** Ezek a megszólalások ✅ **sikerként** számoltak,
hiszen bekerültek a kötegbe. ⇒ A **78%-os átviteli arány nem is látta** a veszteséget.
⚠️ Ez a rosszabbik fajta hiba: **nem hibázik, csak nem mond igazat.**

---

## ✅ A JAVÍTÁS

⛔ **Az FDP AI szolgáltatáshoz nem nyúlunk** *(`fdp-ai-never-restart`; a kódja nem is a mi
repónkban van)*. ⇒ A darabolás **teljesen a mi oldalunkon** történik.

| Fájl | Mit tesz |
|---|---|
| `cli/src/stt/stt-audio-window.ts` | a WAV felbontása **≤28 mp**-es darabokra, **csendnél** vágva — tiszta döntés, hálózat nélkül |
| `cli/src/stt/stt.client.ts` | darabonként hív, az átiratokat **összefűzi**, és a `segmentation`-ben **kimondja** |
| `cli/src/stt/stt.flags.ts` | a jelölésbe teszi: `🧩 3 részletben ismerve (30 mp-es ablak)` |
| `cli/src/voice/voice-funnel-report.ts` | **új sor**: `🧩 darabolva ismerve (>30 mp)` — így a javítás **mérhető** |

### A mért állandók — ⛔ nem hangolható paraméterek

| Állandó | Érték | Mért indok |
|---|---|---|
| `RECOGNIZER_WINDOW_SECS` | **30** | a prefix-sorozat 30,0-nál fagy be |
| `CHUNK_SECS` | **28** | a 28 mp-es prefix hiánytalanul átjött; 2 mp tartalék a vágás igazításának |
| `CUT_SEARCH_SECS` | **5** | 50 keret, amiből statisztikailag több is csendes |
| `QUIET_ENERGY` | **200** | 1502 keret mérve: `p10=65 · p25=504 · median=1381` ⇒ a beszéd 500 felett, a szünet 200 alatt |

⭐ **Teszt őrzi mindegyiket:** ha valaki átírja, a teszt elbukik — és akkor a **mérést** kell
megismételni, ⛔ nem a tesztet átírni.

### 🔴 Amit a darabolás NEM hallgathat el

1. **Hogy darabolás történt** → `🧩 N részletben ismerve (30 mp-es ablak)`.
2. **Ha egy részlet felismerése elbukott** → `🔴 N részlet felismerése ELBUKOTT — a szöveg
   HIÁNYOS`. ⚠️ A meglévő szöveg **nem dobódik el** *(2/3 többet ér a semminél)*, de
   **gyanúsként** megy tovább.
3. **Ha beszéd közben kellett vágni** → `⚠️ N vágás beszéd közben esett`.

⭐ Ez a `⚠️ GYANÚS TAGOLÁS` jelző mintája, amit a handoff jó példaként nevezett meg.

---

## 📊 IGAZOLÁS — élesben, a megőrzött hangon

| Felvétel | Előtte | Most |
|---|---|---|
| 56,9 mp | 295 karakter | **641** karakter *(3 részlet)* |
| **34,2 mp — az owner 15:53-as üzenete** | 299 karakter | **445** karakter *(2 részlet)* |
| 8,8 mp *(rövid)* | 96 karakter | 96 karakter, `segmentation: null` — **változatlan út** |

🔴 **ÉS EZ A DÖNTŐ BIZONYÍTÉK:** a 15:53-as üzenetből most előkerült a hiányzó vég —

> *„Majd erre föl kell írjunk egy **évente ismétlődő**, de mindig **egy-két hónappal korábbra**
> kerülő **adategyeztetési feladatot a dominó telefonhoz**."*

⇒ **Pontosan az a mondat**, amit az owner ezután **kétszer** próbált megismételni *(15:54,
15:54:28)*. A javítás a kiváltó mondatot hozta vissza.

| Ellenőrzés | Eredmény |
|---|---|
| CLI-tesztek | **1116 / 1116** zöld *(+41 új)* |
| `tsc --noEmit` | tiszta |
| Pozitív kontroll ×2 | darabolás kikapcsolva → **13 bukás**; a hiány-jelzés elhallgatva → **1 bukás** |
| `dc rev` | **2397 → 2397** *(0 új találat; a két új fájlon **0**)* |
| `git diff` a `cv-*.ts`-en | **üres** *(`transplant-not-rewrite`)* |

---

## ⚠️ MÉRT BUKTATÓK, amiket a saját tesztem fogott meg

1. **Végig hangos hangnál a „legcsendesebb" keret a sáv ELEJE lett** *(minden keret azonos
   energiájú ⇒ a szigorú `<` az elsőt választja)* ⇒ minden darab **5 mp-rel rövidebb** lett, és
   **fölöslegesen több** darab keletkezett. ⭐ Javítva: ha nincs szóköz, a vágás a **határon**
   marad, `midSpeech: true` jelzéssel.
2. **A hiány-jelzést kiszorította az arány-őr.** Egy elbukott részletnél a
   *„70 mp hangból 25 karakter"* panasz került az indoklásba, és a **leglényegesebb tény** — hogy
   a szöveg **HIÁNYOS** — eltűnt mögötte. ⭐ Javítva: a hiány-jelzés **mindig előre** kerül, a
   kettő **együtt** megy ki.

## ⚠️ AMIT NEM TUDOK KIMONDANI

- **Az átviteli arány NEM fog javulni ettől** — mert a csonkolás **soha nem is szerepelt** benne
  *(a csonka átirat ✅ siker volt)*. ⇒ Ezért kapott a tölcsér **új sort**: a `🧩 darabolva
  ismerve (>30 mp)` mutatja, hogy a mechanizmus dolgozik.
- **A futó listener még a régi kódot viszi** — a javítás a **következő szerver-indulásnál** lép
  életbe. ⛔ Nem indítom újra magamtól *(a szerver a gazda, `ldp-default-runtime`)*.
- A **23 töltelék-őrös** elutasítás *(B eset)* **külön tétel** — ⛔ nem ez a javítás oldja meg,
  és ⛔ nem is reprodukáltam, hogy közülük melyik volt valódi beszéd.
