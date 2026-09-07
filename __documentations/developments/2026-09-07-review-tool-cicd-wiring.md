# A review-eszköz (`dc rev`) bekötése — mérés és bekötés

**Dátum:** 2026-09-07 · **Kiváltó owner-kérdés:** *„A review eszközünk amúgy be van kötve ezen a
projekten. Ráfut a CICD-ben az egyes részekre?"*

## 1. A válasz: NEM futott — sehol

Mérve a két pipeline-konfigból (`.dynamo/`), a bekötés előtti állapot:

| Pipeline | Lépések | `dc rev` lépés |
|---|---|---|
| `pipeline.config.json` (LDP) | 17 | ⛔ **nincs** |
| `pipeline.cicd.config.json` (CI/CD) | 12 | ⛔ **nincs** |

`grep -ril review .dynamo/` → **0 találat**.

⚠️ Két különálló hiányról van szó, nem egyről:

1. **A review-lépés hiányzott** — a referencia (organizer) pipeline-jában van
   `dc-review-client` / `dc-review-server` (`cd <rész> && dc rev`, `fatal: false`); a
   my-assistant CI/CD-jébe **nem vettem bele**, amikor 2026-09-07-én megírtam.
2. **A CI/CD hatóköre eleve csak a relay** — owner-utasítás: *„A cicd csak ezt kell buildelje és
   deploy-olja."* Ezért a `cli/` · `server/` · `client/` · `browser-extension/` a CI/CD-ben
   **egyáltalán nem szerepel**, review-val vagy anélkül. Ezeknek az egyetlen futtatási helye az
   **LDP** (`current/principles/ldp-default-runtime.md`).

⇒ A „ráfut az egyes részekre" tehát **két külön helyen** oldható meg: a relay a CI/CD-ben, minden
más az LDP-ben.

## 2. Az eszköz maga él — mérve

`dc rev --list` → **90 review**, ebből aktív **87** (a `req-code-presence` kikapcsolt).
Kimenet: emberi + `--json` (CI-integrációhoz), és `[CDP_STEP_RESULT]` sor a stderr-en.
Kilépési kód **1**, ha van találat.

### Mennyi találat van MA (2026-09-07, első futtatás)

| Rész | Találat | Bukott review | Futásidő |
|---|---|---|---|
| `cli/` | **1429** | 32 | 15 s |
| `server/` | **364** | 27 | 11 s |
| `client/` | **252** | 31 | 10 s |
| `relay/` | **38** | 15 | 12 s |
| `browser-extension/` | **27** | 12 | ~8 s |
| **össz** | **2110** | | **~56 s** |

### A `cli/` 1429 találatának megoszlása

| Terület | Találat |
|---|---|
| saját kód | 1065 |
| **átemelt CCAP-kód** (`src/_modules`, `_collections`, `_enums`) | **280** |
| teszt | 84 |

Saját kódban a legnagyobb tételek: `jsdoc-presence` 258 · `no-plain-function-export` 252 ·
`no-as-cast` 128 · `one-export-per-file` 80 · `no-object-shorthand` 65 · `no-silent-catch` 55.

## 3. A bekötés

- **CI/CD:** új `dc-review-relay` lépés a `relay-lint` után, `fatal: false`,
  Discord-csoport `relay-build-test`, 🔍 emoji. (12 → **13** lépés.)
- **LDP:** öt új lépés a végén — `dc-review-cli` · `dc-review-server` · `dc-review-client` ·
  `dc-review-relay` · `dc-review-browser-extension`, mind `fatal: false`. (17 → **22** lépés.)

### ⚠️ Miért `fatal: false` — és mi ennek az ára

2110 nyitott találattal egy blokkoló kapu **nem a kódot javítaná**, hanem minden LDP-kört és minden
relay-deployt megállítana. A referencia-pipeline (organizer) is `fatal: false`-szal futtatja.

⛔ **De ez azt is jelenti, hogy a review MA nem kapu, csak jelzés.** A `fatal: true`-vá tétel
**külön owner-döntés**, és csak azután van értelme, hogy a találatszám lement.

### ⛔ Amit a review NEM írhat felül

Az átemelt CCAP-kód 280 találata **nem javítandó** — `current/principles/transplant-not-rewrite.md`
(owner: *„nagyon törékeny az a kód, de cserében meg egész jól működött"*). A review ott **jelzés
marad**, nem munkalista. Ha valaha kizárjuk a review alól, az is owner-döntés.
