# Pending Bedrock Feature Requests — my-assistant

> Kommunikációs csatorna a projekt és a **bedrock package-ek** között
> (**Dynamo:** `@futdevpro/fsm-dynamo`, `nts-dynamo`, `ngx-dynamo`, `cli-dynamo`, `dynamo-builder-models` ·
> **FDP Templates:** `@futdevpro/fdp-templates`, `nts-fdp-templates`, `ngx-fdp-templates`, `fdp-cli`).
>
> **Projekt-agent:** ide gyűjtsd a bedrock-ba szükséges fejlesztési igényeket — a projektből NEM módosíthatod a `NPM-packages/*` repókat. **CSAK pending elemek.** Ami elkészült (🟢/⚪) → **vágd át** a [`BEDROCK-FRS-RESOLVED.md`](./BEDROCK-FRS-RESOLVED.md)-be.
> **Bedrock-agent:** olvasd, és töltsd ki a "Bedrock response" blokkot (státusz + pointer: commit/verzió/meglévő API).
>
> Teljes protokoll: `fdp-documentations/guidelines/development/bedrock-feature-requests.md`

## Index

| ID | Cím | Target | Prio | Státusz |
|----|-----|--------|------|---------|

## Státusz-legenda

🔵 pending · 🟡 acknowledged · 🟠 in-progress · 🟢 available (→ RESOLVED-be) · ⚪ already-available (→ RESOLVED-be) · 🔴 blocked/declined

---

<!-- SABLON — másold lejjebb, töltsd ki, és vedd fel az Index táblába:

### BFR-MYASSISTANT-001 — <rövid cím>
- **Target:** @futdevpro/<package>
- **Status:** 🔵 pending
- **Raised:** YYYY-MM-DD
- **Priority:** high | medium | low
- **Need:** <milyen képességre van szükség>
- **Why:** <use-case; miért nem oldható meg a projekt repón belül>
- **Proposed API:** <javasolt signature / shape — opcionális>
- **Current workaround:** <ha van ideiglenes megoldás a projektben>


  **── MÉRÉS-FRISSÍTÉS 2026-09-08 02:05 — a helyzet ROMLOTT, és megvan az ok ──**

  ⚠️ **A prioritás emelendő.** Az eredeti mérés (18 perces kiesés, 17 újraindítás/nap) **egy
  fejlesztőre** vonatkozott. Azóta az owner **külön DEV-sessiont** állított a projektre, ami
  önállóan és folyamatosan commitol — **minden commit új LDP-ciklust indít**.

  | Mérés (2026-09-08 02:05) | Érték |
  |---|---|
  | Szerver-újraindítás **összesen** | **38** |
  | Ebből **22:00 óta** *(3,2 óra alatt)* | **20** |
  | **Átlagos ciklus-köz** | **10,1 perc** *(min 5,5 · max 55,7)* |
  | A figyelő aktuális kiesése | **23 perc** *(korábban 7, majd 18)* |

  🔴 **A DÖNTŐ ARÁNY:** a teljes pipeline **~15+ perc** *(client-build 536 s + client-test 377 s)*,
  a ciklusok viszont **10 percenként** indulnak ⇒ **a szerver gyakrabban indul újra, mint amennyi
  idő egy körhöz kell**. A csatorna így az idő nagy részében **halott**.

  ⭐ **Ez nem regresszió, hanem a delegálás egyenes következménye** — és pontosan azért fájó, mert
  a delegálás egyébként **működik** *(a DEV érdemi, jó munkát ad ki)*. A megoldás nem a fejlesztés
  visszafogása, hanem a **make-before-break** újraindítás.

  📌 **Kompenzáló kontroll, ami MŰKÖDIK, de nem elég:** a 12 órás Discord-backfill + a
  `ma comm audit` **utólag** felderíti a hiányt *(ma 32/32 megvolt)* — de a **késleltetést** nem
  szünteti meg.


-->

---
