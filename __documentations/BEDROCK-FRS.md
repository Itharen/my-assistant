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
| BFR-MYASSISTANT-001 | LDP: make-before-break szerver-újraindítás | `@futdevpro/cli-dynamo` | **critical** ⬆️ | 🟢 available-fixed — a kepesseg mar letezik (`entry`), a csapda mostantol NEM nema |

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

### BFR-MYASSISTANT-001 — LDP: a régi szerver csak akkor álljon le, amikor az új TÉNYLEG indulhat

- **Target:** `@futdevpro/cli-dynamo` (`dc ldp`)
- **Status:** 🟢 available-fixed — a kepesseg mar letezik (`entry`), a csapda mostantol NEM nema
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

  - _(még nincs)_

  **── Bedrock response ──** _(2026-09-08)_
  - ⭐ **A kepesseg MAR LETEZIK — es pontosan az, amit az owner leirt.** A `serverRestart.entry`
    mezos **DETACHED** agban a regi szerver a STEPS alatt vegig kiszolgal (adoption), es a csere
    (kill-twin → spawn) csak a build/test zoldje UTAN tortenik. A kod doksija szo szerint igy
    fogalmaz: „adopt MINDIG → swap”.
  - ⚠️ **Ti a LEGACY agon vagytok.** A `.dynamo/pipeline.config.json`-otok:
    `{ enabled: true, postPipelineCommand: 'npm --prefix server run start-prod' }` — **`entry`
    nincs**. A legacy agban a szerver a wrapper GYERMEKE, es a watchdog a trigger eszlelesekor
    AZONNAL `SIGTERM`-et kuld, majd a wrapper kilep; az uj szerver csak a KOVETKEZO pipeline
    VEGEN indul. ⭐ **Ez pontosan a mert 15–18 perc**, es nem hiba, hanem a legacy ag beepitett
    tulajdonsaga (a tipus-doksi is kimondja: „Adoption / kill-twin / heartbeat NINCS”).
  - **A TEENDO NALATOK egyetlen konfig-valtozas:** `postPipelineCommand` helyett `entry`, a
    szerver belepesi pontjara mutatva (pl. `./build/src/index.js`). Ezzel a Discord-figyelo es a
    hang-csatornai jelenlet a pipeline alatt is el marad.
  - **AMIT A BEDROCKBAN JAVITOTTAM** (`cli-dynamo` `1beb939e`, verzio **01.15.294**): a bedrock-hiba
    nem a hianyzo kepesseg volt, hanem hogy **ez a csapda NEMA**. A pipeline zolden fut, semmi nem
    jelzi — ti is csak **17 hang-csatorna ledobasbol** vettetek eszre. Mostantol a legacy ag
    INDULASKOR kimondja: mi tortenik, hogy ez csendes, es hogy az `entry` ad make-before-break
    ujrainditast. ⭐ A figyelmeztetes nem tilt es nem valtoztat viselkedest — **atiranyit**.
  - **6 uj spec**, kozte a ti MERT konfiguraciotokkal. Verifikalva: `npx tsc` 0 hiba,
    **2071 spec / 0 bukas**.
  - ⭐ **A meresetek dontott.** A „18 perc kieses” + „17 ledobas/nap” + az owner szo szerinti
    idezete nelkul ez konnyen „tuning-kerdesnek” latszott volna; igy viszont egyertelmu volt, hogy
    a ket ag kozotti valasztas nem izles kerdese.
