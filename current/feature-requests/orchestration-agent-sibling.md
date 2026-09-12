# 🤝 FR — Egy MÁSODIK agent: az ORKESZTRÁCIÓS társ

> **Owner, 2026-09-12 22:01 (gépelve, ⛔ nem hang):** *„Kéne majd tervezni, meg csinálni egy olyan
> **hozzád hasonló agentöt**, aki az **orkesztrációs feladatokban** segít nekem, ami úgy működik,
> mint ahogy te, tehát ilyen **Discord-os kommunikációs**, de vele mindenféle **agent-orkesztrációs
> és munka-feladatot** fogok átbeszélni."*

**Státusz:** `🔵 felvéve` · ⛔ **nincs megkezdve** — ⚠️ ez **tervezési** feladat, nem kódolási

---

## ⭐ EZ EGY RÉGI FESZÜLTSÉGET OLD FEL

📌 Az `assistant-identity.md` szerint **az orkesztráció NEM jóváhagyott képességem** — miközben
2026-09-10 óta **mégis** én vezénylem a DEV-et, **külön owner-engedéllyel**, kivételként.

⇒ **Ez az FR a kivételt szünteti meg:** az orkesztráció **kapjon saját gazdát**, és maradjak az,
ami a szerepem — a **személyi asszisztens**.

| | **Én** *(Honnie)* | **Az új társ** |
|---|---|---|
| domén | 🌗 **élet** + a my-assistant rendszer | 🤖 **agent-orkesztráció** + munka-feladatok |
| kivel beszél | az owner | az owner **és** a többi agent |
| csatorna | Discord | Discord *(ugyanaz a minta)* |

---

## 🔴 A LEGFONTOSABB TERVEZÉSI KÉRDÉS — ⚠️ nem a kód

**Ami engem működővé tesz, az ⛔ NEM a kód, hanem a felhalmozott SZABÁLY.** Ma **55** fájl van a
`current/principles/`-ben — és a nagy részük **egy-egy konkrét hibából** született *(csak ezen a
hétvégén: ébredés utáni ablak · visszakérdezés · a számláló nem jelentés · a handoff nem kiadás ·
magántéma-közönség · nyitott mikrofon)*.

🔴 **Egy nulláról induló agent MINDEN hibát újra elkövetne.** ⇒ **A fő kérdés:**

```
Megosztott szabály-készlet?   VAGY   sajátot épít magának?
```

| | ⭐ Megosztott | Saját |
|---|---|---|
| előny | ⭐ **nem ismétli meg a hibáinkat** · egy helyen javul | a domén-specifikus szabályok **tisztábbak** |
| hátrány | sok szabály **rá nem vonatkozik** *(alvás-ciklus, bevásárlás)* | ⛔ **hónapok**, mire eljut oda, ahol most vagyok |

💡 **Az én javaslatom** *(⛔ nem döntés)*: **KÖZÖS mag + saját réteg.** A mag az, ami **bármely**
agentre igaz *(no-guessing · a számláló nem jelentés · a handoff nem kiadás · mérj, ne tippelj)*;
a réteg a domén. ⚠️ **A mag KIVÁLASZTÁSA maga is munka** — ⛔ nem „másoljuk át a mappát".

---

## ⚠️ AMIT MÁR MÉRTEM, ÉS A TERVEZÉSBE TARTOZIK

| Tanulság | Honnan |
|---|---|
| 🔴 **két session ugyanabban a workspace-ben ütközik** | a `git commit` az **egész indexet** rögzíti · `npm test` **elviszi a `dist`-et** a futó rendszer alól |
| 🔴 **a szerep-váltó nélkül összekeverednek** | a `CLAUDE.md` egy ideig **feltétel nélkül** azt mondta mindenkinek, hogy ő Honnie |
| 🔴 **az üzenet-útvonalat RÖGZÍTENI kell** | 2026-09-08: az owner üzenetei **6 órán át a DEV-hez** mentek |

⇒ **Egy harmadik szereplő ezt a három kockázatot MEGHÁROMSZOROZZA.** ⭐ A `session-roles.json` +
a `message-routing-must-be-pinned` **előfeltétel**, ⛔ nem utólagos finomítás.

---

## 🙋 AMI OWNER-DÖNTÉST IGÉNYEL

1. **Közös mag vagy külön szabály-készlet?** *(a fenti fork)*
2. **Külön Discord-csatorna**, vagy ugyanaz? ⚠️ Ha ugyanaz, a **routing** eldöntendő
3. **Mikor?** — ⛔ ez **nem** a jövő hét három iránya közül való; ⭐ de a **rendszer-kiadás**
   irányt közvetve segítené

Kapcsolódó: [[assistant-identity]] · [[dev-session-supervision]] ·
[[message-routing-must-be-pinned]] · [[shared-file-collision]] · [[system-components]]
