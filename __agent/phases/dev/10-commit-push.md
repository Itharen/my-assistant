# Phase 10 — Commit push

> Atomikus commit + push (Tier 2 autonóm — 2026-05-11 user-engedély).

## Mit csinálj

1. **Pre-commit ellenőrzés:**
   - `git status` — listázd a pending changes-t
   - `08-verify-local`-ban build+test zöld volt? (`STATUS_DEV.last_cycle.build_status == success` + `test_status == success`)
   - Ha NEM zöld → **nem committolj**, vissza `06-implement`/`08-verify-local`-ra

2. **Commit message** — FDP-mintát követő, konvencionális:
   ```
   <type>(<scope>): <short summary>

   - bullet 1
   - bullet 2
   ```
   Type: `feat | fix | refactor | docs | chore | test | style`
   Scope: `cli | server | client | dev-agent | assist-agent | docs | …`

3. **Stage + commit:**
   ```
   git add <konkrét fájlok — NEM git add -A>
   git commit -m "<message>"
   ```

4. **Push:**
   ```
   git push
   ```

## Tier-szabály

- **Tier 2** (autonóm, clear-rule = pending change van + build zöld)
- **Nincs `--no-verify`** — ha pre-commit hook fail, vissza review
- **Nincs `--force`** push — soha

## Action-log emit

```json
{ "kind": "ship", "summary": "Cycle N commit + push (sha=...)",
  "ref": "<commit-sha>",
  "extra": { "files": [...], "commit_message": "..." } }
```

## STATUS_DEV update

```yaml
last_cycle:
  commit_sha: <new-sha>
```

## Kilépés

`STATUS_DEV.phase` → `close-cycle`
