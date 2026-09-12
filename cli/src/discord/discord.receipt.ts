// KÉZBESÍTÉSI ÉRTESÍTŐ — „most ment el neked X üzenet".
//
// > **Owner-KORREKCIÓ (2026-09-07 10:29), szó szerint:** *„Nem kell folyton írni, hogy
// > megvannak az üzenetek... Elég ha a typing frissítve van és esetleg arról küldhetsz egy
// > rövid 2 szavas választ, hogy na most ment el neked x üzenet"*
//
// 🔴 EZ EGY KORÁBBI MEGOLDÁSOM JAVÍTÁSA. Előbb „megérkezett, dolgozom" nyugtát küldtem,
// amikor a köteg VÁRT. Az owner szerint ez **sok** — és igaza van: a várakozásról a
// „gépel…" jelzés úgyis szól, tehát a nyugta ugyanazt mondta el még egyszer, szavakkal.
//
// ⇒ A jelzés **átkerült a KÜLDÉS pillanatára**: nem azt mondjuk meg, hogy *megkaptuk*,
// hanem azt, hogy **most ment át**. Ez az az egy pillanat, amiről a „gépel…" NEM tud
// beszélni — és pont ez hiányzott.
//
// ⭐ A TANULSÁG: nem elég **jelezni**; a jelzésnek azt kell mondania, amit a többi jel NEM
// mond el. A redundáns visszajelzés nem megnyugtat, hanem zajjá válik.
//
// ## 🔴 MÁSODIK KORREKCIÓ (2026-09-12, 23. tétel) — a szöveg FÉLREVEZETETT
//
// Az *„Átment N üzeneted"* **pontos** volt, de az owner **szállítási** visszaigazolásnak
// olvasta. ⇒ Mostantól kimondjuk, hogy **hozzám** érkezett meg, és hogy **mennyit várt** —
// l. a `composeDeliveryNotice` fejlécét a méréssel.

import { formatDuration } from '../utils/local-time.js';

/**
 * ⏳ ENNYI VÁRAKOZÁS FÖLÖTT KIEMELJÜK — a 23. tétel.
 *
 * 🔬 A HORGONY ⛔ NEM FEJBŐL: a gyűjtő-ablak **30 mp**, a tartási szelep **15 perc**
 * *(`DEFAULT_BATCH_CONFIG`)*. ⇒ Egy **10 perc fölötti** várakozás azt jelenti, hogy már a szelep
 * utolsó harmadában vagyunk, tehát ⛔ nem a szokásos elcsendesedésre vártunk, hanem egy
 * **kivételes** kapura *(foglalt session, CCAP-sor, folyamatban lévő megszólalás)*.
 *
 * 🔴 MIÉRT KELL KIEMELNI: az owner **ma négyszer** hitte, hogy áll a rendszer *(03:17 · 04:22 ·
 * 04:40 · 22:02)*, és **egyszer sem állt**. A hosszú várakozás **önmagában információ** — ha
 * elhallgatjuk, ő „nem megy semmi"-ként értelmezi.
 */
const LONG_WAIT_MS: number = 10 * 60_000;

/**
 * A kézbesítési értesítő szövege — ⭐ ŐSZINTÉN arról, ami történt.
 *
 * > **Owner, 2026-09-12 22:02:** *„Úgy látom, hogy X üzenet elküldve üzenetet **nem akkor kapom,
 * > amikor elküldötté válik** tényleg, hanem nem tudom mikor később."*
 *
 * ## 🔴 A NYUGTA PONTOS VOLT — csak nem azt mérte, amit az owner hitt
 *
 * Mérve *(owner, 5 nyugta)*: a nyugta **2-5 másodperccel** a **kézbesítés** után megy ki, de
 * **190-650 másodperccel** azután, hogy az owner **beszélt**. ⇒ Az *„Átment az üzeneted"*
 * szöveget **szállítási visszaigazolásnak** olvasta *(„megérkezett a Discordra")*, miközben azt
 * jelentette: **a köteg megérkezett az agenthez** — a gyűjtő-ablak és a session-szabadság után.
 *
 * ⛔ **A KÉSLELTETÉST NEM SZÜNTETTÜK MEG:** a kötegelés **szándékos**, az owner kérte
 * *(„minél több infó egy promptba")*. ⇒ A hiba a **szövegben** volt.
 *
 * ⭐ **AMI VÁLTOZOTT:** *(a)* kimondjuk, hogy **hozzám** érkezett meg, ⛔ nem „átment";
 * *(b)* kiírjuk a **várakozást**; *(c)* a szokatlanul hosszút **kiemeljük**.
 *
 * @param deliveredCount hány üzenet került át ebben a kötegben.
 * @param oldestWaitMs ⏳ a **LEGRÉGEBBI** üzenet kora a kézbesítéskor. ⚠️ `null` = ⛔ nem
 *   mérhető *(hibás időbélyeg)* — olyankor ⛔ **nem írunk ki számot**, mert a kitalált szám
 *   rosszabb, mint a hiánya.
 *
 * ⚠️ MIÉRT A LEGRÉGEBBI, ÉS ⛔ NEM A LEGÚJABB: az owner azt akarja tudni, hogy amit **elsőként**
 * mondott, az mennyit várt — a legújabb üzenet kora a gyűjtő-ablak hossza, ⛔ nem a türelem-idő.
 */
export function composeDeliveryNotice(deliveredCount: number, oldestWaitMs: number | null = null): string {
  const subject: string = deliveredCount === 1
    ? 'Az üzeneted megérkezett hozzám'
    : `${deliveredCount} üzeneted megérkezett hozzám`;

  if (oldestWaitMs === null || oldestWaitMs < 0) return `📨 ${subject}.`;

  // ⚠️ A KÖZÖS formázót ⛔ NEM forkoljuk (`formatDuration` — több fogyasztója van), csak a
  // kerek perc végéről vágjuk le a `0mp` zajt: „9p 0mp" ⇒ „9p". ⭐ Az owner példája is kerek
  // percet írt *(„4 perc várakozás után")*.
  const waited: string = formatDuration(oldestWaitMs).replace(/ 0mp$/u, '');

  // ⚠️ A HOSSZÚ VÁRAKOZÁS KIEMELVE — és KIMONDJUK az okát is, mert pont az hiányzott: a
  // késés ⛔ nem hiba, hanem a kötegelés működése. Egy szó ennyit ér, mint négy félreértés.
  return oldestWaitMs >= LONG_WAIT_MS
    ? `📨 ${subject} (⚠️ ${waited} várakozás után — addig gyűjtött a köteg).`
    : `📨 ${subject} (${waited} várakozás után).`;
}

/**
 * Kimenjen-e egyáltalán az értesítő.
 *
 * 🔴 MÉRT SPAM, 2026-09-08: **72 üzenetet** küldtem aznap, ebből **17 ez a nyugta** volt.
 * Az owner reggel ezt írta: *„megint kicsit össze lett spam-elve a discord"*.
 *
 * ⚠️ **KÉT OWNER-SZABÁLY ÜTKÖZÖTT, és mindkettő érvényes:**
 *
 * | Mikor | Mit mondott |
 * |---|---|
 * | 2026-09-07 10:29 | *„esetleg arról küldhetsz egy rövid 2 szavas választ, hogy **na most ment el neked x üzenet**"* |
 * | 2026-09-08 13:19 | *„nem jeleznél vissza **mindig minden inputról**. Csak intéznéd/feljegyeznéd."* |
 *
 * ⭐ **A feloldás nem választás, hanem a KÜLÖNBSÉG megtalálása:** a korábbi kérés **kötegre**
 * szólt *(„x üzenet")*, a tiltás pedig az **egyenkénti** visszajelzésre. Mivel az üzenetei
 * egyesével érkeznek, a `deliveredCount` **majdnem mindig 1** volt ⇒ a köteg-értesítőből
 * gyakorlatilag **per-input nyugta** lett, azaz pontosan az, amit megtiltott.
 *
 * ⇒ **Egyetlen üzenetnél hallgatunk** — arról a „gépel…" jelzés úgyis szól. **Kettőtől
 * felfelé** viszont megy, mert ott valódi információ van: hogy **több** ment át egyszerre.
 *
 * 📌 Kanonikus: `current/principles/focus-support.md` 6️⃣ + `discord-message-style.md`.
 */
export function shouldSendDeliveryNotice(deliveredCount: number): boolean {
  return deliveredCount >= 2;
}
