# CHANGELOG — `my-assistant`

> Verzió-bump log. Minden release / jelentős milestone egy-egy entry. Format: SemVer + dátum + summary + linkek.

---

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
