# Helyzet-relay — terv (⏳ OWNER-DÖNTÉSRE VÁR, nem épült meg)

> **Owner (2026-09-07 10:50), szó szerint:**
>
> *„Uh... A my assistant server nem lesz elérhető kívülről... Vagy tudunk safe relay-t
> beállítani, építeni? (Van egy test szerverünk amire esetleg lehet tenni egy realy-t, de
> semmiképp nem a my assistant servert. És mindenképp secure kell legyen.
> (More architectural info in FAM))"*

⛔ **EZ CSAK TERV.** A relay a **test szerveren** élne, ami a `my-assistant` projekten
**kívül** van ⇒ owner-jóváhagyás nélkül nem építem meg
*(`current/principles/assistant-identity.md` — projekten kívüli fejlesztés).*

---

## 1. A kemény korlát, ami az egész tervet meghatározza

> ⛔ **A my-assistant szerver SOHA nem lehet elérhető kívülről.**

⭐ **Ebből egyenesen következik a megoldás alakja: a relay NEM küldhet befelé — a
my-assistant HÚZZA le az adatot.** Egyirányú, kifelé kezdeményezett kapcsolat.

```
📱 telefon (OwnTracks)
     │  HTTPS POST
     ▼
🌐 nginx gateway  (test.<...>.futdevpro.hu, Let's Encrypt)
     │
     ▼
📦 RELAY a test szerveren  — csak PUFFEREL, nem értelmez
     ▲
     │  HTTPS GET  ⟵ a my-assistant KEZDEMÉNYEZI (otthonról, kifelé)
     │
🏠 my-assistant szerver  — ⛔ SEMMILYEN bejövő port
```

🔴 **Miért ez a helyes irány:** ha a relay hívná a my-assistant-ot, ahhoz **nyitott portot**
kellene tartani otthon — pontosan azt, amit az owner kizárt. A pull-modellnél az otthoni gép
**kizárólag kimenő** kapcsolatot létesít, tehát a támadási felülete **nem nő**.

---

## 2. Amit a FAM-ból tudunk (mérve, nem feltételezve)

| Tény | Forrás |
|---|---|
| **Központi nginx gateway** minden külső eléréshez — egy SSL-termináció, 13+ domain, `test.*.futdevpro.hu` minta | `fdp-devops/__documentations/DECISIONS.md` §3.0 · `ARCHITECTURE.md` |
| A **test környezet KÜLÖN hoston** fut (`test-runner`, `E:\Repos\fdp-devops`) — ⚠️ **nem** az owner gépén | FAM knowledge: *„Single Active Compose Project…"* |
| SSL: **Let's Encrypt**, a webhook/server-control ACME-folyamata; ⚠️ rate-limit **50 cert / 7 nap** | `SP-01-08-nginx-gateway-routing.md` |
| ⛔ **NE SSH-zz a hostra** — a webhook-végpontokat kell hívni | memória: `reference_no_ssh_use_webhook` |
| Van **bevált HMAC-hitelesített végpont-minta** (`verifyWebhook`, POST + aláírt body) | FAM knowledge: `/diag/webhook-logs` |
| A webhook **host-szintű Node folyamat**, nem konténer; az SSL előtte a gateway | memória: `reference_webhook_runforever_autoheal` |

---

## 3. A biztonsági réteg

| Réteg | Mit ad |
|---|---|
| 🔐 **HTTPS a gateway-en** | a telefon → relay út titkosított; Let's Encrypt cert, meglévő minta |
| 🔑 **Megosztott titok / HMAC** | csak a mi telefonunk tud írni; a bevett FDP-minta létezik |
| 🚦 **Rate-limit + méret-korlát** | egy kiszivárgott token se tudja megtölteni a lemezt |
| ⏳ **Rövid puffer-idő** | a relay **nem archívum**: átvétel után törli. Ami nincs ott, azt nem lehet ellopni |
| 🙈 ⭐ **Végpontok közti titkosítás** | ha az OwnTracks payload-titkosítása bekapcsolható, a relay **olvashatatlan** adatot pufferel — csak a my-assistant tudja visszafejteni |

⚠️ **Az utolsó pont MÉG NEM ELLENŐRZÖTT.** Az OwnTracks tud payload-titkosítást
*(`_type: "encrypted"`, NaCl secret-box)*, de ezt **élőben kell igazolni**, mielőtt bárki
ténynek veszi. ⛔ Ezt nem állítom mérésnek.

⭐ **Ha működik, az minőségi ugrás:** a relay egy **közös** gépen futna, és így nem is
*kellene* megbíznunk benne — nem tudná elolvasni, hol vagyok.

---

## 4. Mit érint — és mit NEM

| | |
|---|---|
| ⛔ **NEM érinti** | a my-assistant szerver kitettségét — az változatlanul zárt marad |
| ⚠️ **Érinti** | `fdp-devops`: egy nginx-conf + egy kis relay-szolgáltatás + DNS-bejegyzés + cert |
| ⚠️ **Érinti** | a test szerver erőforrásait *(elhanyagolható: néhány KB/nap)* |

---

## 5. Alternatívák, amiket megfontoltam

| Megoldás | Miért nem ez az elsődleges |
|---|---|
| **Port-nyitás otthon** | ⛔ az owner kizárta, és jogosan: a lakás-hálózatot teszi ki |
| **VPN (WireGuard/Tailscale)** | Működne és biztonságos — de a telefon **állandó VPN-t** igényelne, ami akkut és kényelmet visz. ⭐ **Tartaléknak jó**, ha a relay elakad |
| **Kész felhő-szolgáltatás** | ⛔ `no-paid-solutions` + harmadik fél látná a helyzetet |
| **MQTT-bróker** | Több mozgó alkatrész, mint amennyit a feladat indokol |

---

## 6. ~~❓ AMI DÖNTÉSRE VÁR~~ — ⛔ ELAVULT

> ⛔ **ELAVULT (2026-09-07 11:03).** Az owner megadta, hogy **minden adott** — nem kitalálni kell, hanem **követni**. A bevett utat a **§8** írja le, a valóban nyitott kérdéseket a **§9**.

## 7. Kapcsolódó

- `__documentations/dev/OWNTRACKS_LOCATION.md` — az app + a már **kész** fogadó végpont
- `current/principles/location-retention.md` — mit tárolunk és mit nem
- `current/open-questions.md` **N)** — a helyzet-követés döntései

---

## 8. ✅ A BEVETT ÚT — mérve, nem kitalálva (2026-09-07 11:03)

> **Owner:** *„A relay deploy-t a cicd fogja csinálni. A test szerver elérhető a belső
> hálózatról. Ez a gép a RAVEN. A test szerver a PLO KOON. A production szerver a TARKIN.
> A relay-t fel kell venni a megfelelő módon az overseer-be. A devops-ot is/gateway configot
> is be kell majd állítani. Ezeknek meg annak a dedikált helyei és módjai. Semmi ilyet ne
> találj ki. Ezek mind adottak!!"*

⇒ **A §6 kérdés-listája ELAVULT** — nem kitalálni kell, hanem **követni**. Az alábbi a
FAM-ból és a repóból **kiolvasott** út.

### 8.1 A gép-térkép (owner, 2026-09-07 — ÚJ, eddig sehol nem volt rögzítve)

| Név | Szerep | Mérés |
|---|---|---|
| **RAVEN** | ez a gép *(a my-assistant itt fut)* | ✅ `COMPUTERNAME=RAVEN`; a CCAP-doksi szerint `200.33.0.101` |
| **PLO KOON** | **test szerver** | owner |
| **TARKIN** | production szerver | owner |

⭐ **A test szerver a belső hálózatról elérhető** — vagyis a my-assistant `PLO KOON`-t
**LAN-on** éri el. ⇒ A pull-modell nemhogy működik, hanem **még egyszerűbb**: a lehúzás
**el sem hagyja a belső hálózatot**.

### 8.2 A KANONIKUS MINTA: fleet-onboarding hyperplan

⭐ **Nem kell új folyamatot kitalálni — VAN rá kész, követendő terv-készlet:**
`LIVE-projects/hero-coordinator/__agent/plans/hyperplan-fleet-onboarding/`

| Terv | Miről szól |
|---|---|
| `MASTERPLAN-B-fleet-registration.md` | a flottába való felvétel egésze |
| **`SUBPLAN-B2-overseer.md`** | ⭐ **Overseer-regisztráció — a „megfelelő mód"** |
| **`SUBPLAN-B3-fdp-devops.md`** | ⭐ **gateway-conf + futtatókörnyezet** |
| `SUBPLAN-C2-cicd.md` | a CI/CD-bekötés |

### 8.3 Overseer-regisztráció — a 4 szerkesztés *(`SUBPLAN-B2` szerint)*

| # | Fájl (`LIVE-projects/overseer/`) | Mit |
|---|---|---|
| 1 | `server/src/_enums/fdp-system.enum.ts` | új rendszer-tag *(**kebab-case** — ez a konvenció)* |
| 2 | `server/src/_enums/server-project.enum.ts` | `…-server` tag |
| 3 | `server/src/_enums/client-project.enum.ts` | `…-client` tag *(⚠️ a relay-nek valószínűleg **nincs** kliense)* |
| 4 | `server/src/_collections/project-matrix.const.ts` | a mátrix-bejegyzés(ek) |

> ⚠️ **KRITIKUS, a subplanból:** a `projectMatrix` **EXHAUSTIVE** `Record`. Ha az enum-tag
> bekerül, de a mátrix-bejegyzés nem, **az Overseer szerver NEM FORDUL LE.**

**Amit ez ad:** a webhook felismeri a repo-slugot → **queue-priority**; a build-report és a
step-progress megjelenik a dashboardon; az `fdp build-detail --project …` értelmezhető
projektet kap. Enélkül a push default `priority: 50`-nel futna, mátrix-bejegyzés nélkül.

### 8.4 Gateway-conf *(`SUBPLAN-B3` + a meglévő confok szerint)*

**Hely:** `fdp-devops/nginx/confs/<projekt>.conf` — ma **20+ ilyen fájl** van, az `art-tarot`
a hivatkozott minta.

**Szerkezet:** HTTP `:80` → ACME-include + 301 HTTPS · HTTPS `:443` → cert + közös include-ok
+ `proxy_pass http://test-server:<port>/`.

**Kötelező include-ok** *(a flotta SSOT-jai)*:
```
include /etc/nginx/includes/acme-challenge.conf;          # CSAK a :80 blokkban
include /etc/nginx/includes/client-header-buffers.conf;   # FR-078
include /etc/nginx/includes/error-pages.conf;
```

⭐ **DNS: nem kell új rekord.** A `*.futdevpro.hu` **wildcard** lefedi az aldomaint
*(`SUBPLAN-B3`)*.

⭐ **A confok RUN-TIME volume-mounttal jönnek** *(`reference_gateway_confs_runtime_mount`)* ⇒
a conf-változtatás **fix-forward**, nem igényel image-rebuildet.
⚠️ **De:** egy hibás conf `emerg`-gel megdöntheti a gateway-t, és akkor **MINDEN**
`*.futdevpro.hu` leáll — 2026-06-05-ön ez P0 incidens volt. ⇒ `nginx -t` **kötelező** előtte.

### 8.5 SSL *(mérve)*

`fdp-devops/webhook/ssl-config.json` — új bejegyzés:
`{ domain, email: contact@futdevpro.hu, aliases: [], enabled: true, environment: 'test' }`.
Az SSL Manager **kizárólag a configból** dolgozik (`config.domains.filter(d => d.enabled)`),
tehát ami nincs benne, arra **soha nem fut ACME**.
⚠️ Let's Encrypt **rate-limit: 50 cert / 7 nap**.

### 8.6 ⛔ Amit NEM szabad

- ⛔ **NE SSH-zz a hostra** — a webhook-végpontokat kell hívni
  *(memória: `reference_no_ssh_use_webhook`)*.
- ⛔ Ne találj ki portot, nevet, folyamatot — mind adott; ha nem találod, **kérdezd**.

---

## 9. ❓ AMI TÉNYLEG NYITOTT (és amit NEM tippelek meg)

| # | Kérdés | Miért nem döntöm el magam |
|---|---|---|
| 1 | ⚠️ **A domain-név elgépelés?** Az üzenetben `test.my-assisstant-relay.futdevpro.hu` — **két `s`** az „assisstant"-ban. Szándékos, vagy `test.my-assistant-relay.futdevpro.hu` a helyes? | Egy domain **karakter-pontos**; a rossz név DNS-t, certet és configot visz — és a cert **rate-limitet** éget |
| 2 | **Saját repó legyen?** (pl. `futdevpro/my-assistant-relay`) vagy a meglévőn belül? | A CI/CD-bekötés és az Overseer-regisztráció ezen múlik |
| 3 | **Melyik port** a test-serveren? | A portok kiosztottak — ⛔ nem találok ki egyet |
| 4 | **Ki írja meg?** A relay `fdp-devops`/új repó ⇒ **a my-assistant projekten kívül** | `assistant-identity`: projekten kívüli fejlesztés csak külön kérésre |
