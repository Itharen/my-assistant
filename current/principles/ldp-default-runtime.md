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

---

## 🔴 MINDEN WORKFLOW-TRIGGERKOR ELLENŐRIZNI KELL, HOGY FUT-E

> **Owner, 2026-09-07 — SZÓ SZERINT:**
>
> *„a workflow triggerekkor ellenőrizned kellene mindig h fut e a my assistant LDP"*

**Ez a belépési pont NULLADIK lépése** (`__agent/ENTRY.md` §1), az idő-mérés ELŐTT.

### Miért ez az első

Az LDP alatt **minden** él: a szerver, a Discord-figyelő, a jelenlét-figyelő, a konzol-pulzus.
Ha nem fut, **nem csak a build áll** — a **csatorna is néma**, és az owner üzenetei sehova nem
érkeznek meg. ⇒ Ilyenkor **minden további ellenőrzés félrevezető**: a „nincs új üzenet" nem
azt jelenti, hogy nem írt, hanem azt, hogy **nem látjuk**.

### ⚠️ A fájl megléte NEM bizonyíték

A `logs/live-dev-pipeline/status.json` a lemezen marad akkor is, ha a folyamat **rég meghalt** —
fájl-alapon tehát „fut"-nak látszana. Ezért az ellenőrzés a benne lévő **PID-et is megnézi**
(`process.kill(pid, 0)`).

🔴 Ez pontosan az a hibaosztály, ami a **jelenlét-figyelőt 112 napig halottan tartotta**:
a konfiguráció megléte nem azonos a működéssel.

### Hogyan

```bash
ma comm doctor      # az ELSŐ sora az LDP — 4 állapot:
                    #   ✅ fut · 🟡 elavult (él, de beragadhatott)
                    #   🔴 HALOTT (a fájl megvan, a folyamat nem) · 🔴 sosem futott
```

Ha nem fut: **`dc ldp`**, saját terminálablakban — és **csak utána** bármi más.

Kód: `cli/src/comm/comm.ldp-check.ts` *(7 teszt, köztük a halott-PID eset)*.

---

## 🔴 2026-09-10 — 6 ÓRÁS NÉMA KIESÉS GÉPINDULÁS UTÁN

**A mérés:**

| Tény | Idő |
|---|---|
| Az utolsó jelenlét-minta | **09:26** |
| A gép újraindult *(uptime-ból visszaszámolva)* | **~09:57** |
| Én ezt észrevettem | **15:57** |
| A csatorna újra élt | **16:00** |
| **Néma kiesés** | **~6 óra** |

**Ami NEM indult el a boot után:** `dc ldp` · a my-assistant szerver · a **Discord-figyelő** ·
a **jelenlét-figyelő**. ⛔ **Egyik sem indul automatikusan.**

⭐ **A kár ezúttal nulla volt** — a figyelő indulási backfillje **semmit nem talált**, és a
várakozó sor **üres** volt: az owner a kiesés alatt **nem írt**. ⚠️ Ez **szerencse, nem
védelem**.

### 📌 A hibaosztály: a rendszer NEM TUDJA JELEZNI a saját halálát

🔴 Amikor minden leáll, **az is leáll, ami szólna róla**. Nincs az a napló, figyelő vagy
diagnosztika, ami ilyenkor megszólal — a felfedezés **kizárólag a következő ébredésemen** múlik.

⇒ Ezért **a gép-újraindulás ellenőrzése az ELSŐ lépések közé került** (`ENTRY.md` **0a**), a
`LastBootUpTime` és a jelenlét-napló utolsó mintájának összevetésével. ⚠️ A `comm doctor`
önmagában **nem elég**: az „nem fut" üzenetet mond, de **nem mondja meg, hogy MIÓTA** — és a
„most indítsd el" reflex elfedi, hogy **hat órán át néma volt a csatorna**.

### ⚠️ Amit ez a jövőre nézve NYITVA hagy

A valódi megoldás **automatikus indítás boot után** *(feladat-ütemező vagy szolgáltatás)* —
⛔ ez **owner-döntés**, mert a gépén futó autostartot nem én állítok be. Addig a **0a lépés**
a kompenzáló kontroll: **felfedezi**, de nem **előzi meg**.

---

## 🔴 „AZ ÖRÖK HIBA" — az owner megismételte (2026-09-12 01:18)

> **Owner (szó szerint):** *„Lehet, hogy nem az LDP-vel van elindítva a My Assistant? **Az örök
> hiba.** Az **mindig** az LDP-vel kell elindítva legyen, és **külön ablakban mindig, mindig,
> mindig, by default**, és igazából ez már **dynamo szinten** így kéne legyen, hogy by default
> külön ablakban indul el az LDP, és **az LDP a default indítás**."*

⚠️ **Azért kerül ide újra, mert ez a MÁSODIK megfogalmazás** — és most **erősebb**: nemcsak
a my-assistant szabálya, hanem **Dynamo-szintű elvárás**. ⇒ Ez **FR-jelölt a `cli-dynamo`-nak**:
*„az LDP legyen a default indítás, külön ablakban."*

### ⭐ MIÉRT NEVEZI ÖRÖK HIBÁNAK — a mechanizmus

Ha nem LDP-vel indul, akkor a szerver **gazdátlan**, és **alatta nem élnek a figyelők** — de ez
**⛔ nem hibaüzenettel** jelentkezik, hanem azzal, hogy *„valami nem megy"*. ⇒ **A tünet
diffúz, az ok pontszerű** — ezért ismétlődik.

### 📌 MÉRT ELLENPÉLDA UGYANEBBŐL AZ ÉJSZAKÁBÓL — ⛔ ne ugorjunk a következtetésre

2026-09-12 03:20-kor a `ma` CLI **egyáltalán nem indult**:
`Cannot find module '…/cli/dist/cli/src/main.js'`. ⚠️ **Ez NEM az „örök hiba" volt:**

| Mit mértem | Mit jelent |
|---|---|
| `logs/live-dev-pipeline/status.json` → `phase: "tsc-cli"`, `pipelineComplete: false` | ⭐ **éppen FUTOTT egy build** |
| `cli/dist` hiányzik | a `rimraf ./dist` lefutott, a `tsc` még nem végzett |
| a szerver `/api/version` **válaszol**, a listener heartbeat **friss** | ⇒ a szolgáltatás **él** |

⇒ **Átmeneti build-ablak**, nem indítási hiba. ⭐ **A tanulság:** „a CLI nem indul" ⛔ önmagában
nem bizonyíték az „örök hibára" — előbb a **LDP-fázist** kell megnézni.
*(Kapcsolódó mért kockázat: a `npm test` `rimraf ./dist`-je **a futó rendszer alól** viszi el a
`dist`-et — `current/principles/shared-file-collision.md`.)*
