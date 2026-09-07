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

### Kapcsolódó

- `current/principles/ldp-default-runtime.md` — az LDP a default futtatási mód
- `__agent/ENTRY.md` §0 — a napindítási újraindítás és a kivétele
- `current/principles/error-handling.md` — a néma hiba tiltása
