// 📥 CSATOLMÁNY → INBOX. A Discordra dobott fájl LEMENTÉSE, hogy ne vesszen el.
//
// > **Owner (2026-09-07 16:13):** *„Én most letöltöttem valami AI Summit holnapi programot.
// > Hova tegyem?"*
//
// 🔴 A MÉRT HIÁNY, AMIÉRT EZ LÉTEZIK: a figyelő eddig **csak a hangot** töltötte le. Minden más
// csatolmány `toBatchEntry`-ben **levált** az üzenetről, a szöveg nélküli fájl-üzenetet pedig a
// szűrő **elutasította** — a fájl tehát némán elveszett, és az owner nem tudta volna, hogy nem
// jutott el hozzám.
//
// ⭐ A HATÓKÖR SZÁNDÉKOSAN EGY DOLOG (`one-function-is-enough`): **lementeni és megmondani, hova**.
// ⛔ NEM tartozik ide: PDF-olvasás, tartalom-értelmezés, automatikus besorolás. Azt a következő
// körben én csinálom, kézzel — mert az már döntés, nem szállítás.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DiscordAttachment } from './discord.voice-message.js';

/** Ekkora fájlt még lementünk. A Discord alap-limitje 25 MB — ennél többet nem is kapnánk. */
export const MAX_INBOX_BYTES: number = 25 * 1024 * 1024;

/** Letöltési türelem. A hangnál bevált értékkel egyezik. */
export const INBOX_DOWNLOAD_TIMEOUT_MS: number = 30_000;

export interface SavedInboxFile {
  originalName: string;
  /** A lementett fájl neve az inboxban — időbélyeggel, hogy ne ütközzön és sorrendben álljon. */
  storedName: string;
  bytes: number;
}

export interface FailedInboxFile {
  originalName: string;
  detail: string;
}

export interface FileIntakeResult {
  saved: SavedInboxFile[];
  failed: FailedInboxFile[];
  /**
   * A kötegbe fűzendő megjegyzés — ⚠️ **ez az egyetlen nyoma** annak, hogy fájl érkezett.
   * Üres, ha nem volt nem-hang csatolmány.
   */
  note: string;
}

/**
 * A fájlnév biztonságossá tétele.
 *
 * ⚠️ A Discord-csatolmány neve **az owner (vagy egy idegen eszköz) által adott szöveg** — path
 * traversal (`../`), eszköznév és tiltott karakter is lehet benne. Soha nem írjuk ki nyersen.
 */
export function toSafeFileName(rawName: string): string {
  const base: string = rawName.replace(/^.*[\\/]/, '').trim();
  const cleaned: string = base.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');

  return cleaned.slice(0, 120) || 'csatolmany';
}

/** `2026-09-07-1613` — az inbox így magától időrendben áll. */
export function toTimePrefix(when: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');

  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`
    + `-${pad(when.getHours())}${pad(when.getMinutes())}`;
}

/**
 * A kötegbe fűzött megjegyzés szövege.
 *
 * 🔴 A BUKÁS IS BENNE VAN, nem csak a siker. Ha egy fájl nem jött le, azt **látnom kell** —
 * különben a hiányáról csak akkor derülne fény, amikor már keresném.
 */
export function composeIntakeNote(saved: SavedInboxFile[], failed: FailedInboxFile[]): string {
  if (!saved.length && !failed.length) return '';

  const lines: string[] = ['📥 CSATOLMÁNY érkezett ehhez az üzenethez:'];

  for (const file of saved) {
    lines.push(`  ✅ ${file.originalName} → __agent/inbox/${file.storedName} (${formatSize(file.bytes)})`);
  }

  for (const file of failed) {
    lines.push(`  🔴 ${file.originalName} — NEM sikerült lementeni: ${file.detail}`);
  }

  return lines.join('\n');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A nem-hang csatolmányok lementése az inboxba.
 *
 * ⚠️ **AZONNAL le kell tölteni:** a Discord linkjei aláírtak és lejárnak — a tárolt URL később
 * már használhatatlan. Ezért nem a címet őrizzük meg, hanem **magát a bájtokat**.
 *
 * Hibát SOHA nem dob: egy nem letölthető fájl nem döntheti meg a figyelőt. A bukás a
 * `failed` listába és a megjegyzésbe kerül.
 */
export async function saveInboxAttachments(params: {
  attachments: DiscordAttachment[];
  inboxDir: string;
  now?: Date;
  fetchImpl?: typeof fetch;
}): Promise<FileIntakeResult> {
  const when: Date = params.now ?? new Date();
  const fetchImpl: typeof fetch = params.fetchImpl ?? fetch;
  const saved: SavedInboxFile[] = [];
  const failed: FailedInboxFile[] = [];

  for (const attachment of params.attachments) {
    if (attachment.size > MAX_INBOX_BYTES) {
      failed.push({
        originalName: attachment.name,
        detail: `nagyobb a megengedettnél (${formatSize(attachment.size)})`,
      });
      continue;
    }

    const controller = new AbortController();
    const timer = setTimeout((): void => controller.abort(), INBOX_DOWNLOAD_TIMEOUT_MS);

    try {
      const response = await fetchImpl(attachment.url, { signal: controller.signal });

      if (!response.ok) {
        failed.push({ originalName: attachment.name, detail: `HTTP ${response.status}` });
        continue;
      }

      const bytes = new Uint8Array(await response.arrayBuffer());

      if (!bytes.byteLength) {
        failed.push({ originalName: attachment.name, detail: 'üres fájl érkezett' });
        continue;
      }

      const storedName: string = `${toTimePrefix(when)}-${toSafeFileName(attachment.name)}`;

      await mkdir(params.inboxDir, { recursive: true });
      await writeFile(join(params.inboxDir, storedName), bytes);

      saved.push({ originalName: attachment.name, storedName: storedName, bytes: bytes.byteLength });
    } catch (error: unknown) {
      failed.push({
        originalName: attachment.name,
        detail: error instanceof Error ? error.message : String(error),
      });
    } finally {
      clearTimeout(timer);
    }
  }

  return { saved: saved, failed: failed, note: composeIntakeNote(saved, failed) };
}
