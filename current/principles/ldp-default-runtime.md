# Az LDP a default futtatási mód — és ő tartja életben a háttér-figyelőket

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel.

---

## 2026-09-06 — a szerver legyen a figyelők gazdája

> ez a Google Home-on keresztüli kommunikáció… *(korábbi kontextus)*

> a szervernek kéne futnia, a szervernek kéne ezt figyelnie, és amúgy azért kéne LDP-vel
> futtassuk, hogy folyamatosan fusson.

---

## 2026-09-06 — indítsd el te, és nyíljon terminál

> Na én azt szeretném, hogy te indítsd el és nyíljon terminál és maradjon is életben és az
> LDP fusson és te meg ahhoz igazodva fogsz tudni dolgozni és fejleszteni.

---

## 2026-09-06 — ez a default, és a jelenlét-figyelő is ide tartozik

> btw amúgy is ez kéne legyen az alap/default LDP működés…
>
> Azt a jelenlétfigyelőt is vagy integrálni kéne a My Assistant szerverbe, vagy neki kéne
> indítania.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### Az elv

**Az alapállapot: fut az LDP, saját látható terminálablakban, és minden háttér-figyelő
alatta él.** Nem egy külön művelet, amit néha elindítunk — ez a normál üzem.

| | |
|---|---|
| **Ki indítja** | az agent, ha nem fut — nem az owner feladata |
| **Hogyan** | **saját, látható terminálablakban**, ami a session végét is túléli |
| **Ki a gazda** | az LDP indítja a szervert, a szerver a figyelőket |
| **Ki igazodik kihez** | **az agent igazodik az LDP-hez**, nem fordítva |

### Amiből ez a szabály származik (mért tények, nem vélemény)

1. A **Discord-figyelő** külön, kézzel indított folyamat volt → amikor nem futott, az
   owner üzenete kívülről pontosan úgy nézett ki, **mintha meg sem írták volna**.
2. A **jelenlét-figyelő** ütemezett feladaton múlt, amit senki nem ellenőrzött →
   **112 napig volt halott**, és emiatt a hangszórós kapu végig tiltott.
3. Az **LDP maga is** 22 órán át állt egy `fatal` lépésen (`tsc-cli`), és senki nem tudott
   róla, mert nem volt nyitva a terminálja.

⇒ A közös hibaminta: **egy külön elindítandó dolog előbb-utóbb nem indul el, és a
nem-indulás CSENDES.** A válasz nem több fegyelem, hanem **kevesebb külön indítandó dolog**:
egyetlen belépési pont (`dc ldp`), ami alatt minden más automatikusan él.

### Gyakorlati következmények

- **Új folyamatos háttér-folyamat** ⇒ a szerver alá kerül *(`getRootServices()` +
  `SupervisedChild`)*, nem külön szkriptbe és nem ütemezett feladatba.
- **A felügyelet kötelező része** a lassuló újraindítás, a gyermek kimenetének megőrzése a
  hiba-bejegyzésben, és annak felismerése, hogy máshol már fut egy példány.
- **Az ütemezett feladat (`scripts/install-autostart.ps1`) tartalék marad** arra az esetre,
  ha a szerver nem fut — nem az elsődleges út.
- 🔴 **KORREKCIÓ (2026-09-07, mérve):** korábban azt írtam ide, hogy a build alatt a szerver —
  és vele a Discord-csatorna — **áll**. **EZ TÉVES VOLT.** Futó pipeline közben mérve: a
  szerver-port ÉLT, a Discord-figyelő és a jelenlét-figyelő életjele **friss** volt. Az LDP a
  szervert **végig futásban tartja**, és csak a pipeline **sikeres lezárása után** indítja
  újra. *(A `status.json` `serverRunning: false` mezője az LDP belső „restart pending"
  jelzése, nem a szerver valós állapota — ezt olvastam félre.)*
- ⚠️ **A teljes LDP-kör hosszú** (mérve: ~23 perc, a `client-build` 536 s és a `client-test`
  377 s dominál). Fejlesztés közben ehhez kell igazodni: a mentés **utáni** újraindulás nem
  azonnali — az **új kód** csak a kör végén lép életbe.
  ✅ **De a szerver közben FUT** *(lásd a fenti korrekciót)*: csak a kör legvégén van egy
  rövid újraindulás, és az alatt kiesett üzeneteket a **visszamenőleges beolvasás** pótolja.

### Kapcsolódó

- `current/principles/system-components.md` — a 7 komponens elhatárolása
- `current/principles/error-handling.md` — a csendes elhalás tiltása
- `__documentations/ARCHITECTURE.md` — a szerver felügyelt szolgáltatásai
- `__documentations/dev/DISCORD_BOT_SETUP.md` §6b — ki futtatja a figyelőt
