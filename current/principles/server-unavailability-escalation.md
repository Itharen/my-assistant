# Szerver-elérhetetlenség azonnali jelzése

## 2026-09-09 — user-szabály

> „Ha a teszt-szerver, vagy a production szerver nem elérhető, az általában
> gondot jelez, ami azt jelenti, hogy gyorsan meg kell néznem, hogy mi van vele.”

## Működési következmény

- A teszt- vagy production szerver elérhetetlenségét nem nevezem találgatással
  karbantartásnak.
- Azonnal, sürgős üzemeltetési jelzésként szólok a usernek.
- Pontosan közlöm a mért tünetet: melyik végpont vagy művelet hibázott, és milyen
  típusú hibát adott.
- Az okot csak akkor állítom, ha azt külön bizonyíték igazolja.
- A user ellenőrzése szükséges, mert a szerveroldali állapotot csak ő tudja
  teljesen megvizsgálni és helyreállítani.


---

## 🔴 2026-09-10 19:13 — OWNER-SZABÁLY: MINDEN szerver-kiesést JELEZNI KELL

> **Owner szó szerint:** *„nem az organizer nem elérhető, hanem a **production-szerver volt
> leállva teljesen**. Újraindult, és ilyenkor **nem indul rendesen magától újra**, mert a hülye
> Windows 11 upgrade… megállítja mindig. Szóval ilyenkor, **hogyha nem elérhetőek a szerverek
> bármelyik, akkor azt mindenképpen jelezd nekem, ez nagyon fontos**. Elméletileg már van
> implementációnk, ami neked a státuszba jelzi ezeket, de **nem biztos, hogy ez aktív**."*

### ⭐ Ami MŰKÖDIK — és ami HIÁNYZIK

**Mérve 2026-09-10 19:16** (`GET /api/healthz` → `services`):

| Tény | Érték |
|---|---|
| A figyelő **aktív** és **be van kötve** | `app.server.ts:246`, root-service |
| **Észlelte** a kiesést | mind a 7 cél `unreachable`, **28 egymást követő bukás** |
| Mióta | `lastHealthyAt: 2026-09-10 01:33` ⇒ **~15,7 óra** |
| Mintavételi köz | **30 perc** (`intervalMs: 1800000`) |
| 🔴 **Szólt-e valakinek?** | **NEM.** Sem nekem, sem az ownernek |

🔴 **A HIÁNYZÓ LÁNCSZEM: a figyelő ÉSZLEL és KÖZZÉTESZ — de nem ÉRTESÍT.**
Az adat egy végponton ül, amit **valakinek le kell kérdeznie**. ⇒ 15,7 órán át **senki nem tudta**,
hogy a szerverek állnak — és én is csak azért néztem meg, mert **ő kérdezte**.

⭐ **Ez ugyanaz a hibaosztály, mint a 09-10-i 6 órás néma kiesés:** *amikor minden leáll, az is
leáll, ami szólna róla* — itt viszont **nem állt le semmi**, csak **senki nem hallgatta**.
📌 **A megfigyelés önmagában nem riasztás.** Egy `status`-mező, amit nem néz senki, **nulla értékű**.

### ⚠️ ÉS EGY CSAPDA: az adat LEHET ELAVULT

**Mérve ugyanekkor:** a figyelő szerint az **Organizer `unreachable`** — miközben **ugyanabban a
percben sikeresen létrehoztam benne egy feladatot** *(`org:task:6aa2e568…`, 19:14)*.

**Az ok:** a 30 perces köz. Az utolsó futás **19:12** volt, még a kiesés alatt; a következő
**~19:42**. ⇒ A kijelzett állapot **fél óráig téves** maradhat, **mindkét irányban**.

🔴 **Ezért a `healthz` NEM helyettesíti a tényleges próbát:** ha egy szolgáltatásra **támaszkodni
akarok**, a **saját hívásom** a bizonyíték — a `healthz` csak **jelzés**, hogy hol keressem a bajt.

### A szabály, ami rám vonatkozik

```
1. Ha egy szolgáltatás-hívásom BUKIK  →  AZONNAL szólok az ownernek. ⛔ Nem várok a következő körre.
2. Minden körben ránézek a `healthz` `services` blokkjára — és ha van `unreachable`, JELZEM.
3. ⚠️ De a `healthz` állapotát NEM állítom ténynek: 30 perces mintavétel. Ha számít, MEGMÉREM.
```
