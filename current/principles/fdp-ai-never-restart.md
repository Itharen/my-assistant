# ⛔ HARD RULE — az FDP AI szolgáltatáshoz SOHA nem nyúlunk

> **Owner, 2026-09-07 09:10 — SZÓ SZERINT:**
>
> *„Ne indítsd újra az FDP AI szolgáltatást! Ahhoz soha ne nyúlj!"*

---

## Mit tilt

⛔ **Újraindítás · leállítás · elindítás · folyamat kilövése · konfiguráció módosítása ·
modell ki-/betöltése · bármilyen állapot-változtató hívás** az FDP AI szolgáltatáson
(`ccap/speech-recognition`, port **38321**).

Ez **nem** függ attól, hogy
- épp „beragadtnak" látszik,
- én mit gondolok az okáról,
- mennyire kényelmetlen a várakozás,
- mennyire biztos vagyok benne, hogy segítene.

⚠️ Ide tartoznak a **látszólag ártalmatlan** karbantartó végpontok is:
`POST /api/models/unload` · `/api/models/unload-all` — ezek is **állapotot változtatnak**.

## Mi MARAD szabad

✅ **Olvasás / lekérdezés:** `GET /api/health` · `/api/ready` · `/api/diagnostics` ·
`/api/endpoints`, és maga a **használat** (`POST /api/recognition` egy hangfájllal).
A felismerés kérése nem „hozzányúlás" — az a rendeltetése.

## Miért

- **Nem a mi projektünk.** A `my-assistant` **fogyasztója** ennek a szolgáltatásnak, nem
  gazdája. *(Ugyanaz a határ, mint az organizernél: FR-t nyitunk, nem a kódhoz nyúlunk.)*
- **Az owner eszköze, más munka is fut rajta.** Egy újraindítás nála szakít félbe valamit,
  amiről én nem tudok — a költséget nem én viselem, tehát a döntés sem az enyém.
- 🔴 **A „beragadt" diagnózisom HIBÁS VOLT.** A GPU-t mértem (5%), és ebből következtettem
  zárolásra. A valódi ok a **rendszer-RAM 93%-a** volt — a szolgáltatás **várakozott**, nem
  akadt el. Ha újraindíthattam volna, **kárt okozok egy nemlétező hibára**.
  *(Mérés: `__documentations/dev/FDP_AI_STT.md` §3.4.)*

## Mit csinálj helyette, ha lassú vagy nem válaszol

1. **Mérd meg a rendszer-RAM-ot** — 90% fölött a szolgáltatás vár (owner-információ, mérve).
2. **Nézd meg** a `GET /api/health` és `GET /api/ready` állapotot *(olvasás, szabad)*.
3. **Várj, vagy próbáld újra** — a bemelegedett modell gyors *(93% RAM: 5 perc → 77,6 mp)*.
4. Ha memóriát kell felszabadítani: **szólj az ownernek**, melyik folyamat eszi
   *(mérve: vmware 27,7 GB · WSL 13,7 GB · node 12,8 GB)* — ⛔ **te ne zárj be semmit.**
5. Dolgozz addig máson. ⛔ A várakozás **nem indok** a szabály megszegésére.

## Kapcsolódó

- `__documentations/dev/FDP_AI_STT.md` — a mért szerződés + a RAM-függés
- [[no-paid-solutions]] — ezért is a saját, helyi szolgáltatást használjuk
- `cli/src/stt/stt.client.ts` — a timeout `remedy` szövege erre a sorrendre vezet rá
