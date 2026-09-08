# Fejlesztés után KÖTELEZŐ ellenőrzés — tényleg újraindult-e

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

---

## 2026-09-07 — a szabály

> Ha fejlesztéseket végzel a My Assistant projekten, utána mindenképpen ellenőrizned kéne,
> hogy megfelelően újraindult-e, illetve az LDP-nek elméletelek úgy kéne működnie, hogy a
> szervert mindig futásban tartja, és csak akkor indítja újra, amikor már minden teszt és
> build és egyéb sikeresen lezárult.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### A szabály

**Minden `my-assistant` fejlesztés után ellenőrizni kell, hogy a rendszer tényleg újraindult
és él** — nem elég, hogy a commit megtörtént és a tesztek zöldek voltak.

| # | Mit nézünk | Mivel |
|---|---|---|
| 1 | Lefutott-e a pipeline, **zölden** | `logs/live-dev-pipeline/status.json` → `pipelineComplete` + a lépések |
| 2 | Él-e a **szerver** | a szerver-port **valóban** figyel-e |
| 3 | Élnek-e a **figyelők** | Discord-életjel **frissesége** + jelenlét-minta frissesége |
| 4 | Ép-e a **csatorna** | `ma comm doctor` |

⛔ **Egyik sem helyettesíti a másikat.** A „zöld pipeline" nem jelenti, hogy a szerver
felállt; az „elindítottam" nem jelenti, hogy fut.

---

### 🔴 A MÉRÉS, ami egy TÉVES ÁLLÍTÁSOMAT is megdöntötte (2026-09-07 07:02)

Az LDP **már pontosan úgy működik**, ahogy az owner elvárja. Mérve, futó pipeline közben
*(`tsc-agent-handlers` fázis)*:

```
status.json  →  "serverRunning": false ,  "restartPending": true
DE:
  szerver-port 39335        →  ÉL
  Discord-figyelő életjel   →  07:02:31   (friss)
  jelenlét-minta            →  07:02:36   (friss)
```

⇒ **A szerver VÉGIG FUT a build alatt**, és csak a pipeline sikeres lezárása után indul újra.

### ⚠️ Amit ÉN rontottam el

Többször állítottam — és **döntést hoztam rá** —, hogy *„a build alatt áll a Discord-csatorna,
ezért nem nyúlok a kódhoz"*. **Ez téves volt.**

**Az ok:** a `status.json` **`serverRunning: false`** mezőjét úgy olvastam, hogy a szerver nem
fut. Valójában az az **LDP belső jelzése** *(„a szerver újraindítása még hátravan ebben a
körben")* — **nem a szerver valós állapota**.

> 🔴 **A tanulság:** egy állapot-mező NEVE nem a jelentése. Amit egy másik rendszer belső
> mezőjéből olvasok ki, azt **a valóságon kell ellenőrizni** *(port, életjel)* — különben a
> saját következtetésemre építek döntést.

*(Ez ugyanaz a hibaosztály, mint a `sent: true` ≠ „megkapta" — csak most befelé.)*

### Következmény

A `--file` javítás halasztásának **indoka megszűnt**: a kód módosítása **nem vakítja meg** a
csatornát. A ~23 perces pipeline alatt a szerver és mindkét figyelő **fut**; csak a legvégén
van egy rövid újraindulás.

---

## 🔴 A VÉGPONTTÓL VÉGPONTIG PRÓBA NEM LUXUS — 2026-09-07, három mért lebukás

Egyetlen munkamenetben **három** hiba került elő úgy, hogy a típusellenőrzés és **minden teszt
zöld volt**. Egyiket sem lehetett volna olvasással megtalálni.

| # | Mi volt | Miért nem fogta meg semmi |
|---|---|---|
| 1 | A relay-lehúzó `Authorization: Bearer`-t küldött, a relay `x-ma-relay-token`-t olvas | a két oldal **külön fordul**, és külön-külön **helyes** volt |
| 2 | Az `nginx -t` „syntax is ok"-ot mondott — a **saját alapértelmezett** configjára | a parancs **lefutott**, csak nem azt vizsgálta, amit hittem |
| 3 | A helyzet-tár a `build/` alá került volna, amit minden fordítás **letöröl** | a útszámolás forrásból futva **jó**, fordítva **rossz** |

### A három szabály, ami ebből következik

⭐ **1. A szerződést a MÁSIK OLDALON kell megnézni.** A fejléc-név, a mezőnév, a válasz alakja —
ezekre a **szokásból következtetni** tilos. Egy „mindenki így csinálja" feltevés pontosan
addig működik, amíg a másik oldal is így csinálja.

⭐ **2. „A parancs lefutott" ≠ „azt vizsgálta, amit hittem".** A csatolás nem érvényesült, a
`cd` nem oda vitt, a build elavult volt — mindhárom **sikeres kimenetet** adott. ⇒ Egy
igazolás **első lépése** annak bizonyítása, hogy a **helyes bemeneten** dolgozik
*(listázd ki a fájlokat, nézd meg a `pwd`-t, nézd meg a build idejét)*.

⭐ **3. Ami forrásból fut, az még nem fut fordítva is.** Minden útvonal-számolás, ami a kód
**saját helyéből** indul (`import.meta.url`, `__dirname`), **elrendezés-függő** — és élesben
más az elrendezés. A tartós adat helyét **soha ne a kód helyéből** számold.

---

## 🔴 A ZÖLD TESZT ELTAKARJA A BUKOTT FORDÍTÁST (mérve 2026-09-08 08:23)

A `tsc ; jasmine` láncnál a **kilépési kód a LÁNC UTOLSÓ tagjától** jön. Ha a fordítás
bukik, de a tesztek a **régi `dist`-en** lefutnak, a futás `exit 0`-t ad és
`„635 specs, 0 failures"`-t — miközben a forrás **le sem fordult**.

**Mért eset:** a `comm.doctor.ts`-ben maradt egy fölösleges `}`. A háttérfutás `exit 0`-t
jelentett és zöld tesztet — én ezt **zöldnek olvastam**. Közben:

| Ami történt | Amit láttam |
|---|---|
| `error TS1128: Declaration or statement expected` | — *(a kimenet közepén, a „0 failures" ELŐTT)* |
| a tesztek a **korábbi** `dist`-en futottak | `643 specs, 0 failures` ✅ |
| 🔴 az **LDP FATÁLISAN elszállt** ugyanettől a fájltól | `tsc-cli failed (fatal)` |

⚠️ A legárulkodóbb jel nem a kilépési kód volt, hanem hogy **az LDP haldoklott** — azaz a
valóság már mondta az igazat, miközben a saját futásom megnyugtatott.

### A szabály

⛔ **A `exit 0` a láncolt build+teszt végén NEM bizonyíték.** Kötelező:

1. A **fordítás kimenetét külön nézd meg** — `grep "error TS"`, ne csak a `tail`-t.
   *(A `tail -6` pont azt vágja le, ami számít: a fordítási hiba a lista elején áll.)*
2. Vagy válaszd szét: előbb `tsc`, és **csak zöld fordítás után** `jasmine`.
3. ⭐ **A teszt-darabszám is jelzés:** ha új tesztet írtál és a szám **nem nőtt**, a te
   fájlod **le sem fordult**. Ez a legolcsóbb ellenőrzés, és nem hazudik.

📌 **Ugyanaz a hiba-osztály, mint a `ma comm voice-funnel`-nél:** 593 zöld teszt és zöld
`tsc` mellett a parancs **nem létezett futásidőben**. A zöld jelzés és a **működő rendszer**
két különböző állítás.

### Kapcsolódó

- `current/principles/ldp-default-runtime.md` — az LDP a default futtatási mód
- `__agent/ENTRY.md` §0 — a napindítási újraindítás és a kivétele
- `current/principles/error-handling.md` — a néma hiba tiltása
