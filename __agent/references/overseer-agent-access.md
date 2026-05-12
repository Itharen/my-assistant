# Overseer — agent access referencia

**Forrás:** `E:/Programming/Own/CURSOR/LIVE-projects/overseer/` (server) + `fdp-devops/webhook/`
**Last verified:** 2026-05-12 (route + fdp CLI command audit)
**Cél:** AI agent **read-side** belépői az Overseer-be — build state, pipeline jobok, runnerek, hibák, logok lekérdezése.

> Ez a my-assistant rendszer **nem fejleszti** az Overseer-t, csak fogyasztja. Bug-ot
> Overseer-re FR-ként visszünk át. A workspace `CLAUDE.md` "Overseer Pipeline Rendszer"
> szekciója a kanonikus háttér; itt az agent-szempontú quick-ref van.

---

## 1. Mit ad az Overseer egy agentnek

| Téma | Mit lehet kinyerni |
|---|---|
| **Build state** | utolsó build minden projektre, env-enként (test/prod) + step breakdown + log-tail |
| **Pipeline queue** | aktív / queued jobok, runner-enkénti megoszlás |
| **Runnerek** | container état, CLI verziók (`dc`, `fdp`), Node, Docker, last heartbeat |
| **Project deploy state** | online/offline + deployolt verzió env-enként |
| **Errors** | szerveroldali error-ok időablakra (`24h` / `7d` / `30d`), level, count, error code |
| **Server logs** | last N sor in-memory bufferből (max 2000) |
| **Container logs** | tetszőleges Docker container log webhookon át |
| **Secrets metadata** | csak kulcsok + scope + description; **érték SOHA nem queryable** |

---

## 2. Belépési csatornák — prioritás sorrendben

1. **`fdp` CLI** → 90%-ban ez kell (lent táblázat). Auth env-változókból.
2. **Direkt REST hívás** → ha `fdp`-ben nincs lefedve (lásd 4. szakasz).
3. **Webhook szerver REST** → container-logs / service restart / health.
4. **Dashboard URL** (`https://test.overseer.futdevpro.hu`) — human inspectionra, **agentnek soha**.

---

## 3. `fdp` CLI — agent quick-ref (csak read-side)

Részletek: [`fdp-cli.md`](fdp-cli.md).

| Mire kell | Parancs | Megjegyzés |
|---|---|---|
| "Milyen állapotban van **minden** projekt?" | `fdp build-results [--failed-only] [--environment test\|prod]` | táblázat, env default `test` |
| "Mi pontosan a hiba **X** projektben?" | `fdp build-detail --project <name>` | step breakdown + tesztek |
| "Le akarom menteni **X** build összes adatát fájlba" | `fdp cicd-result-full --project <name>` | JSON-ok `./logs/`-ba |
| "Várj amíg lefut a build, blokkolj" | `fdp cicd-wait --project <name> [--target-sha HEAD]` | 30s poll, default 30min max |
| "Mi fut most a runner-eken?" | `fdp pipeline-jobs` | active + queued |
| "Hol és milyen verzióval dropolt a deploy?" | `fdp project-statuses` | env-enként |
| "Egészséges-e a runner-stack?" | `fdp runner-status` | container + queue együtt |
| "Mi a runner-ek CLI verziója?" | `fdp runner-info` | heartbeat + tools |
| "Mi a hiba az Overseer szerveren?" | `fdp errors [--range 24h\|7d\|30d]` | level + count + errorCode |
| "Overseer szerver log" | `fdp server-logs [--tail 200]` | in-memory buffer |
| "Docker container log" | `fdp container-logs --container <name> [--tail 100] [--since 10m]` | webhookon át |

**Tipikus agent-flow — "miért fail X projekt?"**:
```
fdp build-results --failed-only        # lássuk ki esett ki
fdp build-detail --project X           # melyik step
fdp cicd-result-full --project X       # ha mélyre kell ásni → ./logs/
fdp errors --range 24h                 # van-e szerver-error párhuzamosan
fdp server-logs --tail 500             # ha az error-tábla kevés
```

---

## 4. Overseer REST endpointok — ha `fdp`-ben nincs lefedve

**Auth:** minden agent-hívás `secret-key: $OVERSEER_SECRET_KEY` headerrel (a CLI is ezt használja). Bearer JWT csak user-flow-knak kell.

### Build & report (read)
| Endpoint | Mit ad |
|---|---|
| `GET /build-report/results/:environment` | összes build env-ben |
| `GET /build-report/results/:environment/failed` | csak fail-ek |
| `GET /build-report/result/:environment/:project` | egy projekt last build |
| `GET /build-report/result/:environment/:project/details` | step breakdown + CDP report |
| `GET /build-report/result/:environment/:project/log` | log tail |
| `GET /build-report/trends/:environment/:project?count=N` | utolsó N build (cap 100) — duration / passed / failed trend |

### Pipeline runner (read)
| Endpoint | Mit ad |
|---|---|
| `GET /pipeline-runner/status` | queue + running összesítés |
| `GET /pipeline-runner/job/:jobId` | egy job teljes payload (log + cdpReport + stepProgress) |
| `GET /pipeline-runner/job/repository/:owner/:repo/latest` | repo last job |
| `GET /pipeline-runner/job/:jobId/steps` | csak step progress (lightweight poll) |
| `GET /pipeline-runner/runner-info` | runner-ek + heartbeat + tool verziók |
| `GET /pipeline-runner/jobs/recent?limit=N` | recent completed/failed/cancelled |

### Project status (read, **public — auth nélkül**)
| Endpoint | Mit ad |
|---|---|
| `GET /project/statuses/:environment` | összes projekt deploy-state |
| `GET /project/status/:environment/:system` | egy projekt deploy-state |

### Server status & logs
| Endpoint | Mit ad | Auth |
|---|---|---|
| `GET /server-status/status` | uptime + version + startedAt | — |
| `GET /server-status/host-metrics` | CPU% + RAM% + loadavg | — |
| `GET /logs/get?tail=N` | server log buffer (max 2000) | secret-key |
| `GET /server/error/get-range/:range` | hibák időablakra | secret-key |

### Secrets (csak metadata)
| Endpoint | Mit ad |
|---|---|
| `GET /secrets/:projectId` | kulcs + scope + description (érték **nincs**) |
| `GET /secrets/all/keys` | összes projekt kulcsa |
| `POST /secrets/:projectId/validate` | megnézi van-e adott kulcs |

---

## 5. Webhook szerver (`fdp-devops/webhook/`) — read endpointok

| Endpoint | Mit ad | Auth |
|---|---|---|
| `GET /status` | uptime + queue + restart-state | — |
| `GET /health` | (alias /status) | — |

A többi (`/action`, `/restart-service`, `/restart-fdp-runners`, `/redeploy`, `/ssl/*`) **write-side** — agent ne hívja közvetlenül, ehhez `fdp deploy-service` / `fdp deploy-runners` / `fdp redeploy-webhook` van.

---

## 6. Auth setup

Az agent-hívásokhoz **env-változók** kellenek (a `fdp` CLI is ezeket eszi, nincs config-fájl):

```bash
OVERSEER_URL="https://api.overseer.futdevpro.hu"           # vagy http://localhost:39145/api lokálban
OVERSEER_SECRET_KEY="<secret>"
WEBHOOK_TEST_URL="https://webhook.test.futdevpro.hu"       # vagy WEBHOOK_URL prod-ra
WEBHOOK_SECRET="<hmac-secret>"
```

A `fdp` CLI-nek minden parancs `--overseer-url` / `--overseer-secret` / `--webhook-url` / `--webhook-secret` flag-eken is felülbírálhatja az env-et.

**Saját gépen (my-assistant context):** az env-eket nincs konvenció hol tárolni; ha kéne, javasolt `.env.local` a my-assistant root-jában (gitignored), és bash-ban source-olni. Default: ha a my-assistant nem fdp-flow-t fut, **nem kell** beállítani.

---

## 7. Auth-modellek (referencia)

| Mód | Hogyan | Mikor |
|---|---|---|
| **secret-key** | header `secret-key: <key>` | runner, CLI, server-to-server, agent — **alap-eset** |
| **Bearer JWT** | header `Authorization: Bearer <token>` | user-flow-k (dashboard) — `POST /auth/login-user` ad tokent |
| **Webhook HMAC** | `x-webhook-signature` header, HMAC-SHA256 a `WEBHOOK_SECRET`-tel | a webhook szerver saját routejaira |

Egyes route-ok (pl. `/pipeline-runner/next-job`) **csak** secret-key-t fogadnak — agent ezeket ne piszkálja, runner-state-machine függ tőle.

---

## 8. Gotcha-k

1. **Project-name normalizáció** — `organizer-server` és `organizer-client` mindkettő `organizer` néven megy fel build-report-ba. A `fdp build-detail --project` is normalizál.
2. **Secret-érték SOHA nem queryable** — secret-injection csak runner job pickup pillanatában történik. Agent nem tud secret-tel "kifutni" — ha tudni akarod, *létezik-e*, `validate` endpoint van.
3. **Job-poll state-machine** — runner közben polloz, ne hívd `/next-job`-ot agentből, lefoglalja a slot-ot és orphan-cleanup triggerelődhet.
4. **Log-trimming** — csak az utolsó **5 job/repo** őriz full logot. Régebbinél `logTail ~200 sor` + per-step error preserved. CDP report mindig megvan.
5. **Nincs real-time stream** — minden polling. `/pipeline-runner/job/:id/steps` a leghideghidegebb poll-target.
6. **Public endpointok** — `/project/statuses/*` és `/server-status/*` **auth nélkül** mennek (intentional health-check). Ha `OVERSEER_SECRET_KEY` még nincs, ezekkel lehet kezdeni.
7. **`fdp errors` mutathat saját akciókat is** — minden secret-key-vel hívott write tier auditba megy. Ne ijedj meg ha látod a saját error-mark-done-odat.
8. **Cancel state** — runner-orphan-cleanup után job státusza `cancelled`, NEM `failed`. `--failed-only` szűrő nem hozza.

---

## 9. Tipikus agent-workflow-k

### A) "Daily check" — minden zöld-e
```
fdp project-statuses                   # env health
fdp build-results --failed-only        # van-e fail
fdp errors --range 24h                 # új error-ok
fdp runner-status                      # runner-stack él
```

### B) "Mi történt a legutóbbi pusholás után" (CI/CD bekötés)
```
fdp cicd-wait --project <X> --target-sha <HEAD-sha>     # blokkol amíg lefut
fdp build-detail --project <X>                          # ha fail volt
```

### C) "Deep-dive — miért hal el runner X"
```
fdp runner-status                      # látszik-e a container
fdp runner-info                        # heartbeat friss?
fdp container-logs --container fdp-runner-1 --since 30m
fdp server-logs --tail 1000            # Overseer oldalon mit lát
```

### D) "Mi a friss baj a szerveren"
```
fdp errors --range 24h
fdp server-logs --tail 500
GET /server-status/host-metrics        # CPU/RAM ha hardver-gyanú
```

---

## 10. Kapcsolódó dokumentumok

- [`fdp-cli.md`](fdp-cli.md) — minden `fdp` parancs részletesen
- [`dynamo-cli.md`](dynamo-cli.md) — `dc` (build/run oldal, írja a CDP reportot, amit Overseer fogad)
- [`workspace-projects.md`](workspace-projects.md) — projekt-inventory
- Workspace `CLAUDE.md` "CI/CD — Overseer Pipeline Rendszer" szekció — eredeti flow-leírás

**Nincs `LIVE-projects/overseer/__agent/`** — ha onnan jönne reference, ide kell behozni (vagy odaát egy `__agent/AGENT_ACCESS.md`-be).
