# 📥 Inbox — ide teheted a fájlokat, amiket fel kell dolgoznom

**Mit tegyél ide:** bármit, ami adat és a rendszerbe kell — letöltött program, PDF, screenshot,
export, számla, jegyzet. Nem kell elnevezni és nem kell mappát választani.

**Mi történik vele:** a következő körben ránézek, feldolgozom, és a helyére teszem
*(`current/events/`, `current/tasks/`, ahova való)*. Utána ide egy sor kerül arról, hova ment.

⚠️ **Ez nem archívum** — a feldolgozott fájl elmegy innen. Ami itt van, az még nyitott.

## Miért nem elég a Discord

A Discord-figyelő ma **csak hangot** tölt le. Minden más csatolmány *(PDF, kép, doksi)*
**leválik** az üzenetről — a szöveget megkapom, a fájlt nem. Ez **mérve** van
(`cli/src/discord/discord.listener.ts` `toBatchEntry`, `discord.message-filter.ts`).

⇒ Amíg ez nincs megépítve: fájl **ide**, vagy küldd a **linkjét** Discordon — azt le tudom tölteni.
