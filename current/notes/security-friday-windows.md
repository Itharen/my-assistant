# 🔍 FELTÁRANDÓ — „péntekenként maguktól megnyílnak konfidenciális doksik/ablakok"

> **Owner, 2026-09-12 03:27 (hangcsatorna, szó szerint):** *„Valami nagyon érzékelnek. **Mindig
> péntekenként** valahogy olyan **doksik, ablakok nyílnak meg, amik konfidenciál[isak]**. Mindig
> az az érzésem, hogy péntekenként **megtámadnak a hackerek**. Mert tudják, hogy péntekenként
> bulizok. Meg **paranoiás is vagyok. Na jó, nem.** Csak mindegy, azért **nem lenne rossz építeni
> security-t**."*

🔴 **Státusz: `🔍 FELTÁRANDÓ`** *(`uncertain-requests`)* — ⛔ **nem építünk rá semmit**, amíg nem
tudjuk, mi történik. De ⛔ **nem is söpörjük le**: ő maga viccelte el *(„na jó, nem")*, és **pont
az ilyet szokás lekicsinyelni**.

---

## ⚠️ MIÉRT NEM SZABAD SEM PÁNIKOLNI, SEM LEGYINTENI

**Két rossz reakció van**, és mindkettő gyakori:

| ⛔ Rossz | Miért |
|---|---|
| *„hackertámadás, azonnal cselekedj"* | **nincs rá bizonyíték**, és hajnali 3-kor riasztani egy ünneplő embert **kárt okoz** |
| *„á, csak paranoia"* | a megfigyelés **ismétlődő** és **konkrét** *(péntek, konfidenciális doksik)* — ⛔ az ismétlődés nem paranoia-jel |

---

## 🧩 A HIPOTÉZISEK — ⛔ egyik sem tény, mind MÉRENDŐ

| # | Hipotézis | Miért PONT péntek? | Hogyan mérhető |
|---|---|---|---|
| 1 | ⭐ **A saját agentjeink nyitnak meg fájlokat** *(CCAP-agent, DEV, én)* | pénteken **nem figyeli** a gépet, ezért **feltűnik** — más napokon ő maga is nyitogat | action-log + a CCAP-session-ök napló-ideje |
| 2 | **Vendég / kontroller** — a gép **tévére van kötve**, mások is nyúlnak hozzá *(owner, 03:15)* | ⭐ **pénteken vannak vendégek** | nincs közvetlen nyom; időbeli egybeesés |
| 3 | **Ütemezett feladat / frissítés** | ha **heti** ütemezésű, épp péntekre eshet | Windows Feladatütemező |
| 4 | **Tényleges illetéktelen hozzáférés** | — | ⛔ **utolsóként vizsgálandó**, ⚠️ de nem kizárva |

📌 **Az 1. a legvalószínűbb, és pont ezért a legfontosabb kizárni:** ha **mi** nyitunk meg
konfidenciális doksikat, az **saját magunk okozta** biztonsági zaj — és ez **javítható**.

---

## A KÖVETKEZŐ LÉPÉS — ⛔ NEM „security-t építeni"

> ⚠️ *„nem lenne rossz építeni security-t"* — ⭐ **igaza van, de ez nem EGY feladat.** Egy
> általános „security" projekt **soha nem kezdődik el**. ⇒ **Egy** mérhető kérdéssel kezdünk:

```
Melyik folyamat nyitotta meg az ablakot, és mikor?
```

**Amit tőle kérek majd (⛔ nem most, hanem ébren):**
- 🗒️ **Egy konkrét példa**: melyik doksi / ablak, körülbelül mikor
- ⏰ Valóban **csak** péntek, vagy máskor is *(csak akkor veszi észre)*?

**Amit addig ÉN teszek:** az **1. hipotézist** kizárom vagy megerősítem a saját naplóinkból —
⛔ ez **nem igényel tőle semmit**.

Kapcsolódó: [[uncertain-requests]] · [[private-topics-and-audience]] ·
`current/principles/ldp-default-runtime.md`


---

## 📊 ELSŐ MÉRÉS — 2026-09-12 03:42

**Amit megnéztem:** az összes eddigi **péntek** az `__agent/log/actions/*.jsonl`-ben, olyan
bejegyzésre szűrve, ami dokumentum-/ablak-nyitásra utal *(`start-process`, `megnyit`, `explorer`,
`.pdf`, `.docx`, `.xlsx`, `notepad`)*.

**Eredmény:** ⬜ **NINCS TALÁLAT.**

### ⚠️ ÉS EZ MÉG NEM ZÁRJA KI AZ 1. HIPOTÉZIST

🔴 **„Nincs nyom az én naplómban" ≠ „nem történt meg".** Amit ez a mérés **nem** fed le:

| Nem fedi | Miért |
|---|---|
| a **CCAP-agent** a VMware-ben | ⛔ **más gépen/VM-ben** fut, ⛔ nem ebbe a naplóba ír *(owner, 03:13)* |
| a **DEV-session** műveletei | a saját CC-naplójába ír, ⛔ nem feltétlenül ide |
| minden, ami **nem hook-olt** tool-on át történt | a napló a **wired** eszközöket rögzíti |

⇒ **Helyes megfogalmazás:** *az **én** action-logom szerint **én** nem nyitottam dokumentumot
pénteken.* ⛔ Ennél többet **nem** állíthatok.

*(Pont az a hibafajta, amit ma háromszor elkövettem: az adat igaz, a hatóköre szűkebb, mint
amire következtetni csábít — `post-development-verification`.)*

### A KÖVETKEZŐ MÉRÉS — ha ő ad egy konkrét példát

Egy **konkrét fájlnév + hozzávetőleges időpont** elég ahhoz, hogy a **Windows** oldalán nézzünk
utána *(utolsó megnyitás, melyik folyamat)*. ⛔ Enélkül a keresés **iránytalan**.
