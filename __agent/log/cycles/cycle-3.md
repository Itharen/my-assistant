# Cycle 3 — 2026-05-12

**Branch:** main
**Commit:** `0f3c7a1`
**Trigger:** Q-package-1 emergens blocker (cycle 1 óta nyitva)

## Összefoglaló

`pnpm test` baseline újraépítése. A pnpm 11+ build-script approval kérdést
megoldottuk repo-szinten: `cli/pnpm-workspace.yaml` `allowBuilds.protobufjs:
true` → `pnpm install` után automatikusan working, nem kell user-szintű
`approve-builds`. Felfedeztünk egy új blocker-t a server-en
(`@futdevpro/ngx-dynamo-models` 404).

## Fázis-flow

- 00-02 audit: cli typecheck ✅, runtime errors 0-2 bucket (ignore)
- 03-collect-tasks: Q-package-1 anchor (emergens blocker > backlog 🟢)
- 04-investigate: pnpm config list → `allowBuilds.protobufjs` separate state,
  `pnpm-workspace.yaml` mechanism a repo-level fix
- 06-implement:
  - `cli/pnpm-workspace.yaml` `allowBuilds.protobufjs: true` (chat parallel)
  - `cli/README.md` setup doc frissítés
  - `current/open-questions.md` Q-package-1 answered, Q-package-2 open
- 08-verify-local: cli `pnpm test` ✅ (21 spec, 0 fail), typecheck ✅
- 10-commit-push: `0f3c7a1`

## Új blocker (Q-package-2)

`@futdevpro/ngx-dynamo-models@1.15.8` az npm registry-n 404 — privát publikálva
vagy csak lokál tgz formában elérhető. Master-prompter server is használja,
de náluk valószínűleg saját registry / pnpm overrides. A my-assistant server
`pnpm install` nem fut. → Q-package-2 nyitva, prio: high.

## Build/test eredmény

- **CLI typecheck:** ✅
- **CLI test:** ✅ 21 specs, 0 failures (új — cycle 1 óta blokkolt volt)
- **Server typecheck:** ✅ (npx tsc-vel, pnpm install nem fut)
- **Client typecheck:** ✅
- **Server/Client test:** ⏸️ skipped (server: Q-package-2; client: karma setup külön)

## FR-status változások

Nincs.

## Stats

- **Files:** 7
- **Commit:** 0f3c7a1
- **Build status:** success
- **Test status:** success (cli only)
