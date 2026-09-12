# ⏱️ `ma doctor now` — MI TÖRTÉNIK ÉPPEN MOST

**Megépítve:** 2026-09-12 · **Tétel:** 20/3 *(új igény)* · **Állapot:** ✅ kész, **élesben igazolva**

> **Owner, 2026-09-12 05:33:** *„Majd mindenféle **diagnosztikálási eszköz** fog kelleni neked a My
> Assistant rendszereihez. **Tudjad magadat diagnosztizálni**, hogy ilyenkor **mi a fene történik
> például most**?"*

---

## ⚠️ TÁG KÉRÉS VOLT — ezért EGY funkció, ⛔ nem keretrendszer

A handoff kikötése *(`uncertain-requests` + `one-function-is-enough`)*: ⛔ **ne épüljön
„diagnosztikai keretrendszer"**. ⇒ **Egy** parancs, ami **egy** kérdésre válaszol.

## 🔴 ELHATÁROLÁS A `comm doctor`-TÓL — a handoff külön kimondta

| | `ma comm doctor` | ⭐ `ma doctor now` |
|---|---|---|
| a kérdés | *„be van-e kötve, KÉSZ-e a lánc?"* | *„mi történik ÉPPEN MOST?"* |
| az idő | tartós állapot | **a pillanat** |
| a kimenet | tételes készenlét-tábla, teendőkkel | **egy** pillanatkép |

⛔ Nem olvasztottam össze őket: a *„minden zöld"* és a *„most épp semmi nem megy át"* **két
különböző igazság**, és egyszerre is fennállhatnak.

---

## 📺 AMIT MUTAT — élő futás, 2026-09-12 06:26 *(az owner épp beszélt)*

```
⏱️  MI TÖRTÉNIK MOST — 2026-09-12 06:26:50 (Europe/Budapest)

📨 KÖTEG: 1 üzenet vár
    a legrégebbi: 2p 5mp · a legújabb: 2p 5mp
    ⏸️  VÁR — ÉPP BESZÉL — folyamatban van egy megszólalás, megvárjuk, mi lesz belőle (1 tétel vár).

✅ FIGYELŐ: alive (4 mp régi)
    🔊 hang-csatorna: bent (honnie-place) · 4 megszólalás-jel · 1 felvétel feldolgozva
    🎙️ felismerés ÉPP: nem fut · feldolgozás alatt 0 felvétel · nyitott megszólalás-jel 3
    ⏳ köteg-kapu: 🔴 ZÁRVA · zaj az ablakban: 0
    ↳ 3 megszólalás-jel nyitott — ÉPP BESZÉL, megvárjuk.

🖥️  GÉP: CPU 52% · RAM 106.0/127.1 GB (83%)
🔴 UTOLSÓ HIBA (6 mp): [cast/device-caps] MA-CAST-DEVICE-CAPS-PARSE-FAIL: …
```

⭐ **AZ ELSŐ FUTÁS AZONNAL TALÁLT EGY VALÓDI HIBÁT:** `MA-DISCORD-LISTENER-CRASH — a figyelő 1
másodperc után kilépett (kód=1)`, 29 másodperccel korábban. ⇒ Kiderült, hogy az **én** `dist`
újraépítésem *(`rimraf`)* alatt indította újra a felügyelő a figyelőt — a **dist-race**, nem
kód-hiba *(mérve: ma pontosan **1** ilyen összeomlás volt, 06:23:27-kor, a build pillanatában)*.

## 🔬 A NEHÉZ RÉSZ — amit egy KÜLÖN FOLYAMAT nem lát

🔴 A **köteg-kapu** és a **futó felismerés** a figyelő **memóriájában** élnek. A `ma doctor now`
egy másik folyamat ⇒ kívülről ezek ⛔ pontosan úgy néznek ki, mint a semmi.

⭐ **A MEGOLDÁS:** a figyelő az **életjelbe** írja őket *(`moment` blokk — ugyanaz a csatorna, ami
már utazik a diagnosztikáig, tehát a frissesség-ellenőrzés ingyen jön vele)*. A `doctor now` ebből
olvas — és a döntés-számításba **be is táplálja** a kapu állapotát, különben *„elcsendesedett, megy
ki"*-t írna, miközben a figyelő épp visszatartja.

⚠️ **HA A BLOKK HIÁNYZIK, AZT KIMONDJUK:** *„a figyelő életjelében NINCS pillanat-blokk — régi
kódot futtat"*. ⛔ Nem nullákat mutatunk, mert az azt **állítaná**, hogy semmi nem történik.

| Mit mér | Honnan | Ha nem mérhető |
|---|---|---|
| hány üzenet vár és **mióta** | a köteg-tár *(lokális fájl)* | `gaps` sor |
| **miért** nem megy ki | a kiküldési döntés *(CCAP + a kapu az életjelből)* | *„a döntés NEM mérhető: …"* |
| fut-e felismerés, min | az életjel `moment` blokkja | *„a PILLANAT nem mérhető"* |
| a figyelő **életjele** | `listener-heartbeat.json` frissessége | `absent` |
| az újrapróbálási sor | `~/.config/my-assistant/stt-retry/` | `gaps` sor |
| ⭐ **a gép terhelése** *(owner, 03:12: „hogyan pörög a gép")* | CPU **két mintából**, RAM az OS-től | `CPU ?` |
| az utolsó hiba | a napi akció-napló, **visszafelé** olvasva | `gaps` sor |

⚠️ **MIÉRT NEM `loadavg()`:** Windowson **mindig 0**-t ad *(dokumentált Node-viselkedés)* ⇒ hamis
nyugalom. Ezért a CPU-t a tick-számlálók **két mintájának** különbségéből számoljuk.

## 🔴 A TERVEZÉS VEZÉRELVE: egy diagnosztika nem hasalhat el attól, amit mér

Mind a **hat** forrás **injektált**, és mindegyik bukása **túlélhető**: az adat `null` lesz **és**
bekerül a `gaps` listába, ami a jelentés alján **külön blokkban** látszik. ⛔ Nulla ≠ „nincs baj".

📌 Teszt: `cli/src/doctor/doctor-now.spec.ts` — 7 spec, köztük *„egy forrás bukása nem buktatja"*,
*„a döntés bukása külön kimondva"*, *„a hiányzó pillanat-blokk nem nyugalom"*, és hogy a kimenet
**egy képernyő** *(< 20 sor)*.

## A rétegek

| Fájl | Mit tesz |
|---|---|
| `cli/src/doctor/doctor-now.models.ts` | a pillanatkép **szerződése** |
| `cli/src/doctor/doctor-now.ts` | az **összeállítás** — injektált forrásokkal, `gaps`-szel |
| `cli/src/doctor/doctor-now.sources.ts` | a **valódi** olvasók *(fájl, életjel, sor, gép, napló)* |
| `cli/src/doctor/doctor-now.render.ts` | a **megjelenítés** — egy képernyő |
| `cli/src/commands/doctor.command.ts` | a parancs *(`--json`-nal gépi envelope)* |
| `cli/src/discord/discord.heartbeat.ts` | a `moment` blokk — a figyelő PILLANATA |
| `cli/src/main.ts` | ⚠️ a `COMMAND_TREE` bejegyzés *(enélkül a parancs **futásidőben nem létezik**)* |

## 📊 Igazolás

| Ellenőrzés | Eredmény |
|---|---|
| CLI-tesztek | **1248 / 1248** zöld |
| szerver-tesztek | **119 / 119** zöld |
| `tsc --noEmit` | tiszta |
| **élő próba** | `node cli/dist/cli/src/main.js doctor now` ⇒ ⭐ helyes kimenet, és **talált egy valódi hibát** |
| `dc rev` | **2404 → 2397** *(−7: az életjel-olvasó tisztítása 9 találatot vitt el; +2 a parancs-minta ára)* |

---

## 🧪 A 21. TÉTEL — AZ „UTOLSÓ HIBA" SORA TESZT-SZEMETET MUTATOTT (2026-09-12 09:05)

> **Owner, 09:05:** *„Megmértem: a bejegyzés ref-je `…\Temp\ma-groups-spec-KSBgEB\broken.json` — a
> `groups.spec.ts` SZÁNDÉKOSAN hibás fixtúrája… Mivel a teszteket naponta sokszor futtatjuk, az
> »utolsó hiba« szinte MINDIG teszt-eredetű lesz. ⇒ vagy hamis riasztás, vagy megtanuljuk figyelmen
> kívül hagyni — és **a második a rosszabb**, mert akkor a valódi hibát se vesszük észre."*

### 🔬 A MÉRÉS *(a mai napló, 5 992 bejegyzés)*

| | |
|---|---|
| `kind: 'error'` bejegyzés | **631** |
| ebből **ideiglenes könyvtárra** mutató `ref` | **114** |
| a minta | `…\AppData\Local\Temp\ma-<modul>-spec-XXXXXX\broken.json` |
| temp-es `ref` `-spec-` szakasz **nélkül** | **0** |

### 🔴 ÉS EGY HAMIS POZITÍVOT IS MÉRTEM — ezért NEM szöveg-egyezés a jel

A napló **egyik VALÓDI** bejegyzése *(`actor: claude`, 09:08)* a **summary**-jában említi a
`groups.spec.ts`-t, a `ref`-je viszont `__agent/DEV-HANDOFF.md`. ⇒ Egy **summary- vagy blob-szintű**
`*spec*` minta **pont a tétel felvetését** tüntette volna el.
⭐ Ezért a heurisztika **kizárólag az útvonal-mezőket** nézi *(`ref`, `extra.file`)*, és
**ideiglenes könyvtárat** követel.

### ⭐ A TISZTÁBB JEL — mérve, ⛔ nem tippelve

A handoff felvetette, hogy a **teszt-futás explicit megjelölése az emitnél** tisztább lenne.
**Megmértem, mi látszik egy spec-folyamatban:**

```
typeof globalThis.jasmine = 'object'                      ⟵ ⭐ közvetlen, konfiguráció NÉLKÜL
process.argv[1]           = …\node_modules\jasmine\bin\jasmine.js
process.env.MA_TEST_RUN   = (nincs)                       ⟵ ⛔ be kellene vezetni, elromolhat
```

⇒ ⛔ **Nem kellett új környezeti változó** *(ami minden futtatási módban máshogy romlik el)*: a
spec-keretrendszer **már ott van** a folyamatban. A `logAction` innentől **bélyegzi** a bejegyzést:
`extra.testRun: true`.

### 🔴 MIÉRT KELL MINDKÉT JEL — a bélyeg NEM elég

| Eset | Mi fogja meg |
|---|---|
| mostantól keletkező spec-bejegyzés | ⭐ a **bélyeg** *(pontos, nem heurisztika)* |
| a **már meglévő** 114 tétel *(és minden régi nap)* | a **temp-útvonal** |
| spec által **indított gyerek-folyamat** *(ott nincs `jasmine` globális)* | a **temp-útvonal** |
| a szerver **saját** naplózója *(külön funkció ír)* | a **temp-útvonal**, ha egyszer szennyezne |

⚠️ **Mérve:** a szerver egyetlen spec-je sem importálja a saját naplózóját ⇒ ma **nem** szennyez.
⛔ Ezért oda **nem** tettem bélyeget — a visszafogó ott is él.

### ⛔ NEM NÉMÍTÁS — a kihagyottak SZÁMA látszik

```
🔴 UTOLSÓ HIBA (3p 10mp): <a valódi hiba> (⚠️ 120 teszt-eredetű hiba kihagyva)
✅ UTOLSÓ HIBA: ma nem volt VALÓDI hiba (⚠️ 114 teszt-eredetű hiba kihagyva)
```

⭐ Ugyanaz az elv, mint a tölcsérnél a töredékeknél: amit kiszűrünk, arról a **száma** megjelenik —
így a szűrés maga is **ellenőrizhető**, és ⛔ nem fedhet el valódi hibát.
⚠️ A számlálás a **teljes napra** megy, ⛔ nem áll meg az első valódi hibánál: különben a kihagyottak
száma attól függne, **hol** találtuk meg a valódit.

### 📊 ÉLŐ IGAZOLÁS

```
🔴 UTOLSÓ HIBA (3p 10mp): A friss 'ma doctor now' UTOLSO HIBA sora teszt-szemetet mutat…
   (⚠️ 120 teszt-eredetű hiba kihagyva)
```

⭐ A friss teszt-futás **3** cast-spec hibája a naplóban már **bélyeggel** szerepel
*(`extra.testRun: true`)* — a bélyegzés tehát élesben is működik, ⛔ nem csak fixtúrában.
📌 A spec *(`action-log.test-origin.spec.ts`)* **a saját futásában** igazolja, hogy a bélyeg él:
`expect(ActionLogTestOrigin_Util.isTestRun()).toBeTrue()`.

---

## 📖 A 22. TÉTEL — ÖNREFERENCIA + A VAK FOLT MEGMÉRVE (2026-09-12 17:30)

> **Owner, 17:30:** *„Most az ÉN saját retrospektív jegyzetem jelenik meg »utolsó hibaként« — az a
> bejegyzés, amiben LEÍRTAM a teszt-szemét problémát. Nem rendszer-hiba, hanem **krónika**… A
> megkülönböztető jel MÁR OTT VAN: az `actor` mező."*

### 1️⃣ 📖 KRÓNIKA vs. ÜZEMÁLLAPOT — a mérés döntötte el, KIT hagyunk ki

🔴 **Az ok szerkezeti:** a `CLAUDE.md` **előírja**, hogy a szemantikus tanulságot `kind: 'error'`
bejegyzésként írjuk *(„hiba, aminek tanulsága van")* ⇒ **ugyanabban a naplóban** van a **gép**
hibája és az **utólagos elemzés** róla. Az önreferencia elkerülhetetlen: a hiba **leírása** lett „a
legutóbbi hiba". ⇒ ⛔ Nem a naplózást változtattuk meg, hanem az **olvasót** tanítottuk meg.

**MÉRVE — 52 nap, 4 131 `kind: 'error'` bejegyzés, `actor` szerint:**

| actor | db | Mi ez valójában |
|---|---|---|
| `cli` | 3 156 | ⚙️ **futásidejű** |
| `server` | 796 | ⚙️ **futásidejű** |
| `claude` | 100 | 📖 **krónika** *(az owner ezt kérte kihagyni)* |
| `codex` | 46 | 📖 **krónika** — mérve ugyanaz az osztály *(„Organizer shopping-item write blocked…")* |
| `agent` | 23 | ⚙️ **futásidejű** — `[notify-discord] POST failed … fetch failed` |
| `agent-dispatcher` | 6 | ⚙️ **futásidejű** — `dispatch: JSON parse error …` |
| `development-agent` | 3 | ⚠️ **VEGYES** *(„Build fail: client …" vs. prózai tanulság)* |
| `assistant-agent-cron` | 1 | ⚙️ **futásidejű** — `fo tasks.list AUTH-fail` |

🔴 **EZÉRT NEM a „minden, ami nem `cli`/`server`" szabály lett:** az `agent`, `agent-dispatcher`,
`assistant-agent-cron` és `development-agent` bejegyzések **mért módon GÉPI hibák** ⇒ egy fordított
logikájú szűrő **33 valódi hibát** tüntetett volna el. ⇒ **Nevesített, szűk lista** *(`claude`,
`codex`)*, ⛔ nem tagadás. ⚠️ A `development-agent` **szándékosan benne marad** *(vegyes tartalom)*:
a bizonytalan bejegyzést inkább **megmutatjuk**.

🙋 **A `codex` hozzávétele az én kiterjesztésem** *(az owner `claude`-ot kért)*: 46 mért, prózai
bejegyzés ugyanabból az osztályból. ⛔ Ha nem kell, egy szó és kiveszem.

### 2️⃣ 🔴 A NYELT `parseLine` HIBA — megmértem, és NEM vagyunk vakok

⚠️ A mérést **ugyanazzal a parserrel** kellett végezni, amit az eszköz használ *(Node `JSON.parse`
— a Python `json` máshol húzza a határt)*:

| Mit mértem | Érték |
|---|---|
| napló-fájl | **52 nap** |
| összes sor | **119 869** |
| 🔴 **értelmezhetetlen sor** | **1** *(0,001%)* |
| melyik napon | **csak 2026-09-12** |
| a sor `kind`-ja | ⭐ **`ship`** ⇒ „utolsó hibaként" ⛔ sosem jelenhetett volna meg |

**A konkrét ok** *(a sor 248. karakterénél)*:

```
…"summary":"… A Steam-utvonal a regisztrybol (F:\Steam)" …
                                                 ↑ escape-eletlen backslash ⇒ JSON-ban érvénytelen
```

⇒ Egy **kézzel írt** JSONL-sor *(direkt append, ⛔ nem a `logAction`-ön át)*. A kanonikus úton
*(`ma action-log emit` → `JSON.stringify`)* ez ⛔ nem fordulhat elő.

⭐ **AMIT TETTEM:** a `doctor now` **megszámolja** az értelmezhetetlen sorokat, és a `gaps`
blokkban **kimondja** — ⛔ nem csak a `stderr`-en:

```
⚠️ AMIT NEM SIKERÜLT MEGMÉRNI:
    · 1 napló-sor NEM volt JSON-ként értelmezhető — ennyire vak a napló-olvasás
      (az „utolsó hiba" ezekben a sorokban nem látszik)
```

⛔ **AMIT SZÁNDÉKOSAN NEM TETTEM:** ⛔ nem építettem „JSON-javító" tartalék-parsert *(0,001%-ért
egy olyan mechanizmus, ami **félre is olvashat** — pont az a magabiztos tévedés, amit kerülünk)*, és
⛔ **nem írtam át a sérült sort**: a napló **append-only**, a javítás nem az én döntésem.
🙋 A megelőzés a **kézi JSONL-append** elhagyása lenne *(a `ma action-log emit` helyesen escape-el)*.

### ⛔ NEM NÉMÍTÁS — a két szám KÜLÖN látszik

```
🔴 UTOLSÓ HIBA (11ó 13p): [MA-DISCORD-LISTENER-CRASH] Discord-figyelő 1s után kilépett …
   (⚠️ 132 teszt-eredetű + 11 krónika bejegyzés kihagyva)
```

⭐ **MIÉRT KÜLÖN a kettő:** a teszt-szemét a **gép** zaja, a krónika a **saját utólagos
elemzésünk** — ha egy nap sok krónika-bejegyzés van, az azt jelenti, hogy **sokat tanultunk**,
⛔ nem azt, hogy sok baj volt.

### 📊 ÉLŐ IGAZOLÁS

⭐ Az „utolsó hiba" most **valódi üzemállapot**: a 06:23-as `MA-DISCORD-LISTENER-CRASH`
*(a dist-race)*, **11 órával** korábbról — ⇒ azóta **nem történt gépi hiba**, és ez most **látszik**
is, nem elveszik a krónika és a teszt-szemét között.
