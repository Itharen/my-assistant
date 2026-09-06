// Köteg → EGYETLEN prompt.
//
// Ez az a pont, ahol az owner fő kérése teljesül: „minél több infó kerüljön be egy-egy
// promptba" — N üzenetből EGY prompt lesz, tehát EGY futás, nem N.
//
// A prompt szerkezete szándékosan gépiesen felismerhető:
//   - az első sor az előtaggal kezdődik (`INCOMING_USER_MSG_ON_DISCORD:`)
//   - a tételek sorrendtartók, időbélyeggel
//   - a végén a válasz-kötelezettség emlékeztetője (owner-szabály: Discordon IS válaszolni kell)

import { DISCORD_INBOUND_PREFIX, type DiscordInboundMessage } from './discord.models.js';

/** Ennyi karakter fölött a promptot vágjuk — a CCAP/CLI bemenetnek van felső határa. */
const MAX_PROMPT_CHARS: number = 24_000;

/**
 * Egy kötegből egyetlen prompt-szöveget állít elő.
 *
 * @param messages érkezési sorrendben; üres tömbre üres sztringet ad (a hívó ne küldjön).
 */
export function composeBatchPrompt(messages: DiscordInboundMessage[]): string {
  if (messages.length === 0) return '';

  const header: string = messages.length === 1
    ? `${DISCORD_INBOUND_PREFIX} 1 új üzenet Discordon.`
    : `${DISCORD_INBOUND_PREFIX} ${messages.length} új üzenet Discordon (időrendben, összevonva).`;

  const body: string = messages
    .map((message, index) => formatEntry(message, index, messages.length))
    .join('\n\n');

  const footer: string = [
    '---',
    '🔴 Válasz-kötelezettség: erre NEM elég a sessionben válaszolni — Discordon IS',
    'válaszolnod kell, rövid és tömör formában (owner-szabály, 2026-09-06).',
  ].join('\n');

  return truncateIfNeeded([header, '', body, '', footer].join('\n'));
}

function formatEntry(message: DiscordInboundMessage, index: number, total: number): string {
  const label: string = total === 1 ? '' : ` [${index + 1}/${total}]`;
  const time: string = formatLocalTime(message.receivedAt);

  return `### Üzenet${label} — ${time}\n${message.content.trim()}`;
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
