# TODO — `my-assistant`

> Short-term akció-lista. Itt élnek azok a tételek, amiket **most vagy a következő pár session-ben** mérlegelendő végrehajtani. Ha egy item kikerül innen befejezetlen állapotban, vissza a [`BACKLOG.md`](BACKLOG.md)-be.
>
> Formátum: `TD-YYYYMMDD-NNN` ID-vel, prioritás (high / medium / low), 1-2 mondat leírás.

---

## In-progress

(üres)

## High prio

- **TD-20260508-001** — `cast-notifier` Phase 2 Spotify OAuth dance + e2e teszt (BathCom-on bemondás miközben Spotify megy → resume verify). Forrás: `__agent/STATUS.md` notes
- **TD-20260508-002** — A-mode dispatcher első éles tick (`fo`-CLI hívás vagy server `POST /tick`) sleep-gate validációval. Forrás: `__agent/plans/triggering-A-mode-health-check.plan.md`
- **TD-20260509-001** — **dc-dynamo bug:** ✅ **FIXED workspace-side** (2026-05-09). `pipeline-entry.script.js:344` `shell: 'true'` → `shell: true` patch alkalmazva mind src-ben, mind build-ben. A `dc ldp` most működik Windows-on. **Followup:** felküldeni FDP upstream PR-be (`NPM-packages/dynamo-cli/` → npm registry) hogy a globálisan telepített `dc` is fixed legyen. CLI-engineering session feladata.
- **TD-20260509-002** — **dc-dynamo `.dynamo/` config-cwd bug:** `live-dev-pipeline.js:142` `cwd: state.resolved.configDir` miatt a `.dynamo/pipeline.config.json` használatakor a step-parancsok cwd-je `.dynamo/` (rossz). Workaround: config a my-assistant root-ban (deprecation warning látszik, de funkcionálisan OK). Tartós fix: a launcher cwd-resolution-je legyen "config-szülőkönyvtár ha az `.dynamo/`, egyébként configDir". CLI-engineering session feladata.

## Medium prio

- **TD-20260508-010** — `start-cli` script polish — most `cd cli && build-base && cd .. && ma --help`, lehet hogy egyszerűbben. Forrás: root `package.json`
- **TD-20260508-011** — `__documentations/dev/LOCAL_DEV_ENVIRONMENT.md` — első futás új gépen (követi az új monorepo `pnpm prep` flow-t)
- **TD-20260508-012** — `cli/scripts/agent-handlers/` és `cli/scripts/action-log/` cutover-tervezet részletezése: pontosan mikor és hogyan vált a `.claude/settings.json` hook a server-POST-ra

## Low prio

- **TD-20260508-020** — Pattern-audit P2 elemei (ESLint, pre-flight-check pipeline-step)
- **TD-20260508-021** — `__specifications/` REQ-kódok bevezetése (most csak prosa-spec, `REQ-MA-*` kódolás később)

---

## Convention

- **ID:** `TD-YYYYMMDD-NNN` — `TD-` prefix, dátum, sorszám
- Tétel áthelyezése `BACKLOG.md` → `TODO.md`-be: ID megőrzendő (ha volt) vagy új ID (ha nem volt)
- Done: töröld vagy mozgasd a `__documentations/CHANGELOG.md`-be (ha jelentős)
