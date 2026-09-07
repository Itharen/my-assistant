# SSOT állapot-szinkron több session között — terv

> **Owner-kérés (2026-09-07 06:43):** *„Ahhoz, hogy majd a multisession-ös dolog is jól
> működjön, ahhoz valami utolsó aktuális infók, meg utolsó elvégzett feladatok, meg aktuális
> állapot, meg ilyesmik, az lehet, hogy nem ártana, hogy az jól szinkronban tartson mindent.
> Ugye, hogyha van egy SSOT infótár, akkor az mindenképpen segíteni fog majd a különféle
> sessioneknek a szinkronban tartásában."*

> **Státusz: TERV — jóváhagyásra vár.** *(`open-questions.md` L6/L7.)*

---

## 1. ⚠️ A csapda, amit el kell kerülni

**Egy ÚJ, kézzel vezetett „aktuális állapot" fájl NEM SSOT lenne — hanem a NEGYEDIK igazság**
a `STATUS.md`, a `CONTINUATION.md` és az action-log mellett.

| Miért rossz | |
|---|---|
| Senki nem garantálja, hogy **mindenki** frissíti | egy Codex-session, egy cron-futás vagy egy megszakadt kör kihagyja |
| Ami elavul, de **hitelesnek látszik** | ez rosszabb, mint ha nem is lenne |
| Több agent **egyszerre írja** | a markdown-nak nincs zárolása → **csendes felülírás** |

⇒ **A megoldás nem új fájl, hanem GENERÁLT NÉZET.**

---

## 2. A javaslat: `ma brief` — egyetlen belépő, generált kép

```
ma brief
   │
   ├── MI TÖRTÉNT UTOLJÁRA      ←  __agent/log/actions/*.jsonl      (append-only)
   ├── MI A NYITOTT MUNKA       ←  organizer (fo) + __agent/CONTINUATION.md
   ├── MI A CSATORNA-ÁLLAPOT    ←  ma comm doctor
   ├── MI VÁR RÁM (owner)       ←  current/open-questions.md (open tételek)
   └── KI DOLGOZIK ÉPPEN        ←  session-regiszter (lásd §3)
```

⭐ **Minden session ezzel kezd** — így ugyanazt a képet látják, és nincs miből szétcsúszni.

### Miért az action-log a GERINC

| Tulajdonság | Következmény |
|---|---|
| **Append-only JSONL** | ⭐ **több agent egyszerre írhatja** ütközés nélkül |
| Már most **minden akcióhoz** készül | nem kell új fegyelem, csak olvasás |
| Idő-rendezett, `actor` mezővel | megmondja, **ki** csinálta és **mikor** |

⇒ A napló **MÁR MOST a legmegbízhatóbb közös igazságunk** — csak még nincs belőle
ember-olvasható kép. A `brief` ezt a hiányt tölti be.

⚠️ **A markdown-fájlok (`STATUS.md`, `CONTINUATION.md`) megmaradnak**, de a szerepük
tisztázódik: **emberi összefoglaló és szándék**, nem esemény-igazság. Ütközésnél **a napló nyer**.

---

## 3. Session-regiszter — ki dolgozik éppen

Enélkül két agent ugyanabba a fájlba nyúl.

```
~/.config/my-assistant/sessions/<agent-id>.json
   { agent, kind: "cc"|"codex"|"cron", startedAt, lastSeenAt, workingOn }
```

- minden agent **periodikusan frissíti** a sajátját *(ugyanaz a minta, mint a Discord-életjel)*,
- a `brief` kiírja, ki **friss** *(< 5 perc)*,
- ⚠️ **elavult bejegyzés = halott session**, nem „foglalt" — az óvatos irány.

---

## 4. Mi NEM lesz ettől megoldva

⛔ **Ez nem zárolás.** Két agent továbbra is **egyszerre írhat** ugyanabba a markdown-ba —
a regiszter csak **láthatóvá teszi**, hogy van másik. A tényleges védelem külön kérdés
*(`open-questions.md` L4)*.

⛔ **Nem helyettesíti a dokumentációt.** A `brief` **pillanatkép**; a döntések és a szabályok
SoT-ja továbbra is a verziókezelt dokumentum *(`core-document-everything`)*.

---

## 5. Sorrend

| # | Lépés | Miért ebben a sorrendben |
|---|---|---|
| 1 | **L1 — címke-alapú session-feloldás** | enélkül a Discord-kézbesítés attól függ, ki indította az LDP-t — ez a **működés** feltétele |
| 2 | **Session-regiszter** | ez adja a `brief` „ki dolgozik éppen" részét |
| 3 | **`ma brief`** | a fentiekre épül |

## Kapcsolódó

- `__documentations/dev/MULTI_SESSION.md` — mit bír ma a rendszer
- `current/principles/ssot.md` — az SSoT alapelv
- `__agent/log/actions/README.md` — a napló sémája
