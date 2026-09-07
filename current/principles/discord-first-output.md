# Discord-first kimenet — ami érdemi, az DISCORDRA megy

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.**

---

## 2026-09-07 — a korrekció

> Ne felejtsd el, hogy most még látom, hogy írogatsz nekem a sessionbe az üzeneted végére, de
> a Discordon nem látom az infókat, és amikor el fogok indulni itthonról, akkor egyáltalán nem
> fogom látni, amiket a sessionbe írogatsz, csak amit a Discordra. Úgyhogy jobban oda kéne
> figyeljél, hogy tényleg minden átjusson nekem Discordra, és egynél több üzenetet is írhatsz
> egy körben nyugodtan.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### 🔴 A HIBA, amit ez javít

Eddig a **session-választ** kezeltem „fő" válaszként, és a Discordra csak egy **rövidített
kivonat** ment. Ez **működni látszott**, amíg a user a gép előtt ült — ezért nem is bukott ki.

⚠️ **De abban a pillanatban, hogy elindul otthonról, a session-válasz LÁTHATATLAN.**
Amit csak oda írtam, az **elveszett info**, nem „másodlagos csatorna".

⇒ Ugyanaz a hibaosztály, mint a csendben elhalt figyelő: **kívülről rendben lévőnek látszik.**

### A szabály

| | |
|---|---|
| ⭐ **Elsődleges kimenet** | **Discord** |
| Másodlagos | a session-válasz *(kényelmi tükör, amíg a gépnél ül)* |
| **Több üzenet egy körben** | ✅ **SZABAD** — a user kifejezetten engedte |
| Hosszabb tartalom | ✅ mehet Discordra; a küldő 2000 karakter fölött **sorhatáron darabol** |

### Az ellenőrző kérdés — minden kör végén

> **„Ha a user ebben a pillanatban elindulna otthonról, elveszne bármi abból, amit most
> leírtam?"**

Ha igen → **az Discordra való.**

### Mi NEM megy Discordra

- Belső mechanika, amit nem kért *(fájl-útvonalak, commit-hash, teszt-számok)* — **kivéve**,
  ha kifejezetten érdekli vagy döntést hoz rajta
- Puszta nyugtázás („rendben, megcsinálom") — az **zaj**

⇒ A szűrő **nem a hossz, hanem az információ-tartalom**: ami **döntést, cselekvést vagy
tudást** ad neki, az megy.

### Kapcsolódó

- `current/principles/message-delivery-reliability.md` — a „sent ≠ megkapta" probléma
- `current/principles/working-style.md` — rövid, tömör, emoji
- `__agent/workflow-rules.md` §2 ⑦ — a kimenet a userhez szól
