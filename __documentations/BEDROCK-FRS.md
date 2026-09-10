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
| `BFR-MYASSISTANT-001` | `dc ldp`: make-before-break újraindítás (nulla kiesés) | `@futdevpro/cli-dynamo` | **critical** | 🔵 pending |

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


-->

---

---

### BFR-MYASSISTANT-001 — `dc ldp`: make-before-break újraindítás (nulla kiesés)

- **Target:** `@futdevpro/cli-dynamo` (`dc ldp` — live dev pipeline)
- **Status:** 🔵 pending
- **Raised:** 2026-09-08
- **Priority:** **critical**
- **Requested by:** owner (Tahi-Tóth Balázs), 2026-09-08 10:48 — szó szerint idézve lentebb

#### Need

Az LDP **ne állítsa le a szervert a ciklus ELEJÉN**. A futó példány szolgáljon ki mindaddig,
amíg a teljes ellenőrzés-sor (build + teszt + lint + review) le nem futott — és a leállítás +
újraindítás **csak a legvégén**, egyetlen rövid ablakban történjen.

> **Owner, 2026-09-08 10:48 (szó szerint):** *„ennek az egész kurva LDP-nek úgy kell működnie,
> hogy szépen lefut az összes build, az összes teszt, majd a végén elindítja a szervert, majd új
> triggerek érkeznek, és nem állítja le a szervert, csak újrafuttatja a buildeket, újrafuttatja a
> teszteket, és amikor rendezeknek a végére ért, akkor állítja le a szervert, és akkor indítja
> újra. Tehát tulajdonképpen **nulla kiesés**, és nem várunk minden szarra… De ez az LDP-nek a
> **default működése** kéne legyen."*

> **Owner, 2026-09-08 08:12:** *„semmit nem vehetsz ki… pont az a lényege a kurva LDP-nek, hogy
> lefuttatja az összes tetves kurva ellenőrzést, MIELŐTT újraindítaná a szervert."*

⛔ **A kérés NEM a lépések csökkentése.** A hossz nem hiba. A hiba a **kiesés helye**: a szerver
az elején áll le, nem a végén. *(Az agent 2026-09-08 10:03-kor tévesen lépés-eltávolítást
javasolt; az owner elutasította, a javaslat visszavonva.)*

#### Why — miért nem oldható meg a projekt repóból

A `serverRestart` viselkedést a **`dc` (cli-dynamo) vezérli**; a projekt `pipeline.config.json`-ja
csak `enabled` + `postPipelineCommand` szintű kapcsolót ad — a **leállítás időzítése** nem
konfigurálható belőle. Mérve 2026-09-08: a `status.json` `restartPending` mezője a ciklus elején
már `true`, a szerver-életciklus a `dc` kódjában dől el.

#### Mért hatás

| Mérés (2026-09-08 02:05) | Érték |
|---|---|
| Szerver-újraindítás összesen aznap | **38** |
| Ebből 22:00 óta (3,2 óra alatt) | **20** |
| Átlagos ciklus-köz | **10,1 perc** (min 5,5 · max 55,7) |
| Teljes pipeline-hossz | **~15+ perc** (`client-build` 536 s + `client-test` 377 s) |

🔴 **A döntő arány:** a ciklusok **gyakrabban indulnak**, mint amennyi idő **egy körhöz kell** ⇒ a
szerver — és vele a Discord-csatorna — az idő nagy részében **halott**.

⭐ **Nem regresszió, hanem a delegálás egyenes következménye:** az owner külön DEV-sessiont állított
a projektre, ami folyamatosan commitol, és minden commit új ciklust indít. A megoldás nem a
fejlesztés visszafogása.

**Üzleti következmény (mérve 2026-09-08 09:48):** az owner **21 üzenete torlódott fel 3 órán át**,
mert a szerver nem ért el futó állapotba. Saját szava: *„el se indul a My Assistant szerver, ezért
aztán nem kerülnek elküldésre neked ezek az üzeneteim..... 🙁"*

#### Proposed API

```jsonc
// pipeline.config.json
"serverRestart": {
  "enabled": true,
  "strategy": "make-before-break",   // ⭐ ÚJ — default legyen ez
  "postPipelineCommand": "…"
}
```

**Viselkedés `make-before-break` esetén:**

1. Trigger érkezik → a **futó szerver marad életben**, a ciklus mellette indul.
2. Minden lépés lefut — ⛔ **egyet sem hagyunk ki**, a `fatal: false` lépések is futnak.
3. Csak **zöld** sor végén: `stop` → `start`, egyetlen rövid ablakban.
4. Ha a sor **piros**: ⛔ **nincs újraindítás** — a régi, működő példány szolgál tovább.
   *(Ez járulékos nyereség: ma egy törött build is elveszi a csatornát.)*
5. Új trigger futó ciklus közben → a ciklus **újraindul**, a szerver **nem áll le**.

**Minimum-változat, ha a fenti túl nagy:** elég lenne a leállítás **átmozgatása** a ciklus
elejéről a végére. A kiesés így ~21 percről a puszta újraindulás idejére (~5-10 s) csökken.

#### Current workaround

⛔ **Nincs.** A projekt kompenzáló kontrollja — 12 órás Discord-backfill + `ma comm audit` — a
hiányt **utólag felderíti** (2026-09-08: 32/32 megvolt), de a **késleltetést nem szünteti meg**:
az üzenetek órákkal később érnek célba, és az owner addig válasz nélkül marad.

#### Bedrock response

*(a bedrock-agent tölti ki)*


---

#### ⚠️ MÉRÉS-KIEGÉSZÍTÉS 2026-09-08 16:13 — nem csak a szerver esik ki, hanem a **CLI is**

Az eredeti leírás a **szerver** kieséséről szól. Élő mérés közben kiderült, hogy a kár **tágabb**:

```
$ ma action-log emit …
cli bootstrap failed: Cannot find module '…/cli/dist/cli/src/main.js'
```

**Állapot ugyanekkor** (`logs/live-dev-pipeline/status.json`): `phase: tsc-cli`,
`pipelineComplete: false`, `serverRunning: true`.

🔴 **Az ok:** a ciklus **`rimraf-cli-dist`-tel KEZD** — letörli a `dist`-et, és csak a
`tsc-cli` végén áll helyre. Ebben az ablakban **minden**, ami a `dist`-ből fut, halott:

| Ami kiesik | Következmény |
|---|---|
| `ma comm say` | ⛔ **nem tudok üzenni az ownernek** |
| `ma comm doctor` · `ma status digest` | ⛔ a diagnosztika sem fut |
| **Discord-figyelő** *(`ma comm listen`)* | ⛔ a beérkező üzenetek sem érkeznek |
| `ma action-log emit` | ⛔ a naplózás is kiesik — **még a hiba sem naplózható** |

⭐ **Ez a `serverRunning: true` melletti csendes vakfolt:** az állapotfájl szerint „a szerver
fut", és ez **igaz is** — miközben a **kommunikációs csatorna teljes eszközkészlete** nem
elérhető. ⇒ Egy `serverRunning`-alapú ellenőrzés **nem** fogja meg ezt az ablakot.

📌 **Amit ez hozzátesz a kéréshez:** a make-before-break **nem elég**, ha csak a szerver-
folyamatra vonatkozik. A **build kimenete** (`dist`) is make-before-break kell legyen —
**új könyvtárba fordítunk, és csak készen cserélünk**, ahelyett hogy a régit **előre**
letörölnénk. *(`rimraf` → build → atomi csere.)*

⚠️ **Ez a mérés az eredeti kérést NEM váltja fel, hanem BŐVÍTI** — a prioritás változatlanul
**critical**.

#### 🔴 SÚLYOSBÍTÓ MÉRÉS 2026-09-08 20:04 — a vakablak nem másodperces, hanem **VÉGTELEN, ha a build elbukik**

Az előző kiegészítés azt írta le, hogy a `rimraf` **előre** törli a `dist`-et. Most kiderült a
**súlyosabb** eset: **ha a build ELBUKIK, a `dist` SOSEM épül újra** — a CLI tehát nem
„néhány percig", hanem **határozatlan ideig** halott.

**A mért eset** (`logs/live-dev-pipeline/status.json`, ciklus indult 19:07:24):

| Lépés | Eredmény |
|---|---|
| `rimraf-cli-dist` | ✅ 18 s — **a `dist` törölve** |
| `tsc-cli` | 🔴 **`failed`, 602,2 s** — `[tee-run] FATAL: timeout: command exceeded 600s — killing` |
| a ciklus | `phase: waiting-for-restart`, `pipelineComplete: false` |
| **A CLI állapota** | ⛔ **halott 19:07-től 20:04-ig — 57 percig**, amíg kézzel újra nem fordítottam |

**Az LDP saját őrének sora a bukás pillanatában:**
```
[tee-run] GUARD CRITICAL: CPU 32.8% · RAM 96.9% (126136/130153 MB) — RAM 96.9% >= critical 96%
[ldp] GUARD: the process tree of step 'tsc-cli' OUTLIVED the step (root PID 298888) - killed: 1/1
```

⭐ **Amit ez elvesz:** `ma comm say` *(nem tudok üzenni az ownernek)* · `ma comm doctor` ·
`ma status digest` · `ma action-log emit` *(még a hibát sem tudom naplózni)* · és a
**Discord-figyelő újraindulása** is meghiúsulna. ⚠️ A már **futó** figyelő túlélte — ezért az
üzenetek **beérkezni** tudtak volna; a **válasz** viszont nem ment volna ki.

#### ⚠️ AMIT NEM ÁLLÍTOK — és miért fontos

⛔ **NEM állítom, hogy a RAM az ok.** Ellenpélda ugyanabból az órából: **kézzel** ugyanaz a
fordítás *(`npx tsc -p cli/tsconfig.json`)* **22,5 s alatt** lefutott, **95,2 %-os RAM mellett**.

| Futás | Környezet | RAM | Idő |
|---|---|---|---|
| LDP-lépés | pipeline-on belül | **96,9 %** | 🔴 **> 600 s (kivágva)** |
| kézi | önállóan | **95,2 %** | ✅ **22,5 s** |

⇒ A fordítás **önmagában 22 másodperces munka**. Valami a 19:07-es ablakban **27-szeresére**
lassította. A RAM a legesélyesebb jelölt, de **1,7 százalékpont** különbségre ok-állítást
építeni felelőtlenség lenne *(`measure-the-effect-not-just-the-cause.md`)*.

#### 📌 Amit ez a kérésen VÁLTOZTAT

A make-before-break itt **nem kényelmi kérdés, hanem adatvesztés-megelőzés**:

1. **A `dist` cseréje legyen atomi** — új könyvtárba fordítunk, és **csak siker esetén** cserélünk.
   Így egy **bukott build nem visz magával egy működő CLI-t**.
2. **A bukott lépésnek vissza kell állítania az előző kimenetet** — ma a `rimraf` hatása
   **túléli** a bukást, és senki nem takarítja el.
3. ⭐ **A timeout ne csendben öljön:** a `tsc-cli` **10 percig** tartotta a ciklust, majd
   kivágódott — és a rendszer **nem jelezte**, hogy közben a CLI nem elérhető.

#### 📊 ADAT 2026-09-10 — a `tsc-cli` az LDP alatt **16×** lassabb, és a RAM NEM magyarázza

| Futás | Környezet | RAM | Idő |
|---|---|---|---|
| `tsc-cli` **LDP-lépésként** *(16:00-ás ciklus)* | pipeline-on belül | **49 %** | **355,9 s** |
| `tsc-cli` **LDP-lépésként** *(09-08 19:07-es ciklus)* | pipeline-on belül | 96,9 % | **> 600 s** *(timeout, kivágva)* |
| `npx tsc -p cli/tsconfig.json` **kézzel** *(09-08 20:04)* | önállóan | 95,2 % | **22,5 s** |

🔴 **Amit ez ELDÖNT:** a 2026-09-08-i „a RAM az ok" magyarázat **megdőlt**. Most **49 %-os**
RAM mellett is **356 s** — vagyis a lassulás **nem memória-nyomás**.

⚠️ **Amit NEM állítok:** nem tudom, mi okozza. Lehetőségek, amiket **nem mértem**:
a `tee-run` burkoló · a lépés-őr *(CPU/RAM mintavételezés)* · más `tsconfig`/inkrementális
beállítás a pipeline-ban · párhuzamos lépések CPU-versenye. ⛔ Ezt **a bedrock oldalán** lehet
megnézni, nálam nincs rálátás a lépés-futtatóra.

📌 **Miért fontos ez a kérésnek:** a make-before-break értéke **egyenesen arányos** ezzel az
idővel. Ha a `tsc-cli` **22 s**, a vakablak elviselhető; ha **356 s**, akkor a `dist` törlése
**hat percre** megvakítja a CLI-t — és a `600 s`-es timeout **karnyújtásnyira** van attól, hogy
a `dist` **egyáltalán ne épüljön újra** *(ez 09-08-án meg is történt: 57 perc halott CLI)*.

⭐ **Élő következmény ugyanezen a napon:** az owner **16:05-kor** kérdezte, hogy elindítottam-e
a szervert. A válasz **nem** volt — mert a szerver a **pipeline végén** indul, és a ciklus a
`tsc-cli` 356 másodperce miatt még a harmadik lépésnél tartott. A **6 órás kiesés után** ez
további percek némaság.
