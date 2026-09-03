# LinkedIn a My Assistant mellett — iframe és vezetett kézi küldés

**Ellenőrizve:** 2026-09-03, 04:10 Europe/Budapest körül.
**Állapot:** megvalósíthatósági vizsgálat és javaslat; nem elfogadott implementációs döntés, nem elkészült UI.
Előzmény: [hivatalos Messages API hozzáférési kutatás](2026-09-02-linkedin-messaging-access-research.md).

## Mérés

Bejelentkezés nélküli HTTPS GET a `https://www.linkedin.com/messaging/` címre, redirectek követésével.
Csak státusz, Location, X-Frame-Options és CSP frame-ancestors rész került kiolvasásra; cookie/token nem.

- Messaging: HTTP 302 → LinkedIn `/uas/login?session_redirect=...`.
- 302 válasz: `x-frame-options: sameorigin`; `frame-ancestors 'self' *.www.linkedin.com:* *.prod.linkedin.com`.
- Login: HTTP 200; `x-frame-options: SAMEORIGIN`;
  `frame-ancestors 'self' *.www.linkedin.com:* *.prod.linkedin.com ciafilestore.corp.linkedin.com`.

**Következtetés:** a mért belépési út nem ágyazható localhost My Assistant-oldal iframe-jébe a normál
böngészővédelmek mellett. Ez nem a bejelentkezett inbox teljes útjának élő tesztje; ilyen teszt nem történt.
A `frame-ancestors` érték nem engedi meg a localhost szülőt.
[CSP frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors),
[X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options).

## Három külön megoldás

1. **Webes iframe:** a mért LinkedIn belépési út blokkolja. Nem javasolt fejléceltávolítás, proxy vagy
   böngészőbiztonság-kikapcsolás. A LinkedIn feltételeinek 8.2.14 pontja külön tiltja a framing/mirroringot;
   a kézi Küldés nem oldja fel ezt. [User Agreement §8](https://www.linkedin.com/legal/user-agreement).
2. **Saját desktop böngészőpanel:** Electron `WebContentsView` technikailag támogat külön webtartalmat
   egy natív ablakban. Nem azonos a localhost HTML iframe-jével. LinkedIn login-kompatibilitás és a konkrét
   beágyazás engedélyezettsége nincs igazolva; nem tekinthető automatikusan szabályos kerülőútnak.
   [Electron web embeds](https://www.electronjs.org/docs/latest/tutorial/web-embeds).
3. **Javaslat: normál böngésző osztott nézete:** bal oldalon My Assistant, jobb oldalon a valódi LinkedIn
   weboldal, két külön böngészőlapként, egy ablakban. A böngésző funkciója, nem My Assistant általi iframe/overlay.
   Chrome és Edge dokumentál ilyen nézetet; a helyben telepített verziókat és a konkrét munkafolyamatot még
   nem teszteltük. [Chrome split view](https://support.google.com/chrome/answer/16971124?hl=en),
   [Edge split screen](https://www.microsoft.com/en-us/edge/features/split-screen).

## Javasolt vezetett munkafolyamat

- My Assistant: hivatalos read-only adatokból thread-kivonat, címzettazonosítás, szerkeszthető draft, CV-checklist.
- Owner: draft másolása a saját felület gombjával; a valódi LinkedInben beszélgetés kiválasztása,
  beillesztés, CV kézi csatolása, ellenőrzés és natív Küldés.
- Saját UI: „kézzel elküldtem” külön owner-jelölés, nem API-receipt vagy bizonyított kézbesítés.
  Későbbi hivatalos syncben azonosított kimenő üzenet igazolhatja a küldést, a sync késhet.
- Nem ígérünk automatikus LinkedIn-mezőkitöltést vagy minimálisan egyetlen kattintást. A saját weboldal
  nem olvassa/manipulálja a másik oldali LinkedIn DOM-ját. Nem nyitunk/töltünk be automatikusan privát threadeket.
- A tisztán kézi natív küldéshez a mi appunknak nem kell Messages API send-jogosultság;
  a meglévő read-side adatkezelési kötelezettségek ettől nem változnak.

Nem módosult app, token, böngészőablak, task-státusz vagy send-szabály. Csak e vizsgálat és javaslat került rögzítésre.
