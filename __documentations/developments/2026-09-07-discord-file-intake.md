# 📥 Discord-csatolmány → `__agent/inbox/` — a fájl többé nem vész el

**Dátum:** 2026-09-07 · **Kiváltó owner-üzenet (16:13):** *„Én most letöltöttem valami AI Summit
holnapi programot. Hova tegyem?"*

## 1. A mért hiány

A kérdés maga leplezte le a hibát: **nem volt hova tennie.**

| Eset | Mi történt eddig |
|---|---|
| Fájl **szöveg nélkül** | ⛔ a szűrő **elutasította** — *„Csak nem-hang csatolmány érkezett…"* |
| Fájl **szöveggel** | a szöveg átjött, a **fájl leesett** róla (`toBatchEntry` eldobja a csatolmányokat) |
| **Hangüzenet** | ✅ letöltve, felismerve — ez volt az egyetlen kezelt eset |

⇒ Ha az owner rádobja a PDF-et a csatornára, **némán elveszik**, és ő azt hiszi, megkaptam.

## 2. Amit megépítettem — és amit szándékosan NEM

**`cli/src/discord/discord.file-intake.ts`** — a nem-hang csatolmányt **azonnal letölti** és az
`__agent/inbox/`-ba menti `YYYY-MM-DD-HHmm-<biztonságos-név>` alakban, majd a mentés helyét
**hozzáfűzi az üzenet szövegéhez** — ez az egyetlen nyom, ami a kötegbe eljut.

⛔ **NEM része** (`one-function-is-enough`): PDF-olvasás, tartalom-értelmezés, automatikus
besorolás. Az már döntés, nem szállítás — azt a következő körben kézzel csinálom.

### A három döntés, ami számít

1. **Bájtot tárolunk, nem URL-t.** A Discord linkjei aláírtak és **lejárnak** — egy elmentett cím
   később használhatatlan. Ugyanaz a tanulság, mint az STT újrapróbáló sorában.
2. **A bukás is bekerül a szövegbe.** Ha egy fájl nem jött le, azt az üzenettel **együtt** látom
   (`🔴 … NEM sikerült lementeni`). Különben a hiánya csak akkor derülne ki, amikor keresném.
3. **A fájlnév ellenséges bemenet.** `../../../etc/passwd` és `C:\Windows\…\evil.dll` is
   érkezhet — a `toSafeFileName` levágja az útvonalat és csak `A-Za-z0-9._-`-t enged. Teszt fedi.

## 3. Hatókör-határ, ami megmaradt

A **biztonsági kapuk változatlanok**: idegen küldő és rossz csatorna a fájlnál is elutasítva
*(külön regressziós teszt)*. A csatolmány-fogadás **nem** lazít a szűrőn — csak a *„van tartalom?"*
kérdésre válaszol másképp.

## 4. Igazolás

`503/503` teszt zöld. Új tesztek: 9 a `discord.file-intake.spec.ts`-ben *(path traversal, méret-korlát,
hálózati hiba, HTTP-hiba, üres fájl, névütközés-elkerülés)*, 3 a szűrőben *(fájl szöveggel, fájl
szöveg nélkül, idegen küldő)*.

⚠️ **Élő próbára vár:** valódi Discord-csatolmánnyal még nem futott. Amíg az nincs meg, a képesség
**nem tekinthető igazoltnak** — ugyanaz a mérce, mint a hangüzeneteknél volt.
