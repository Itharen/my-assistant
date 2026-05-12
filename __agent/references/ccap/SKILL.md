---
name: ccap-cli
description: A CCAP Revisioned CLI (`ccap`) gyakori használati mintái — service-lifecycle, status, logs, quick-input, notify. A részletes command-referencia a `REFERENCE.md`-ben.
---

# CCAP CLI — gyakori használati minták

A `ccap` parancs a CCAP Revisioned monorepo CLI-ja (Commander + TypeScript). Ezen az oldalon a leggyakrabban használt subcommand-ok és példák. Teljes command-referencia: **[REFERENCE.md](./REFERENCE.md)**.

*Generálva: ccap v1.1.3371 — 
`ccap skill-doc <output-dir>` paranccsal.*

---

## Gyakran használt parancsok

### `ccap start`

CCAP service-ek indítása (server háttérben).

```bash
$ ccap start
$ ccap status   # ellenőrzés indulás után
```

### `ccap stop`

A futó CCAP service-ek leállítása.

```bash
$ ccap stop
```

### `ccap status`

Rendszer és session státusz egy snapshotban.

```bash
$ ccap status
```

### `ccap logs`

Live-tail server (default) vagy client log.

```bash
$ ccap logs --lines 100
$ ccap logs --filter "error|FAIL" --since 5m
$ ccap logs --client --no-follow --lines 50
```

### `ccap notify send`

Notification küldése a UI-ra (és opcionálisan várakozás válaszra).

```bash
$ ccap notify send --title "Hello" --type message
$ ccap notify send --title "Folytassuk?" --type confirm --wait
$ ccap notify send --title "Melyik?" --type option-select --options "a:A,b:B" --wait
```

### `ccap input`

Quick Input felvétele (POST /api/user-input).

```bash
$ ccap input "Új quick input szövege"
$ ccap input -w refactor-cycle "Lifecycle javítás kell"
$ ccap input -f bulk.md     # bulk: ---  separator
$ echo "A\n---\nB" | ccap input --stdin
```

---

## További parancsok

A többi subcommand (chat / sessions / config / init / palette / vault-key / explore / review / notify list / notify respond / repair / update / ver / skill-doc) a **[REFERENCE.md](./REFERENCE.md)**-ben.
