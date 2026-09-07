# INCIDENS — a Discord-üzeneteim az ELSŐ SORNÁL csonkolódtak

> **Felfedezve: 2026-09-07 06:58.** Az owner gyanújára, méréssel.
> **Súlyosság: 🔴 magas** — a reggeli kommunikáció ~90%-a nem jutott el hozzá.

---

## 1. Mit vett észre az owner

> *„Na most ha visszaolvasod ezt a chatet, akkor tényleg ennyit akartál csak küldeni, vagy
> itt közben valami hibánk is van, ami miatt nem kapom meg a teljes üzeneteket?"*

⭐ **Igaza volt.** Én addig „sikeresnek" hittem minden küldést.

---

## 2. A mérés — ez döntötte el

A csatorna visszaolvasva a **Discord REST API-jával**
*(`GET /api/v10/channels/{id}/messages`)*:

```
a USER üzenetei:      55, 146, 319, 617, 744 karakter
az ÉN üzeneteim:      29, 46, 62, 63, 73, 75, 78, 82, 105 karakter
```

⇒ **Minden kimenő üzenetem pontosan az első sornál ért véget.** Amit az owner kapott, az a
**címsor** volt; a tartalom — készülődés-lista, időzítés, a többsession-válasz, az SSOT-terv —
**soha nem érkezett meg**.

---

## 3. Az ok

A küldést így hívtam:

```bash
npx tsx src/main.ts comm say --text "első sor
második sor
…"
```

Windowson az `npx` egy **`.cmd` burkoló**, és a **többsoros argumentum a burkolónál elveszett**
az első újsornál. A CLI és a `discord.js` **hibátlanul működött** — pontosan azt küldte el,
amit megkapott: egyetlen sort.

### 🔴 Miért nem vettem észre — ez a lényeg

| | |
|---|---|
| A CLI `sent: true`-t adott | ✅ **igaz is volt** — az az egy sor tényleg kiment |
| A `partCount: 1` | ✅ **igaz is volt** — egy darab volt |
| A daraboló logika | ✅ **hibátlan** — csak sosem kapott 2000 karakternél többet |

⇒ **A rendszer minden szintje őszintén „sikert" jelentett.** A hiba a mérés HATÁRÁN KÍVÜL
történt: a szöveg már azelőtt elveszett, hogy a kódunk látta volna.

> 💡 Ez pontosan az a hibaosztály, amit az owner előre megnevezett:
> *„az üzeneteid nem mindig jutnak el hozzám… el-elúsznak"* — és amiről a
> `message-delivery-reliability.md` szól: **a „sent: true" ≠ „megkapta".**

---

## 4. Az azonnali megkerülés (működik, igazolva)

Küldés **közvetlenül a Discord REST API-jára**, a shell-burok kihagyásával — a szöveg
**fájlból** jön, tehát nincs idézőjel- vagy újsor-probléma:

```
E:/tmp/dsend.py <fajl>     →  SENT len=990 / küldött=990   ✅
                              SENT len=1194 / küldött=1194 ✅
                              SENT len=1528 / küldött=1528 ✅
```

⚠️ **Ez ideiglenes.** A `cli/src` módosítása ~23 perces LDP-újraépítést indít, ami alatt a
csatorna áll — és a felfedezés pillanatában az owner **27 perccel az indulása előtt** volt.
*(Lásd az `ENTRY.md` §0 kivételét: eseménynél nem indítunk újra.)*

---

## 5. A végleges javítás — TEENDŐ

| # | Mit | Miért |
|---|---|---|
| 1 | **`ma comm say --file <út>`** opció | a szöveg fájlból jön ⇒ a shell/burkoló **soha nem látja** |
| 2 | **KÜLDÉS UTÁNI VISSZAOLVASÁS** | ⭐ owner-javaslat, és **ez fogta meg ezt a hibát** |
| 3 | A visszaolvasás **hossz-ellenőrzéssel** | ha `elküldött ≠ megérkezett`, az **HIBA**, nem siker |

> **Owner (2026-09-07):** *„Lehet, hogy vissza is se kéne ellenőrizni időnként, hogy
> sikerülhet-e infókat átadni a Discordon, miután megtörtént."*

---

## 5b. 🔴 A MÁSODIK HIBA — a MEGKERÜLÉS okozta

Az owner ugyanaznap **07:00 körül** jelezte:

> *„jelenleg azt írja a Discord, hogy írsz valamit, de közben meg már elküldted, amit írtál,
> meg befejezted a session futást is. Ez magától el fog ugyan tűnni, de itt egy fals
> indikáció van."*

### Az ok — mérve

A „gépel…" jelzés abból dönt, hogy **van-e megválaszolatlan üzenet** *(`owesReply`)*, azt
pedig a **kimenő naplóból** (`outbound-log.jsonl`) olvassa.

```
az utolsó naplózott kimenő üzenet:  06:44   (az utolsó `ma comm say`)
a REST-megkerüléssel küldött 3 üzenet:  06:58, 07:00, 07:03   → NEM került a naplóba
```

⇒ `owesReply` **örökre igaz maradt** → a bot **végtelenül gépelt**.
*(A 15 perces biztonsági szelep leállította volna — de az owner előbb vette észre.)*

### ⭐ A TANULSÁG — ez általánosabb, mint az első

> 🔴 **Amikor egy hibát MEGKERÜLÜNK, a megkerülés kihagyhat MELLÉKHATÁSOKAT, amiket az
> eredeti út elvégzett.**
> A megkerülésnek **UGYANAZT A TELJES SZERZŐDÉST** kell teljesítenie — nem csak a fő
> funkciót.

Az eredeti `ma comm say` **három** dolgot csinált: darabolt · küldött · **naplózta a kimenőt**.
A megkerülésem az első kettőt átvette, a harmadikat **elhagyta** — és ez egy **másik**
alrendszert rontott el.

### A javítás (kész)

| # | | |
|---|---|---|
| 1 | a kimaradt naplóbejegyzés **pótolva** | a `comm doctor` újra „nincs megválaszolatlan üzenet" |
| 2 | a küldő **maga rögzíti** a kimenő naplót | nem felejthető el |
| 3 | a küldő **visszaolvas + hosszt hasonlít** | `SENT kuldott=1006 megerkezett=1006 OK` |

---

## 6. A TANULSÁG — általánosítható

> 🔴 **Egy művelet visszajelzése csak addig ér valamit, ameddig a mérés HATÁRA ér.**
> Ha a hiba a határon kívül történik *(burkoló, hálózat, másik rendszer)*, a saját
> „sikerünk" **hamis biztonságot** ad.

⇒ **Ahol a kimenet elhagyja a rendszerünket, ott VISSZA KELL OLVASNI.** Nem elég tudni, hogy
elküldtük — azt kell tudni, hogy **megérkezett, és teljes egészében**.

*(Ugyanez az elv már megvan a Discord-kötegnél: a köteg csak IGAZOLT átadás után ürül.
A kimenő irányból hiányzott.)*

## Kapcsolódó

- `current/principles/message-delivery-reliability.md`
- `current/principles/discord-first-output.md`
- `current/open-questions.md` **K)** — nyugta-követés, postaláda
