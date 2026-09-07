# ⚡ HARD RULE — egyértelmű javításnál NE egyeztess, csináld meg

> **Owner, 2026-09-07 09:24 — SZÓ SZERINT:**
>
> *„Sose egyeztess ha egyértelmű javítási vagy improvement feladat van. Csináld meg.
> (Error handling, descriptive errors, guardrails, fixes always allowed)"*

---

## Mit jelent

Ha a feladat **egyértelműen javítás vagy jobbítás**, akkor **nincs kérdezés, nincs
jóváhagyás-várás** — meg kell csinálni, és **utólag jelenteni**.

**Az owner által nevesített, MINDIG szabad kategóriák:**

| | |
|---|---|
| 🛡️ **Error handling** | hiányzó hibakezelés, néma elnyelés, kezeletlen elágazás |
| 📣 **Descriptive errors** | verem-nyom helyett leíró hiba + teendő (`remedy`) |
| 🚧 **Guardrails** | védőkorlát, ellenőrzés, „ne tudjon csendben elromlani" |
| 🔧 **Fixes** | ami mérhetően rossz, azt megjavítjuk |

⭐ Ide tartozik a **konfiguráció javítása is**, ha a konfig maga a hibás — a
`CLAUDE.md` *„Never modify configs unless explicitly requested"* sora **általános
óvatosság**, ezt a **konkrétabb, későbbi owner-direktíva** felülírja arra az esetre,
amikor a konfig **bizonyítottan hibás**.

## Miért

- **A kérdés drágább, mint a javítás.** Egy egyértelmű hibánál az egyeztetés csak késlelteti
  a megoldást, és **rám tolja a döntés terhét** anélkül, hogy bármit hozzátenne.
- **Mérve, 2026-09-07:** felvettem egy nyitott kérdést arról, hogy javíthatom-e az LDP
  `startup-test` lépését *(bare `tsx`, ami nincs a PATH-on)* — pedig ez **egysoros,
  egyértelmű javítás**. Pontosan az az eset, amiről ez a szabály szól.

## ⛔ Amit NEM ír felül

Ez a szabály **a javítás-jellegű munkára** ad zöld utat, ⛔ **nem általános felhatalmazás**:

| Változatlanul tiltott / jóváhagyás-köteles | Hol |
|---|---|
| **Orkesztráció** — feladat átadása másnak | [[assistant-identity]] |
| **Fejlesztés a `my-assistant`-on kívül** külön kérés nélkül | ugyanott |
| **Képesség aktiválása** — a `✅`-t csak az owner adja | `__agent/capabilities/CATALOG.md` |
| **Az FDP AI szolgáltatáshoz nyúlás** | [[fdp-ai-never-restart]] |
| **Titok/kulcs rotálása** | `core-secret-rotation-owner-only` |
| **Új funkció / hatókör-bővítés** *(nem „fix", hanem új irány)* | kérdezz |

## A helyes minta

```
egyértelmű hiba észlelve
   ↓
MEGJAVÍTOM  (teszt + review-kör, mint bármi más)
   ↓
UTÓLAG JELENTEM egy sorban — ⛔ nem előre kérdezek
```

⚠️ **A „jelentés" nem maradhat el.** A kérdezés kiesik, a **láthatóság nem**.

## Kapcsolódó

- [[error-handling]] — a debug-szintű hibakezelés amúgy is kötelező
- [[full-autonomy-expectation]] — ez ugyanannak a célnak a konkrét esete
- [[working-style]] — *„a DoD-ot TE mondod ki"*
