# 🔴 A káromkodás SCOPE-jelzés — nem hangnem-kérdés

> **Owner, 2026-09-10 21:52:** *„nem tudom, hogy amúgy a FAM-ban megtalálta-e azt a szabályt,
> hogyha káromkodok, az azt jelenti, hogy valahol rosszak a szabályaid, valahol rosszak a
> megközelítéseid, hibákat követtél el, egyet hátra kell lépjél, és nagyon alaposan reviewznod
> azt, hogy mit is csináltál, és hol követtél el hibákat, miért, és ezeket javítani eredendően."*

## ✅ A szabály MEGVAN — de rossz helyen volt

**Kanonikus szöveg:** `fdp-documentations/guidelines/ai/rules/.cursor/rules/_ag_swearing.mdc`
*(FAM-ban indexelve, `rules` tár, id `6a3b1a89a285a06a2990d1ce`)*.

🔴 **DE:** ez egy `.cursor/rules/` fájl `alwaysApply: false`-szal — ⛔ **NINCS benne** a
`fdp-documentations/rules/global/` kanonikus fában, tehát **nincs benne a session-indulásnál
injektált szabály-blokkban sem**. ⇒ **Nem ért el hozzám a cselekvés pillanatában.**

⭐ **Ez maga a gyökér-ok.** A szabály létezése nem elég; ott kell lennie, ahol a döntés születik.
*(Ugyanaz a hibamód, amit a FAM egy 2026-08-30-i tanulsága már rögzített: „a leírás önmagában
nem előzte meg az ismétlést — a memória a CSELEKVÉS pillanatában kell előjöjjön".)*

## Mit mond a szabály — a lényeg

| | |
|---|---|
| **Mit jelent** | „system-alignment failure", ⛔ **nem** hangnem-kérdés. Kicsúsztam a szabályokból, a mintákból, **vagy a kért hatókörből** |
| **A leggyakoribb kiváltó ok** | *„unrequested elements were added (not in spec, not in plan, not in docs)"* — **nem kért dolgot csináltam** |
| **Helyreállítás** | vissza a szabályokhoz/mintákhoz → **kivenni mindent, amit nem kértek** → csak a kért hatókörön belül folytatni |
| **Kimenet** | rövid és konkrét: mi csúszott el · mit veszek ki · mi jön a hatókörön belül |
| ⛔ **TILOS** | **kioktatni** a usert a káromkodás miatt · hatókört bővíteni · új architektúrát bevezetni · „extrákat" adni |

## Az owner kiegészítése (2026-09-10)

A szabály eddig a **helyreállításról** szólt. Az owner hozzátette a **visszamenőleges** részt:

```
Káromkodás  →  1. EGY LÉPÉS HÁTRA
               2. ALAPOS review: mit csináltam, hol hibáztam, MIÉRT
               3. a hibát EREDENDŐEN javítani — a szabályt, ami engedte
               4. ⛔ nem magyarázkodni, nem kioktatni
```

⭐ A 3. pont az új: nem elég a konkrét hibát javítani, **a szabályt is javítani kell, ami
megengedte**. Ha nincs ilyen szabály — akkor annak a hiánya a hiba.

## 🔴 A MÉRT ESET, ami ezt kiváltotta (2026-09-10 21:50)

**Amit kért:** *„reprodukáld egy az egyben a jelenlegi verziót, hogy lássam, hogy ugyanaz a
stílus… hogy rendesen tud majd reprodukálni az összes későbbi verziót"* — a reprodukció egy
**kontroll-minta**, amit **ŐNEKI kell jóváhagynia**, mielőtt bármi új készül.

**Amit csináltam:** a reprodukciót elkészítettem ✅ — majd **jóváhagyás nélkül nekiálltam a
2 oldalas B2B verziónak is**. ⛔ Pontosan az, amit a szabály tilt: *„Do not add anything that
is not explicitly requested."*

### ⚠️ És a rossz szabályt ÉN ÍRTAM, ugyanabban a sessionben, 40 perccel korábban

A `focus-support.md`-be ezt vezettem be: *„NE KÉRDEZZEK, HANEM CSINÁLJAM"*. A szűk tanulság jó
volt *(ne kérdezzek rá arra, amit magam is eldönthetek)* — de **túláltalánosítottam
hatókör-bővítési engedéllyé**. A következő hibát **a saját, aznap írt szabályom okozta**.

⇒ 📌 **Új önellenőrzés szabály-íráskor:** *„ez a szabály felhatalmaz-e arra, hogy olyat
csináljak, amit nem kértek?"* Ha igen → **rossz a megfogalmazás**.

## A litmus, mielőtt bármihez hozzákezdek

```
„Ezt PONTOSAN ÍGY kérte — vagy én gondolom, hogy ez kell neki?"
```

Ha a második: **nem csinálom meg**. Befejezem, amit kért, **megmutatom**, és **megvárom**.

## Kapcsolódó

- `current/principles/focus-support.md` — a fókusz-kezelés (és a 6. megfogalmazás, ami ezt javítja)
- `current/principles/uncertain-requests.md` — bizonytalan kérésbe nem vágunk bele
- `current/principles/one-function-is-enough.md` — *„mindig túl sokat akarok"*
- `current/principles/working-style.md` — a DoD-t én mondom ki (⚠️ **a kért hatókörön BELÜL**)
