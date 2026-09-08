// A hangszórós kapu futtatása valós adatokkal — összeszedi a jeleket és kiértékel.
//
// Ez a réteg köti össze a tiszta döntés-logikát (`evaluatePresenceGate`) a lemezen lévő
// mérésekkel. Külön van, hogy a döntés maga futó gép nélkül is tesztelhető maradjon.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { DiscordBatchStore } from '../discord/discord.batch-store.js';
import { readPresence } from '../presence/presence.reader.js';
import { resolvePresenceDataDirectory, resolveProjectRoot } from '../utils/project-root.js';
import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { evaluatePresenceGate, type PresenceGateDecision } from './notify.presence-gate.js';

/**
 * Kiértékeli a kaput a jelenlegi, mért állapot alapján.
 *
 * 🔴 A kapu SOHA nem dobhat hibát. Ha a jelenlét-olvasás elszáll (jogosultsági hiba,
 * sérült könyvtár), az eredmény `unknown` ⇒ TILT — nem pedig összeomlás a bemondás
 * útjában. Egy kivétel itt azt jelentené, hogy a `ma cast notify` és a tick elhasal,
 * ahelyett hogy biztonságosan csendben maradna.
 */
export async function runPresenceGate(now: Date = new Date()): Promise<PresenceGateDecision> {
  let presence: Awaited<ReturnType<typeof readPresence>>;

  try {
    presence = await readPresence(resolvePresenceDataDirectory(resolveProjectRoot()), now);
  } catch (err: unknown) {
    presence = {
      isHome: 'unknown',
      reason: 'A jelenlét-mérés nem olvasható '
        + `(${err instanceof Error ? err.message : String(err)}).`,
    };
  }

  const lastDiscordReplyAt: Date | undefined = await findLastDiscordReply();

  return evaluatePresenceGate({ presence, lastDiscordReplyAt, now });
}

/**
 * Az owner legutóbbi Discord-üzenetének ideje.
 *
 * Két helyen lehet: a még ki nem küldött kötegben, és a már bejuttatottak archívumában.
 * A kettő közül a KÉSŐBBI számít — enélkül egy frissen érkezett üzenet nem számítana bele
 * az ébrenlétbe, mert még nem került archívumba.
 */
async function findLastDiscordReply(): Promise<Date | undefined> {
  const store: DiscordBatchStore = new DiscordBatchStore();
  const candidates: Date[] = [];

  try {
    const pending = await store.readPending();
    const newest = pending[pending.length - 1];

    if (newest) candidates.push(new Date(newest.receivedAt));
  } catch (err) {
    // A koteg olvashatatlansaga nem akadalyozhatja a kapu kiertekeleset — a jel egyszeruen
    // hianyzik. De a „nincs jel" es a „nem tudtam elolvasni" KULONBOZO allapot: az elso
    // nyugalom, a masodik hiba. A kapu ugyanugy dont, a naplo viszont megkulonbozteti.
    SwallowedFailure_Util.report('cast.gate-runner.readPending', err);
  }

  const archiveTimestamp: Date | undefined = await readArchiveTail(store.getPaths().archiveFile);

  if (archiveTimestamp) candidates.push(archiveTimestamp);

  const valid: Date[] = candidates.filter((date) => !Number.isNaN(date.getTime()));

  if (valid.length === 0) return undefined;

  return valid.reduce((latest, current) => (current > latest ? current : latest));
}

async function readArchiveTail(archiveFile: string): Promise<Date | undefined> {
  if (!existsSync(archiveFile)) return undefined;

  try {
    const raw: string = await readFile(archiveFile, 'utf-8');
    const lines: string[] = raw.split('\n').filter((line) => line.trim().length > 0);

    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const parsed = JSON.parse(lines[index]!) as { receivedAt?: unknown };

      if (typeof parsed.receivedAt === 'string') {
        const date: Date = new Date(parsed.receivedAt);

        if (!Number.isNaN(date.getTime())) return date;
      }
    }
  } catch (err) {
    SwallowedFailure_Util.report('cast.gate-runner.readArchiveTail', err);

    return undefined;
  }

  return undefined;
}
