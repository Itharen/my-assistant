// 🗓️ `ma calendar today [--day <YYYY-MM-DD>]` — ⭐ MI VAN MA.
//
// > **Owner, 2026-09-11 12:19:** *„a MUNKANAPTÁR előre kerül… A feladat EGY funkció:
// > `ma calendar today` (vagy `--day <ISO>`) → a nap eseményei (kezdés, vége, cím, helyszín/link,
// > résztvevők)."*
//
// ## 🔴 A HIBA SOSEM ÜRES NAPKÉNT LÁTSZIK
//
// ⛔ **Ebben a fájlban NINCS `try`/`catch` a naptár-olvasás körül** — és ez **szándékos**. A
// `CalendarToolError` **átmegy** a CLI központi hibakezelőjén *(`main.ts`)*, ami hiba-borítékot ír
// a stabil kóddal *(`MA-CALENDAR-SCOPE-MISSING` stb.)*, **naplózza** a hibát, és **1-es
// kilépési kóddal** áll le.
//
// ⚠️ Egy itteni `catch` pont azt a hibát okozná, amit el kell kerülni: *„az üres naptár és a
// nincs-jogosultság kívülről ugyanúgy néz ki."*

import { parseArgs } from 'node:util';

import { CalendarDayService } from '../calendar/calendar-day.service.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';
import { localTimeHeader } from '../utils/local-time.js';

/** A nap magyar neve — a puszta dátum ránézésre nem mond semmit. */
const WEEKDAYS: readonly string[] = [
  'vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat',
];

/** A `YYYY-MM-DD` → `2026-09-11 (péntek)`. */
function describeDay(day: string): string {
  const match: RegExpMatchArray | null = day.match(/^(\d{4})-(\d{2})-(\d{2})$/u);

  if (!match) return day;

  // ⚠️ Helyi dél: így semmilyen időzóna-eltolás nem viszi át a napot a szomszédosra.
  const date: Date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);

  return `${day} (${WEEKDAYS[date.getDay()] ?? '?'})`;
}

/**
 * A parancs belépési pontja.
 *
 * ## ⚠️ EGY ISMERT REVIEW-TALÁLAT — TUDATOSAN, MÉRÉSSEL
 *
 * A `no-plain-function-export` szabály szerint ez statikus metódus lenne egy `_Util` osztályon.
 * ⭐ **Mérve 2026-09-11:** ugyanez a találat **mind a 31 többi** parancs-fájlon rajta van a
 * `cli/src/commands/`-ban — tehát a szabály a parancs-réteg **egészére** vonatkozó, meglévő
 * adósság, ⛔ nem az én regresszióm.
 *
 * ⛔ Egyetlen fájlban eltérni **két konvenciót** hozna ugyanabba a mappába, és a `main.ts` lusta
 * betöltője is kétféle alakot kezelne *(`core-patterns-first`)*. ⇒ A váltás a réteg **egészére**
 * szóló döntés, owner/architektúra szinten — ezért a szomszédok mintáját követem, és a találatot
 * **kimondom** a jelentésben, ⛔ nem hallgatom el és ⛔ nem kapcsolom ki a szabályt.
 */
export async function runCalendarCommand(subcommand: string, args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();

  if (subcommand !== 'today') {
    process.stderr.write(
      `Ismeretlen calendar subcommand: "${subcommand}".`
      + ' Használat: ma calendar today [--day <YYYY-MM-DD>]\n',
    );
    process.exitCode = 1;

    return;
  }

  const parsed = parseArgs({
    args,
    options: {
      day: { type: 'string' },
      account: { type: 'string' },
      json: { type: 'boolean' },
      pretty: { type: 'boolean' },
    },
    strict: false,
    allowPositionals: true,
  });
  const reading = await CalendarDayService.readDay({
    day: typeof parsed.values.day === 'string' ? parsed.values.day : undefined,
    account: typeof parsed.values.account === 'string' ? parsed.values.account : undefined,
  });

  if (parsed.values.json) {
    writeEnvelope(ok('calendar.today', requestId, startedAt, reading), parsed.values.pretty === true);

    return;
  }

  const body: string = reading.events.length
    ? reading.lines.map((line: string): string => `  ${line}\n`).join('')
    // 🔴 KIMONDOTT ÜRES NAP: ⛔ nem egy néma, üres blokk. A csend hibának látszana.
    : '  (a naptár OLVASHATÓ volt — ezen a napon nincs esemény)\n';

  process.stdout.write(
    `\n🗓️  ${describeDay(reading.day)} — ${reading.events.length} esemény\n`
    + `  ${localTimeHeader()}\n\n`
    + body
    + '\n',
  );
}
