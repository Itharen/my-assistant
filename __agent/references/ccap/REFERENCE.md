# CCAP CLI — teljes command-referencia

A CCAP Revisioned monorepo CLI (`ccap`) minden top-level command-ja és subcommand-ja. A felületes („gyakran használt") verzió: **[SKILL.md](./SKILL.md)**.

*Generálva: ccap v1.1.3371 — 
`ccap skill-doc <output-dir>` paranccsal.*

---

## Tartalomjegyzék

- [`ccap start`](#ccap-start) — CCAP service-ek indítása (server háttérben).
- [`ccap stop`](#ccap-stop) — A futó CCAP service-ek leállítása.
- [`ccap restart`](#ccap-restart) — Hard-restart: stop + start sorozat.
- [`ccap chat`](#ccap-chat) — Interaktív CLI chat egy CCAP Session-höz.
- [`ccap sessions`](#ccap-sessions) — CCAP Session lista.
- [`ccap status`](#ccap-status) — Rendszer és session státusz egy snapshotban.
- [`ccap info`](#ccap-info) — Diagnosztikai snapshot (bug-jelentéshez).
- [`ccap logs`](#ccap-logs) — Live-tail server (default) vagy client log.
- [`ccap cc-inspect`](#ccap-cc-inspect) — CC Session mély diagnosztikai snapshot (REQ-CC-INSPECT-001).
- [`ccap config`](#ccap-config) — Konfiguráció megjelenítése + interaktív módosítás.
- [`ccap init`](#ccap-init) — Setup wizard (12 lépéses inicializálás).
- [`ccap palette`](#ccap-palette) — Session run-execution palette (PATCH /api/session/:id).
- [`ccap vault-key`](#ccap-vault-key) — Vault master-key kezelése (új generálás / megjelenítés).
- [`ccap explore`](#ccap-explore) — Kódbázis-felfedezés CLI-on át.
- [`ccap review`](#ccap-review) — Custom code-review futtatás (rule-id-k listájával).
- [`ccap notify send`](#ccap-notify-send) — Notification küldése a UI-ra (és opcionálisan várakozás válaszra).
- [`ccap notify list`](#ccap-notify-list) — Notification lista (státusz-szűrővel).
- [`ccap notify respond`](#ccap-notify-respond) — Programmatikus válasz egy notification-re.
- [`ccap input`](#ccap-input) — Quick Input felvétele (POST /api/user-input).
- [`ccap repair`](#ccap-repair) — Önjavító runner (cache cleanup, port-release, mongo-precheck).
- [`ccap update`](#ccap-update) — CCAP CLI / server frissítése (npm publish-ról).
- [`ccap ver`](#ccap-ver) — Verzió-info (kliens + server, ha fut).
- [`ccap skill-doc`](#ccap-skill-doc) — Ezt a doc-ot generálja agent-célmappába.

---

## `ccap start`

**CCAP service-ek indítása (server háttérben).**

A CCAP server-t és a CCAP client-et háttérben indítja. A server gyökér indulása után az állapot a `ccap status` paranccsal lekérdezhető. Stop: `ccap stop`. Hard-restart: `ccap restart`.

### Példák

```bash
$ ccap start
$ ccap status   # ellenőrzés indulás után
```

## `ccap stop`

**A futó CCAP service-ek leállítása.**

A server + client process-eket gracefully leállítja. Ha a graceful exit nem sikerül, hard-kill esik vissza (a process-tree-vel együtt).

### Példák

```bash
$ ccap stop
```

## `ccap restart`

**Hard-restart: stop + start sorozat.**

Egyenértékű a `ccap stop ; ccap start`-tal, de egyetlen idempotens lépésben — a stop-success előtt nem kezd start-ot, és a config-cache is frissül.

### Példák

```bash
$ ccap restart
```

## `ccap chat`

**Interaktív CLI chat egy CCAP Session-höz.**

Új CCAP Sessiont nyit (vagy meglévőhöz csatlakozik) a CLI terminálban. Multichannel csatorna: a server route-output-ja a CLI-ban is megjelenik.

### Példák

```bash
$ ccap chat
```

## `ccap sessions`

**CCAP Session lista.**

Active + archivált sessionek lekérdezése; státusz oszloppal.

### Példák

```bash
$ ccap sessions
```

## `ccap status`

**Rendszer és session státusz egy snapshotban.**

Process-ek (server / client), Mongo-állapot, aktív session-ek darabszáma, provider-listák. Gyors check arra hogy minden fut-e.

### Példák

```bash
$ ccap status
```

## `ccap info`

**Diagnosztikai snapshot (bug-jelentéshez).**

Identity, server runtime, client runtime, config, update-állapot, workspace — minden ami egy bug-reporthoz kell. A `--json` flag machine-readable kimenetet ad.

### Példák

```bash
$ ccap info
$ ccap info --json > /tmp/ccap-snapshot.json
```

## `ccap logs`

**Live-tail server (default) vagy client log.**

Kezdeti N sor + tail-loop. Filter regex (`--filter`), idő-szűrő (`--since 30s|5m|2h|1d`), client-log (`--client`), no-follow mód (`--no-follow`).

### Példák

```bash
$ ccap logs --lines 100
$ ccap logs --filter "error|FAIL" --since 5m
$ ccap logs --client --no-follow --lines 50
```

## `ccap cc-inspect`

**CC Session mély diagnosztikai snapshot (REQ-CC-INSPECT-001).**

Egyetlen HTTP GET-tel összesít MINDENT egy CC Session jelenlegi állapotáról: DB record, in-memory runtime state, USS unified state, lifecycle metadata, terminal/runner flag-ek, queue snapshot, per-instance rate-limit state-ek, output buffer utolsó 5 sora, utolsó 20 event, és automatikusan generált diagnosztikai hint-ek (cycle 805 reconcile, cycle 812 rate-limit, cycle 814 unstall, cycle 958 blocked-resume mintázatok). Use case: ha egy session látszólag csendben elhalt, ez a parancs egy lépésben megmutatja MIÉRT. Flags: `--ccap-id <id>` (default: localhost), `--url <baseUrl>` (default: `http://localhost:39050`), `--json` (raw JSON output bug-jelentésekhez, scripting-hoz). Részletes guide: `__documentations/diagnostics/cc-inspect.md`.

### Példák

```bash
$ ccap cc-inspect ccs-43581416-mp1h51k4
$ ccap cc-inspect ccs-43581416-mp1h51k4 --ccap-id dcc565cf-435b-4328-8d76-c6f1261ffca9
$ ccap cc-inspect ccs-43581416-mp1h51k4 --url https://200.33.0.101:39051
$ ccap cc-inspect ccs-43581416-mp1h51k4 --json | jq .hints
```

## `ccap config`

**Konfiguráció megjelenítése + interaktív módosítás.**

A `ccap_setting` collection szekcióit jeleníti meg (vault-ed dekódolva). Interaktívan módosítható szekciónként.

### Példák

```bash
$ ccap config
```

## `ccap init`

**Setup wizard (12 lépéses inicializálás).**

Vault, MongoDB, AI/Message providerek, workspace path, soul. Új workstation-en először ezt kell lefuttatni.

### Példák

```bash
$ ccap init
```

## `ccap palette`

**Session run-execution palette (PATCH /api/session/:id).**

A session execution-mód-jának váltása: `full | ask-only | plan-only | clear`.

### Példák

```bash
$ ccap palette --session <id> --mode plan-only
```

## `ccap vault-key`

**Vault master-key kezelése (új generálás / megjelenítés).**

A `CCAP_VAULT_MASTER_KEY` env-var-on alapuló vault titkos kulcsa. Friss generáláskor a régi titkokat újra kell encrypt-elni (a `config` parancsból).

### Példák

```bash
$ ccap vault-key
```

## `ccap explore`

**Kódbázis-felfedezés CLI-on át.**

Glob / grep / file-listing wrapper-ek a workspace-en, agent-friendly outputtal.

### Példák

```bash
$ ccap explore --grep "TODO" --type ts
```

## `ccap review`

**Custom code-review futtatás (rule-id-k listájával).**

A pipeline review-step-jét futtatja explicit rule-id listával — a `ccap review --ids <a,b,c>` minden szabályt csak a megnevezetteken értékel ki.

### Példák

```bash
$ ccap review --ids max-method-params,no-console-log
```

## `ccap notify send`

**Notification küldése a UI-ra (és opcionálisan várakozás válaszra).**

Subcommand. Típusok: `message` (info-csak), `confirm` (igen/nem), `option-select` (lista-választás), `question` (szöveges válasz). A `--wait` flag-gel a CLI háttérben long-poll-olja a választ; max 5 perc, Ctrl+C-vel megszakítható.

### Példák

```bash
$ ccap notify send --title "Hello" --type message
$ ccap notify send --title "Folytassuk?" --type confirm --wait
$ ccap notify send --title "Melyik?" --type option-select --options "a:A,b:B" --wait
```

## `ccap notify list`

**Notification lista (státusz-szűrővel).**

A pending / delivered / responded / expired / dismissed notification-ök lekérése.

### Példák

```bash
$ ccap notify list --status pending
```

## `ccap notify respond`

**Programmatikus válasz egy notification-re.**

A `--id` kötelező; `--confirmed true|false` vagy `--text "..."` adja a választ.

### Példák

```bash
$ ccap notify respond --id <id> --confirmed true
```

## `ccap input`

**Quick Input felvétele (POST /api/user-input).**

A `__agent/USER_INPUT.md`-szerű quick input-bejegyzéseket veszi fel programatikusan. Forrás-prioritás (mutex): pozícionális content arg (egy entry), `--file <path>` vagy `--stdin` (bulk import a `---` separator mentén — ugyanaz a konvenció mint a UI overlay-é). Workflow-key-vel kötés: `-w <key>`.

### Példák

```bash
$ ccap input "Új quick input szövege"
$ ccap input -w refactor-cycle "Lifecycle javítás kell"
$ ccap input -f bulk.md     # bulk: ---  separator
$ echo "A\n---\nB" | ccap input --stdin
```

## `ccap repair`

**Önjavító runner (cache cleanup, port-release, mongo-precheck).**

Ha valami félresiklott (zombie process, port-conflict, lock-file), ezzel állítható helyre.

### Példák

```bash
$ ccap repair
```

## `ccap update`

**CCAP CLI / server frissítése (npm publish-ról).**

Lekéri a legutóbbi publikált verziót, telepíti globálisan, és újraindítja a service-eket.

### Példák

```bash
$ ccap update
```

## `ccap ver`

**Verzió-info (kliens + server, ha fut).**

Egyszerű verzió-snapshot — `--version` flag (`-v`) is ugyanezt adja.

### Példák

```bash
$ ccap ver
$ ccap -v
```

## `ccap skill-doc`

**Ezt a doc-ot generálja agent-célmappába.**

Egy adott mappába kiír egy `SKILL.md` (felületes) + `REFERENCE.md` (mélységi) párost a CCAP CLI használatáról. A `--name` flag a SKILL.md frontmatter `name` mezőjét állítja (default: `ccap-cli`); a `--force` felülírja a meglévő fájlokat.

### Példák

```bash
$ ccap skill-doc .claude/skills/ccap-cli
$ ccap skill-doc /tmp/skills --name ccap-cli-prod --force
```
