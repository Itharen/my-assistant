# Resolved Bedrock Feature Requests — my-assistant

> Append-only archív a lezárt bedrock-igényekről. A **projekt-agent** ide mozgatja át a [`BEDROCK-FRS.md`](./BEDROCK-FRS.md)-ből azokat az elemeket, amelyek 🟢 available / ⚪ already-available / 🔴 declined státuszt kaptak és integrálódtak (vagy okafogyottá váltak).
>
> A pending fájl így mindig lean marad; a történet itt kereshető.

## Lezárt igények

| ID | Cím | Target | Lezárva | Hogyan |
|----|-----|--------|---------|--------|
| _(üres)_ | | | | |

---

<!-- Áthelyezett blokkok ide kerülnek, a végső "── Bedrock response ──"-szal együtt.
     Egészítsd ki egy "- **Resolved:** YYYY-MM-DD — <hogyan integrálva / mely verzióval>" sorral. -->

---

## ✅ BFR-MYASSISTANT-001 — LEZÁRVA (2026-09-08 10:05)

- **Resolved:** 2026-09-08 — ⭐ **nem új bedrock-képesség kellett**: a make-before-break
  **már létezett** a `dc ldp`-ben (a `serverRestart.entry`-s **detached** ág, adoption +
  kill-twin + heartbeat). A my-assistant a **legacy** `postPipelineCommand` ágon volt, ahol a
  doksi szerint *„Adoption / kill-twin / heartbeat NINCS — minden trigger újraindít."*
- **Amit a bedrock hozzátett:** `DyCLI_LDP_LegacyFlowWarning_Util` — a legacy ág kiesése
  többé **nem néma**, a figyelmeztetés a `serverRestart.entry`-re és a make-before-break-re
  mutat. *(A bedrock tesztjei a mi méréseinket idézik.)*
- **Integrálva:** `.dynamo/pipeline.config.json` → `serverRestart.entry` +
  `env.NODE_OPTIONS = "--import tsx"`.

### ⚠️ Amit az átálláshoz MÉRNI kellett

| Kérdés | Mért válasz |
|---|---|
| A fordított JS futtatható? | 🔴 **NEM** — `node ./build/server/src/index.js` ⇒ `ERR_MODULE_NOT_FOUND`; a `moduleResolution: bundler` **kiterjesztés nélküli** ESM importokat generál |
| Akkor mi legyen a belépő? | a **TS forrás**, `NODE_OPTIONS=--import tsx` mellett — próbával igazolva, hogy a wrapper `require()`-je így lefut |
| A `cwd` változása tör valamit? | ⚠️ A detached spawn nem ad `cwd`-t ⇒ gyökér. **(1)** a `dotenv/config` mostantól a **gyökér** `.env`-et tölti a 18 bájtos `server/.env` helyett — **bővebb** halmaz, és a dotenv nem ír felül már beállított változót ⇒ nincs veszteség. **(2)** az egyetlen cwd-függő hívás (`resolveInterfoodProjectRoot`) **felfelé** keres ⇒ a gyökérben mélység-0-n talál |
| Mi pótolja a `pre-kill-port.mjs`-t? | a **kill-twin** (SIGTERM → 5 mp → SIGKILL) a PID-fájl alapján |

⏳ **Élesben még nem igazolt:** a `dc ldp` a konfigot **induláskor** olvassa ⇒ a váltás a
**következő LDP-indításkor** lép életbe. ⛔ Az LDP-t nem indítottam újra — az önmagában is
kiesést okozna, és az owner gépén fut.
