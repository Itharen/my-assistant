# 📍 ÁLLAPOT MOST — a rövid, MINDIG teljesen elolvasható belépő

> 🔴 **EZT OLVASD ELŐSZÖR.** Szándékosan **2 kB alatt** marad, hogy **soha ne csonkolódjon**.
> A részletes történet: `__agent/CONTINUATION.md` *(148 kB — oda csak célzottan, `grep`-pel)*.
>
> ⚠️ **MIÉRT LÉTEZIK (mérve 2026-09-08):** a `CONTINUATION.md` akkorára nőtt, hogy **a saját
> horgonyomat sem találtam meg benne**, és egy csonkolt előnézet **a fejlécnél elakad**. Ugyanez
> történt az `AGENT_BUS.md`-nél: `tail`-lel néztem, és **tévesen jelentettem**, hogy az FDP
> asszisztens nem válaszolt. ⇒ A nagy fájl **nem hiba, de nem is belépő**.

**Frissítve:** 2026-09-08 09:05

## Ma

**2026-09-08, kedd — AI Summit 2. nap.** Az owner ~02:17-kor feküdt le.
A kész terv: `current/events/2026-09-08-summit-day2-plan.md`.

## 🙋 AMI RÁ VÁR — ez a legfontosabb lista

1. 📅 **Mikor indul?** — ÉBREDÉS-RELATÍV tábla kiment (09:45 a váltó). Eredetileg: — három érv a későbbi mellett: kifáradás · a 8–9 pontos tételek mind
   14:00 után · **az előadások visszanézhetők**
2. ✉️ **Mehet a bérszámfejtés-levél?** *(az ő saját, rövidebb szövege)*
3. 🗂️ **Napi matrac** napi ismétlődőre? · NZT és OGS kivezethető? · dátumok: **Üzemorvos 09-15**,
   **Interfood 09-10**
4. 📧 **Belenézhetek a postafiókba?** *(feladó + tárgy + darabszám, tartalom nélkül)*
5. 📱 **Helyzet-app v1** — belevágjunk? *(Capacitor, saját app)*
6. 👤 **A GPT-s infócsomagja magáról** — várom, emlékeztetni kell rá
8. ⚠️ **A `dc ldp` kérdés VISSZAVONVA** — a „build vitte el a beszélgetést" állításom **megalapozatlan** volt: a kiesést **sosem mértem**, és nincs is rá napló-esemény. *(A sorrend amúgy **Dynamo-kód**, nem helyi konfig — a `serverRestart` csak `enabled` + `postPipelineCommand`.)*
7. 🔓 **Képesség-jóváhagyás** — ⚠️ **25 ⏳ / 1 ✅**: az üresjárati sávom gyakorlatilag ÜRES.
   Javasolt hármas: **C-13** feladat-kezelés · **C-10** státusz-kivonat · **C-19** alvás-ciklus

## 🤝 Akiknek kiadtam

| Kinek | Mit | Állapot |
|---|---|---|
| **DEV** `ccs-d5027942-mtroz7ve` | hang-csatorna (T-22) | 630/630 zöld · ⚠️ a T-52-t késznek jelentette, de az owner **színes élő sávját** nem építette meg ⇒ visszanyitva |
| **FDP** `ccs-e4e4fadf-mtroyj33` | pénzügy + bérszámfejtés | kész — a levél jóváhagyásra vár |

⚠️ **Küldés előtt mindhárom kell:** `waiting-input` · `busy: false` · **ÜRES SOR**.

## ⚠️ Nyitott rendszer-gond

🔴 **LDP make-before-break** — `BFR-MYASSISTANT-001`, **critical**. A szerver gyakrabban indul
újra (**10,1 perc**), mint amennyi egy pipeline (**~15 perc**) ⇒ a Discord-csatorna sokat halott.
