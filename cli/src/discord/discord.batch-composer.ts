// Köteg → EGYETLEN prompt.
//
// Ez az a pont, ahol az owner fő kérése teljesül: „minél több infó kerüljön be egy-egy
// promptba" — N üzenetből EGY prompt lesz, tehát EGY futás, nem N.
//
// A prompt szerkezete szándékosan gépiesen felismerhető:
//   - az első sor az előtaggal kezdődik (`INCOMING_USER_MSG_ON_DISCORD:`)
//   - a tételek sorrendtartók, időbélyeggel
//   - a végén a FELTÉTELES válasz-szabály: Discordra csak a FÓKUSZ kerül, alvás alatt semmi
//
// ⚠️ Owner, 2026-09-11 03:34-03:35: a korábbi feltétel NÉLKÜLI „Discordon IS válaszolnod kell"
// lábléc a fejlesztési témákat is Discordra kényszerítette, és ezzel ébren tartotta őt:
// „azzal, hogy küldesz egy bármilyen üzenetet, azzal megint ébren tartasz… Ez most már
// nagyon-nagyon rossz." ⇒ a lábléc feltételes lett, és kimondja, hogy a HALLGATÁS is válasz.

import { DISCORD_INBOUND_PREFIX, type DiscordInboundMessage } from './discord.models.js';

/** Ennyi karakter fölött a promptot vágjuk — a CCAP/CLI bemenetnek van felső határa. */
const MAX_PROMPT_CHARS: number = 24_000;

/**
 * Egy kötegből egyetlen prompt-szöveget állít elő.
 *
 * @param messages érkezési sorrendben; üres tömbre üres sztringet ad (a hívó ne küldjön).
 */
export function composeBatchPrompt(
  messages: DiscordInboundMessage[],
  now: Date = new Date(),
): string {
  if (messages.length === 0) return '';

  const header: string = messages.length === 1
    ? `${DISCORD_INBOUND_PREFIX} 1 új üzenet Discordon.`
    : `${DISCORD_INBOUND_PREFIX} ${messages.length} új üzenet Discordon (időrendben, összevonva).`;

  // ⭐ A KÉZBESÍTÉS ideje külön sorban: enélkül nincs mihez viszonyítani az üzenetek korát.
  const deliveredAt: string = `*(kézbesítve: ${formatLocalTime(now.toISOString())})*`;

  const body: string = messages
    .map((message, index) => formatEntry(message, index, messages.length, now))
    .join('\n\n');

  const footer: string = [
    '---',
    '📌 Válasz-szabály: Discordra CSAK akkor írj, ha a téma a FÓKUSZ része — az owner',
    'teendője vagy döntése. Fejlesztési / belső üzemeltetési témáról ⛔ NE írj Discordra:',
    'az a repóba megy, és a HALLGATÁS a helyes válasz.',
    '🛏️ Ha az owner alszik vagy lefekvéshez készül, MINDEN üzenet ébren tartja —',
    'ilyenkor ⛔ semmit ne küldj, csak valódi vészhelyzetben.',
  ].join('\n');

  return truncateIfNeeded([header, deliveredAt, '', body, '', footer].join('\n'));
}

function formatEntry(
  message: DiscordInboundMessage,
  index: number,
  total: number,
  now: Date,
): string {
  const label: string = total === 1 ? '' : ` [${index + 1}/${total}]`;
  const time: string = formatLocalTime(message.receivedAt);
  const age: string = formatAge(message.receivedAt, now);

  return `### Üzenet${label} — ${time}${age}\n${message.content.trim()}`;
}

/**
 * Mennyi ideje várt az üzenet — a KÉZBESÍTÉSHEZ képest.
 *
 * > **Owner-ötlet (2026-09-07):** *„Ezeket a discord inputjaimat, lehet hasznos lenne ellátni
 * > timestamp-el"* — az abszolút időbélyeg már megvolt; a **kor** volt az, ami hiányzott.
 *
 * 🔴 MIÉRT SZÁMÍT: a köteg csak akkor megy ki, amikor a session felszabadul — ez akár **egy
 * óra** is lehet. Puszta abszolút időbélyegből nem tűnik fel, hogy egy kérés már **elavult**:
 * a „mikor induljak?" egy órával később egészen mást jelent, és a rossz válasz rosszabb, mint
 * a késői. A kor kiírásával ez azonnal látszik.
 *
 * Friss üzenetnél (< 2 perc) semmit nem írunk ki — ott csak zaj lenne.
 */
function formatAge(isoTimestamp: string, now: Date): string {
  const parsed: Date = new Date(isoTimestamp);

  if (Number.isNaN(parsed.getTime())) return '';

  const minutes: number = Math.round((now.getTime() - parsed.getTime()) / 60_000);

  if (minutes < 2) return '';
  if (minutes < 60) return ` *(${minutes} perce)*`;

  const hours: number = Math.floor(minutes / 60);

  return ` *(${hours} ó ${minutes % 60} perce — ⚠️ RÉGI, nézd meg, aktuális-e még)*`;
}

/** ISO időbélyeg → ember-olvasható helyi idő. Hibás bemenetre az eredetit adja vissza. */
function formatLocalTime(isoTimestamp: string): string {
  const parsed: Date = new Date(isoTimestamp);

  if (Number.isNaN(parsed.getTime())) return isoTimestamp;

  const pad = (value: number): string => String(value).padStart(2, '0');

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} `
    + `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

/**
 * Túl hosszú köteg vágása.
 *
 * ⚠️ A vágás LÁTHATÓ: a prompt végén jelezzük, hogy csonkoltunk. Néma csonkolás tilos —
 * különben úgy tűnne, hogy az owner kevesebbet írt, mint amennyit valójában.
 */
function truncateIfNeeded(prompt: string): string {
  if (prompt.length <= MAX_PROMPT_CHARS) return prompt;

  const notice: string = '\n\n[⚠️ A köteg túl hosszú volt, a szöveg itt csonkolva. '
    + 'A teljes tartalom a Discord-csatornában olvasható.]';

  return prompt.slice(0, MAX_PROMPT_CHARS - notice.length) + notice;
}
