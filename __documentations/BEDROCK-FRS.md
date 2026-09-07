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
| BFR-MYASSISTANT-001 | LDP: make-before-break szerver-újraindítás | `@futdevpro/cli-dynamo` | high | 🔵 pending |

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

  **── Bedrock response ──** _(a bedrock-agent tölti)_
  - <státusz-frissítés / pointer: commit-hash, package-verzió, meglévő API neve / "use X instead">

-->

---

### BFR-MYASSISTANT-001 — LDP: a régi szerver csak akkor álljon le, amikor az új TÉNYLEG indulhat

- **Target:** `@futdevpro/cli-dynamo` (`dc ldp`)
- **Status:** 🔵 pending
- **Raised:** 2026-09-07
- **Priority:** high
- **Need:** Az LDP **make-before-break** újraindítást végezzen: fusson le a teljes pipeline, és a
  régi szervert **csak akkor** állítsa le, amikor az újat ténylegesen indítaná.

- **Why — MÉRT hatás, nem elméleti:**
  A my-assistant szerver **élő, felhasználó felé néző szolgáltatásokat gazdál**: a Discord-figyelőt
  *(ezen érkeznek az owner üzenetei)*, a jelenlét-figyelőt és a hang-csatornai jelenlétet.
  Amíg a pipeline fut, ezek **nem élnek**.

  | Mérés (2026-09-07) | Érték |
  |---|---|
  | Discord-figyelő kiesése egy cikluson át | **18 perc** |
  | Hang-csatornából ledobás | **17× egy nap alatt** *(= 17 LDP-ciklus)* |
  | A pipeline hossza | `client-build` 536 s + `client-test` 377 s ≈ **15 perc** |

  ⚠️ **A kiesés CSENDES:** az owner Discord-üzenete ilyenkor nem érkezik meg időben, és kívülről
  pontosan úgy néz ki, mintha nem is írt volna. *(A 12 órás backfill pótolja, tehát nem vész el —
  de késik.)*

  **Owner szó szerint (2026-09-07 21:20):**
  > *„Úgy látom amúgy, hogy a Voice Channel-ről ledroppolódsz. Lehet, hogy az LDP restart miatt?
  > Elméletileg az LDP-restartnak amúgy úgy kéne működnie, hogy először lefut minden, és amikor
  > már ténylegesen el akarná indítani a szervert a friss verzióval, csak akkor állítsa le a régit."*

  **Miért nem oldható meg a projekt repóján belül:** az újraindítás sorrendjét a `dc ldp` vezérli
  (`serverRestart` / `postPipelineCommand`), nem a projekt kódja. A projekt oldaláról csak a
  **tünet** kezelhető *(pl. a figyelő kiszervezése külön folyamatba)* — az viszont megbontaná az
  owner által kimondott felépítést, hogy **a szerver a gazda**
  (`current/principles/ldp-default-runtime.md`).

- **Proposed API:** `serverRestart.strategy: "make-before-break" | "stop-first"` a
  `pipeline.config.json`-ben, alapértelmezés a mostani viselkedés *(visszafelé kompatibilis)*.
  ⚠️ Portütközésnél a `stop-first` marad az egyetlen járható út — ezt a bedrock-agent tudja
  megítélni, mi nem.

- **Current workaround:** nincs. A kiesés minden ciklusban megtörténik; a hatását a 12 órás
  Discord-backfill és a `ma comm audit` **utólag** fedi fel, de nem előzi meg.

  **── Bedrock response ──** _(a bedrock-agent tölti)_
  - _(még nincs)_
