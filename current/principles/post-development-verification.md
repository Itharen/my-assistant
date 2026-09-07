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
  szerver-port 39245        →  ÉL
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

### Kapcsolódó

- `current/principles/ldp-default-runtime.md` — az LDP a default futtatási mód
- `__agent/ENTRY.md` §0 — a napindítási újraindítás és a kivétele
- `current/principles/error-handling.md` — a néma hiba tiltása
