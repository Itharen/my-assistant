# ✍️ LinkedIn POSZT-piszkozatok

> ⚠️ **Ez a mappa a RENDSZER-SZERZŐDÉST írja le** *(mit olvas a panel, milyen alakban)*.
> 🔴 **A poszt SZÖVEGÉNEK szabályai NEM itt vannak:** `current/principles/linkedin-post-writing.md`
> — azok az **owner/asszisztens** szabályai. A DEV a **felületet** adja, ⛔ a szöveget nem írja
> és nem módosítja.

## Két fájl piszkozatonként — a bevett alak

| Fájl | Mi | Kinek |
|---|---|---|
| `<azonosító>.body.txt` | 🔴 **PONTOSAN az a szöveg, ami kimegy.** Semmi más: se fejléc, se magyarázat | a **rendszernek** — ezt jeleníti meg és ezt másolja vágólapra |
| `<azonosító>.md` | az **indoklás**: miért így, mi vár döntésre | az **ownernek** *(a panelen a „miért így szól" alatt)* |

⭐ **Azonosító:** `ÉÉÉÉ-HH-NN-<rövid-cím>` *(pl. `2026-09-12-agentic-dev-limits`)*. A panel a
**dátum szerint** rendez, a legfrissebbet előre.

⚠️ **A `.md` NEM kötelező** — `.body.txt` önmagában is érvényes piszkozat *(csak nincs
indoklása)*. ⛔ Fordítva nem: indoklás **szöveg nélkül** nem poszt, azt a panel nem is látja.

## Ahol megjelenik

```
A My Assistant felületén:  LinkedIn posztok        (/linkedin/posts)
```

Posztonként: a **teljes szöveg** másolható dobozban · **karakterszám / 3 000** · a
**túllógás jelzése** *(⭐ a beillesztés ELŐTT)* · **„kiposztoltam" pipa**.

## ⛔ Amit a rendszer NEM tesz meg

⛔ Nem küld ki semmit *(a LinkedIn API **csak olvas**)* · ⛔ nem ütemez · ⛔ nem generál képet ·
⛔ nem szerkeszti és nem „szépíti" a szöveget.

⇒ A kiküldés **kézzel** történik, és **owner-kapu**. A kiküldött posztot utána az archiváló
viszi a `current/linkedin/posts/` alá *(`python scripts/linkedin-archive.py`)*.

## ⚠️ MIÉRT KÜLÖN MAPPA — és ⛔ miért NEM a `drafts/`

A szomszédos `current/linkedin/drafts/` **üzenet-válaszokat** tartalmaz *(thread-hez kötve)*, és
azokban **óradíj és telefonszám** is van. 🔴 Egy „posztok" panelen megjeleníteni őket ⛔ nem
elírás, hanem **adat a rossz felületen**. ⇒ A posztok külön mappában élnek, ugyanezzel a
két-fájlos alakkal.

📌 Részletek + a teljes mérés: `__documentations/dev/LINKEDIN_POST_DRAFTS.md`.
