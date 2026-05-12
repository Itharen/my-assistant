# Locations — bolt / szolgáltatás info

Bolt nyitvatartás, utazási idő, egyéb helyfüggő info, amit a task-tervezésnél
használunk (deadline-ok, mikor érdemes elindulni, stb.).

---

## Patika 💊

| Mező | Érték | Forrás |
|---|---|---|
| **Nyitvatartás** | hétköznap (H-P) | user 2026-05-07 |
| **Záróra** | **19:00** (NEM 18:00 — korrekció) | user 2026-05-07 |
| **Hétvége** | zárva | user 2026-05-07 |
| **Utazási idő** | min. **20 perc** (oda) | user 2026-05-07 |
| **Latest indulás** | `záróra − 20p` = **18:40** | számolva |

> *Forrás (szó szerinti idézet a 2026-05-07 korrekcióból):*
> *"Egy kis pontosítás, Patika amúgy nem hatkor, hanem hétkor zár. Minden hét
> köznap van csak nyitva. De legalább 20p-el előtte el kell oda indulni"*
>
> *(STT-megjegyzés: a korábbi inputban "este 6"-ot mondott; ez "este 7"
> helyesen — STT-félrehallás-javítás.)*

### Task-tervezési szabály

- Patika-task-okon `dueDate` = max **18:40 a tervezett napon** (utolsó normál indulás)
- Hard záró: 19:00
- **Hétvégén nem tervezünk patikai task-ot** (zárva)
- Ha péntek estefelére csúszik egy patikai item, azt **csütörtökre** kell előre
  hozni, mert pénteken vendégek érkezhetnek (lásd `fit-system.md` weekly anchors)

---

## Megjegyzés

Ez a fájl bővíthető bolt-/szolgáltatás-szinten:
- 🏪 Tesco (online → 24/7 rendelés / bolt — nyitvatartás külön)
- 🛒 IKEA (heti nyitvatartás + utazási idő)
- 🏥 Bőrgyógyász (külön task, helyszín / rendelési idő — TBD)
- ⛰️ Gellért-hegy (kapcsolódó, ha van pl. szezonális zárás vagy ütem-info)
- 👕 Ruhaboltok (mikor megyünk, melyik bolt típus)

Új location hozzáadáskor: `## {Location név}` szekció + tábla a fenti minta szerint.
