# 😴 AZ ÉBRENLÉT-DÖNTÉS — mérésből, nem órarendből (MP-5)

**Megmérve és megépítve:** 2026-09-12 · **Állapot:** ✅ kész *(a HTTP-végpont a következő
szerver-indulásnál él)*

> **A `comm doctor` régóta sárga sora:**
> ```
> 🟡 Ébrenlét-döntés forrása
>    Fix órarend-tippelés — NEM mérés. Ez ellentmond a csúszó, 26 órás alvás-ciklusnak.
>    → TEENDŐ: Kösd át a jelenlét-mérésre: ITTHON-jel VAGY Discord-válasz (+1 óra). MP-5.
> ```

📌 **Miért nem kozmetika:** erre épül a **hangszóró-kapu**. Rossz ébrenlét-döntés ⇒ megszólal a
Google Home, amikor az owner alszik — 🔇 és 09-12/13-án **vendégek** vannak.

---

## 🔬 A MÉRÉS — 5 698 minta, ⛔ nem két anekdota

A teljes jelenlét-adaton *(8 napi fájl, 2026-05-07 … 09-12)* összevetettem a **fix órarendet**
*(`02:00-10:00 = alvás`, env-felülírás nincs — mérve)* a **mérhető** ébrenléttel:

| Osztályozás | EGYEZIK | ELTÉR | Értékelhető minta |
|---|---|---|---|
| (a) az `idleState` mező szerint | 56,1% | **43,9%** | 5 437 *(261 régi sorban nincs mező)* |
| (b) `idleSeconds ≥ 10 perc` = nem ébren | 61,5% | **38,5%** | 5 698 |
| (c) `idleSeconds ≥ 1 óra` = alszik | 64,7% | **35,3%** | 5 698 |

🔴 **Az eltérés mindhárom olvasatban 35-44%** — a fix órarend gyakorlatilag **érme-feldobás**.
⇒ Strukturális ok: a **csúszó, ~26 órás** alvás-ciklus *(`sleep-system.md`)* egy **fix**
órarenddel összeférhetetlen.

## ⚠️ AMIT A HANDOFF ÁLLÍTOTT — és amit a mérés mond

A handoff *(00:10)* két esetet nevezett meg a tipp cáfolatául. ⭐ **Utánaszámoltam, és a két
példa nem cáfolja** a `/api/sleep-state` heurisztikáját:

| Időpont | A FIX órarend | A valóság *(nyers adat)* | |
|---|---|---|---|
| 09-11 **09:00** | 09 **az ablakban** ⇒ „alszik" | aludt *(idle 6,1 → 7,7 óra)* | ⭐ EGYEZIK |
| 09-12 **00:06** | 00 **az ablakon kívül** ⇒ „ébren" | ébren volt *(idle 0 mp, HeaveHo)* | ⭐ EGYEZIK |

⇒ A két idézett pillanatban a tipp **véletlenül eltalálta**. ⛔ Ez **nem érv a tipp mellett** — a
35-44%-os eltérés mutatja, hogy máskor rendszeresen téved. ⭐ **A csere indoka tehát erősebb,
mint a handoffé — de más, és ezt kimondom** *(a 2026-09-11-i owner-elvárás: ha a handoff
méréssel cáfolható tényt állít, cáfold)*.

*(Ha a „reggel = ébren" tipp nem a `/api/sleep-state`-ből jött, akkor egy másik, nem mért
forrásból — ⚠️ az külön tétel, és nem ez a change-set fedi.)*

---

## ✅ A MEGOLDÁS — ⭐ EGY funkció, és ⛔ NEM új implementáció

> **ébren?** = friss **AKTIVITÁS**-minta **VAGY** friss **Discord-válasz** *(+1 óra türelmi ablak)*

🔴 **A jel és a szabály MÁR MEGVOLT** — csak nem ott, ahol a szerver kérdezte:

| Ami már készen volt | Hol |
|---|---|
| a jelenlét-olvasás *(BOM, `timestamp`, `idleSeconds`, 3 állapot, RustDesk-szűrő)* | `cli/src/presence/presence.reader.ts` |
| a „Discord-válasz ⇒ +1 óra" owner-szabály | a **hangszóró-kapuba** beépítve |

⇒ Ezért **nem írtam új olvasót**. Az ébrenlét-döntés **kiemelve** egy helyre, és **mindkét**
fogyasztó azt használja:

| Fájl | Mit tesz |
|---|---|
| `cli/src/presence/presence.awake.ts` | ⭐ **a döntés** — tiszta függvény, 3 ág, indoklással |
| `cli/src/presence/presence.awake-runner.ts` | a jelek összeszedése lemezről *(jelenlét + Discord)* |
| `cli/src/cast/notify.presence-gate.ts` | a **hangszóró-kapu** — ezt használja, és **szigorúbb** *(ébren **ÉS** itthon)* |
| `server/src/_services/sleep-state.service.ts` | a `/api/sleep-state` — **ugyanezt** hívja a CLI-ből |
| `cli/src/comm/comm.doctor.ts` | az ellenőrző sor — 3 állapot, tiszta döntésként |

⛔ **MIÉRT NEM KÉT IMPLEMENTÁCIÓ** *(`core-ssot-unified`)*: a szerver **tippelt**, a CLI-kapu
**mért** — a rendszer **két különböző igazságot** mondott ugyanarról az emberről.

---

## 🔴 A HÁROM ÁG — és a harmadik a lényeg

| Ág | Mikor | `isAwake` | Következmény |
|---|---|---|---|
| ⭐ **ébren** | friss, aktív mérés **vagy** Discord-válasz ≤1 óra | `true` | megszólalhat *(ha itthon is van)* |
| 😴 **alszik** | friss mérés, de régóta tétlen | `false` | **néma** |
| 🔴 **nincs adat** | nincs/elavult mérés, és nincs Discord-válasz | `false` | **néma** |

> **⚠️ BIZONYTALANSÁGNÁL AZ „ALSZIK" ÁG NYER.** A téves csend **olcsó**, a téves hangos
> **nem az**. Az `unknown` ⛔ nem „valószínűleg ébren" — és ez **be van építve** az `isAwake`
> mezőbe, hogy a hívó ⛔ ne tudja félreolvasni.

⭐ **Az „alszik" ág indoklása kimondja a kétértelműséget:** *„ALSZIK (vagy nincs a gépnél)"* —
a friss-de-tétlen mérés ⛔ nem bizonyítja az alvást, de a **következmény ugyanaz**.

### Ami a döntéssel együtt jár — ⛔ nem puszta logikai érték

```
allapot : awake
jel     : presence-active
eletkor : 0 perc
indoklas: ÉBREN — a gépét használja. Friss mérés (0 perce), aktív bevitel.
```

---

## 📊 Igazolás

| Ellenőrzés | Eredmény |
|---|---|
| CLI-tesztek | **1192 / 1192** zöld *(+16 új: 12 az ébrenlétre, 4 a doktor-sorra)* |
| szerver-tesztek | **119 / 119** zöld *(a 9 óra-alapú spec **mérés-alapúra** átírva, +4)* |
| `tsc --noEmit` | tiszta mindkettőn |
| Pozitív kontroll ×2 | az `unknown` „ébren"-re állítva → **1 bukás** · a doktor „nincs mérés" ága elnémítva → **1 bukás** |
| Élő mérés *(00:21)* | `awake` · `presence-active` · 0 perc · **hangszóró NEM szólalt meg** |

⛔ **A HÉTVÉGI KIKÖTÉS BETARTVA:** ⛔ **nulla élő hangszóró-kísérlet**. A tesztek **fixtúrából**
mennek *(a szerver-spec egy egyszerű objektumot ad olvasónak)*, az élő mérés pedig **csak
olvasott** — a `ma cast notify` **nem futott**.

⚠️ **Amit nem tudok kimondani:** a **HTTP-végpont** élő próbáját — a 39335-ös porton semmi nem
figyel *(a szerver épp nem fut)*. A végpont a **következő szerver-indulásnál** vált mérés-alapúra;
⛔ nem indítom el magamtól *(`ldp-default-runtime`)*.

## ⚠️ VÁLLALT REVIEW-TALÁLATOK — kimondva

| Találat | Miért marad |
|---|---|
| `controller-handler-error-wrapping` ×2 | 🔴 **Szándékos:** a `getSnapshot` a mérés bukásakor **nem dob**, hanem a **biztonságos (néma)** választ adja. Dobásnál a végpont 500-at adna, a `comm doctor` *„a szerver nem válaszolt"*-ot írna a valódi ok helyett, a kapu pedig **nem tudna dönteni** — pont amikor a legfontosabb. ⭐ A hiba **nem veszik el**: a `reason` viszi, és a hiba-tár is megkapja *(`SwallowedFailure_Util`)*. |
| `no-dynamic-imports` ×3 | A CLI-modul **futásidejű** betöltése. Mért kényszer: a `@cli/*` alias **csak fordítási időben** létezik — a Google- és a Spotify-panel **élesben elromlott** emiatt, zöld `tsc` mellett. A LinkedIn-panelek ugyanezt viszik. |
| `no-plain-function-export` ×2 | A szomszédok *(`runPresenceGate`, `decideVoicePresenceCheck`, `formatAge`)* ugyanezt a formát viszik — egy fájlban eltérni két konvenciót hozna ugyanabba a mappába. |

⇒ `dc rev` **2397 → 2404**: a **+7** a fenti három, kimondott tétel. ⛔ Egyetlen szabály sincs
kikapcsolva.
