# Tipikus félrehallások — STT-szótár

> **Owner-kérés (2026-09-07 11:52, hangüzenetben):** *„az STT-vel küldött üzeneteknél lehet,
> hogy valami kis egyszerű flegekkel megjelölhetjük az üzeneteket, hogy tudják róla, hogy ez
> egy STT volt, mert ugye az STT-kben lehetnek transkript hibák, félrehallások, illetve
> általában amúgy ezekhez szoktunk vezetni, tipikus félrehallások könyvtárat."*

---

## Mire jó ez a fájl

**Élő, bővülő lista** azokról a szavakról, amiket a beszédfelismerés rendszeresen félrehall.
Két dolgot ad:

1. **Nekem olvasáskor:** ha egy átiratban ilyet látok, tudom, mi volt valószínűleg az eredeti —
   és **nem kérdezek vissza feleslegesen**.
2. **A jelöléshez:** ha egy átirat ismert félrehallást tartalmaz, az üzenet **külön flaget** kap.

⚠️ **Ez NEM automatikus javítás.** ⛔ A szöveget **nem írjuk át** — csak **megjelöljük**.
Az automatikus csere pont azt a hibát követné el, amit el akarunk kerülni: magabiztosan
rosszat állítani. A döntés az owneré.

---

## A szótár

| Amit hallott | Amit valószínűleg mondott | Honnan tudjuk |
|---|---|---|
| `CIC` · `CIC-ig` | **CI/CD** | owner, 2026-09-07 — *„végig kell menjenek a CIC-ig"* |
| `FTP templates` | **FDP Templates** | owner, 2026-09-07 — *„FTP templates-be felvenni"* ⚠️ az FTP **létező** FDP-szolgáltatás, ezért ez a félrehallás **különösen veszélyes** |
| `FDP KeyStore` | FDP Keystore | ugyanaz, csak írásmód |
| `transkript` | transcript | ugyanaz, csak írásmód |
| `fleg` · `flegek` | **flag** · flagek | owner, 2026-09-07 |
| `realy` | relay | owner, 2026-09-07 *(gépelve, nem STT — de ugyanaz az osztály)* |
| `my-assisstant` | my-assistant | owner, 2026-09-07 *(gépelve)* |

### ⚠️ Amit ebből tanulni kell

🔴 **A legveszélyesebb félrehallás az, ami EGY MÁSIK LÉTEZŐ DOLOG NEVE.** Az `FTP templates`
nem értelmetlen zaj — az **FTP egy valódi FDP-szolgáltatás** (`fdp-ftp-service`, XY=10).
Ha vakon követem, a **rossz repóban** kezdek dolgozni.

⇒ **Ellenőrző kérdés minden átiratnál:** *van-e a mondatban olyan név, ami egy MÁSIK létező
rendszerre is illik?* Ha igen, a szövegkörnyezet dönt — és ha az sem egyértelmű, **kérdezek**.

---

## 🔴 MÉRT PROBLÉMA: az átirat ELVÁGÓDHAT

**2026-09-07:** egy **32 másodperces** üzenet átirata **mondat közben** ért véget
(*„…az ENV-be generált kulcsokat. **Ehhez**"* — 263 karakter). A 14 másodperces üzenet
ugyanakkor **teljes** volt.

⚠️ **Ez nem félrehallás, hanem HIÁNY** — és sokkal veszélyesebb: a félrehallás *látszik*,
a hiányzó vég **nem**. Egy csonka utasítás úgy néz ki, mint egy teljes.

**Amit tenni kell:** ha egy átirat **mondat közben ér véget** *(nincs záró írásjel, kötőszóval
vagy névelővel végződik)*, azt **JELEZNI kell**, és ⛔ **nem szabad cselekedni rá** — vissza
kell kérdezni. *(Így jártam el a kulcsokról szóló üzenetnél.)*

---

## Kapcsolódó

- `cli/src/stt/stt.transcript-guard.ts` — a hallucináció-őr *(más osztály: kitalált szöveg)*
- `cli/src/stt/stt.mirror.ts` — a tükör-üzenet
- `cli/src/discord/discord.voice-message.ts` — a kötegbe kerülő jelölés
- `__documentations/dev/FDP_AI_STT.md` — a szolgáltatás mért szerződése
