# CHANGELOG — `my-assistant`

> Verzió-bump log. Minden release / jelentős milestone egy-egy entry. Format: SemVer + dátum + summary + linkek.

---

## A Discord-HANGUZENET vegig mukodik (C-33 kesz) — 2026-09-07

> **Owner:** *„Folytasd a discord STT fejlesztest amig kesz nincs"*

```
Discord hanguzenet -> szuro -> letoltes -> FDP AI STT -> TUKOR-UZENET -> megjelolt atirat a kotegbe
```

### 🔴 A BLOKKOLO, amit ez feltart

A Discord hanguzenete **URES `content`-tel** erkezik — a hang egy csatolmany. A bejovo
szuronk viszont az ures tartalmat *„Ures uzenet (pl. csak csatolmany) — nincs mit atadni"*
indokkal **elutasitotta**. Vagyis a hanguzenetek **SOSEM jutottak el hozzam**, es kivulrol
ez pontosan ugy nezett ki, mintha nem is kuldott volna semmit. Regresszio-teszt orzi.

### Amit a megoldas tartalmaz

- **`discord.voice-message.ts` (uj):** hang-felismeres (`contentType` ES kiterjesztes alapjan
  is — egyik sem megbizhato onmagaban), csatolmany-valasztas, letoltes, es a kotegbe kerulo
  szoveg **megjelolese**.
- **A szuro** mostantol elfogadja a hangot — de a **biztonsagi hatar valtozatlan**: a hang nem
  keruli meg a kuldo- es csatorna-ellenorzest (3 kulon teszt orzi).
- ⭐ **Bizonytalan vagy sikertelen felismeresnel a kotegbe SEMMI nem kerul.** A tukor kimegy
  (*„NEM cselekszem ra"*), es varunk. Egy felrehallott mondat a kotegben mar az owner
  **szo szerinti utasitasanak latszana**.
- **A kotegbe kerulo szoveg megjelolt:** `🎙️ HANGÜZENET — gépi átirat …, NEM gépelt szöveg`.

### Vedokorlatok (owner: *„guardrails … always allowed"*)

- max **25 MB** — es a **letoltott MERET** is ellenorizve, nem csak a Discord allitasa;
- **60 mp** letoltesi idokorlat; ures fajl = hiba, nem csendes tovabbengedes;
- **duplikatum-szures a DRAGA lepes ELOTT** — a Discord ujrakuldhet egy esemenyt, es enelkul
  masodik tukor-uzenet menne ki + ujabb ~78 mp felismeres futna;
- a duplikatum-halmaznak **felso hatara** van (nem szivargo memoria);
- ⛔ a csatolmany-linkek **nem kerulnek a koteg-fajlba** (alairtak es lejarnak).

### A backfill is ezen az uton megy

Mert kulonben a leallas alatt erkezett hanguzenet **ures tartalommal** kerult volna a kotegbe —
vagyis a backfill pont azt veszitette volna el, amiert letezik.

### Mellesleg: az LDP `startup-test` lepese ujra ZOLD

Bare `tsx`-et hivott, ami nincs a PATH-on -> `npx tsx`. Allandoan piros volt (`fatal:false`,
ezert nem blokkolt). Most **8 teszt / 0 bukas**. Owner-szabaly szerint jarva el:
*„Sose egyeztess ha egyertelmu javitasi vagy improvement feladat van. Csinald meg."*

Teszt: CLI **392/392** (26 uj).

---

## STT elo igazolas + a konzol-pulzus (C-33 / C-44) — 2026-09-07

> **Owner:** *„Majd szeretnem, hogy egy sor logot is tegyunk a My Assistant projektbe, hogy amikor
> ranezek a konzolra, az is arulkodjon nekem arrol, hogy mi minden tortenik a rendszerben."*

### C-44 — `SystemPulse_Service` (uj)

- **Percenkent EGY sor** a szerver konzoljan: ora - futasido - Discord-figyelo - jelenlet -
  varakozo koteg - utolso kimeno uzenet.
- 🔴 **A VALOSAGOT meri, nem a konfiguraciot:** az eletjel- es minta-fajlok FRISSESSEGEBOL dolgozik.
  Nem azt kerdezi, „be van-e allitva", hanem azt, hogy „EL-E MOST". Baj eseten 🔴 / ⚠️ jelenik meg
  a sorban, tehat egy pillantas eleg.
- **Miert kellett:** a szerver konzolja addig EGYETLEN sort irt (indulas), utana nema volt — es a
  nemasag meg a „minden rendben" kivulrol megkulonboztethetetlen. Pontosan ez tartotta a
  jelenlet-figyelot 112 napig halottan.
- Nem duplikal uzleti logikat: a valasz-kotelezettseg megitelese tovabbra is a `ma comm doctor`
  dolga (SSOT). A pulzus csak nyers tenyeket mutat.
- Az utvonal-feloldok **exportalva** lettek (`resolveListenerHeartbeatFile`, `resolvePresencePaths`)
  ahelyett, hogy harmadszor is bemasoltuk volna oket.
- **14 uj teszt** — a hiba-agakra (halott figyelo, elavult meres, varakozo koteg) legalabb annyi
  jut, mint a boldog utra. Szerver: **42/42 zold**.

### C-33 — az STT ELO, vegponttol vegpontig probaja SIKERES

- **Modszer:** a Windows SAPI-val generalt **ismert szovegu** WAV -> sajat kliens -> FDP AI ->
  az atirat **szorol szora** osszevetve az eredetivel.
- `"Please check when the next train departs to Budapest."` -> ugyanez jott vissza (a zaro pont
  nelkul), `status: processed`, 77,6 mp. A hallucinacio-or helyesen NEM jelolte gyanusnak.
- A **timeout-ag is igazolt**: 5 perc utan leiro eredmenyt adott, es a tukor-uzenet helyesen
  megtagadta a talalgatast.

### 🔴 Egy hibas diagnozisom javitva — a RAM, nem a GPU

> **Owner:** *„Az FDP AI vegpontja lehet lassu, amikor nagy a RAM usage (90% usage felett, varakozik)"*

- **Megmerve:** RAM **93%** (118/127 GB) -> ugyanaz a fajl 5 perc alatt sem futott le; kozvetlenul
  utana 77,6 mp; terheletlenul ~2 s.
- Korabban a GPU-t mertem (5% kihasznaltsag) es ebbol arra jutottam, hogy „beragadt zar" — es
  majdnem a szolgaltatas ujrainditasat kertem. **A rendszer-RAM-ot nem mertem meg.**
- ⭐ **Tanulsag:** ha egy alrendszer „var", ne az elsokent eszedbe juto eroforrast merd meg, hanem
  MINDET, mielott kovetkeztetsz. Bekerult a kliens `remedy` szovegebe is, hogy a hibauzenet maga
  vezesse ra a kovetkezo olvasot.

---

## Az LDP a default futtatasi mod + a jelenlet-figyelo is a szerver ala kerult — 2026-09-06

> **Owner:** *"btw amugy is ez kene legyen az alap/default LDP mukodes... Azt a jelenletfigyelot is
> vagy integralni kene a My Assistant szerverbe, vagy neki kene inditania."*

- **Uj alapelv:** `current/principles/ldp-default-runtime.md` — az alapallapot, hogy **fut az LDP,
  sajat lathato terminalablakban**, es **alatta el minden hatter-figyelo**. Az agent inditja, ha
  nem fut; az agent igazodik hozza, nem forditva. Hivatkozva a `CLAUDE.md` / `AGENTS.md` parbol.
- **`SupervisedChild` (uj, kozos vaz):** a Discord-figyelo utan a jelenlet-figyelo lett a MASODIK
  felugyelt gyermek. A lassulo ujrainditas, a kimenet-megorzes es a "fut-e mar mashol?" logika
  **kiemelve kozosbe** — ket masolat garantaltan szetcsuszott volna.
- **`PresenceMonitor_Service` (uj):** a szerver futtatja es felugyeli a
  `server/activity-monitor/logger.ps1`-et. A Win32-es merest **nem irtuk ujra TypeScriptben**.
  🔴 **Miert kellett:** ez a figyelo **112 napig volt halott**, mert az inditasa egy utemezett
  feladaton mult, amit senki nem ellenorzott — es enelkul a hangszoros kapu TILT.
  "Fut-e mar mashol?": a legfrissebb minta-fajl 3 percnel frissebb-e (tiszta fuggveny, tesztelt).
  Az utemezett feladat innentol **tartalek**, nem az elsodleges ut.
- **LDP-blokkolo feloldva:** a `cli/src/interfood/interfood.api-client.ts`-ben ket parhuzamos
  session mindegyike hozzaadott egy `getImageUrl`-t (TS2393) -> a `tsc-cli` fatal lepes dolt, es
  az LDP **22 oran at** allt. **Nem valasztottunk a ketto kozul — osszevontuk:** a 960x640
  alapertek az egyikbol, a teljes parameter-ellenorzes + `URLSearchParams` a masikbol.
- **Elo igazolas:** a teljes LDP-kor **1370 mp alatt, minden lepes zold** (`cli-test` 345/345),
  a vegen a szerver elindult es 8 mp mulva hozta a Discord-figyelot.
- **Teszt-allas:** CLI **345/345**, szerver **28/28** zold.
- ⚠️ **Mert figyelmeztetes:** a teljes kor hosszu (`client-build` 536 s, `client-test` 377 s), es
  a build alatt a gep **95%-on allt RAM-ban**. Fejlesztes kozben ehhez kell igazodni.

---

## A Discord-csatorna ÖNMŰKÖDŐVÉ vált — a szerver a gazda + „gépel…" — 2026-09-06

- **🔴 A figyelő gazdája a SZERVER** (owner-kérés: *„a szervernek kéne futnia, a szervernek kéne
  ezt figyelnie… LDP-vel, hogy folyamatosan fusson"*). Új:
  `server/src/_services/discord-listener.service.ts` — a `WeatherPoll_Service` mintájára
  boot-időben induló singleton, ami a CLI-figyelőt **gyermek-folyamatként** futtatja és felügyeli.
  ⛔ A figyelő logikája **nem másolódott** a szerverbe: egy forrás, egy igazság.
  - Összeomlás után **újraindít**, lassuló ütemben (5 mp → ×2 → max 5 perc); 60 mp-nél hosszabb
    futás után a várakozás nullázódik.
  - A hiba-bejegyzésbe beteszi a gyermek **utolsó 12 kimeneti sorát** — így a naplóból kiderül,
    MI hiányzott, nem csak az, hogy „meghalt".
  - Friss **idegen életjel** esetén nem indít másodikat; az életjel mostantól a **PID-et** is
    tartalmazza, így egy épp elhalt figyelő jele nem mutatja percekig „foglaltnak" a csatornát.
- **🔴 KRITIKUS HIÁNY JAVÍTVA — a kiküldés eddig KÉZI volt.** A figyelő csak **gyűjtött**; a
  köteg átadásához valakinek le kellett futtatnia a `ma comm flush`-t. Vagyis még futó figyelő
  mellett is a köteg-fájlban álltak volna az üzenetek, miközben kívülről ez pontosan úgy néz ki,
  mintha meg sem érkeztek volna. **Mostantól automatikus, 15 mp-enként.** A kiküldési hiba
  naplózva van (első alkalommal azonnal, utána legfeljebb 5 percenként), és az üzenetek a
  kötegben **maradnak** — nem vesznek el.
- **⌨️ „Gépel…" visszajelzés** (owner-kérés: *„vagy dolgozol, vagy valami visszajelzést… egy
  typing üzét küldhetnél… Ugye az egy idővel le is jár, ilyenkor frissíteni kell"*). Új:
  `cli/src/discord/discord.typing-indicator.ts`. Akkor jelez, ha **van várakozó üzenet** vagy
  **válasz-tartozás**; **7 mp-enként** frissül (a Discordé ~10 mp után lejár); **15 perc** után
  biztonsági szeleppel leáll — az örökké gépelő bot félrevezetőbb, mint a néma. 11 új teszt.
- **Élő igazolás (2026-09-06 22:33):** a szerver elindult → felügyelt figyelőt indított → a
  visszamenőleges beolvasás behozta a 2 kimaradt üzenetet → **automatikusan** átment a CC
  sessionbe (`deliveredCount: 2, queued: true`), emberi beavatkozás nélkül.
- **Teszt-állás:** a teljes CLI-suite **344/344 zöld**.
- ⚠️ **Nyitott blokkoló:** a `cli/src/interfood/interfood.api-client.ts`-ben **két** `getImageUrl`
  van (TS2393, másik session commitolatlan munkája). Ez elhasalasztja a `tsc-cli` lépést, ami az
  LDP-ben `fatal` — ezért az **LDP jelenleg nem tud végigfutni**, és a szervert közvetlenül kell
  indítani. Owner-döntésre vár (`current/open-questions.md` H).

---

## Kommunikációs csatorna alapok — CCAP-híd, hangszórós kapu, tick — 2026-09-06

- **Saját CC session-önazonosítás** (`ma ccap whoami` / `runtime`): a `CLAUDE_CODE_SESSION_ID`
  futásidejű összepárosítása a CCAP `/api/cc-session` rekordjával. Semmi beégetett azonosító.
- **Discord-kötegelő** (`cli/src/discord/`): a bejövő üzenetek lemezen gyűlnek, és **EGYETLEN**
  prompttá összefűzve mennek be a CCAP hivatalos `prompt` végpontján — mert minden prompt egy
  külön futás. Üzenet nem veszhet el: a köteg csak igazolt átadás után ürül.
- **🔴 Hangszórós kapu** (`cli/src/cast/notify.presence-gate.ts`): a `ma cast notify` mostantól
  **csak ÉBREN + ITTHON** állapotban szólal meg. Ismeretlen jel ⇒ **tilt**. Kézi felülbírálás
  `--force`-szal, mindig naplózva. Korábban a bemondás útján **semmilyen kapu nem volt**.
- **Csatorna-diagnosztika** (`ma comm doctor`): tételesen mi él, mi hiányzik, és **mi a teendő**.
  Az `unknown` külön állapot — ami nem mérhető, az sosem látszik „rendben"-nek.
- **Státusz-kivonat** (`ma status digest`): elmúlt / egy órán belül / ma / dátum nélküli magas
  prioritású, az organizerből mint elsődleges forrásból. Forrás-hiba esetén **HIÁNYOS** jelzés.
- **Assistant-tick** (`ma tick plan`, száraz futás): Daytime/Nighttime ág **az ébrenléthez**
  kötve, nem napszakhoz; csatorna-választás; ismétlés-elnyomás; minden döntés naplózva —
  a csendes tick is.
- **Javított mért hibák:** a státusz-kivonat **nem lapozott** (131 feladatból 10-et látott) ·
  a jelenlét-olvasó éjfélkor hamis „nincs mérés"-t adott volna · a kapu összeomlott volna
  olvasási hibánál.
- **Discord-figyelő** (`ma comm listen`, `discord.js` 14.27): csak az owner üzenetei, csak a
  dedikált csatornából; a saját bot üzenetei kiszűrve (visszhang-hurok). A figyelő **csak a
  kötegbe tesz** — szerkezetileg nem tudja megkerülni a CCAP-ot.
- **Életjel a figyelőhöz:** 60 mp-enként frissülő jel, és a `comm doctor` a jel
  **frissességét** nézi — nem a konfiguráció meglétét. Egy csendben elhalt figyelő így
  nem néz ki úgy, mintha az owner nem írt volna. *(A jelenlét-figyelő 112 napig volt
  halott pontosan ilyen jel hiányában.)*
- Tesztek: **78 új spec**, mind zöld.

## LinkedIn semantic reply triage — 2026-09-06

- Split latest-inbound technical candidacy from the message-bound semantic `needsReply` decision.
- Added agent-neutral `ma linkedin review list|apply`, explainable categories/confidence/reasons, stale-review
  invalidation and idempotent agent drafts tied to the reviewed latest message.
- Backfilled the live 90-day inbox: 5 reply-worthy conversations and drafts; automated, closed and duplicate
  threads no longer pollute **Válaszra vár**.
- Made the workspace show review state, semantic reason and stale/current draft state, and distinguish Chrome Side
  Panel availability from the normal-tab fallback.
- Added full internal review-list pagination and LI-J08 semantic state-carrying journey coverage.

## LinkedIn guided manual-send workspace — 2026-09-05

- Added the responsive Angular `/linkedin` inbox/thread/draft workspace over the existing official read-only cache.
- Added explicit pagination, 90-day needs-reply default, CV checkpoint, clipboard flow and truthful
  `manual-send-reported` local evidence.
- Added the vendor-neutral `My Assistant Companion` MV3 Chrome Side Panel extension. It has no LinkedIn host
  permission/content script and never reads, fills or sends through LinkedIn.
- Pinned the companion's stable extension ID and scoped iframe permission to that exact origin on the dedicated
  side-panel surface; ordinary app routes retain `SAMEORIGIN`.
- Added an idempotent, health-gated TypeScript launcher behind `npm start` and `npm run start:agent`; it waits for
  the actual HTTP-listening event rather than the LDP's earlier process-start flag.
- Added manifest/security tests and LI-J07 state-carrying happy/restricted/restart variants with cleanup.
- Added the operational runbook and wired the extension/startup checks into the normal root and LDP gates.

## Interfood agent-independent ordering toolkit — 2026-09-01

- Added browser-free `ma interfood last-minute` live inventory reading for expired normal-order deadlines, with
  exact occurrence/order-window normalization, empty-inventory warning and IF-J08 regression variants.
- Added a non-cancellable Last Minute finalization gate (fresh inventory read + dedicated owner confirmation) and
  fixed 🍲 soup / 🍰 dessert owner-review markers.
- Refined owner-review ranking so explicit favorites remain selected with visible warnings (hard rejects still
  exclude), added exact Mexican meat-and-bean tortilla plus quinoa/bulgur preferences and the lecsó-over-
  Székelykáposzta pairwise decision, changed the health marker to 🥦, and removed empty soup/dessert placeholders.
- Added agent-neutral `ma interfood weeks|menu|menu-range` commands against Interfood's first-party public API.
- Normalizes weekly occurrence/food IDs, category context, prices, ingredients and component-level portion/per-100g nutrition.
- Live smoke verified current plus two following enabled weeks (2026-W36..W38, 482 rows each).
- Added schema/dedup tests, a state-carrying current-week → available-weeks → menu-normalization journey and an explicit partial-availability variant.
- Added HP-IF-001 and the operational CLI runbook; authenticated order history, preferences and mutations remain gated later phases.
- Promoted cart composition and already-submitted order modification to mandatory capability scope, with separate
  reversible-draft and financial-preview/approval/readback state machines.
- Added explicit `small | full | mixed | unspecified` portion classification while preserving raw menu categories;
  regression coverage proves same-food/same-date full and small occurrences remain separate.
- Defined full paginated order-history identity and coverage rules: order/menu/line/date/portion/quantity are never
  collapsed by food ID or name, and a same-day quantity of two remains two ordered units.
- Added the persistent dedicated UBH account bridge with an exact Interfood endpoint allowlist; browser token and
  `_capuid` stay inside the extension and secret-like response fields are redacted.
- Added full 2022→current+1 order-history pagination/cache, coverage, food fingerprint registry, explicit preference
  graph with cycle detection, explainable variety/health ranking and nutrition comparison.
- Added convergent cart quantity writes with authoritative readback and submitted-order immutable preview → exact
  hash approval → apply → final order-details receipt.
- Added complete desired-cart `diff`/bounded `reconcile`, order cancellability + overlap fail-closed checks,
  hash-bound item/financial diffs and persisted final-readback mismatch diagnostics.
- Added the `interfood-ordering` operational flow, Source-of-Truth split, journey catalogue and regression tests.
- Live authenticated sync calibrated 71 unique orders, 664 unique lines and 723 active units without duplicate
  fingerprints; current-week quantity-two lines remain distinct and are not double-counted from shared cart data.
- Live submitted-order reduction preview calibrated changed-row-only provider payloads and normalized total,
  instant and pending refund effects. Apply now revalidates order/safety/financial state before approval issuance.
- Only the explicitly owner-approved reversible write canary remains an environment release gate; no live apply ran.

## Organizer stock mirror CLI — 2026-08-23

- Added workspace-ready `pnpm stocks:mirror` and the optional linked-CLI form `ma stocks mirror` for complete cursor-aware Organizer stock and stock-item mirroring.
- Added atomic snapshot replacement at `current/stock/organizer-mirror.json`, dry-run support and structured errors.
- Added per-feature variants plus a state-carrying refresh journey; every invocation emits action-log events.
- The generated mirror is isolated from the manually maintained `current/stock/items.md` recovery/working mirror.

## Gmail forwarding policy — 2026-08-12

- Added `EMAIL-FORWARDING-SETUP.md` as the source of truth for the main-mailbox access boundary, forwarding verification state, `NO_SAFE_FORWARD` audit label, exclusion queries, and staged rollout.
- Global forwarding remains disabled; no source-mailbox access was granted to the assistant.

## 0.1.0 — 2026-05-08 — Initial tri-tier skeleton

**Sub-projekt verziók (mind 0.1.0):**
- `cli/package.json` → `@my-assistant/cli` v0.1.0
- `server/package.json` → `@my-assistant/server` v0.1.0
- `client/package.json` → `@my-assistant/client` v0.1.0
- `package.json` (root, monorepo) → `my-assistant` v0.1.0

**Highlights:**

- ✅ **Tri-tier monorepo** ship-elve (`cli/` + `server/` + `client/`) FDP minta szerint
- ✅ **Pattern audit:** Pattern-compliant in spirit and naming, 3 dokumentált architektúra-szintű deviation (FDP-shaped lite, lásd `__agent/references/pattern-audit.md`)
- ✅ **48 spec, 0 failure** (cli 21, server 20, client 7) Karma + Jasmine + c8 setupokkal
- ✅ **Pipeline-ok:** 3× CDP (`pipeline.cicd.config.json` per sub-project) + 1× LDP (`pipeline.config.json` root)
- ✅ **Action-log infrastruktúra:** lokál JSONL (`__agent/log/actions/`) + server SQLite tábla, dual-write Phase 1
- ✅ **Tick-engine MVP:** file-based dispatcher (`cli/scripts/agent-handlers/`) + server `POST /tick` endpoint kétszintű séma + tier-policy validálással
- ✅ **Activity ingest:** PowerShell logger `server/activity-monitor/` + server `POST /activity-sample` endpoint sleep/wake heuristic-kel
- ✅ **Reorg 2026-05-08:** `activity-monitor/` → `server/activity-monitor/`, `scripts/` → `cli/scripts/`
- ✅ **Workspace inventory:** `__agent/references/workspace-projects.md` 33 LIVE projekt + 12 NPM package + OGS-okat lefed
- ✅ **Root monorepo package.json** sub-projekt-delegate scriptekkel (prep, start = dc ldp, build, test, …)
- ✅ **`__specifications/` és `__documentations/`** struktúrák FDP minta szerint létrehozva

**Plan-ek lezárva:**
- `__agent/plans/refactor-tri-tier.plan.md` ✅ shipped 2026-05-08
- `__agent/plans/triggering-A-mode-health-check.plan.md` (v2 Phase 1 MVP shipped)

**Decisions:** lásd [`DECISIONS.md`](DECISIONS.md) DEC-MA-001..007.

**Tests:** cli 21 + server 20 + client 7 = 48 spec, 0 failure.

---

## 0.1.1 — 2026-05-09 — dc ldp Windows fix + port-allocation FDP-konvenció + reorg

**Highlights:**

- 🐛 **dc-dynamo Windows bug FIX** — `pipeline-entry.script.{ts,js}:344` `shell: 'true'` → `shell: true`. A `dc ldp` most működik Windows-on. Patch alkalmazva mind a workspace src-ben, mind a build-ben. Upstream FDP-PR előkészítve (TD-20260509-001).
- 📍 **Port allokáció FDP-konvenció szerint** — XY=24 slot lefoglalva: server `39245`, client `4224`, notif socket `39247`, service socket `39924` (Phase 2+). Igazodik a `port-env-settings.const.ts` mintához (lásd DEC-MA-009).
- ♻️ **Folder reorg** — `activity-monitor/` → `server/activity-monitor/`, `scripts/` → `cli/scripts/`. Top-level layout: csak `cli/`, `server/`, `client/` + governance (`__agent/`, `current/`, `__specifications/`, `__documentations/`).
- ✨ **Root monorepo `package.json`** — `pnpm prep`/`start`/`build`/`test` per sub-project delegate-ekkel.
- 📚 **`__specifications/` + `__documentations/`** — FDP-minta-szerinti business-spec + impl-doc mappák létrehozva (main, BACKLOG, TODO, modules, features + ARCHITECTURE, DECISIONS, CHANGELOG, dev/LOCAL_DEV_ENVIRONMENT, developments/, plans/).
- 🧹 **Temporary `concurrently`-workaround visszavonva** — sosem volt jó megoldás (nem-LDP, nincs build+test-on-save), csak a dc-bug kerülésére. A patch megoldja a gyökeret.

**Decisions:** lásd [`DECISIONS.md`](DECISIONS.md) DEC-MA-008 (dc bug fix + config-at-root rationale), DEC-MA-009 (port-allokáció).

**Tests:** cli 21 + server 20 + client 7 = 48 spec, 0 failure (variancia nélkül).

---

## 0.1.112 — 2026-05-16 — Wave UI + Socket-sync ship (cumulative cycle 51-68)

> **Megjegyzés:** a 0.1.2 → 0.1.111 közötti patch-bumpok (auto bump-version hook minden commit-ra) a részletes cycle-archívumban követhetők (`__agent/log/cycles/cycle-<N>.md`). Ez az entry az **összegző milestone** a 2 nagy FR funkcionális zárására.

**Sub-projekt verziók (mind 0.1.112):**
- `cli/package.json` → `@my-assistant/cli` v0.1.112
- `server/package.json` → `@my-assistant/server` v0.1.112
- `client/package.json` → `@my-assistant/client` v0.1.112
- `package.json` (root) → `my-assistant` v0.1.112

**Highlights — FR #3b-WAVE-UI Phase 2-4 ship (cycle 51-56):**

- 🌊 **Server unauth wave JSONL endpoints** — `GET /api/wave/get-from-jsonl` (read, Phase 2.A) + `POST /api/wave/log-public` (write + validáció + structured errorCodes, Phase 3.A) + `POST /api/wave/sync-jsonl` (bulk JSONL→DB sync, Phase 4.A) — `_collections/wave-jsonl.util.ts` + `_routes/wave/wave-jsonl.controller.ts`. AUTH BLOCKER bypass.
- 🩹 **Client 401 JSONL-fallback** — `D_Dashboard_ControlService.refresh()` 401 esetén automatikusan átvált a JSONL endpoint-ra (Phase 2.B) → wave-panel auth-token nélkül is megjelenik
- 🌊 **d-waves component enrichment** — mood + note + vector emoji context-card (Phase 2.C)
- 📝 **`D_WavesForm_Component`** (új standalone) — 3 level select + vector + mood + note + submit, JSONL útvonalon (Phase 3.B). Ack-wipe bug-fix cycle 65: `handleReset()` után setteljük az ack-et, különben null-ra wipe-olódott
- 🗄️ **Wave schema extension** — `level`, `wave_vector`, `mood`, `snapshotTs` (denormalizált snapshot-metadata, Phase 4 dual-write paralel JSONL + DB)
- 🔄 **Auto-sync hook** — `POST /log-public` után 3 idempotens DB-insert (Phase 4.B)

**Highlights — FR #3f socket-and-version-sync Phase 1-4 ship (cycle 57-60):**

- 🔌 **Server `VersionBroadcast_SocketServerService`** — `DyNTS_SocketServerService` extend (`@futdevpro/nts-dynamo/socket`), `getSocketServices()`-be regisztrálva (üres → 1 service). `server:hello` per-presence (Phase 2.A) + 30s tick `server:version` broadcast on package.json bump (Phase 2.B). **KRITIKUS:** path=`/socket` (DyNTS_defaultSocketPath, NEM Socket.IO default `/socket.io`).
- 🔌 **Client `A_Socket_ControlService`** — `DyFM_SocketClient_ServiceBase` extend (`@futdevpro/fsm-dynamo/socket`), `server:hello` + `server:version` handlerek → `A_Version_DataService` (Phase 3.A+3.B).
- 📊 **`S_StatusBar_Component`** (új standalone) — footer-sticky `srv vX · cli vY · ↻ HH:mm · ⚠ reload` (Phase 4.A).
- 🚨 **`S_VersionReloadBanner_Component`** (új standalone) — dev-mode (`isDevMode()`) silent 1s reload / prod-mode 5s countdown banner + Reload Now + Dismiss (Phase 4.B).

**Highlights — egyéb:**

- 🧪 **+47 client-test case** (cycle 62-65) — `A_Version_DataService` spec, `S_StatusBar` spec, `S_VersionReloadBanner` spec, `wave-jsonl-fallback.util` spec, `D_WavesForm_Component` spec
- 📚 **Architecture-ref doc-sync** (cycle 68) — socket-layer rows + test counts + cycle-roll-up header
- 📊 **M1 grooming + M2 daily report 2026-05-16** (cycle 61)
- 🚨 **`error-handling.md`** — univerzális zero-tolerance hard rule (AGB-2026-05-16-03)
- ✅ **`e2e-validation.md`** — új principle (AGB-2026-05-16-03, eszköz-választás külön user-OK)

**Plan-ek lezárva (Phase 1-4 functionally):**
- `wave-panel-ui.plan.md` Phase 2-4 ✅ shipped (cycle 51-56)
- `socket-and-version-sync.plan.md` Phase 1-4 ✅ shipped (cycle 57-60)
- Phase 5+6 mindkettőhöz külön green-light vár (AGB-2026-05-16-04 wave Phase 5a-d, AGB-2026-05-16-18 FR #3f Phase 5-6)

**Tests:** cli 26 + server 2 + client 60 = **88 spec, 0 failure** (volt: 21+20+7 = 48 a 0.1.1-nél; a server-test csökkenés a `DyNTS_AppExtended` switch + ESM-mig miatt — pattern shift LDP-integration testing felé)

**Cycle stats:** 18 cycle (51-68) egy napon belül; ~3000+ LOC delta; 14 ship-commit + 13 close-commit + 2 maintenance commit

**Decisions:** lásd [`DECISIONS.md`](DECISIONS.md) (új DEC-MA-* sorok pending — Q-WAVE-2/3 denormalized pattern, DyNTS path=/socket constraint, dev-silent reload UX)

---

## 0.1.171 — 2026-05-17 — FR #3g full ship + Wave/Socket Phase 5 + spec-coverage burst (cumulative cycle 69-108)

> **Megjegyzés:** ez a milestone két marathon-burst-öt fed le egy napon belül: AGB-19 zöldlámpa-flotta (Wave Phase 5, FR #3f Phase 5, FR #5/#8a Phase 1) és AGB-24 (Reports/Dev/User I/O panel teljes szériája Phase 1-6). 22 ship-commit + 18 close-commit, ~2500 LOC delta.

**Sub-projekt verziók (mind 0.1.171):**
- `cli/package.json` → `@my-assistant/cli` v0.1.171
- `server/package.json` → `@my-assistant/server` v0.1.171
- `client/package.json` → `@my-assistant/client` v0.1.171
- `package.json` (root) → `my-assistant` v0.1.171

**Highlights — Wave Phase 5 (cycle 80-89, AGB-2026-05-16-19 green-light):**

- 📈 **X-tengely density-aware ticks** (Phase 5a) — wave-panel x-tick formátum a range alapján (h/d/w/m)
- 📈 **Sin/cos least-squares fit overlay** (Phase 5b) — 3-paraméteres `y=A·sin(ωt)+B·cos(ωt)+C` regresszió, period-scan SSR-alapon, lunar default 29.5d (`wave-sinusoid-fit.util.ts`)
- 🎛 **Interval picker + localStorage persist** (Phase 5c) — user-választott rangeHours [1..24×365], `ma:wave-range-hours` kulcs
- 🖼 **Fullscreen toggle + ESC** (Phase 5d)
- 💬 **Per-point hover tooltip** (Phase 5e.1) — native tooltip (no Material dep)
- 🌫 **Wave marker overlay** (Phase 5e.2+.3) — `GET /api/wave/markers` action-log-szűrt (`event_class IN [törés, megoszló-erő, 3x3-trigger]`), kliens render emojikkel a chart-on (`wave-markers.util.ts` + `wave-markers.controller.ts`)

**Highlights — FR #3f Phase 5+6 socket-push (cycle 80-82, AGB-2026-05-16-19):**

- 📡 **Server `broadcastDomainEvent(topic, op, payload)`** — `VersionBroadcast_SocketServerService` bővítés: minden mutation után `domain:<topic>` push. Csatlakozási pontok: wave/insight/capture/wave-jsonl/auth-wave (Phase 5.A+5.B-extra)
- 📡 **Client `A_DomainEvent_DataService`** — Subject-event-bus, `A_Socket_ControlService` domain:* handler emit-tel rá (Phase 5.C)
- 🔄 **`D_Dashboard_ControlService` push-driven refresh** — `DASHBOARD_TOPICS = {wave,insight,capture}` subscription, no-polling-delay frissítés
- 🌐 **`GET /api/version` endpoint** (Phase 6.B) — server runtime version exposed (6.A skipped DyNTS-limitation miatt, 6.C build-hash inject deferred)

**Highlights — FR #5 + #8a Phase 1 (cycle 90-91, AGB-2026-05-16-19 🟡 unlock):**

- 🌧 **`WeatherPoll_Service`** — OpenMeteo polling (15min interval, 5s grace), dry→rain transition: action-log emit (`kind:'note'` + `event_class:'3x3-trigger'` + `subtype:'rain'`) + domain-event broadcast (`weather.create`). `GET /api/weather/snapshot` lekérhető (No-paid-solutions principle: OpenMeteo unauth).
- 😴 **`SleepState_Service`** + `GET /api/sleep-state` — env-overrideable window (default 02:00-10:00 wrap-around), Cron Job sleep-aware filter számára (FR #5 Phase 1 MVP). MA_SLEEP_START_HOUR / MA_SLEEP_END_HOUR env-flag.

**Highlights — AGB-20/22/17-01 + AGB-23 fixes (cycle 92-94):**

- 🔐 **AGB-20 AUTH BLOCKER fix** — `Auth_ControlService` loopback-bypass (MA_LOCAL_DEV=true + req.ip ∈ {127.0.0.1, ::1, ::ffff:127.0.0.1}). Server `.env` gitignored — minden `/api/*` most 200 dev-en (volt: 401)
- 📢 **AGB-22 notification position fix** — `verticalPosition: 'bottom'` explicit a DyNX_Message-CS-hez (default top eltakarja a header-t) + defensive global CSS top-padding fallback
- 🖥 **AGB-17-01 Activity-monitor Phase 1** — `Get-AppCategory` state-change detect (idle-transition, app-category-change, screen-locked/unlocked, machine-wake), PS 5.1 compat fix (`??` → if-else), path-fix (`scripts/` → `cli/scripts/` reorg-aware)

**Highlights — AGB-24 FR #3g Reports/Dev/User I/O panel TELJES (cycle 95-105, 11 cycle):**

- 📊 **3 panel route** — `/reports` (R_Home: FR-board kanban + cycle history + recent ships), `/reports/dev-io` (R_DevIO: status-dev + action-log stream + AGENT_BUS), `/reports/user-io` (R_UserIO: USER_INPUT inbox + open-Q outbox)
- 🌐 **9 GET endpoint** unauth — `/reports/{frs,cycles,recent-ships,status-dev,agent-log,agent-bus,user-input,open-questions,active-plans,blockers}`
- ✏️ **3 POST endpoint** inline-write — `/reports/user-input` (új [NEW] blokk), `/reports/user-input/done` ([NEW]→[DONE] toggle), `/reports/agent-bus/reply` (AGB inline-reply + status-shift OPEN→ANSWERED/ACTED/DROPPED). `server/_collections/reports.util.ts` 1130L (parsing helpers + write transformers)
- 📡 **Phase 5 socket-push auto-refresh** — server `broadcastDomainEvent('user-input'|'agent-bus', ...)`, client R_DevIO+R_UserIO subscribe → silent `refreshFromPush()` no-flicker
- 🗺 **Phase 6 blockers + roadmap** — `listActivePlans()` (15 plan parsing: title, totalPhases via `## Phase N.X — title`, completedPhases via `**N.X** ... ✅` scope-table) + `listBlockers()` (OPEN AGBs kind=question|block OR stale>24h, announcement-szűréssel)
- 🎨 **R_Home kanban** (4 col: 🟢/🚀/✅/🅿️) + plan-progress-bar + blocker-list with age-badge

**Highlights — spec-coverage burst (cycle 106-108):**

- 🧪 **`wave-sinusoid-fit.util.spec.ts`** (12 it) — fitSinusoid LSQ recovery + null/degenerate + SSR + pickBestPeriod candidates + sampleSinFit clamp
- 🧪 **`error-extract.util.spec.ts`** (16 it) — plain Error + string + HttpErrorResponse 5 ág + DyFM_Error 3 ág + unknown/circular fallback + source param
- 🧪 **`d-dashboard.data-service.spec.ts`** (14 it) — BehaviorSubject state (loading/snapshot/error/markers) + 2 static helper (seriesFor / latestValue)

**Plan-ek lezárva (Phase 5 functionally):**
- `wave-panel-ui.plan.md` Phase 5a-e ✅ shipped
- `socket-and-version-sync.plan.md` Phase 5 ✅ shipped (Phase 6.C deferred)

**Tests:** cli 26 + server 2 + client 74 = **102 spec, 0 failure** (88 → 102 a Phase 5 + spec-coverage marathon-nal)

**Cycle stats:** 40 cycle (69-108) ~24h-n belül; ~2500 LOC delta; 22 ship-commit + 18 close-commit. Bump-version 0.1.112 → 0.1.171 (59 patch-bumps).

**Decisions:** lásd [`DECISIONS.md`](DECISIONS.md) (új DEC-MA-* sorok pending — broadcastDomainEvent topic-route, loopback auth-bypass + MA_LOCAL_DEV env-flag, push-driven silent refresh).

---

## Unreleased — 2026-08-12 — Data-free email tools transfer

**Highlights:**

- ✉️ `ma email` command group: `list-mailboxes`, `list`, `read`, `fetch-attachments`, `send`
- 🔐 Gmailhez `auth` + `status`, Desktop OAuth 2.0 PKCE/loopback és Gmail API
- 🪶 Legkisebb Gmail scope-ok: `gmail.readonly` + `gmail.send`; nincs app-password
- 🔐 Dinamikus, env-alapú account isolation; ismeretlen account soha nem esik vissza másik postafiókra
- 🧼 FDP Assistant mailbox-adat, credential, account-registry, címzett, sablon és month-closing automatizmus nélkül
- 🛡️ Read-only IMAP műveletek, message/attachment size limit, attachment filename sanitize, no-overwrite mentés
- 🕵️ Tracked action-log redakció: e-mail parancsból csak flag-nevek perzisztálódnak
- 🧪 Offline CLI feature-E2E: dry-run composition + missing-recipient error + action-log leak guard
- 🔧 `cli/pnpm-workspace.yaml` build-allowlist placeholder drift javítva a dokumentált boolean értékekre
- 🧪 `safeCall` spec race javítva: async log flush + sorrendfüggetlen két-label assertion

**Tests:** `cli/pnpm test` — 125 spec, 0 failure. Live-provider probe nincs futtatva, mert a My Assistant
valós mailbox-konfigurációját és adatait ez a migráció szándékosan nem olvasta be.
`cli/pnpm run test:coverage` — zöld; e-mail modul: 74.82% statement/line, 79.9% branch, 73.8% function.

Részletes implementációs riport:
[`developments/2026-08-12-email-tools-transfer.md`](developments/2026-08-12-email-tools-transfer.md).

---

## Convention új release-hez

```markdown
## X.Y.Z — YYYY-MM-DD — Rövid cím

**Sub-projekt verziók:** ...

**Highlights:**
- ✅ / 🐛 / ✨ / ⚡ / ♻️ / 📚

**Plan-ek lezárva:**
- ...

**Tests:** N spec, M failure.
```
