# 📍 Saját mobil-app a helyzet-küldéshez — VÁLASZ, nem visszakérdezés

> **Owner (2026-09-07 14:56):** *„elbizonytalanodtam, hogy ez [az OwnTracks] tényleg kellene-e
> nekünk. Lehet, hogy jobb lenne, hogyha a My Assistant client tudná a pozícióinfókat
> rögzíteni, és közölni a relay-en keresztül."*
>
> **Owner (2026-09-07 15:03):** *„Jobban preferálom a saját fejlesztéseket... Pl mobil app
> fejlesztési patternjeink is vannak és azt az irányt jobban preferálom."*
>
> **Owner (2026-09-07 20:40):** *„mintha nem [válaszoltál] volna arra a kérésemre"*

🔴 **Igaza volt: nem válaszoltam.** Owner-döntési kérdéssé alakítottam és visszadobtam neki,
ahelyett hogy állást foglaltam volna. A working-style ezt kimondottan tiltja:
*„Ne mondja meg neked, mit csinálj — inkább ötletelj"*. Ez a dokumentum a válasz.

---

## 1. A rövid válasz: **igen, csináljuk sajátban** — és kevésbé nagy falat, mint hittem

**Mért tény:** az **organizer**nek **már van teljes Capacitor → Android APK futószalagja**:

```
build-mobile-web      → ng build production
build-mobile-copy-www → a kész web a mobile/www-be
build-mobile-ensure-android → Capacitor android platform
build-mobile-sync     → cap sync android
build-mobile-apk      → assemble debug APK
build-mobile-copy-dist→ APK a dist-be
```
*(`LIVE-projects/organizer/package.json`, `scripts/run-build-mobile-pipeline.cjs`)*

⇒ **Nem nulláról indulnánk.** Ugyanaz a minta, amit a `pattern-audit` amúgy is előír:
meglévő mintát követünk, nem találunk ki újat.

---

## 2. 🔴 A NEHÉZSÉG NEM AZ APP — hanem a háttér-helymeghatározás

Ez a lényeg, és ezt kellett volna először megírnom:

| | Tud-e háttérben helyet küldeni? |
|---|---|
| **Böngésző / PWA** *(a mostani my-assistant client)* | ⛔ **NEM** — se Androidon, se iOS-en, ha az app nincs előtérben |
| **Capacitor app + háttér-plugin** | ✅ igen, Android **foreground service**-szel |
| **OwnTracks** | ✅ igen — **pontosan ezért létezik** |

⚠️ Ez **platform-korlát**, nem fejlesztési ráfordítás kérdése. Ha a mostani Angular klienst
tennénk mobilra „PWA-ként", **a fő funkció nem működne** — csak akkor küldene helyet, amikor
te épp nyitva tartod. A jelenlét-kapuhoz *(itthon van-e)* az használhatatlan.

⇒ **Ha saját app, akkor Capacitor** — nem PWA.

### A plugin nem fizetős (ellenőrizve)

A legismertebb háttér-geolokációs plugin **fizetős licencű**, de **több MIT-licencű,
ingyenes alternatíva** is van, korrekt Android foreground service-szel *(capacitor-community,
Cap-go, seididieci)*. ⇒ A `no-paid-solutions.md` nem sérül.

---

## 3. Az árak, amiket TE soroltál fel — és mi lesz velük

> *„a saját alkalmazás fejlesztésében benne van az is, hogy ott az auto-update-et, meg az
> alkalmazás telepítést, meg a location sharing-et… meg kéne oldani."*

| Ár | A javaslatom |
|---|---|
| 📲 **Telepítés** | debug APK, kézzel. **EGY felhasználó van** — nincs áruház, nincs aláírási lánc |
| 🔄 **Auto-update** | ⏸️ **NEM az első verzióba.** Egy usernél az újratelepítés percek kérdése. Ez v2 |
| 📍 **Location sharing** | ⭐ **ez már KÉSZ** — a relay él, a szerződés mért, az otthon-koordináta sosem tárolódik |

⭐ **A legfontosabb, amit ebből ki lehet hozni:** a három ár közül **kettő elhalasztható vagy
már megvan**. Ami tényleg dolgozni kell vele: az app-váz + a háttér-plugin bekötése.

---

## 4. ⭐ NEM „vagy-vagy", és nem is sorrend-kényszer

A relay **szerződése azonos**, akárki küld rá. ⇒ Az OwnTracks **most** használható, és a saját
app **később** átveszi — **a relay egyetlen sorát sem kell átírni**.

⇒ Ez nem elköteleződés. Nincs olyan, hogy „rossz irányba indulunk el".

---

## 5. Amit ELSŐNEK építenék — EGY funkció

> `one-function-is-enough.md`

**A v1 egyetlen dolgot tud: háttérben helyet küld a relay-nek.**

Képernyő: **egy kapcsoló** + **egy státusz-sor** *(„utoljára elküldve: …")*.

⛔ **NEM része a v1-nek:** térkép · előzmények · beállítások · értesítések · auto-update ·
bármi, ami nem a helyküldés.

**Miért pont ennyi:** a te bejelentkezésed a summitra, a jelenlét-kapu és az odajutás-tervezés
mind **egyetlen adatot** kér: hol vagy. Minden más ráépíthető később.

---

## 6. Amit tőled kérek — EGY döntés, nem három

🙋 **Belevágjunk a Capacitor-alapú v1-be?** *(igen / még ne)*

Ha igen, a következő kör az app-váz felállítása az organizer mintájából. Ha nem, a relay
attól még él, és az OwnTracks bármikor rákapcsolható.

⚠️ **Amit én nem tudok eldönteni helyetted:** hajlandó vagy-e egy **állandó értesítést**
elviselni a telefonon. Az Android a háttér-helymeghatározáshoz **kötelezően** kitesz egyet —
ez nem megkerülhető, és nem a mi döntésünk.
