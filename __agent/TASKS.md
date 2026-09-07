# RENDSZER-FELADATOK — nyitott / folyamatban / lezárt

> **Owner-szabály (2026-09-07 12:13, hangüzenetben) — SZÓ SZERINT:**
>
> *„Nagyon fontos, hogy megfelelően és alaposan mindig fájlokba mentve jegyezzük, hogy milyen
> feladatok vannak nyitva, mi az, ami in progress, és hogy mi az, amit már ténylegesen
> lezártunk, hogy ne sikkadhassanak el soha a feladatok, amiket elkezdtünk."*

> **Owner-elhatárolás (2026-09-07 12:26, hangüzenetben) — SZÓ SZERINT:**
>
> *„fontos, hogy ezt a feladat nyilvántartást, ezt ne keverjük össze az organizerben lévő én
> feladataimmal. Tehát valahogy ezt nagyon alaposan kifejezésekben is el kell különíteni
> egymástól ezt a két fajta feladatot, amit te csinálsz, amit együtt csinálunk, meg amit én
> csinálok."*

---

## 🔴 A HATÁR — mi tartozik IDE, és mi NEM

**Két, egymástól FÜGGETLEN nyilvántartás van. Soha nem folynak össze:**

| | **RENDSZER-FELADAT** *(ez a fájl)* | **ÉLET-FELADAT** *(organizer)* |
|---|---|---|
| **Miről szól** | a **rendszer** építése és üzemeltetése | az **owner élete** |
| **Példa** | relay-deploy · STT-újrapróbálás · port-költözés | bevásárlás · takarítás · séta · munka · GoPrint |
| **Hol él** | `__agent/TASKS.md` | organizer, `fo tasks.*` |
| **Azonosító** | `T-NN` | organizer-ref (`org:task:…`) |
| **Ahogy hívjuk** | *„rendszer-feladat"* | *„a te feladatod"* / *„élet-feladat"* |

⛔ **AMIT SOHA NEM SZABAD:**
- rendszer-feladatot az organizerbe írni *(ott az owner listáját hígítaná)*
- élet-feladatot `T-NN` azonosítóval ellátni *(itt a rendszer-listát hígítaná)*
- egy tételt **hallgatólagosan** átvinni egyik nyilvántartásból a másikba

🔴 **MIÉRT SZIGORÚ EZ:** az owner az organizert azért nézi, hogy **mit kell NEKI csinálnia**.
Ha oda bekerül egy „nginx conf" tétel, a lista **használhatatlanná válik** — és pontosan az
a lista sérül, amiért az egész rendszer létezik. A hígítás **visszafelé is igaz**: ha ide
kerül a „vegyél kenyeret", akkor ez a fájl szűnik meg SSOT lenni.

### Ki végzi — minden tételnél jelölve

| Jel | Ki | Mit jelent |
|---|---|---|
| 🤖 | **én** *(Honnie)* | egyedül elvégzem, nem kell hozzá az owner |
| 🤝 | **közösen** | az én munkám, de owner-döntés vagy -adat kell hozzá útközben |
| 🙋 | **owner-lépés** | ⚠️ **NEM az owner feladata a saját listáján** — hanem egy *rendszer*-feladat **kapuja**, amit csak ő tud kinyitni *(kulcs, jóváhagyás, telefon-beállítás)* |

⭐ A 🙋 **szándékosan nem** „az owner feladata": az organizerbe **nem** kerül át. Itt marad,
mert **az én munkám áll miatta** — a nyilvántartás az enyém, csak a kulcs van nála.

---

## Az állapotok

| Jel | Állapot | Mit jelent |
|---|---|---|
| 🔵 | **NYITOTT** | fel van véve, még nem kezdtem el |
| 🟠 | **FOLYAMATBAN** | elkezdtem, **nincs kész** |
| ✅ | **LEZÁRT** | ténylegesen kész **és igazolva** |
| ⏸️ | **BLOKKOLT** | rajtam kívül álló okból áll — a *mire vár* mezővel |
| 🔍 | **FELTÁRANDÓ** | ⚠️ bizonytalan kérés — **NEM kezdjük el**, előbb körbejárjuk *(l. lentebb)* |

⚠️ **A ✅ csak IGAZOLÁS után jár.** „Megírtam" ≠ „kész": teszt/mérés/élő próba kell hozzá.
*(Ugyanaz az elv, mint a képesség-katalógusban a `✅` = owner-jóváhagyás.)*

**Utoljára frissítve:** 2026-09-07 23:24

---

## 🟠 FOLYAMATBAN

| # | Ki | Feladat | Hol tart | Következő lépés |
|---|---|---|---|---|
| T-47 | 🙋 | 💼 **Bérszámfejtés — rákérdezni a jelenléti ívekre** | Felírva az organizerbe (`org:task:6a9f04ab482367e7f6420c8f`, prio **112**). Owner 20:32: a bérszámfejtés **csúszik** a szokásoshoz képest | **az owner dolga** — neki kell írnia a bérszámfejtésnek |
| T-43 | 🤝 | 📍 **Saját mobil-app a helyzet-küldéshez** | 🟢 **MEGVÁLASZOLVA** (`current/feature-requests/own-location-app.md`) — 🔴 korábban visszakérdeztem ahelyett, hogy állást foglaltam volna. **Javaslat: csináljuk sajátban, Capacitorral.** Mérve: az organizernek **kész APK-futószalagja** van; a háttér-hely **PWA-ban NEM megy** (platform-korlát); a plugin **nem fizetős** (MIT-es alternatívák) | 🙋 **EGY döntés:** belevágjunk a v1-be? *(egy kapcsoló + státusz-sor, semmi más)* |
| T-44 | 🤝 | 📅 **AI Summit nap 2 — TERV** | 🟢 **ÚJRACSINÁLVA a `summit-planning.md` 7 lépése szerint** (`current/events/2026-09-08-summit-day2-plan.md`): A/B/NEM lista · ütközések · épületváltás-minimalizálás · energia · visszanézési lista. ⛔ Az első kísérletem hibás volt: **időpontból indultam, és ahhoz hajlítottam az érdeklődést** | 🙋 **owner dönt:** 11:00 (teljes A-lista) vagy 13:45 (délutáni blokk)? + a vibecoding-ütközés |
| T-45 | 🤖 | 🔍 **A review-eszköz (`dc rev`) bekötve — a találatok levitele** | **Bekötve ma**: CI/CD 12→13 lépés (`dc-review-relay`), LDP 17→22 (cli/server/client/relay/ext), mind `fatal: false`. ⚠️ **Eddig SEHOL nem futott.** Mérve: **2110 találat** (cli 1429 / server 364 / client 252 / relay 38 / ext 27), ~56 s. Mérés: `__documentations/developments/2026-09-07-review-tool-cicd-wiring.md` | a **relay 38** találatával kezdeni *(ez a legkisebb, és ez fut a CI/CD-ben)*. ⛔ Az átemelt CCAP-kód 280 találata **nem munkalista** (`transplant-not-rewrite`). A `fatal: true`-vá tétel **külön owner-döntés** |
| T-46 | 🤖 | 📥 **Discord-csatolmány fogadása** | **Megépítve**, 503/503 — `cli/src/discord/discord.file-intake.ts`. Eddig a fájl **némán elveszett** (szöveg nélkül elutasítva, szöveggel leesett az üzenetről). Most `__agent/inbox/`-ba mentődik | ⚠️ **élő próbára vár**: az owner holnapi summit-programja lesz az első valódi csatolmány. Addig NEM ✅ |
| T-48 | 🤝 | 💰 **Pénzügyi helyzetkép + bérszámfejtés — KIADVA** | ⭐ **2026-09-07 23:23: elküldve** `ccs-e4e4fadf-mtroyj33`-nak (`{"success":true}`), `__agent/FDP-HANDOFF.md` + `CONTINUATION.md` pointerekkel. Három kérdés: balansz · belefér-e ~1M Ft ügyvédi díj · ElevenLabs 20→100 € *(+960 €/év)*. Mellette a bérszámfejtés-megkeresés | ⏸️ **az FDP dolgozik rajta.** Az eredményt az `AGENT_BUS.md`-be kértem ⇒ onnan továbbítom |
| T-52 | 🤖 | 🖥️ **Konzol-visszajelzés a hang-feldolgozásról** | Owner 21:47: *„a konzolban nem látom azokat a visszajelzéseket, amiket annó a CCAP-ban"*. ⚠️ **Jogos: ilyet nem építettem** — az action-logba írok, ami neki nem látszik | 🔵 nyitott: mit lásson és hol (LDP-konzol / kliens) |
| T-49 | 🤖 | 🎙️ **A voice-drop oka MEGVAN + FRS felvéve** | **Mérve: 17 ledobás = 17 LDP-restart** (+ a figyelő 18 perces kiesése). Az owner diagnózisa helyes. ✅ **BFR-MYASSISTANT-001** felvéve a bedrock-csatornába (`__documentations/BEDROCK-FRS.md`, `cli-dynamo`, high) — ez a **kanonikus út**, nem idegen repó szerkesztése | ⏸️ bedrock-agent válaszára vár. ⛔ A `dc ldp`-hez magamtól nem nyúlok |
| T-50 | 🙋 | 📝 **LinkedIn posztok kitétele** | Owner 21:20: *„a LinkedIn posztokat ki kéne tenni, amiket terveztem"* | 🙋 **kérdés nála:** nála vannak megtervezve, vagy nekem kell összeszedni? |
| T-51 | 🤖 | 📮 **CC-session üzenetküldés — szabályok ADOPTÁLVA** | ✅ `__agent/references/ccap-session-messaging.md`: a 6 HARD szabály (§7), a végpontok, és a **beazonosított ID-k** — 🔴 a fájl tetején a kötelező „a szabályokat MINDIG előbb olvasd el" figyelmeztetéssel. FDP Assistant: `ccs-eb7533f2-msf45rno` | ⛔ küldés **csak owner-jóváhagyással**; a `status` küldés előtt újra lekérdezendő |
| T-41 | 🙋 | **Agent a támogatásokra / pályázatokra / mikromunkára** | ⭐ **HATÓKÖR-KORREKCIÓ (owner 2026-09-07 20:49):** *„ez nem a te feladatod lesz, az arra majd egy agentet kell összeállítsunk és elindítsunk"* ⇒ ⛔ **NEM én csinálom.** A mai feltárás (`current/leads/2026-09-07-exploration.md`) az agent **kiindulása** marad, nem kidobott munka | ⏸️ **owner-vezérelt**: az agent összeállítása. ⛔ Magamtól nem indítok agentet (nincs jóváhagyva) |
| T-22 | 🤝 | 🔊 **Voice control — mind a 3 owner-követelmény MEGÉPÍTVE** | ⭐ **2026-09-07 23:20:** (1) `voice-drop-probe.ts` — a néma eldobás **MÁSODPERCBEN** mérhető; (2) `voice-missed-speech.ts` — ami nem jutott át, az is **látszik** a hang-csatornában, összevonva; (3) `voice-cues.ts` — 🔊 **hangjelzések a CCAP EREDETI hangjaival**, futásidőben igazolva. CLI **582/582** zöld; a záró review-kör **2 valós hibát** fogott meg | ⏳ **ÉLŐ MÉRÉSRE VÁR:** az átviteli arány csak akkor derül ki, ha az owner beszél. ❓ Q-07 (hang-hozzárendelés) · Q-08 (fejhallgató-e) |
| T-10 | 🤖 | 🔴 **Sikertelen STT újrapróbálása** | **megépítve**, 474/474 teszt — `cli/src/stt/stt.retry-queue.ts` | ⚠️ **élő próbára vár**: a következő sikertelen felismerésnél derül ki. Addig NEM ✅ |

---

## 🔍 FELTÁRANDÓ — bizonytalan kérés, NEM kezdjük el

> **Owner-szabály (2026-09-07 12:26, hangüzenetben) — SZÓ SZERINT:**
>
> *„Most volt egy olyan feature request-em, ami kicsit bizonytalan, nem tudom mennyire
> megvalósítható. […] Nagyon fontos, hogy az ilyen bizonytalan pontokat azt ne vágjunk egyből
> bele, mert a már működő dolgokat keresztül húzhatja, hanem jelöljük össze ezeket, próbáljuk
> meg alaposan körbejárni és lefixálni."*

⇒ Teljes szabály: `current/principles/uncertain-requests.md`.

| # | Feladat | Mi a bizonytalan | Mit húzhat keresztül |
|---|---|---|---|
| T-13 | **Hosszú hang darabolása átfedéssel** | maga az owner mondta, hogy nem tudja, mennyire megvalósítható; a darab-határon a szó **kettévágódhat**, az átfedés pedig **duplikálhat** | 🔴 a **ma működő** hang-utat: 16 sikeres felismerés fut rajta. Egy rosszul darabolt átirat **teljesnek látszik** — ez a legrosszabb hibafajta |

**Mielőtt ebből 🔵 lehetne:** meg kell mérni, hol vágódik el ténylegesen a vég *(van-e egyáltalán
levágás, vagy csak a tagolás rossz — l. `current/stt-mishearings.md`)*, és kell egy mód, amivel
a darabolás **kikapcsolható marad**, ha rontana.

---

## 🔵 NYITOTT

### Hangüzenet / STT — megbízhatóság

| # | Ki | Feladat | Miért | Forrás |
|---|---|---|---|---|
| T-40 | 🤖 | 🔴 **Az üzenetek nem jutnak el hozzám az LDP-újraindítások között** | owner 2026-09-07 12:57: *„félek, hogy egy kicsit elsikkadt egy pár üzenet. Itt a LDP-s folyamatos újraindítások között nem perzisztálnak rendesen az üzenetek"* — **MÉRVE, igaza van — de az ok MÁS**: a szelep foglalt sessionbe küldött, a CCAP sorba tette, és onnan **késve, ÜZENETENKÉNT KÜLÖN futásban** érkezett *(nem veszett el)*. ⇒ a foglaltság-kapu javítva | owner 12:57 + saját mérés |
| T-12 | 🤖 | **Figyelés/riasztás a sikertelen feldolgozásokra** | *„nem ártana valami kezelés, figyelés"* — ⚠️ a T-10 sora már **szól**, ha végleg feladja; ami HIÁNYZIK: a **várakozó sor láthatósága** *(konzol-pulzus + `comm doctor`)* | owner 12:00 |

### Egyéb

| # | Ki | Feladat | Miért | Forrás |
|---|---|---|---|---|
| T-20 | 🤝 | **Mikromunkák + hackathon előrevétele** | *„Reklámnak és pénznek"* — ⚠️ ez **kétfelé bomlik**: a *prioritás-átállítás az organizerben* **élet-feladat**, az viszont, hogy én ezt **felvessem és kövessem**, rendszer-feladat | owner 10:25 |
| T-23 | 🤖 | **LDP működés Bedrockba** | | owner 2026-09-06 |
| T-42 | 🤝 | 🤖 **Saját robot építése** | owner 13:51: *„eddig vágyálomnak tűnt de a mai ai summit után neki kéne állni... Tök egyszerű gagyik voltak a robotok..."* · 🎯 **HATÓKÖR-KORLÁT** (owner 14:15): *„mindig túl sokat akarok, pedig itt semmi sem hozott egynél több funkciót"* ⇒ **EGY funkció**, l. `current/principles/one-function-is-enough.md` | owner 13:51 + 14:15 |

---

## ⏸️ BLOKKOLT — owner-kapura vár

⚠️ **Ezek NEM az owner feladatai** *(azok az organizerben vannak)* — ezek **az én
rendszer-feladataim**, amiknek a kulcsa nála van.

| # | Ki | Feladat | Mire vár |
|---|---|---|---|
| T-30 | 🙋 | **Relay-kulcsok élesítése** | az owner beállítja a `.env`-ben, ha hazaért *(a kulcsok generálva)* |
| T-31 | 🙋 | **Keystore-felvétel** | ⚠️ az `fdp env-*` CLI-vel **nem lehet írni** (mérve) — Overseer-felület, owner |
| T-32 | 🙋 | **Böngésző-kiegészítő újratöltése** | a port-költözés után (`manifest.json` host-engedély) |
| T-33 | 🙋 | **OwnTracks beállítása a telefonon** | app + `home` régió + URL |
| T-34 | 🙋 | **Képesség-jóváhagyások** | a `CATALOG.md` `⏳` sorai — `✅`-t csak az owner adhat |

---

## ✅ LEZÁRT — 2026-09-07

*(Csak az igazoltak. A részletek a `CHANGELOG.md`-ben és a `CONTINUATION.md`-ben.)*

| # | Feladat | Igazolás |
|---|---|---|
| ✅ | ✂️ **A rövidség-korlát VISSZAVONVA** | Owner 21:45: a kemény korlát **rossz megoldás** — feldarabolóvá tett, és elvette a tagolást adó **emojikat**. ⇒ jelzés, nem kapu; 1200/40; emojik vissza. 📌 *Rossz metrikát tettem mérhetővé — az aktívan árt* |
| ✅ | ⛔ **Hatáskör-kapu beépítve** | Owner 21:27 rendszer-kritikája: *„szarul lettek becsatornázva a workflow szabályok"*. **ENTRY §5b**: 1. az enyém? → 2. jóváhagyott? → 3. csak azután hogyan. **CATALOG**: új „NEM AZ ÉN HATÁSKÖRÖM" szekció. ⚠️ Mérve: az `ma email send` **nem is szerepelt** a katalógusban |
| ✅ | ✂️ **Rövidség-őr — a hosszú üzenet nem megy ki** | Owner 21:06: *„nem olvastam, hosszú üzeneteket írsz"*. ⚠️ A szabály **már létezett** — nem tartott vissza. Most **gépi korlát**: 400 karakter / 8 sor, `--long`-gal felülbírálható. 535/535, élesben igazolva (514 karakter blokkolva) |
| ✅ | 🔴 **Az automatikus action-log hookok NEM FUTOTTAK** — két ok | Mérve: **2026-08-28…09-06 között NULLA** hook-bejegyzés, közben 400-600 sor/nap kézi. (1) BOM nélküli `.ps1` + em dash ⇒ a **Windows PowerShell 5.1** nem parse-olta *(a hook `powershell`-lel indul, nem `pwsh`-sal)*; (2) elavult `cli/build/main.js` útvonal *(valódi: `cli/dist/cli/src/main.js`)*. **Javítva mindkettő**, a hook azóta ír. Doksi: `__documentations/developments/2026-09-07-action-log-hooks-were-dead.md` |
| ✅ | **Duplikált feldolgozás javítva** *(owner 12:21)* | 481/481 + **regresszió-teszt**: az `append()` addig CSAK a várakozó köteget nézte, az archívumot nem ⇒ a kézbesített üzenet védelme megszűnt. Most **mindkét halmazt** nézi (`isKnownMessage`), és a **hangfelismerés is** ellenőrzi a drága lépés ELŐTT |
| ✅ | **C-33 Discord-hangüzenet → STT → tükör** | **élőben**, az owner valódi hangüzeneteivel (16 sikeres felismerés) |
| ✅ | **C-44 konzol-pulzus** | élőben fut; már az első percben jelzett 3 váró üzenetet |
| ✅ | **C-45 köteg-frissítés küldés előtt** | 409/409 teszt |
| ✅ | **C-46 távvezérlés-szűrő** | a 09:15:33-as rejtély megoldva és kódba öntve |
| ✅ | **C-48 kézbesítési értesítő** | owner-korrekció után áthelyezve a küldés pillanatára |
| ✅ | **STT-flagek + félrehallás-könyvtár** | 448/448 |
| ✅ | **LDP-ellenőrzés minden triggerkor** | élő próba: a `doctor` első sora |
| ✅ | **Port-költözés 24 → 33 + relay 34** | `fdp-templates`-be regisztrálva; a szerver a 39335-ön fut |
| ✅ | **Overseer-regisztráció** | 844/844 |
| ✅ | **T-01 relay gateway-conf** | `nginx -t` a konténerben LEFUT az új conf-on: fallback-cert generálás után **sikeres** ⇒ nem tudja crash-loopoltatni a gateway-t |
| ✅ | **T-02 relay SSL** | `ssl-config.json` 36 → 37 domain, JSON érvényes |
| ✅ | **T-35 CI/CD-indító** | ⭐ **az owner oldotta meg**: átvitte a repót a `futdevpro` szervezetbe (2026-09-07 13:03). Igazolva: `futdevpro/my-assistant` létezik és tartalmazza a legfrissebb commitot; a remote átállítva a kanonikus címre |
| ✅ | **T-12 a várakozó STT-sor láthatósága** | **élő próba**: 2 tétellel a sorban a `doctor` 🟡-t adott és a **legsürgősebb** tétellé tette; a konzol-pulzus `🎙️ 2 hang újrapróbálásra vár` |
| ✅ | **T-04 relay lehúzó oldal** | **élő, végponttól végpontig próba** a futó relay ellen: helyzet betöltve → lehúzva → eltárolva → nyugtázva → a következő kör üres. ⭐ A **home** helyzet koordináta NÉLKÜL tárolódott (`{state:"home"}`) — az owner szabálya élőben igazolva |
| ✅ | **T-03 relay CI/CD + Dockerfile** | JSON érvényes, 12 lépés; a `node build/index.js` belépési pont **élőben elindult**, a `/api/relay/pull` **401**-et adott token nélkül *(fail-closed igazolva)*. ⚠️ Maga a **pipeline-futás** még nem próbálódott — az a T-35-ön múlik |
| ✅ | **`startup-test` javítás** | 8 teszt / 0 bukás; mind a 14 pipeline-lépés zöld |

### Lezárva a T-11 helyett — 👂 fül-reakció + válasz-lánc

⚠️ **A T-11 („gépel…" az STT alatt) TÖRÖLVE, nem elhalasztva** — az owner **mást kért helyette**
*(2026-09-07 12:26)*, és a régi tétel bent hagyása azt a látszatot keltené, hogy még tartozom vele.

| # | Feladat | Igazolás |
|---|---|---|
| ✅ | **👂 fül-reakció a hangüzenetre + az átirat VÁLASZKÉNT megy rá** | `discord.voice-acknowledge.spec.ts` — élő próbára vár a következő hangüzenetnél |

---

## Kapcsolódó

- `current/principles/task-tracking.md` — **a szabály** *(ez a fájl a nyilvántartás)*
- `current/principles/uncertain-requests.md` — a 🔍 állapot szabálya
- `__agent/CONTINUATION.md` — a **hogyan állunk** (állapot), ez a fájl a **mi van hátra**
- `__agent/capabilities/CATALOG.md` — a képességek és a jóváhagyásuk
- `current/open-questions.md` — a **kérdések**, amikre owner-válasz kell
