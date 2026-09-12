# 📨 A KÉZBESÍTÉSI NYUGTA — „megérkezett hozzám (N perc várakozás után)"

**Mérve és megépítve:** 2026-09-12 · **Tétel:** 23. *(MAGAS)* · **Állapot:** ✅ kész
*(élesben a következő listener-indulástól)*

> **Owner, 2026-09-12 22:02 (gépelve):** *„Úgy látom, hogy **X üzenet elküldve** üzenetet **nem
> akkor kapom, amikor elküldötté válik** tényleg, hanem nem tudom mikor később."*

---

## 🔬 A MÉRÉS — igaza volt, és a nyugta **pontos** volt

*(Az owner mérése a `delivered-inbound.jsonl` és az `outbound-log.jsonl` összevetéséből — ⛔ nem
mértem újra, a handoff kikötése szerint.)*

| Nyugta | Az **első megszólalása** óta | A **kézbesítés** óta |
|---|---|---|
| 04:49:21 | **201 mp** | **2 mp** |
| 16:05:40 | **650 mp** | 3 mp |
| 16:19:48 | **330 mp** | 5 mp |
| 16:27:26 | **190 mp** | 3 mp |

🔴 **A nyugta 2-5 másodperccel a kézbesítés után ment ki — de 3-11 perccel az owner beszéde után.**
⇒ A szám **pontos** volt, csak ⛔ **nem azt mérte, amit ő hitt**.

## ⇒ A HIBA A SZÖVEGBEN VOLT, ⛔ NEM AZ IDŐZÍTÉSBEN

*„Átment N üzeneted"* ⇒ az owner **szállítási visszaigazolásnak** olvasta *(„megérkezett a
Discordra")*. Valójában azt jelentette: **„a köteg megérkezett az agenthez"** — a gyűjtő-ablak és a
session-szabadság **után**.

⛔ **A késleltetést NEM szüntettük meg:** a kötegelés **szándékos**, az owner kérte
*(„minél több infó egy promptba")*.

## ✅ AZ ŐSZINTE NYUGTA

```
📨 3 üzeneted megérkezett hozzám (4p 12mp várakozás után).
📨 2 üzeneted megérkezett hozzám (41 mp várakozás után).
📨 5 üzeneted megérkezett hozzám (9p várakozás után).
📨 3 üzeneted megérkezett hozzám (⚠️ 14p várakozás után — addig gyűjtött a köteg).
📨 12 üzeneted megérkezett hozzám (⚠️ 1ó 5p várakozás után — addig gyűjtött a köteg).
📨 4 üzeneted megérkezett hozzám.                       ⟵ ha a várakozás ⛔ NEM mérhető
```

| Döntés | Miért |
|---|---|
| **„megérkezett hozzám"** | ⛔ nem „átment" — a nyugta a **saját** átvételemről szól, ⛔ nem a Discord-szállításról |
| **a legRÉGEBBI üzenet kora** | ⭐ ez az, amit az owner **ténylegesen várt**. A legújabb kora a **gyűjtő-ablak** hossza *(~30 mp)* lenne — ⛔ nem a türelem-idő |
| ⚠️ **10 perc fölött kiemelés** | 🔬 a horgony ⛔ nem fejből: a gyűjtő-ablak **30 mp**, a tartási szelep **15 perc** ⇒ a 10 perc fölötti várakozás már a szelep utolsó harmada, tehát **kivételes** kapu *(foglalt session, CCAP-sor, folyamatban lévő megszólalás)* |
| **és az OKA is kimondva** | *„addig gyűjtött a köteg"* — a késés ⛔ nem hiba, hanem a kötegelés **működése** |
| ⛔ **nem mérhető ⇒ nincs szám** | egy hibás időbélyeg mellett a `0` azt **állítaná**, hogy nem is várt. ⇒ `null`, és a szöveg elhagyja a zárójelet |
| **egy sor marad** | az owner 09-07-i *„rövid 2 szavas válasz"* kérése ⚠️ **részben felülírva** *(most kifejezetten TÖBB infót kért)*, de a **tőmondat** megmarad |

⭐ **A közös időtartam-formázót ⛔ nem forkoltuk** *(`formatDuration` — több fogyasztója van)*:
csak a kerek perc végéről vágjuk le a `0mp` zajt *(„9p 0mp" ⇒ „9p")*.

## 🔴 MIÉRT TÖBB EZ KOZMETIKÁNÁL

Az owner **ma négyszer** hitte, hogy áll a rendszer — **03:17 · 04:22 · 04:40 · 22:02**.
**Egyszer sem állt.** ⇒ **Egy őszinte nyugta mind a négy félreértést megelőzte volna.**
⚠️ Nem a szolgáltatás hibás, hanem a **bizalom** sérül — és azt nehezebb visszaépíteni, mint egy
funkciót.

## A rétegek

| Fájl | Mit tesz |
|---|---|
| `cli/src/discord/discord.receipt.ts` | ⭐ **a szöveg** — a mért indoklással és a 10 perces küszöbbel |
| `cli/src/discord/discord.bridge.ts` | a **legrégebbi** üzenet korának mérése a kézbesítéskor *(`measureOldestWait`)* |
| `cli/src/discord/discord.models.ts` | `DiscordFlushResult.oldestWaitMs` — ⚠️ `number \| null`, mert a 0 ⛔ nem „nem tudom" |
| `cli/src/discord/discord.listener.ts` | a szám átadása a nyugtáig |
| `cli/src/discord/discord.bridge-wait.spec.ts` | ⭐ **a legrégebbi ≠ legújabb** állítás — öröklés-alapú hamis tárral *(⛔ `as` átcímkézés nélkül)* |

## 📊 Igazolás

| Ellenőrzés | Eredmény |
|---|---|
| CLI-tesztek | **1273 / 1273** zöld *(+8 új spec)* |
| `tsc --noEmit` | tiszta |
| szöveg-előnézet | ⭐ fixtúrából, mind a **7** változat *(l. feljebb)* |
| `dc rev` | **2397 → 2397** — ⭐ **0 új találat** *(a bridge-spec 536 sorra nőtt volna ⇒ a blokk **külön fájlba** került, ⛔ nem szabály-kikapcsolással; és az `as never` helyett **öröklés**)* |

🔇 **A KERET BETARTVA:** ⛔ nulla élő hangszóró-kísérlet, ⛔ egyetlen üzenet sem ment az ownernek —
az előnézet **fixtúrából** készült, ⛔ nem élő Discord-küldésből.
