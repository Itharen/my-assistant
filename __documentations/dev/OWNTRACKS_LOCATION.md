# OwnTracks — helyzet-követés beállítása

> **Owner-döntés (2026-09-07):** OwnTracks, **állítható** gyakoriság, és ⛔ **az otthoni
> koordinátát NEM tároljuk.**
> Kanonikus szabály: `current/principles/location-retention.md`

---

## 1. Mit kell feltenni

| Platform | Hol |
|---|---|
| **Android** *(ajánlott, FOSS-forrásból)* | `https://f-droid.org/packages/org.owntracks.android/` |
| Android (Play) | `https://play.google.com/store/apps/details?id=org.owntracks.android` |
| **iPhone** | App Store → keresés: **OwnTracks** ⚠️ *(az azonosítót nem ellenőriztük — nem tippeljük)* |

⚠️ **A telefon platformja NINCS rögzítve** — a `current/feature-requests/activity-tracking.md`
`Q-act-2` kérdése ma is nyitott. Ezért adtuk meg mindkettőt.

---

## 2. Az app beállítása

| Beállítás | Érték |
|---|---|
| **Mode** | `HTTP` *(⛔ nem MQTT — nincs saját brókerünk, és nem is kell)* |
| **URL** | `http://<a-szerver-cime>:39335/api/location/owntracks?token=<A_TITOK>` |
| **Device ID / Tracker ID** | tetszőleges *(nálunk nem azonosít semmit)* |
| **Locator interval** | ⭐ **ÁLLÍTHATÓ** — owner: *„Legyen állítható és majd finomhangoljuk."* |

### ⭐ A LÉNYEG: a `home` régió

Az appban **fel kell venni egy régiót (waypoint) `home` néven**, az otthon címére.

🔴 **Ez nem kényelmi beállítás, hanem maga az adatvédelmi megoldás:**
a telefon ettől kezdve az `inregions` mezőben küldi, hogy otthon van-e — így
**a szervernek SOHA nem kell tudnia az otthon koordinátáját.**

⚠️ Ha a régió neve más, a szerver oldalon is át kell állítani
(`LocationConfig.homeRegionName`).

---

## 3. A titok

A végpont **megosztott titokkal** védett: `MA_LOCATION_TOKEN` a `.env`-ben.

- ⛔ **Ha nincs beállítva, a végpont MINDENT elutasít.** Szándékosan: egy védtelen
  helyzet-végpont rosszabb, mint egy nem működő — az elsőt nem vennénk észre.
- A titok mehet **fejlécben** (`X-MA-Location-Token`) vagy **query-ben** (`?token=…`).
- ⚠️ A hibaüzenet **nem árulja el**, hogy a szerver oldalán hiányzik-e a titok, vagy a
  küldött rossz — kívülről mindkettő `401`.

---

## 4. Mit tárolunk (és mit NEM)

| Helyzet | Amit eltárolunk |
|---|---|
| 🏠 **otthon** | `{ at, state: 'home' }` — ⛔ **koordináta NÉLKÜL** |
| 🚶 **máshol** | `{ at, state: 'away', lat, lon, accuracyM?, batteryPct? }` |
| ❓ **nem tudjuk** | ugyanaz, mint az otthon — ⛔ koordináta nélkül *(óvatos irány)* |

🔴 A szabály **típusszinten** van kikényszerítve: a `StoredLocation` union `home`-ágához
**nincs is hova** tenni a koordinátát. Nem egy elfelejthető `if`.

**Hely:** `server/data/location/locations.jsonl` — **gitignore-olva**.
⛔ A helyzet-adat SOHA nem kerülhet a repóba.

**Lejárat:** a `away` bejegyzések alapból **365 nap** *(állítható)*; a `home` bejegyzések
**nem járnak le** — nincs bennük érzékeny adat, viszont látszik belőlük a napi ritmus.

---

## 5. ⏳ Ami még nyitott

- **Elérhetőség kívülről:** a szerver `39335`-ön a gépen figyel. Ahhoz, hogy a telefon
  útközben is elérje, kell egy út kívülről (port-forward / VPN / alagút).
  ⚠️ **Ezt még nem mértük fel** — owner-döntés lesz, biztonsági következményekkel.
- **„Otthon" sugara:** az appban állítható; a jó érték **mérendő**, nem tippelendő.
- A telefon **platformja** (Android/iOS) — lásd fent.
