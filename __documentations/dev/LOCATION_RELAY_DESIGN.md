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

## 6. ❓ AMI DÖNTÉSRE VÁR

1. **Mehet-e a relay a test szerverre?** *(fdp-devops-ot érint ⇒ ez az owner döntése)*
2. **Milyen néven?** pl. `test-relay.futdevpro.hu` — a DNS + cert az owner köre.
3. **Kell-e a végpontok közti titkosítás?** *(⭐ ajánlom; előbb élőben igazolandó)*
4. **Meddig pufferelhet a relay**, ha a my-assistant napokig nem húzza le? *(javaslat: 7 nap, aztán dobja)*

---

## 7. Kapcsolódó

- `__documentations/dev/OWNTRACKS_LOCATION.md` — az app + a már **kész** fogadó végpont
- `current/principles/location-retention.md` — mit tárolunk és mit nem
- `current/open-questions.md` **N)** — a helyzet-követés döntései
