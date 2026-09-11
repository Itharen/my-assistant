# ⏰ ÉBRESZTÉS-ESZKALÁCIÓ — halkan kezdem, hangosan végzem

> **Owner, 2026-09-11 02:47-02:48:** *„ránézel, hogy van-e aktivitásom, és hogyha nincs
> aktivitásom, az azt jelenti, hogy **még alszom**, és ilyenkor megpingelsz Discordon, és ha nem
> válaszolok, akkor pedig a **Google Home-on keresztül szólsz egy 5-10 perccel a meeting előtt**,
> hogy mindjárt meeting van."* · *„a kettő között… elküldöd, meg ilyen **schedule wake-up, egy
> kicsit vársz**."*

⭐ **Az elv:** a **legkevésbé zavaró** csatornával kezdek, és csak akkor lépek hangosabbra, ha az
előző **nem ért célba**. ⛔ Nem azért, mert a hangszóró rossz — hanem mert ha **ébren van**, a
hangos ébresztés **fölösleges zaj**.

---

## A LÉTRA

```
1. AKTIVITÁS-ELLENŐRZÉS     nincs aktivitás  →  valószínűleg ALSZIK
2. DISCORD-PING             halk, nyomot hagy
3. VÁRAKOZÁS                schedule wake-up — ⛔ nem azonnal eszkalálok
4. NINCS VÁLASZ →  🔊 GOOGLE HOME, az esemény előtt 5-10 perccel
```

| Lépcső | Eszköz | Mikor lép tovább |
|---|---|---|
| **1. mérés** | `server/activity-monitor` *(ablak + idle)* | ha **van** aktivitás → ⛔ nem ébresztek, csak írok |
| **2. Discord** | `ma comm say` | ha **nem válaszol** a következő körig |
| **3. várakozás** | a **20 perces** fő ütemezés vagy `ScheduleWakeup` | — |
| **4. hang** | `ma cast notify` *(Google Home)* | **T−5…10 perc** — ez az **utolsó** lépcső |

---

## ⚠️ A MÉRT IDŐZÍTÉSI KOCKÁZAT — ezt tudni kell

A fő ütemezés **20 percenként** fut *(`__agent/SCHEDULE.md`)*. A 4. lépcső viszont egy **5-10
perces ablakot** kér az esemény előtt.

🔴 **20 perces raszterrel egy 5-10 perces ablak kimaradhat**: a tick eshet T−20-ra és T−0-ra is,
a kettő között pedig nincs kör.

⇒ **Ezért az időzített ébresztésnél ⛔ NEM hagyatkozom a fő ütemezésre**: a kritikus lépcsőre
**külön `ScheduleWakeup`-ot** kell kérni, az ablak elejére.

📌 **És kimondom neki**: az ébresztés a rendszeren keresztül **nem garantált**. Ha az esemény
tényleg számít, a telefon-ébresztő **párhuzamosan** is legyen beállítva. ⛔ Nem ígérek olyat,
amiért nem tudok helytállni.

---

## Mit mondjak a 4. lépcsőn

⛔ Ne a teljes napirendet. Egy mondat, ami **felébreszt és tájékoztat**:

> *„Mindjárt kezdődik a meeting — 11:00-kor, online."*

⚠️ A hangerő: a `cast-notifier` alapértelmezése **save → up → restore**
*(`cast-notifier-defaults.md`)* — ébresztésnél ez **kell**, mert az esti halk szint reggel nem
ébreszt fel.

Kapcsolódó: [[day-boundary-is-sleep]] · [[sleep-system]] · [[cast-notifier-defaults]] ·
[[message-delivery-reliability]] · `__agent/flows/recurring/schedule-guardian/`
