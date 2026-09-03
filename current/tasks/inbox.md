# Tasks — lokál tükör / inbox

> **Másodlagos tükör.** A kanonikus forrás az **organizer** (`fo tasks.*`).
> Ez a fájl csak tükör + fallback (organizer-downtime esetén). Szabály:
> `current/principles/recording-discipline.md`.
>
> Minden sor org-ref-fel van összekötve, amint sikerült organizerbe írni.
> `⏳ pending organizer sync` = még csak lokálban van (org down volt).

---

## Aktív

### 2026-09-02 — Zenei előadói történetszál

| Task | Org-ref | Előfeltétel / határidő | Status |
|---|---|---|---|
| 🎵 **Zenei előadó — rebrand után zenék javítása és újrafeltöltése** | `org:task:6a982b8de7e7e729f544b6b7` | az artist-rebrand lezárása után; dátum nincs megadva | 🟡 nyitva; a rebrand készültsége megerősítendő |

Suno-generált zenék, a user számára fontos témákról. Az elsőre rosszul beállított
artist rebrandje után: dalok átnézése → helyenkénti tisztítás → hangerő-normalizálás
és végighallgatás → újrafeltöltés a helyes előadói profilhoz. A korábbi feltöltések
nem voltak normalizálva. Előadónév, platform és érintett dalok még pontosítandók;
nem feltételezünk határidőt vagy lezárt rebrandet. Rögzítés, nem publikálási művelet.

### 2026-08-26 — Tesco átvétel, munkaismétlés, következő fókusz (frissítve: 2026-09-02)

| Task | Org-ref | Határidő / ismétlődés | Status |
|---|---|---|---|
| 📦 **Tesco-rendelés átvételének ellenőrzése és a megvett mennyiségek készletre vétele** | `org:task:6a8e9e88deaa21f637fc8c31` | átvétel/készletre vétel: 2026-08-27 | ✅ kész · owner megerősítette és Organizerben lezárva 2026-09-02 |
| 💼 **Munka — generálások és kapcsolódó események ellenőrzése (kedd)** | `org:task:6a8e9e8adeaa21f637fc8c38` | hetente kedden; első: 2026-09-01 | 🔄 folyamatban · mostani fő fókusz · heti sorozat · P=116 |
| 💼 **Munka — generálások és kapcsolódó események ellenőrzése (csütörtök)** | `org:task:6a8e9e8bdeaa21f637fc8c3f` | hetente csütörtökön; első: 2026-08-27 | 🔄 folyamatban · mostani fő fókusz · heti sorozat · P=116 |
| 💼 **LinkedIn — válaszok megírása / kezelés** | `org:task:6a72198dce096533ed928987` | a teljes kezelés küldési képesség nélkül elakadt | ⏸️ blokkolt · olvasás/fogadás működik, személyes üzenetküldés nem |
| 🍱 **Interfood — következő 2–3 hetes rendelés leadása** | `org:task:6a8ed251deaa21f637fca107` | az utolsó fedett hét kedd–szerda; konkrét dátumhoz `coverageEnd` kell | 🟡 nyitva · P=115 |
| 🛠️ **Interfood rendelés- és lefedettségkezelő eszköz elkészítése** | `org:task:6a8ed242deaa21f637fca0fc` | nincs fix dátum | 🔄 setup folyamatban · meglévő aktív fejlesztés · P=100 |
| 🔎 **Éves HIPA-egyenleg ellenőrzése az E-Önkormányzatban** | `org:task:6a8ecfcddeaa21f637fca053` | 2027-07-10; utána évente új példány | 🟡 nyitva · a rendszer nem küld automatikus értesítést |

> 2026-09-02 owner-korrekció: a Tesco átvételi bizonyítéka már megvolt:
> `__documentations/developments/2026-08-27-tesco-delivery-reconciliation.md`.
> A feladattükör és az Organizer lezárása maradt le, nem a vásárlás.
> A munka folyamatban jelzése nem egy konkrét ismétlődő példány készre jelentése.
> Az Interfood setup nem el nem kezdett feladat; a meglévő hyperplan és approval-kapuk
> érvényben maradnak. A jövőbeli rendelések nem nyitják újra a lezárt Tesco-rendelést.

> A 2026. szeptemberi 285 845 Ft-os (`org:task:6a8ecfc2deaa21f637fca045`)
> és a 2027. márciusi 288 034 Ft-os (`org:task:6a8ecfc3deaa21f637fca04c`)
> HIPA-tétel ✅ befizetve 2026-08-26, Organizerben lezárva.

> A HIPA értesítési működésének kivizsgálása (`org:task:6a104196d440d3f484cee136`)
> ✅ kész 2026-08-26. A Fővárosi Adó Főosztály telefonos tájékoztatása szerint
> nincs automatikus értesítés, figyelmeztetés vagy számla. Az ellenőrzési pont:
> <https://ohp-20.asp.lgov.hu/adoegyenleg>. Minden „… napjáig pótlékmentesen
> fizethető” tételt külön, a kijelzett összeggel és határidővel kezelünk; a korábbi
> automatikus túlfizetés-nettósítási feltételezést nem használjuk.

> Az Organizer jelenlegi task-modellje egyetlen sorozaton nem tárol több
> kiválasztott hétköznapot, ezért a kedd + csütörtök ritmust két heti sorozat
> reprezentálja. Ez nem „kétnaponta” ismétlődés.

### 2026-08-22 ismétlődő feladat

| Task | Org-ref | Ismétlődés / következő határidő | Status |
|---|---|---|---|
| 🔐 **NPM-token frissítése mindenhol** — dolgozó gépek, szerverek, FDP Keystore, szerver-global `.npmrc`, DevOps environment | `org:task:6a049f19d440d3f484cee052` | 90 naponta · értesítés: 2026-11-13 · határidő: 2026-11-20 10:00 | ✅ meglévő organizer-task frissítve · kötelező · P=105 |

### 2026-08-17 mai feladatok

| Sorrend | Task | Org-ref | Határidő | Status |
|---|---|---|---|---|
| 1 | 💼 **Munka — generálások és kapcsolódó események ellenőrzése** | `org:task:6a886f3c777f60bd4da715d2` | 2026-08-17 | ✅ kész 2026-08-26 · organizerben lezárandó; heti kedd+csütörtök sorozat folytatja |
| 2 | 🩺 **Orvoshoz elmenni** — külön a háziorvosi bejelentkezéstől és az üzemorvostól | `org:task:6a886f3d777f60bd4da715d9` | 2026-08-17 | ✅ kész 2026-08-22 · organizerben lezárva |
| 3 | 🛒 **Tesco-rendelés leadása** | `org:task:6a7c3f24d9038971c29bf759` | 2026-08-17 23:59 | ✅ kész 2026-08-26 · átvétel/készletre vétel dokumentálva 2026-08-27 |
| 4 | ⚖️ **Egyeztetés az ügyvéddel** | `org:task:6a886f3e777f60bd4da715e0` | 2026-08-17 | ✅ kész 2026-08-22 · organizerben lezárva |
| 5 | ✉️ **Az ügyvédnek küldendő e-mail összeállítása** | `org:task:6a886f3f777f60bd4da715e7` | 2026-08-17 | ✅ kész 2026-08-22 · organizerben lezárva |

| Task | Org-ref | Felvéve | Status |
|---|---|---|---|
| **Mutti-nak odaadni a fagyasztott zöldségeket** | `org:task:6a1af22c1aaf1ebfb627df10` | 2026-05-29 | ✅ organizerben |
| 🚗 **Jogosítvány meghosszabbítása** — lejár 2026-09, **TOP PRIO (P=120)** | `org:task:6a49435b1a4a07c9fb0d36ef` | 2026-07-04 (pontosítva 2026-08-04) | ✅ kész 2026-08-22 · organizerben lezárva |
| 🔴 **Üzemorvosnak utánanézni** (magas prió, **P=118**, jogosítvánnyal hasonló szint) | `org:task:6a1c5b69daaf57307ecb6f58` | 2026-05-29 (prio ↑ 2026-07-04) | 🟡 **NYITVA** · külön téma · organizerben |
| ☎️ **Körzetes háziorvos megerősítése és bejelentkezés** — külön ügy az üzemorvostól | `org:task:6a7cbaf4d9038971c29c0b63` | 2026-08-12 · hívás: 2026-08-17 15:00 | ✅ kész 2026-08-22 · organizerben lezárva |
| **MediaMarkt számla** | `org:task:6a1c5b6adaaf57307ecb6f5e` | 2026-05-29 | ✅ organizerben |
| 🌐 **Frontend performance eszköz** (dev-domain) | `org:task:69a05561c1f77dfa09287eae` | 2026-05-29 | 🔀 **ÖSSZEVONVA** a meglévő Core-Web-Vitals taskba; a mai duplikátum (`…6f64`) archiválva |
| 💰 **Sales-est szerezni** (eladni amit csinálunk) | `org:task:6a1c5c6edaaf57307ecb6f8b` | 2026-05-29 | ✅ organizerben (retro-sync) |
| **Organizer tasks-screen továbbfejlesztés** (saját dev) | `org:task:6a1c5c6fdaaf57307ecb6f91` | 2026-05-29 | ✅ organizerben (retro-sync) |
| 🤖 **Jarvis — személyi AI-agent (umbrella epic)** | `org:task:6a1e61ceb2d8b2918f0cf897` | 2026-05-29 | ✅ organizerben · prioritás **jóváhagyva**: `current/notes/jarvis-vision.md` |
| 📖 **Tanulmányírás folytatása** (life goal, fontos) | `org:task:6a1f7a6a7550efa6b0e01252` | 2026-05-29 | ✅ organizerben · ld. `life-goals.md` #1 |

| 📐 **GVCS blueprint-ek letöltése** (opensourceecology.org/gvcs) | `org:task:6a20accaa2fa18b3a8386390` | 2026-05-29 | ✅ organizerben |
| 🔐 **Research: cross-domain key/auth kezelés** (FDP SSO-szerű átmenet) | `org:task:6a20accca2fa18b3a8386396` | 2026-05-29 | ✅ organizerben (dev-domain) |
| 🗂️ **Research: multi-tab közös szervizek** (háttérigény ↓) | `org:task:6a20accda2fa18b3a838639c` | 2026-05-29 | ✅ organizerben (dev-domain) |
| 🤖 **Marketing master agent** (lead gathering + active sales) | `org:task:6a21306a4b53d12a1922ecc7` | 2026-05-29 | ✅ organizerben · kötődik Sales-es taskhoz |
| 🧠 **Kutatás: tudat/gondolat-digitalizálás** (végakarat #3) | `org:task:6a2212204b53d12a1922f0c0` | 2026-05-29 | ✅ organizerben · ld. `current/will.md` |
| 🛋️ **IKEA megvett termékek dokumentálása** (újravásárláshoz) | `org:task:6a3e76df59295790375ab105` | 2026-05-29 | ✅ organizerben |
| 🥤 **Turmixgép vétele + egészségesebb étkezés** | `org:task:6a3e76e059295790375ab10b` | 2026-05-29 | ✅ organizerben |
| 🖥️ **GPU-átrendezés** (kisebb kártya a fő gépbe, tehermentesítés) | `org:task:6a3e76e159295790375ab111` | 2026-05-29 | ✅ organizerben (dev/hw) |
| 🔄 **Mirror-mode auto-sync** (lokál ↔ organizer) | `org:task:6a3e776c59295790375ab11f` | 2026-05-29 | ✅ organizerben (dev) · a manuális recording-discipline automatizálása |
| 📚 **OGS tanterv** | `org:task:6a4e936fac124fca1303a32c` | 2026-07-08 | ✅ organizerben |
| 🖼️ **Goldaholic (OGS) — képregény kezelés** | `org:task:6a4e9370ac124fca1303a332` | 2026-07-08 | ✅ organizerben |
| 💬 **Goldaholic (OGS) — párbeszéd-generálás** (dialógus-fa formában) | `org:task:6a4e9370ac124fca1303a338` | 2026-07-08 | ✅ organizerben |
| 💬 **CCAP élő kommunikáció — Discord + node-ok** (minél előbb, P=105) | `org:task:6a5556ae45ca6bb6d4be605d` | 2026-07-13 | ✅ organizerben |
| 🧪 **Teszt + kísérletezés: `dc dataflow`** (dev-domain) | `org:task:6a64a7ca7a40e93d2f5f8e70` | 2026-07-19 | ✅ organizerben |
| 🛒 **Bevásárló lista + household stock frissítése** | `org:task:6a64a7cb7a40e93d2f5f8e76` | 2026-07-19 | ✅ organizerben |
| 🔌 **Konyhai node beüzemelése** (household stock quick-update) | `org:task:6a64a7cc7a40e93d2f5f8e7c` | 2026-07-19 | ✅ organizerben · ld. `feature-requests/kitchen-note-capture.md` |

### 🎯 Fő-feladat sorozat (2026-08-04) — jogosítvány → LinkedIn → organizer → mikromunka

| Task | Org-ref | Prio | Status |
|---|---|---|---|
| 🚗 **Jogosítvány meghosszabbítása** — van jogsi, **2026-09-ben lejár** | `org:task:6a49435b1a4a07c9fb0d36ef` | 120 | ✅ kész 2026-08-22 · organizerben lezárva |
| 💼 **LinkedIn — válaszok megírása** | `org:task:6a72198dce096533ed928987` | 112 | ⏸️ blokkolt 2026-09-02 · olvasás megy, üzenetküldés nem |
| 🗂️ **Organizer aktív használat kiépítése** | `org:task:6a72198ece096533ed92898e` | 110 | ✅ organizerben |
| 💰 **Mikromunkák beindítása** | `org:task:6a72198fce096533ed928995` | 108 | ✅ organizerben |

### 2026-08-12 batch

| Task | Org-ref | Prio / határidő | Status |
|---|---|---|---|
| 🏠 **Beázás/áttörés — At-La-Ka ismételt bejelentés és helyreállítás** | `org:task:6a7c36e2d9038971c29bf5df` | 119 · utánkövetés: 2026-08-19 10:00 | ✅ kész 2026-08-22 · organizerben lezárva |
| 🔗 **LinkedIn összekötése a My Assistanttel** | `org:task:6a7c36e3d9038971c29bf5e6` | 75 | ✅ organizerben · külön a LinkedIn-válaszok taskjától |
| 📨 **GitHub e-mail értesítések és CI-zaj rendbetétele** | `org:task:6a7c36e3d9038971c29bf5ed` | 70 | ✅ organizerben · ideiglenes Gmail CI-failure szűrő aktív |
| 🚗 **Jogosítvány meghosszabbítása** — pontos lejárat: **2026-09-15** | `org:task:6a49435b1a4a07c9fb0d36ef` | 120 · 2026-09-15 | ✅ kész 2026-08-22 · organizerben lezárva |
| 🛒 **Tesco-rendelés leadása** | `org:task:6a7c3f24d9038971c29bf759` | 114 · 2026-08-17 23:59 | ✅ kész 2026-08-26 · rendelés leadva |

### 2026-08-06 batch

| Task | Org-ref | Felvéve | Status |
|---|---|---|---|
| 🎟️ **Subscription-token: rövid TTL + breakage-alapú árazás** (dev-domain) | `org:task:6a74d0d773f7157d43d6e9bf` | 2026-08-06 | ✅ organizerben · jegyzet: `org:note:6a74d0d873f7157d43d6e9c6` |

### ⏰ Társasági adó — jövőbeli befizetések (due date-tel, "mindig elmarad")

| Esedékes | Összeg | Org-ref |
|---|---|---|
| 2026-10-20 | 55 000 Ft | `org:task:6a1f7a647550efa6b0e0123a` |
| 2027-01-20 | 55 000 Ft | `org:task:6a1f7a667550efa6b0e01240` |
| 2027-04-20 | 55 000 Ft | `org:task:6a1f7a687550efa6b0e01246` |
| 2027-07-20 | 53 000 Ft | `org:task:6a1f7a697550efa6b0e0124c` |
