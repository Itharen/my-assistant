# DISPATCH BRIEF — SÜTI-LELTÁR (cookie inventory) · 2026-07-29

> **Kiadó:** My Assistant 3 (koordinátor) · **Végrehajtó:** `ALL Projects - MA3 Dev 3` (`ccs-fbc3577e-ms6cy0bt`).
> **Miért külön session:** a `MA3 Dev 2` a számlázás-hyperplanon dolgozik — **nem zavarjuk**.

## 0. A kiváltó ok (ügyvédi kérés, 2026-07-29)
Dr. Nagy Dániel Endre (a jogi dokumentációnkat készíti) írta:
> *„A megjelölt weboldalakon az ellenőrzésem során jelenleg **nem találtam működő sütiket**. Kérem ezért, hogy küldje
> meg a **bevezetni tervezett sütik listáját**, feltüntetve az egyes sütik **célját**, valamint azt is, hogy **melyik
> weboldalon** kívánják az adott sütit elhelyezni. Elképzelhető, hogy a lista áttekintését követően további technikai
> információkra is szükségem lesz, különösen akkor, ha valamelyik sütiről nem található megfelelő nyilvános
> dokumentáció."*

⚠️ **Az, hogy ő „nem talált működő sütit", NEM bizonyítja, hogy nincs.** Lehet, hogy consent előtt nem települ, csak
bejelentkezés után jön létre, vagy `httpOnly`/`SameSite` miatt nem látta. **MÉRNI KELL.**

**A cookie-tájékoztató ezen a leltáron fog állni — ha hiányos, a jogi dokumentum lesz hiányos.**

## 1. A FELADAT
Készíts **teljes, verifikált süti-leltárt** (+ a sütikkel egy tekintet alá eső tárolási technológiákat) **domainenként**.

**Érintett domainek (verifikált, `fdp-devops/webhook/ssl-config.json`):**
- `master-prompter.hu` (jelenleg `test.master-prompter.hu`)
- `adventor.futdevpro.hu` (`test.` / `dev.`)
- `futdevpro.hu` / `www.futdevpro.hu`
- `token.futdevpro.hu` (a vásárlási/fizetési felület — **fontos**)
- *(másodlagos, ha belefér: `art-tarot.hu`, `social.futdevpro.hu`, `dum.futdevpro.hu`, `warbots.hu`)*

**Mit kell minden tételről megadni:**
| Mező | Megjegyzés |
|---|---|
| **Név** | pontos süti-név (vagy localStorage/sessionStorage kulcs) |
| **Melyik weboldalon** | domain + a beállító hoszt (első vagy harmadik fél) |
| **Cél** | mire szolgál, közérthetően (ez megy a jogi doksiba) |
| **Kategória** | feltétlenül szükséges / funkcionális / statisztikai / marketing |
| **Élettartam** | session vs. konkrét lejárat |
| **Első/harmadik fél** | ha 3rd party: **melyik szolgáltató** (pl. Stripe, Google, CDN) |
| **Mikor települ** | consent ELŐTT vagy UTÁN? bejelentkezés előtt/után? |
| **Forrás-bizonyíték** | kód-hely (`file:line`) VAGY futásidejű mérés (mit, hol, hogyan mértél) |

## 2. HOGYAN — legalább 3 független irány (ne csak egy!)
1. **Kód-oldal:** a szerver által beállított sütik (auth/session/CSRF/nyelv), a kliens-oldali
   `document.cookie` / `localStorage` / `sessionStorage` írások, a bedrock-csomagok (`@futdevpro/*`,
   `nts-dynamo`, `fdp-templates*`) által beállított sütik, cookie-consent könyvtár, socket/CDN.
2. **Harmadik felek:** minden beágyazott/kihívott szolgáltatás, ami sütit tehet — **Stripe** (fizetési elemek),
   analitika (ha van), betűtípus/CDN, hibakövetés. A providerek **saját nyilvános süti-dokumentációját** is keresd meg
   (az ügyvéd külön jelezte, hogy ez kelleni fog).
3. **Futásidejű mérés (a legfontosabb):** a **test** környezetekben nézd meg ténylegesen, mi települ —
   **consent ELŐTT**, **consent UTÁN**, **bejelentkezés előtt** és **után**, valamint a **vásárlási folyamat** közben
   (`token.futdevpro.hu`). Az e2e/Playwright eszköztár rendelkezésre áll (`@futdevpro/dynamo-e2e`); a hálózati és
   `document.cookie` állapot kiolvasható. Ha nem tudsz mérni, azt **EXPLICIT „unverified"**-ként jelöld.

## 3. ⚠️ ISMÉTLŐ-ÁTFÉSÜLÉS — a lényeg (owner-direktíva)
**NAGYON ALAPOSNAK kell lenni: addig ismételd az átfésülést, amíg TALÁLSZ ÚJ ELEMET.**
- Minden kör **változtasson nézőpontot** (kód-grep → futásidejű mérés → 3rd-party doksi → másik domain → másik
  user-állapot: anonim / bejelentkezett / vásárló / consent-elutasító).
- **A ScheduleWakeup-ot használd** arra, hogy magadat mozgásban tartsd a körök között (autonóm haladás).
- **Kilépés:** akkor állsz meg, ha **két egymást követő kör NEM hoz új elemet** (a `core-review-until-clean` szellemében),
  és ezt a tényt a riportban **kimondod** (hány kör futott, mit nézett mindegyik).

## 4. KIMENET
`fdp-documentations/legal/_process/cookie-inventory-2026-07-29.md` — **egy tábla**, a fenti mezőkkel, domainenként
csoportosítva; a végén:
- **Módszertan** (hány kör, milyen nézőpontok, mit mértél és hogyan),
- **Bizonytalanságok** (`unverified` tételek külön listán),
- **Javasolt kategorizálás** a cookie-tájékoztatóhoz.
Commit + push. **Ez a doksi megy át az ügyvédnek.**

## 5. KORLÁTOK
- **NE módosíts alkalmazás-kódot** — ez **felmérés**, nem fejlesztés. Ha hiányosságot találsz (pl. consent előtt
  települő nem-szükséges süti), azt **leletként jelentsd**, ne javítsd.
- **Nincs polling/háttér-task** — a ScheduleWakeup egyszeri, ütemezett újraébresztés.
- `core-no-guessing`: minden állítás mögé bizonyíték (kód-hely vagy mérés).
