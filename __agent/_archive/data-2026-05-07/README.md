# data/

A tényleges, élő adatok. Minden domain-hez egy fájl (vagy mappa, ha nagyobb mennyiség).

A formátumokat a `__agent/domains/{domain}.md` definiálja.

## Fájlok

- `tasks.md`
- `calendar.md`
- `notes.md`
- `diary.md`
- `shopping.md`
- `stock.md`
- `wallet.md`
- `wishlist.md`

## Migrációs alapelv

Ezek a fájlok a végén az **organizer** projektbe kerülnek importálva. Ezért a
formátum legyen sima markdown + strukturált mezők, hogy parse-olható legyen.
