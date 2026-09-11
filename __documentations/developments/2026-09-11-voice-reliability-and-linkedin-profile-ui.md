# 2026-09-11 — 🎙️ A hang-csatorna MEGBÍZHATÓSÁGA (6 tétel) + 🔗 a LinkedIn profil-felület

> **Feladat-forrás:** `__agent/DEV-HANDOFF.md` — a 2026-09-11 **01:20 · 01:24 · 01:30 · 01:33 ·
> 01:55 · 02:00**-as szakaszok.
> **Folyamatvezérlő:** `__agent/plans/voice-reliability/PROCESS-CONTROL.md` *(tételes státusz)*.

**Egy mondatban:** amit az owner mond, az többé nem veszhet el; amit én mondok, az hiánytalanul
és egymásba-beszélés nélkül hangzik el.

---

## Mi készült el

| # | Tétel | Commit |
|---|---|---|
| 1 | 🎙️ **Megőrzés** — nyers hang + nyers átirat + látható veszteség | *(`9d3ff7d`-be sodródott, l. lent)* |
| 2 | 🔢 **FIFO sor** a felolvasásra | `0e0bd73` |
| 2b | 🧹 **Napló-áradás** *(élő ellenőrzésből)* | *(`148b927`-be sodródott)* |
| 3 | ✂️ **Darabolás** csonkolás helyett | `95f9e8f` |
| 4 | 🔇 **Szüneteltetés**, amíg az owner beszél | `0bdab09` |
| 5 | 🌐 **Nyelv-eltérés** *(a paraméter nem létezik)* | `8760bbc` |
| 6 | 🔗 **LinkedIn profil-frissítő felület** | `5b30cdb` |

**Teszt a végén:** CLI **1003/1003** · szerver **106/106** · kliens **144/144** · `tsc` tiszta
mindhárom csomagon. *(Kiindulás: CLI 892, kliens 132.)*

---

## 🔴 A HAT MÉRÉS, AMI A MUNKÁT VEZETTE

⭐ Egyik sem feltevés — mindegyik a **futó rendszerből** jött, és **kettő közülük megváltoztatta
a tervet**.

### 1. A bizonytalan hang eldobása *(62,5% átvitel)*

```
ma comm voice-funnel --day 2026-09-11
  🟡 ÁTVITELI ARÁNY: 62,5%  (24 megszólalásból)
  ❌ felismerés után elveszett: 6
```

A `handleFinishedRecording` *bizonytalan* ágán *(`result.ok && result.suspicious`)* **semmi nem
hívódott** ⇒ a WAV-ot az átemelt felvevő takarítása törölte, a nyers átirat pedig a `detail`
szövegén kívül **nem maradt meg sehol**.
⇒ **Nem a felismerés volt a hibás, hanem AZ ELDOBÁS.**

### 2. A sorosítás teljes hiánya

`voice-speaker.ts`: ha a lejátszó nem `Idle`, a felolvasás `spoken: false`-szal **elesik**. És a
`speakInVoiceChannel` a `player.play()` **után azonnal visszatér** ⇒ a hívó `await`-je csak az
**indítást** várta meg, a **végét** nem. ⇒ Semmi nem sorosított.

### 3. ⚠️ A napló 95%-a egyetlen zajsor *(az élő ellenőrzés hozta elő)*

```
a napi akció-napló ....................... 67 408 sor · 14 967 KB
ebből „ezt már felolvastuk" kihagyás ..... 64 088 sor  (95%)
az előző nap .............................  5 298 KB
```

Az `fs.watch` minden eseményére a figyelő újraolvasta a **teljes** naplót, és **minden** korábbi
bejegyzésre kiírt egy kihagyás-jegyzetet ⇒ `bejegyzések × események`.
⚠️ Az akció-napló **végtelen retentionnal commitolva** van ⇒ a zaj **véglegesen** a repóban
maradt volna, napi ~15 MB-tal, és **eltemeti a valódi jelzéseket**.

### 4. ⚠️ A csonkolás sokkal kisebb, mint a feladat hitte — KORREKCIÓ

A handoff a **nyers** hosszokat idézte *(„1441 karakter, több mint a fele elveszett")*. A
csonkolás viszont a **már kimondhatóvá alakított** szövegen történt.

| mérés *(444 kimenő üzenet)* | érték |
|---|---|
| kimondható üzenet | 221 |
| a 700 karakteres határ fölött | **14** *(6%)* |
| a leghosszabb **kimondható** szöveg | **717** karakter |
| összes elvesző karakter | **112** |

⇒ A veszteség **valódi, de jóval kisebb**. ⭐ A kérés ettől érvényes: **112 karakter is
veszteség**, és a **mechanizmus** rossz — a néma csonkolás holnap sokkal többet vinne el,
ugyanúgy némán.

### 5. 🔴 A saját hangom VISSZAJÖN — a handoff félelme igazolva

A feladat kikötése: *„saját magamra ne süljön el — ezt **méréssel** zárd ki."*
**43** sikeres felolvasás, **213** észlelés. A felolvasás utáni **első** észlelés késése:

```
23 · 32 · 34 · 37 · 38 · 38 · 39 · 40 · 40 · 42 · 43 · 45 · 45 · 47 · 49 · 50 · 50 · 51 · 60 mp
                                                    ↑ az owner válaszol
0,0 · 1,0 · 2,0 · 3,0 mp   ← 🔴 VISSZHANG-ALÁÍRÁS
```

Ember nem kezd beszélni **0,0** másodperccel az én hangom után ⇒ nyitott mikrofon + hangszóró
mellett a felolvasásom **az ő megszólalásaként** jön vissza.
⚠️ A szerkezeti szűrő ezt **nem fogja meg**: az esemény az ő Discord-azonosítóján jön — nem a
botot látjuk, hanem **az ő mikrofonját, amibe az én hangom szól bele**.

### 6. 🔴 A kért nyelv-paraméter NEM LÉTEZIK

Ugyanazt a **megőrzött** felvételt *(⭐ az 1. tétel munkája!)* kétszer küldtem be:

```
language paraméter NÉLKÜL  →  { "text": "Thanks." }
?language=hu               →  { "text": "Thanks." }     ← BETŰRE UGYANAZ
```

⇒ Az FDP AI `/api/recognition` a paramétert **elfogadja, de figyelmen kívül hagyja**.
⛔ Nem elfelejtettük átadni — **nincs mit átadni**. *(⛔ A szolgáltatáshoz nem nyúltunk:
`fdp-ai-never-restart`.)*
⭐ **Ráadás:** a magyar felvétel **„Thanks."**-re fordult ⇒ a hiba **reprodukálható** a
megőrzött hangon.

---

## A megoldások — és ami VÁLTOZATLAN

| tétel | megoldás | ⛔ ami NEM változott |
|---|---|---|
| 1 | a nyers hang a felismerés **ELŐTT** lemezre *(`voice-utterance-archive.ts`)*; a bizonytalan átirat + az ok megmarad; a kiesés-jelentés megmondja, **mit** értettem és **miért** bizonytalan | bizonytalan átiratra **továbbra sem cselekszünk**, és a kötegbe sem kerül |
| 2 | `voice-speech-queue.ts` FIFO sor + `voice-playback-idle.ts` *(a lejátszás **végének** kivárása, `entersState`, 180 s korláttal)* | — |
| 2b | a tiszta döntés megjelöli a **rutin** kimenetelt; csak a **nem-rutin** kihagyás naplózódik | a **magyarázó** okok *(nincs bent · nyugta · nincs kimondható tartalom)* változatlanul naplózódnak |
| 3 | `voice-speech-split.ts` — mondathatár → szóhatár → ⛔ szó közepén soha; a darabszám **egyszer**, az elején | a `SPEECH_MAX_CHARS` megmaradt, de **a DARAB** mérete lett, ⛔ nem a teljes szövegé |
| 4 | `voice-speech-hold.ts` + `voice-speech-grace.ts` *(paraméter, 2,5 s, ⭐ **ugyanott, ahol a hangerő**)* | — |
| 5 | **egy** szabály: magyarban **nem létező betűk** ⇒ nyelv-eltérés | — |
| 6 | három réteg, **SSOT a CLI-ben**: mezőnként vágólap + limit + pipa | — |

### ⭐ MIÉRT NEM LEHET VÉGTELEN SZÜNET — a 4. tétel kritikus indoklása

1. 🔴 **A szünet MEGSZÜNTETI a visszhang forrását**: az én hangom elhallgat ⇒ nincs több
   visszhang ⇒ a türelmi idő letelik ⇒ folytatjuk. A rendszer **önjavító**; a legrosszabb eset
   egy ~2,5 s akadás.
2. **A feloldás IDŐ-alapú**, ⛔ nem egy *„elhallgatott"* jelre vár, ami elmaradhat.

⛔ **Ezért NEM tiltottam le a lejátszás alatti észlelést** — az pont a **félbeszakíthatóságot**
szüntetné meg, amit az owner kért. ⚠️ Helyette **minden** tartás és feloldás naplóba kerül a
késéssel: ha akadás-hurok alakul ki, az a naplóból **azonnal látszik**.

### ⚠️ A csapda, amit a mérés fogott meg *(5. tétel)*

Az 56 megőrzött átiratból 13 nem tartalmazott magyar ékezetet, és **mind a 13** bukott
felismerés volt ⇒ kézenfekvőnek tűnt az *„ékezet-hiány = gyanús"* szabály.
🔴 **De az „Igen." és a „Nem." is ékezet nélküli** — és azok az owner **legfontosabb válaszai**.
Egy ilyen szabály a **jóváhagyását** dobta volna el. *(A kód ezt már ismerte: az „igen"/„ok"
**szándékosan** nincs a filler-listán, és teszt védi. ⛔ Nem írtam felül.)*

**A helyes szabály eredménye:** 10 ismert bukásból **10/10 elkapva** *(előtte 5/10)*; valódi
magyar üzenet megjelölve: **0**. *(A 46 „magyarnak látszó" átiratból 2 megjelölve — ⭐ mindkettő
**izlandi**, csak az á/í/ó miatt látszott magyarnak.)*

---

## ⭐ POZITÍV KONTROLL — minden tételnél lefuttatva

⛔ A zöld teszt önmagában nem bizonyíték: azt is igazolni kell, hogy a teszt **elkapja a hibát**.

| tétel | amit elrontottam | mi bukott |
|---|---|---|
| 1 | a megőrzés-hívás kivéve | **2** teszt *(sorrend + bizonytalan ág)* |
| 2 | `waitForIdle` kiiktatva | **2** teszt *(egymásba-beszélés + továbblépés)* |
| 2b | a rutin-szűrés kiiktatva | **1** teszt |
| 3 | a csonkolás visszatéve | **8** teszt a 17-ből |
| 4 | a türelmi idő újraindítása + a leállítás-feloldás kiiktatva | **3** teszt |
| 5 | a regex soha-nem-találóra | **3** teszt |

⭐ Az 5. tételnél az **első** sabotage-kísérletet *(`if (false && foreign)`)* maga a **fordító**
utasította el *(strict-null)* — az is védelem.

---

## Review: a saját fájljaimon

| kör | találat a saját fájljaimon |
|---|---|
| 1. tétel | 8 → **0** *(két `max-file-lines` a változásom miatt ⇒ **bontottam**, ahogy a review tanácsolja)* |
| 2. tétel | 2 → **0** |
| 4. tétel | 5 → **2** |
| 6. tétel | **23 → 4** *(régebbi mintákat másoltam, amiket a review azóta szigorított)* |

⭐ **Repo-szintű összes találat: 2393 → 2394** *(±1 a ~1 900 új sor mellett)*.
⛔ **Egyetlen szabályt sem kapcsoltam ki**, és egyetlen findingot sem hallgattattam el.

### 🔴 Kétszer bejött ugyanaz a csapda

A review a **saját kommentemre** illeszkedett — először a `no-native-browser-dialogs`-nál
*(korábbi kör)*, most az `*ngIf`-nél. ⇒ **Tanulság:** a tiltott minta **nevét** a kommentben sem
szabad kiírni; a szándékot körülírni kell.

### 🙋 Ami owner-kapun áll *(⛔ nincs elhallgatva, csak nem az én döntésem)*

1. **`endpoint-auth-preprocess` ×2 + `thin-controller`** *(LinkedIn-útvonal)* — a felület
   **szándékosan loopback-alapú** *(saját guard + saját teszt, és a 4 szomszéd végpont is így
   működik)*. ⛔ Nem tettem rá csak-ide-token-autht: ha a kliens nem küld tokent, a panel
   **némán elhallgatna** — pont az a hibafajta, amit ebben a körben máshol javítottam.
   ⇒ **Az auth-modell owner-döntés.**
2. **`no-dynamic-imports`** — ⭐ **mért kényszer**: a `@cli/*` alias csak **fordítási** időben
   létezik, a `tsx` futásidőben nem oldja fel. Statikus importtal a szerver **nem indulna**;
   ezt a Google- és a Spotify-panel **élesben** már megfizette.
3. **`one-export-per-file`** a típus-szókincsen *(`voice-recording-outcome.ts`)* — a szomszéd
   voice-modulokon is áll; `AGB-2026-09-09-01` szerint owner-kapus.
4. **A türelmi idő CLI + szerver + kliens felülete** — most fájlból és env-változóból
   állítható; a **működés kész**, a három felület külön kör *(`one-function-is-enough`)*.
5. **A megmaradt 15 MB napló** — ⛔ nem nyúltam hozzá: az akció-napló **append-only** hard rule
   *(„soha ne írj felül vagy törölj sort")*. A tisztítás/rotáció **owner-döntés**.
6. **A LinkedIn-javaslat szövege** — `current/linkedin/profile-proposed.json`; ⭐ **az
   asszisztens** dolga, ⛔ nem a DEV-é. A panel addig **kimondja**, hogy még nincs.

---

## 🔀 ÜTKÖZÉS — HÁROMSZOR ugyanaz a minta

A munkám **három** commitból az **asszisztens session** commitjaiba került be, mert megosztott
worktree-ben `-A`-szerűen stage-elt, amíg az én fájljaim staged-ek voltak:

| az én munkám | ahova bekerült |
|---|---|
| V3 ElevenLabs *(előző kör)* | `be95eb6` — „fix(CV): AI GENERATIONS KI…" |
| 1. tétel *(megőrzés)* | `9d3ff7d` — „fix(stt): MASODIK izlandi hallucinacio…" |
| 2b. tétel *(napló-áradás)* | `148b927` — „feat(handoff): a Discord-valaszkenyszer…" |

✅ **Minden esetben: a tartalom helyes, HEAD-ben van, pusholva, a tesztek zöldek** — csak a
commit-üzenet félrevezető. ⛔ `shared-file-collision.md` szerint csak a **saját** káromat vonom
vissza; itt semmi nem sérült.

⇒ **A minta már nem véletlen.** Amit én tettem ellene: a `git add` és a `git commit`
**egyetlen** parancsban fut, hogy a staged-ablak a lehető legrövidebb legyen. ⚠️ Ez **csökkenti**
az esélyt, de nem szünteti meg — a valódi megoldás a másik oldalon van *(explicit fájllista)*.

⚠️ **Egy megfigyelés, ami nem az enyém:** a `43bcff3` *(„feat(voice): a koteg varja meg a
folyamatban levo megszolalast + ujrainditas-jelzes")* commit **csak `package.json`
verzió-emeléseket** tartalmaz. Lehet, hogy annak a sessionnek a kódja **elveszett** —
ellenőrzésre érdemes, de ⛔ nem az én commitom, nem nyúltam hozzá.

---

## Mért eszköz-buktatók *(hogy más ne fusson bele)*

| buktató | mit tegyél |
|---|---|
| `npm test` a CLI-ben `rimraf ./dist`-tel kezd | megosztott workspace-ben egy párhuzamos build **kihúzza a `dist`-et** a jasmine alól ⇒ **külön** `npm run build-base`, majd `npx jasmine`. *(Kétszer futottam bele.)* |
| bash + backtick a python-heredocban | a command substitution **megeszi** a backtickes szövegrészt — egy JSDoc-om így csonkult. Írd fájlba a szkriptet. |
| `dc rev --json` | **ANSI-színkódokkal** kezdődik ⇒ `JSON.parse` előtt le kell szedni |
| a review a kommentet is olvassa | a tiltott minta **nevét** kommentben sem írjuk ki |
