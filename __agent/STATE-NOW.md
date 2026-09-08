# 📍 ÁLLAPOT MOST — a rövid, MINDIG teljesen elolvasható belépő

> 🔴 **EZT OLVASD ELŐSZÖR.** Szándékosan **4 kB alatt** marad, hogy **soha ne csonkolódjon**.
> A részletes történet: `__agent/CONTINUATION.md` *(148 kB — oda csak célzottan, `grep`-pel)*.
>
> ⚠️ **MIÉRT LÉTEZIK (mérve 2026-09-08):** a `CONTINUATION.md` akkorára nőtt, hogy **a saját
> horgonyomat sem találtam meg benne**, és egy csonkolt előnézet **a fejlécnél elakad**. Ugyanez
> történt az `AGENT_BUS.md`-nél: `tail`-lel néztem, és **tévesen jelentettem**, hogy az FDP
> asszisztens nem válaszolt. ⇒ A nagy fájl **nem hiba, de nem is belépő**.

**Frissítve:** 2026-09-08 21:35

## Ma

**2026-09-08, kedd — AI Summit 2. nap.** Az owner ~02:17-kor feküdt le.
A kész terv: `current/events/2026-09-08-summit-day2-plan.md`.

## 🙋 AMI RÁ VÁR — ez a legfontosabb lista

1. 👤 **Profil megérkezett** → `current/owner/who-is-the-user.md`. ⛔ **NEM kanonizálva** (ő kérte).
   ❓ **Doc'** a megszólítás? · **szül. 09-15, a 36.** — ⚠️ egy héten belül, ÜTKÖZIK az „Üzemorvos 09-15"-tel
   · hőérzékenység *(ez magyarázza a hajnali sétát)* · admin: jogosítvány · csótányvédelem · TEÁOR.
   ⏳ Kéri még: **a cégéről** szóló összeállítást
2. 🗂️ **Napi matrac** napi ismétlődőre? · NZT és OGS kivezethető? · dátumok: **Üzemorvos 09-15**,
   **Interfood 09-10**
3. 📧 **Belenézhetek a postafiókba?** *(feladó + tárgy + darabszám, tartalom nélkül)*
4. 📱 **Helyzet-app v1** — belevágjunk? *(Capacitor, saját app)*
5. 🔓 **Képesség-jóváhagyás** — ⚠️ **25 ⏳ / 1 ✅**: az üresjárati sávom gyakorlatilag ÜRES.
   Javasolt hármas: **C-13** feladat-kezelés · **C-10** státusz-kivonat · **C-19** alvás-ciklus

## 🎧 T-68 (DEV) — kész, az ÉLES igazolás még hátra van

`ma stt pending | transcript <id> | retry <id>` **működik**. ⭐ A hang **a feladás előtt**
átkerül a ledgerbe (`~/.config/my-assistant/stt-ledger/`) ⇒ többé nem vesz el.
🔴 **De éles hangon még nem bizonyult:** a 19:00:58-as hangüzenete **1/5**-nél tart — a
ledger csak a **feladáskor** ír, tehát az igazolás az 5. bukott próba után jön.

⚠️ **Saját közeli hiba:** a `pending` „nincs”-ét és a doctor „1 hang vár”-ját **ellentmondásnak**
néztem, és majdnem defektként jelentettem. Két **külön szakasz** — a kód jó, a **szóhasználat**
félrevezető ⇒ **T-69**. ⭐ Az ellenőrzés **előbb**, a jelentés **utána**.

🔴 **Ami változatlanul nyitott:** az STT **5 percenként túllép** — ⛔ az FDP AI-hoz (38321)
nem nyúlunk. ⇒ A hangüzenetei továbbra sem értelmeződnek.

## 🔄 GÉP-ÚJRAINDÍTÁS UTÁN — 2026-09-08 21:05, elvégezve

Az owner újraindította a gépet. ⭐ **RAM 97 % → 58 %.**

| Mit | Állapot |
|---|---|
| `dc ldp` | ✅ **elindítva** saját ablakban (21:05) |
| Discord-figyelő | ✅ **kézi tartalékként felhúzva** (`ma comm listen`) — ⭐ **backfillel behozta** a leállás alatt érkezett üzenetet |
| Hang-csatorna | ✅ bent ül a `honnie-place`-ben |
| my-assistant szerver | ⏳ a pipeline **végén** indul — ez a `BFR-MYASSISTANT-001` lényege |

⚠️ **Amit ez megmutatott:** gépindítás után a csatorna **nem áll fel magától** — az LDP előbb
végigfuttatja a teljes pipeline-t, és a szerver *(vele a figyelő)* csak utána jön. Addig az
owner üzenetei **nem érnek el**. ⇒ A kézi `ma comm listen` **nem kényelmi lépés**, hanem a
napindítás része, amíg a make-before-break nincs meg.

## 🤝 Akiknek kiadtam

| Kinek | Mit | Állapot |
|---|---|---|
| **DEV** `ccs-d5027942-mtroz7ve` | hang-csatorna (T-22) | 630/630 zöld · ⚠️ a T-52-t késznek jelentette, de az owner **színes élő sávját** nem építette meg ⇒ visszanyitva |
| **FDP** `ccs-e4e4fadf-mtroyj33` | pénzügy + bérszámfejtés | ✅ **kész — a levél kiment 11:08:26**. Már csak GEOK válaszára vár (külső fél) |

⚠️ **Küldés előtt mindhárom kell:** `waiting-input` · `busy: false` · **ÜRES SOR**.

## ⚠️ Nyitott rendszer-gond

🟡 **`tsc-transplanted` PIROS** — `Buffer` → `BodyInit` típus-regresszió. ⭐ A kimenet **elkészül**
(`dist/cli/src/_modules/` megvan), tehát futásidőben nem hiányzik semmi. DEV-nek kiadva.


🔴 **LDP make-before-break** — `BFR-MYASSISTANT-001`, **critical**. A szerver gyakrabban indul
újra (**10,1 perc**), mint amennyi egy pipeline (**~15 perc**) ⇒ a Discord-csatorna sokat halott.
