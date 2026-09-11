# 🔀 Megosztott fájl: MÁS AGENT IS ÍRHATJA — a szerkesztés előtt tudni kell róla

> 🔴 **Mérve 2026-09-11 00:08–00:12.** Az owner egy CV-javítást kért. Ugyanazt a három javítást
> **két agent** kezdte el, **ugyanabban a fájlban** *(`current/cv/build/cv-10.html`)*, percre
> egyszerre. A fájl néhány percig **félig az egyikünk, félig a másikunk** verzióját tartalmazta:
> az 1. oldal az én `<div class="sub-head">`-jeimmel *(amikhez a CSS még nem volt kész → stílus
> nélküli, 45pt-tal rövidebb oldal)*, a 2. oldal a másik agent `<h3 class="entry__role">`
> megoldásával.

---

## ⛔ A hibamód: NEM ütközés-hibát kapsz, hanem NÉMA KEVEREDÉST

A fájlrendszer **nem szól**. Nincs lock, nincs konfliktus-jelzés, nincs merge-marker. Az utolsó író
**nyer**, a másik munkája **eltűnik vagy felemás állapotban marad** — és a következő mérés már a
**kevert** fájlt méri, tehát a **mérés is hazudik**.

⚠️ **A saját `read → módosít → ír` ciklusom sem atomi:** a beolvasás és a kiírás között a másik
agent írhatott. Én pontosan ebbe futottam bele: a `grep`-em még a régi szerkezetet mutatta, a
20 másodperccel későbbi `cp`-m már a másik agent átalakított 2. oldalát mentette.

---

## ✅ A PROTOKOLL

### 1. Szerkesztés ELŐTT — észlelés

| Mit | Hogyan |
|---|---|
| Fut-e más session | `ListAgents` |
| Nyúlt-e valaki a fájlhoz | `__agent/log/actions/<ma>.jsonl` — ⭐ **a `summary`-ben lévő tool-leírás árulkodó:** ha egy Bash-lépés leírását **nem én írtam**, akkor nem is én futtattam |
| Mikor módosult | `ls --time-style=full-iso <fájl>` a szerkesztés előtt **és** után |

### 2. Szerkesztés KÖZBEN — mtime-őr

```python
m0 = os.path.getmtime(p); s = read(p)
...  # modositas
assert os.path.getmtime(p) == m0, 'KOZBEN MODOSULT — nem irok bele'
write(p, s)
```

⛔ Ha az `assert` bukik: **ne írj**. Az egész kör újrakezdendő a friss tartalommal.

### 3. Ha már megtörtént — SAJÁT KÁRT VONJ VISSZA, az övét NE

⭐ **Ez a lényeg.** A reflexem az volt, hogy „állítsuk vissza az egészet" — az **letörölte volna a
másik agent munkáját is**. A helyes lépés: **csak azt a blokkot** állítom vissza, amit **én**
rontottam el, a `git show HEAD:<fájl>`-ból, blokk-cserével:

```python
head = git_show('HEAD:current/cv/build/cv-10.html')
cur.replace(my_broken_block, head_block, 1)     # a masik agent blokkja ERINTETLEN
```

Utána `git diff --stat` — a maradék változás **kizárólag** az övé legyen.

### 4. Aztán: EGY GAZDA

⛔ Két agent **nem viheti párhuzamosan** ugyanazt a fájlt. Meg kell egyezni, ki viszi végig
*(`SendMessage`)*, és a másik **átadja a méréseit** — azok nem vesznek kárba, csak nem ő írja be
őket. **Az ownernek is szólni kell**: ő indított két szálat ugyanarra, ez az ő döntése.

---

## 📌 Mikor élesedik ez

Minden **közös munkafájlnál**: a CV-build, a `cli/` forrás, a `__agent/` doksik, a `current/`
alapelvek. ⚠️ Ugyanez az oka a `git add -A` tilalmának megosztott workspace-ben — csak ott a
**commit** keveri össze a két munkát, itt maga a **fájl**.

Kapcsolódó: [[dev-session-supervision]] · [[message-routing-must-be-pinned]] · [[ssot]]

---

## 🔴 A VALÓDI OK MEGVAN — a `git add` szűk, a `git commit` NEM (mérve 2026-09-11 06:05)

> **DEV, 2026-09-11 04:19:** *„A munkám **három** commitból az **asszisztens session**
> commitjaiba került be *(`be95eb6`, `9d3ff7d`, `148b927`)*… ⇒ 🙋 **a valódi megoldás a te
> oldalán van: explicit fájllista a `git add`-nál.**"*

⚠️ **A diagnózis fele volt igaz — és pont ezért nem szűnt meg a hiba.** ⛔ **Nem** `-A`-val
stage-eltem: **végig explicit fájllistát** adtam. A rés a **másik** parancsban volt:

```bash
git add <az-én-fájlom>     # ✅ ez tényleg csak az enyém megy az INDEXBE
git commit -m "..."        # 🔴 DE EZ AZ EGÉSZ INDEXET COMMITOLJA — a MÁSIK AGENT fájljait is
```

⭐ **A tanulság általánosabb, mint a git:** **két szűk lépés nem ad szűk eredményt**, ha a
második lépés **hatóköre tágabb**. A `git add` fájl-szintű, a `git commit` **index-szintű**.
Az „explicit fájllistát adtam" érzés **hamis biztonság** volt.

### ✅ A RECEPT — pathspec-korlátos commit

```bash
git add <útvonalak>
git commit -m "..." -- <UGYANAZOK az útvonalak>      # ⭐ a `--` után CSAK ezeket rögzíti
```

⛔ **A `git commit -m "..."` önmagában TILOS ebben a workspace-ben.** A `-- <útvonal>` alak
akkor is helyesen működik, ha közben **más agent** stage-elt — az ő tartalma **az indexben
marad**, nem jön velem.

📌 **Ami már megtörtént, azt nem javítjuk visszamenőleg:** a tartalom **helyes**, HEAD-ben van,
pusholva, a tesztek zöldek — csak a **commit-üzenet** félrevezető. A history átírása
*(`core-always-master`, force-push tilalom)* **nagyobb kár**, mint egy pontatlan üzenet.
