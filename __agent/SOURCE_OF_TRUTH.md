# SOURCE_OF_TRUTH — élő modul-tábla

> **Élő dokumentum.** Minden új session elején, és minden modul-művelet előtt
> ellenőrizd. Módosítása **csak user jóváhagyással** történhet.

A my-assistant rendszer modulonként dönt arról, hogy egy domain adata az
organizer test env-jében (`fo` CLI), vagy lokálisan (`current/{modul}/` markdown)
él. Ez a tábla mondja meg, melyik melyik.

## Status enum

| Status | Mit jelent | Mit szabad |
|---|---|---|
| `organizer-verified` | E2E tesztelve. Megbízható. Kanonikus az organizer DB. | `fo` CLI-n keresztül write/read szabadon. |
| `organizer-partial` | Részben tesztelve (általában read OK, write nem). | Read szabad. Write előtt user-confirmation + verify command. |
| `local` | Csak lokál fájl. | `current/{modul}/`-ban a kanonikus. Ne hívj organizer-MCP-t. |
| `dual` | **Átmeneti** költöztetés alatt. | Ne kerülj ide jóváhagyás nélkül. Konfliktus esetén kérdezz. |
| `external` | Az adat külső providerben marad; a repo csak adaptert tartalmaz. | Runtime read/write kizárólag explicit CLI akcióval; repo-persistencia tilos. |

---

## Modulok

| Modul | Source | Status | Lokál útvonal | `fo` namespace | Last verified | Verifikáció parancsa |
|---|---|---|---|---|---|---|
| **tasks** | organizer | `organizer-partial` | — | `tasks.*` | 2026-05-07 | `fo tasks.list/create/archive` (etag-update nem tesztelve) |
| **notes** | organizer | `organizer-partial` | — | `notes.*` | 2026-05-07 | `fo notes.list` ✅ (üres), create nem tesztelve |
| **calendar** | organizer | `organizer-partial` | — | `calendar.*` | 2026-05-07 | `fo calendar.list` ✅ (üres), create nem tesztelve |
| **shopping** | organizer | `organizer-partial` | — | `shopping.lists.*`, `shopping.items.*` | 2026-05-07 | parancs él, list nem tesztelve |
| **stocks** | organizer + local mirror | `organizer-partial` | `current/stock/items.md` (backup/mirror) | `stocks.*`, `stock-items.*` | 2026-08-23 | read ✅; actual item-write 🔴 `ORG_TEST/SIDS/DyNTS-DS0-VDP3`; organizer-note fallback + local mirror |
| **wallet** | organizer | `organizer-partial` | — | `wallet.*`, `wallet.transactions.*` | 2026-05-07 | parancs él, list nem tesztelve |
| **wishlist** | organizer | `organizer-partial` | — | `wishlists.*`, `wishitems.*` | 2026-05-07 | `fo wishlists.list` ✅ (1 üres entitás) |
| **diary** | local | `local` | `current/diary/diary.md` | (nincs MCP) | n/a | n/a |
| **email** | external IMAP/SMTP provider | `external` | — | `ma email *` | 2026-08-12 (offline suite) | `pnpm test` a `cli/`-ben; live-provider probe csak konfigurált My Assistant fiókkal |
| **interfood-account** | Interfood account + user-local cache | `external` | — | `ma interfood auth/orders/cart/order *` | 2026-09-01 (offline contract) | `ma interfood auth status`; live read calibration required |
| **interfood-preferences** | local | `local` | `current/interfood/preferences.json` | — | 2026-09-01 | `ma interfood preference list --pretty` |

---

## Verifikációs kritériumok modulonként

Egy modul `organizer-partial` → `organizer-verified` átmenetéhez **mind**
teljesülnie kell:

- [ ] `list` művelet — paging + filter
- [ ] `get` művelet — ref-fel
- [ ] `create` művelet — minden kötelező mezővel
- [ ] `update` művelet — etag-konzisztencia (ha kell)
- [ ] `archive` / `delete` művelet
- [ ] (ha van) `restore` művelet
- [ ] Sub-entitások (pl. `task-group`, `wallet.transactions`, `stock-items`,
      `note-books`) ha tartoznak hozzá

Új modul felvétele a táblába → user jóváhagyás kell.

---

## Ismert egyenetlenségek

- **diary** — az organizer-ben nincs MCP handler (`mcp/diary/` mappa hiányzik).
  Amíg ez nem jön létre, a `current/diary/`-ban marad lokálisan.
- **task-group** — csak `tasks.*` MCP-n keresztül kezelhető (parentRef-en át).
  Önálló `task-group.*` namespace nincs.
- **CLI etag flag** — `tasks.archive --if-match` opció a help példákban van, de
  a futtatható build nem fogadja el. `--ref` egyedül elég. Update-eknél lehet,
  hogy kell — minden művelet előtt: `fo {action} --help`.

---

## Változás-log

A tábla minden módosítását egy bejegyzéssel le kell vezetni — sorrend: legújabb
felül. A módosítást user jóváhagyással kell rögzíteni.

| Dátum | Mi változott | Ki kérte | Indok |
|---|---|---|---|
| 2026-09-01 | Interfood account-adat `external`, a verziókezelt explicit preferenciák `local` Source of Truth-ként felvéve. | user | Az Interfood Hyperplan teljes végigvitelének jóváhagyása. |
| 2026-08-23 | Stocks lokális backup/mirror engedélyezve a `current/stock/items.md` fájlban; az organizer marad a célrendszer. | user | „Ezeket local is fel kell jegyezzük mindig. Legyen backup/mirror” |
| 2026-08-12 | Email modul `external` source-szal felvéve; mailbox-adat és credential repo-persistencia explicit tiltva. | user | Az FDP Assistant e-mail eszközének adatmentes átemelése. |
| 2026-05-07 | Bootstrap. Minden organizer-modul `organizer-partial`-ra állítva probe alapján. Diary `local`. | user | Initial setup, organizer probe eredménye alapján. |
