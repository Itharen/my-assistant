# FDP CLI (`fdp`) — referencia

**Forrás:** `E:/Programming/Own/CURSOR/NPM-packages/fdp-cli/`
**Package:** `@futdevpro/fdp-cli` v01.15.31
**Bin:** `fdp`, `fdp-cli`
**Last verified:** 2026-05-12 (`src/program.ts` + `src/_commands/` audit)
**Cél:** prod-DevOps + Overseer-observability swiss-knife. `dc`-t extendeli (`registerDynamoCommands(...)` a `program.ts`-ben), tehát **minden `dc` parancs `fdp`-vel is megy**, plusz a lent felsorolt FDP-specifikusak.

---

## 1. Mit ad

| Téma | Mire jó |
|---|---|
| **Pipeline reporting** | `cicd-report.json` → Overseer + Discord |
| **DevOps control** | service-restart / runner-restart / image-rebuild / webhook self-redeploy (webhookon át) |
| **Overseer query** | build-results, build-detail, jobs, project-statuses, errors, server-logs |
| **Container debug** | `container-logs --container X` webhookon át, SSH nélkül |
| **CI-blocking wait** | `cicd-wait` — polloz amíg lefut, ETA-val |
| **Workspace setup** | `fsar` (clone-all-repos), `tai` (OpenAI sanity) |

---

## 2. Parancsok kategóriánként

### A) Workspace setup
| Cmd / alias | Mit csinál |
|---|---|
| `fsar` / `fdp-setup-all-repos` | SSH-check + GitHub login + minden repo clone/pull |
| `tai` | OpenAI connection sanity-check |

### B) Pipeline reporting & notifications (CI-ből)
| Cmd / alias | Mit csinál |
|---|---|
| `pipeline-report` / `pr` / `plr` | `cicd-report.json` → Overseer `POST /build-report/new` |
| `pipeline-notify` / `pn` / `pln` | Discord embed `cicd-report.json` + `pipeline.cicd.config.json` alapján; fatal/non-fatal step-jelölést tisztel |

Tipikus flow: `dc cdp` → `fdp pipeline-report` → `fdp pipeline-notify`.

### C) DevOps — write-side (webhook-driven)
| Cmd / alias | Mit csinál |
|---|---|
| `deploy-service` / `ds --services <names>` | konkrét Docker service-ek restart (nem full-compose). Comma-sep nevek. |
| `deploy-runners` / `dr` | FDP runner-ek soft restart (git pull + rebuild) |
| `rebuild-runner-image` / `rri` / `rebuild-runners` | runner Docker image full rebuild (`CACHE_BUST`, friss CLI installok). Flags: `--dynamo-cli <ver> --fdp-cli <ver>` |
| `redeploy-webhook` / `rw` | webhook szerver self-redeploy (git pull + restart). `--no-git-pull` skip |

Auth: `--webhook-url` + `--webhook-secret` (vagy `WEBHOOK_TEST_URL` / `WEBHOOK_URL` + `WEBHOOK_SECRET` env).

### D) DevOps — status / monitoring
| Cmd / alias | Mit csinál |
|---|---|
| `runner-status` / `rs` | runner-container state + Overseer queue együtt |
| `runner-info` / `ri` | runner-ek CLI/Node/Docker verziók + heartbeat |
| `server-logs` / `sl --tail <n>` | Overseer in-memory log buffer (max 2000) |
| `container-logs` / `cl --container <name> [--tail <n>] [--since 10m]` | Docker container log webhookon át |

### E) Overseer query — build & pipeline intelligence
| Cmd / alias | Mit csinál |
|---|---|
| `build-results` / `br` | env build-state táblázat. `--environment test\|prod`, `--failed-only` |
| `build-detail` / `bd --project <name>` | step breakdown + tests + CI context |
| `cicd-result-full` / `crf --project <name>` | full result dump `./logs/`-ba (status + report + job + logs JSON-okban). Auto-detect project a `package.json`-ból. |
| `cicd-wait` / `cw --project <name>` | blokkol amíg lefut. `--target-sha <sha>` (def HEAD), `--max-wait 30m`, `--poll-interval 30s`. ETA: last-5-build median + 50% buffer. |
| `pipeline-jobs` / `pj [--job-id <id>]` | active+queued lista vagy egy job detail |
| `project-statuses` / `ps [--environment]` | env-szintű deploy-state minden projektre |
| `errors` / `err [--range 24h\|7d\|30d]` | Overseer error-tábla. `--delete <id>` / `--delete-all` |

---

## 3. Auth & config

**Nincs config-fájl** — minden env-változó (vagy per-parancs flag override).

| Cél | Env | Flag |
|---|---|---|
| Overseer base URL | `OVERSEER_URL` | `--overseer-url` |
| Overseer secret | `OVERSEER_SECRET_KEY` | `--overseer-secret` |
| Webhook URL | `WEBHOOK_TEST_URL` vagy `WEBHOOK_URL` | `--webhook-url` |
| Webhook HMAC | `WEBHOOK_SECRET` | `--webhook-secret` |

Setup példa (bash):
```bash
export OVERSEER_URL="https://api.overseer.futdevpro.hu"
export OVERSEER_SECRET_KEY="<secret>"
export WEBHOOK_TEST_URL="https://webhook.test.futdevpro.hu"
export WEBHOOK_SECRET="<hmac-secret>"
```

**Auth mechanizmus:**
- Overseer: `secret-key: $OVERSEER_SECRET_KEY` header.
- Webhook: HMAC-SHA256 (DyFM_Crypto) signature header.
- CI-kontext: auto-detect `ciContext`-ből a CDP report-ban (branch, commit, run URL, provider).

---

## 4. Mikor `fdp` vs `dc`

> **`fdp` extendeli `dc`-t** (registerDynamoCommands), tehát ha bizonytalan vagy, `fdp` mindent tud, amit `dc` is.

| Szituáció | CLI |
|---|---|
| projekt scaffold / code gen | `dc` |
| lokál dev-loop | `dc ldp` |
| egyszeri CI build | `dc cdp` |
| build-report Overseer-be | `fdp pipeline-report` |
| Discord értesítés | `fdp pipeline-notify` |
| Overseer build-status query | `fdp build-results` / `build-detail` |
| Várd meg amíg CI lefut | `fdp cicd-wait` |
| runner / service restart | `fdp deploy-runners` / `deploy-service` |
| runner image rebuild | `fdp rebuild-runner-image` |
| Docker container log | `fdp container-logs` |
| szerver hibák | `fdp errors` |
| szerver log | `fdp server-logs` |

**Rule of thumb:** build/scaffold = `dc`, prod-ops + observability = `fdp`.

---

## 5. Tipikus agent-workflow-k

### A) CI/CD integráció (push utáni várakozás)
```bash
fdp cicd-wait --project <X> --target-sha $(git rev-parse HEAD)
fdp build-detail --project <X>                        # ha NOT OK
```

### B) "Mi a fenét csinál a runner"
```bash
fdp runner-status
fdp runner-info
fdp pipeline-jobs
fdp container-logs --container fdp-runner-1 --since 30m
```

### C) Új CLI verzió kihúzása runner-ekre
```bash
# 1) NPM-re publish (dc cdp lokálban vagy CI-ből)
# 2) rebuild
fdp rebuild-runner-image --dynamo-cli 01.15.60 --fdp-cli 01.15.31
fdp runner-info                                       # confirm
```

### D) Build-fail diagnostics offline
```bash
fdp build-results --failed-only
fdp build-detail --project <X>
fdp cicd-result-full --project <X>                    # → ./logs/
fdp errors --range 24h
fdp server-logs --tail 500
```

### E) Service-szintű hotfix deploy
```bash
# kód push már megtörtént, runner lebuildelt; csak újra kell indítani
fdp deploy-service --services overseer-server,overseer-client
fdp project-statuses                                  # confirm
```

---

## 6. Gotcha-k

1. **Webhook-pair auto-restart** — `fdp deploy-service --services <X-server>` automatikusan kibővül `X-server + X-client`-re (CICD pair). Ha nem akarod, a webhook-on van flag (memory: `webhook v01.15.8`).
2. **Output format** — túlnyomórészt text/table, nincs structured `--json` mode. Parse-elésnél text vagy FR-rel kérj JSON.
3. **Nincs retry** — fail-fast, sync. Retry-t orchestration-layeren oldj meg.
4. **Timeout-ok** — webhook 15s, Overseer 30s. Lassú env-ben overrideolni nem lehet flag-gel.
5. **`cicd-wait` ETA** — median + 50% buffer; első build-eknél (kevés history) pontatlan.
6. **`pipeline-notify` fatal/non-fatal** — `pipeline.cicd.config.json` `fatal: false` step-bukások `warning`-ot küldenek, nem `failure`-t. Tervezésnél figyelj.
7. **Project name auto-detect** — `cicd-result-full` / `cicd-wait` `--project` nélkül `package.json` nevét veszi; ha az `-server` / `-client` suffix-os, akkor is jó, Overseer normalizálja.
8. **`pipeline-report` ciContext** — ha nem CI-ben futtatod (lokálban manuálisan), a ciContext kézzel passing nem támogatott — agentnek inkább CI-ből hívd.

---

## 7. Kapcsolódó dokumentumok

- [`dynamo-cli.md`](dynamo-cli.md) — `dc` parancsok (build/scaffold oldal)
- [`overseer-agent-access.md`](overseer-agent-access.md) — agent-oldali Overseer-quick-ref + REST endpointok (`fdp`-n túli direkt hívásokhoz)
- Workspace `CLAUDE.md` "FDP CLI DevOps parancsok" szekció — eredeti listing
