# Event — on-cdp-fail

> **CI/CD Pipeline** (`dc cdp` / Overseer pipeline) hiba a `git push` utáni
> pipeline-futás során. Forrás: `pipeline.cicd.config.json` step-jei +
> Overseer build-report.

## Mikor trigger

- `git push` után az Overseer pipeline egy step-je failel
- `fdp build-results` / `fdp build-detail --project my-assistant` failed status
- Webhook fail / runner unavailable

## Phase 1 megjegyzés

A my-assistant projektben **még nincs** `pipeline.cicd.config.json` és
Overseer-integráció. Ez az event-handler **placeholder** — Phase 2+-ban
aktiválódik amikor a CDP setup megtörténik (Overseer-rel + Docker Hub-bal).

## Detekció

Phase 2-höz tervezett források:

| Forrás | Mit ad |
|---|---|
| `fdp build-results --project my-assistant` | utolsó N build status |
| `fdp build-detail --project my-assistant` | step-breakdown failing step-tel |
| `fdp errors --range 24h` | overseer-szintű error-ok |
| GitHub Actions webhook log | trigger fail (10s)  |

## Mit csinálj

1. **Failing step kategorizálás:**
   - **`docker-build` step fail** → Dockerfile / build context probléma — `04-investigate`
   - **`test` step fail** → `events/dev/on-test-fail.md` (vagy build-fail)
   - **`deploy` step fail** → `events/dev/on-user-needed.md` (Tier 3 production-deploy = TILTOTT auto)
   - **`docker-push` step fail** → registry hozzáférés, `events/dev/on-package-issue.md`
   - **Webhook trigger fail** → manuális trigger via `OVERSEER_KEY` (lásd CLAUDE.md global)

2. **Lokál reprodukáció:**
   ```
   dc cdp --dry-run    # ha implementálva
   ```
   vagy a step-et direktben futtatni.

3. **Bundle a fixet a megfelelő scope-ba** (cli/server/client/dockerfile/pipeline-config) — ne külön push minden próbálkozásra (12. alapelv: push minimalizálás).

4. **STATUS_DEV update:**
   ```yaml
   last_cycle:
     build_status: failed
   phase_notes: |
     CDP fail: <step> @ <commit-sha>. Lokál reprodukció + fix.
   ```

5. **Maximum 3 push-próbálkozás** — utána `events/dev/on-user-needed.md`. (Push = CDP-trigger; minimalizálás kötelező.)

## Action-log emit

```json
{ "kind": "error",
  "summary": "CDP fail: <step>, commit=<sha>",
  "extra": { "pipeline": "cdp", "step": "...", "commit_sha": "...", "build_url": "..." } }
```

## Priority

A `03-collect-tasks` priority-sorrendben **#0b** — közvetlenül a LDP után.
CDP fail = remote main branch broken state, gyors fix kell. De LDP fix
elsőbbség (a fejlesztő-blokkolás súlyosabb).
