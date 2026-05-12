# Cast-notifier defaults

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel.
>
> Operacionális preferenciák a `cli/` `cast` subcommand-csoporthoz (volt `cast-notifier/`). Nem általános
> alapelvek, hanem konfigurációs default-ok — élő dokumentum, ahogy a felhasználás
> tapasztalata finomítja.

---

## 2026-05-07 — initial defaults declaration

> Lehetőleg írjuk fel azt is, hogy általában a default az az all speakers
> legyen a bemondásokhoz.
>
> Alapvetően mindig Spotify-t fogunk használni a zenelejátszásokhoz.
>
> Mindegyik eszköz más és más hangerőkre van beállítva, és ez jó és fontos.
> Szóval, hogyha állítgatjuk a hangerőket, oda és vissza, akkor nagyon fontos
> előtte mindig megnéznünk, hogy melyik eszköz milyen hangerőre van állítva,
> hogy arra visszaállíthassuk utána. Valamint a bemondás előtt felhangosítani
> kéne mindent, nem levalkítani, hogy jól hallhatunk, és jól érthető legyen
> a bemondás.
>
> Jelenleg egy női hang a TTS, lehetne férfi hang helyette. Wolamenty.
>
> A zenét is oldspeakeren játszuk, szóval ha véletlenül megszakítod, akkor
> nem egy eszközre kell visszarakni azt is, hanem mindenre. Esetleg az talán
> segíthet, hogy van egy rutinunk a zene elindítására, vagy folytatására a
> Play Music parancs.

---

## Strukturált összefoglaló (assistant-jegyzet, NEM a user szavai)

### Default target

- **`All Speakers`** Cast Group a default a bemondásokhoz, hacsak explicit nem
  kerül megadásra `--target` a CLI-n.
- Speciális use case-ek célzott target-tel:
  - Bedtime push → **`Sleep Monitor`** (Nest Hub a hálószobában)
  - Konyhai recurring task → `KitchCom`
  - Fürdéssel kapcsolatos → `BathCom`

### Hangerő-kezelés (a duck nem-pattern)

A duck (lehalkítás) **NEM** a megfelelő pattern. **Felhangosítás** kell:

1. **SAVE**: minden érintett eszköz (Group esetén: a Group + minden tagja) jelenlegi
   `level` és `muted` state-jét lekérdezzük és elmentjük
2. **UP**: a bemondáshoz **felhangosítjuk** őket egy "announcement loudness"-re
   (default: 0.6, később finomíthatóan)
3. **PLAY**: a bemondás
4. **RESTORE**: minden eszközt EXACT visszaállítunk a saját mentett szintjére

**Indok:** minden eszköz tudatosan be van állítva egy egyedi szintre (BathCom
halkabb, mert intim hely; Boomer hangosabb, mert nappali). Ezt **tisztelni kell**
— nem szabad felülírni. A bemondás idejére átmenetileg menjünk fel egy közös
"jól érthető" szintre, után precízen vissza.

### TTS hang preferenciája

- **Férfi hang** preferált (jelenleg női — Translate gTTS default magyar női hangja)
- Magyar nyelv (default `hu`)
- Cél: **`hu-HU-TamasNeural`** (Microsoft férfi neural HU hang) **ingyenes**
  endpoint-on (msedge-tts lib — Edge böngésző Read-Aloud feature publikus
  endpoint-ja, nincs API kulcs, no auth)
- Plan B ha az nem megy: Coqui XTTS v2 lokálban férfi reference voice-szal

### Music app

- **Spotify** a kanonikus music app.
- A user mindig Spotify-on hallgat zenét, többnyire az **All Speakers** Cast
  Group-on. Ezt veszi figyelembe minden flow:
  - Resume strategy: Spotify Web API alapú (egy egyszeri OAuth, aztán refresh
    token tárolva)
  - "Play Music" Google Home routine — a user említette, de **routine-ot
    HTTP-n keresztül programatikusan triggerelni 2026-ban nem lehet**
    (lásd `current/feature-requests/google-home-integration.md` follow-up
    research). Ez nem visszaesés a Spotify Web API-tól — utóbbi
    megbízhatóbb is.

### Resume target

- Ha a bemondás Cast Group-ot szakít meg (általában All Speakers), a resume
  **vissza ugyanarra a Group-ra** kell hogy menjen, nem egyetlen eszközre.

---

---

## 2026-05-07 (19:45) — KÖTELEZŐ szabály: minden bemondásnál

> Ezeknél az üzeneteknél mindig először le kell kérjük az összes volumot,
> azt rögzítéssel. és utána meg akkor újra kell indíteni a zenét, hogyha
> előtt el volt indítva.

### Kötelező lépések MINDEN notify hívásnál (nincs kivétel)

1. **Pre-snapshot — VOLUME**:
   - Lekérdezni az ÖSSZES érintett eszköz (target single OR group→members)
     jelenlegi `level` és `muted` állapotát
   - Elmenteni egy struktúrált rekordba (memory + opcionálisan log)

2. **Pre-snapshot — MUSIC**:
   - Lekérdezni az érintett eszközökön mi fut épp (Cast `getStatus().applications`)
   - Ha **Spotify** (`appId: 705D30C6` vagy `displayName: "Spotify"`) fut:
     - Lekérdezni a Spotify Web API `/me/player`-ből: current device, track URI,
       `position_ms`, `is_playing`
     - Elmenteni

3. **Hangerő UP** → bemondás → **Hangerő RESTORE** (per device exact)

4. **Post-resume — MUSIC**:
   - Ha a pre-snapshot szerint Spotify ment:
     - Spotify Web API `PUT /me/player` body `{ device_ids: [originalDeviceId], play: true }`
     - A Spotify Connect-en a saved device wake-upol és folytatja onnan ahol abbahagytuk
     - Ha eredetileg `is_playing: false` volt (csak betöltve, nem playing) → ne start-old el
   - Ha más app ment (YouTube Music, Plex, stb.) — V1 scope-ban **NEM** támogatott
     resume; csak naplózunk hogy "X app fut, resume nem implementált", és
     skip-eljük (a user manuálisan indíthatja vissza)

### Indok

- Volume save/restore: a user explicit kérése, minden eszköz egyedi szintje
  szándékos és tisztelendő.
- Music resume: a Cast `DefaultMediaReceiver` mindig átveszi a hangszórót
  (ld. `current/feature-requests/google-home-integration.md`), tehát a zene
  megszakad. A Spotify Web API-n keresztül azonban tudjuk a Spotify Connect
  állapotot wake-upolni — így a user érzékelése: "rövid bemondás, aztán
  folytatódott a zene".

### Mire NEM vonatkozik

- `--no-volume` flag explicit kikapcsolja a volume orchestrationt — de a
  music-snapshot/resume ettől függetlenül megy (ortogonális logika)
- `--host` direct mode discovery skip — itt a music detection sincs (nem tudjuk
  ki a target környezete); ez egy escape hatch, dokumentálni kell

### Failure modes

- Spotify auth hiányzik / lejárt → log warn, skip resume, bemondás megy normál
- Pre-snapshot hibázik egy eszközön → folytatjuk, naplózzuk
- Restore/Resume hibázik → naplózzuk, de a flow `ok: true` marad ha a play
  sikerült (a primary cél a bemondás kézbesítése)

---

---

## 2026-05-07 — Per-device hangerő-constraint-ek (élő, bővülő)

> A fürdőben sosem lehet túl hangos, mert az áthallatszik a szomszédhoz.

| Device | Hard cap | Indok |
|---|---|---|
| **BathCom** | ~0.30-0.40 (TBD) | Áthallás a szomszédhoz |
| Boomer | ? | (még nincs constraint) |
| Többi | ? | (még nincs constraint) |

**Hatás a presetekre:** a `hangos` és `normál` presetekben a BathCom szintet
**nem szabad** a hard cap fölé vinni, akkor sem ha a felhasználói tuning
máshová is mutatna.

**Hatás a notify-flow-ra:** a `--announcement-volume` (default 0.7) jelenleg
egységes minden eszközön; ha BathCom is benne van a volume target-ekben,
ez túl hangos lehet → következő iterációban érdemes per-device cap-et
honorálni a UP fázisban (clamp az announcement level-t a cap-hez).

---

## TODO — preset matrix finomhangolás

A `config/volume-presets.json` jelenleg **placeholder értékekkel** van feltöltve.
A user dolga finomhangolni:

1. Élesben próbálni a 4 presetet (`pnpm preset --apply <name>`)
2. Ha valami nem stimmel: a Google Home appban beállítani ízlés szerint, majd
   `pnpm preset --capture <ugyanaz-a-név>` — kimenti a jelenlegi szinteket az
   adott preset alá
3. Constraint-eket is rögzíteni ide a "Per-device hangerő-constraint-ek"
   táblába, ahogy felfedezzük (pl. áthallás, alvó környezet, stb.)

---

## Open follow-up

- Próbáljuk-e külön kezelni az "active music" detection-t (respect-music
  routing, korábbi javaslat C opció)? Egyelőre **NEM** — a save/up/restore +
  Spotify resume együtt elég lesz a tipikus use case-re.
- "Announcement loudness" target érték: kezdjük 0.6-tal, próba alapján
  finomítjuk.
- Voice cloning saját hanggal? Coqui XTTS v2 támogatja (~10s reference
  felvétel kell). Phase 3+ ötlet.
