# 🔴 Az átemelt CCAP-kódból SOHA nem készült JS — és két környezet-különbség

**Dátum:** 2026-09-07 · **Hogyan bukott ki:** a voice-átemelés 6. szakaszához (felvétel) be
akartam tölteni az átemelt `CV_Recording_ControlService`-t. Nem létezett.

## 1. A csendes zsákutca

| | |
|---|---|
| `cli/tsconfig.json` | `exclude: [… "src/_modules", "src/_collections", "src/_enums"]` |
| `cli/tsconfig.transplanted.json` | **`noEmit: true`** |

⇒ A 70 átemelt fájl **típus-ellenőrzésen átment**, a repóban ott volt, a terv „bent van"-ként
könyvelte — de **JS SOHA nem készült belőle**. Mérve: `dist/cli/src/_modules/` **nem létezett**.

⚠️ **Ez a legrosszabb fajta hiány: a zöld típus-ellenőrzés ELFEDTE.** A „fordul" és a „létezik
futásidőben" két különböző állítás, és itt csak az elsőt mértük.

🩹 `noEmit: false` + `outDir: "dist/cli"` + a fő builddel azonos `rootDirs`.
⭐ Az `outDir` **nem** `dist`: az emit-kiosztás akkor `dist/src/_modules/…` lett volna, a saját
kódunk viszont `dist/cli/src/…`-ben él ⇒ a `../_modules/…` hivatkozások nem találnák meg.
*(Mérve: pontosan ez történt az első próbán.)*

⛔ `noEmitOnError` **szándékosan** nincs bekapcsolva: az átemelt kódnak vannak típus-hibái,
amiket az owner-korlát miatt nem javítunk (`transplant-not-rewrite`). A típus-hiba **nem
futásidejű hiba** — a típusok törlődnek.

## 2. Két környezet-különbség — a KIMENETEN feloldva, nem a forráson

A régi bot más build-kiosztásban és régebbi Node-on futott. A forráshoz nem nyúlunk; a
különbséget a `cli/scripts/transplanted-build-fix.ts` oldja fel a kibocsátott JS-en.

| # | Akadály | Feloldás |
|---|---|---|
| 1 | `settings.const` a `../../../package.json`-ból veszi a verziót — a kimenetben ez `dist/cli/package.json`, ami nem létezett | **minimális** manifest odaírása (`{type, version}`) — ⛔ nem a teljes `package.json` másolása: annak `bin`/`dependencies` mezői a dist-ben félrevezetőek |
| 2 | a Node 22 ESM-ben a JSON-import `with { type: 'json' }`-t követel, és a JSON-modulnak **csak `default`** exportja van | attribútum pótlása + `import { version }` → default-import + destrukturálás |

📌 **A két hiba EGYMÁST FEDTE:** a hiányzó attribútum hibája jött előbb, és elrejtette a hiányzó
fájlt. Külön-külön javítva mindkettő „ugyanazt a hibát" hagyta volna hátra — más okból.

A fixer **idempotens** (a már ellátott alakra a minta nem illeszkedik), mert egy build-lépés
ugyanazon a kimeneten többször is lefuthat.

## 3. ⚠️ SAJÁT MÉRÉSI HIBA — terhelés alatt mértem, és rosszat állapítottam meg

Az első felderítésben `timeout 22`-vel bisecteltem az importokat, és arra jutottam, hogy
`CVO_Main_ControlService` *(a beszéd-kimenet, az ElevenLabs ága)* **beragad** import közben —
amiből majdnem levontam, hogy a 6. szakasz az owner kulcsára vár.

**Ez HAMIS volt.** Közben az LDP egy teljes buildet futtatott, és telítette a gépet.
Nyugodt gépen újramérve **minden betöltődik**:

| Modul | Betöltés |
|---|---|
| `cv-connection.control-service` | 2,8 s |
| `cvo-unified-text-to-speech.control-service` | 7,8 s |
| `cv-recording.control-service` | 9,6 s |
| `cvo-main.control-service` | 19,5 s |

És a példányosítás is megy — **API-kulcs nélkül**:
`{"instantiated":true,"hasHandlePcmReceiver":true,"hasInitDir":true}`

📌 **A TANULSÁG:** a „no guessing" nem áll meg annál, hogy *mértem*. Számít, hogy **milyen
körülmények között** mértem, és a mérés mellé oda kell írni, **mi futott még**. Egy szűk
timeout terhelés alatt **hamis architekturális következtetést** szül — itt majdnem egy nem
létező owner-blokkolót írtam volna be a tervbe.

⇒ Következmény a gyakorlatra: bináris `OK/HANG` helyett **időt mérünk**, és bőkezű a timeout.

## 4. Amit ez felszabadít, és ami hátra van

✅ A 6. szakasz **NINCS blokkolva** az owner kulcsán. A felvételi lánc betölthető és
példányosítható.

⚠️ **A ~19,5 s-es hidegindítás viszont valós költség** — a hang-láncot ezért **lustán** kell
betölteni, nem a figyelő indulási útvonalán. Különben minden szerver-indulás ennyivel csúszna.

⚠️ **Mellékhatás, amit jelölni kellett:** a példányosítás létrehozza a
`cli/_assets/voice-outputs/` könyvtárat, a felvevő pedig `<cwd>/recordings/`-ot — és azt
**induláskor KIÜRÍTI**. Mindkettő gitignore-ba került; verziózott tartalom oda soha nem kerülhet.

**Build-lépések az LDP-ben** (17 → 22 → **24** lépés): `tsc-transplanted` + `fix-transplanted`,
mindkettő `fatal: false`.
