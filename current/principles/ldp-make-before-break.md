# A szolgáltatás NEM állhat le a build alatt — make-before-break

> **Owner, 2026-09-08 (szó szerint):**
>
> *„Fontos lenne, hogy az LDP futása tesztjei, buildjei alatt ne állítsuk le a szervert, hanem
> végig fusson, és csak akkor állítsuk le, amikor már újraindítanánk az új verziót."*

---

## A szabály

⛔ **A régi példány addig szolgál ki, amíg az új TÉNYLEG indulhat.** A leállítás **nem** a
ciklus elején van, hanem a **cseréig** kitolva — build és teszt alatt a szolgáltatás **él**.

Ez általános elv, nem LDP-specifikus: bármilyen újraépítés/újratelepítés során az a helyes
sorrend, hogy **előbb kész az új, aztán megy el a régi**.

## 🔴 Miért — mért következmény

A régi (leállítás-előbb) viselkedés mellett:

| Mérés | Érték |
|---|---|
| Szerver-újraindítás egy nap alatt | **38** *(ebből 20 egyetlen 3,2 órás ablakban)* |
| Átlagos ciklus-köz | **10,1 perc** |
| Egy teljes pipeline hossza | **~15+ perc** |

⇒ A szerver **gyakrabban indult újra, mint amennyi idő egy körhöz kell** — az idő nagy részében
**halott** volt.

**És nem elméletben fájt.** 2026-09-08:

```
08:52:29  bent vagyunk a hang-csatornában
08:53:58  felvétel indul — az owner beszél
08:56:58  ÚJ PIPELINE INDUL → a szerver leáll → kiestünk
```

⇒ **Egy élő beszélgetés veszett el**, pont amikor a rendszer azt csinálta volna, amiért készült.

⚠️ **A legrosszabb tulajdonsága: CSENDES.** A pipeline végig **zöld**; semmi nem mondja, hogy
közben a szolgáltatás nem elérhető.

## ⭐ A tanulság, ami túlmutat ezen az eseten

**A képesség MÁR LÉTEZETT** a `dc ldp`-ben — csak mi a **legacy** ágon voltunk. Hónapokig egy
**meglévő** megoldás hiányzott, nem egy megépítendő.

📌 **Ezért:** mielőtt „ezt a másik repóban kellene megcsinálni"-ra jutsz, **olvasd el annak a
repónak a konfigurációs felületét**. A gyors, sűrű commit és az élő használat ütközése itt nem
új fejlesztést igényelt, hanem **négy sor konfigurációt**.

*(Az én korábbi következtetésem — „ez a `dc`-ben van, nem tudunk hozzányúlni" — **téves volt**:
a `dc`-hez tényleg nem nyúltunk, de a megoldás a **saját** configunkban volt.)*

## Hol van megvalósítva

`.dynamo/pipeline.config.json` → `serverRestart.entry` *(detached ág: adoption + kill-twin +
heartbeat)*, `env.NODE_OPTIONS = "--import tsx"`.
A mérések és a buktatók: `__documentations/BEDROCK-FRS-RESOLVED.md` → BFR-MYASSISTANT-001.

## Kapcsolódó

- `current/principles/ldp-default-runtime.md` — az LDP a default futtatási mód
- `current/principles/post-development-verification.md` — a zöld jelzés ≠ működő rendszer
- `current/principles/message-delivery-reliability.md` — a kiesés alatt küldött üzenet elvész
