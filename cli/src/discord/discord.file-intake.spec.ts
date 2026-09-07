import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  MAX_INBOX_BYTES,
  composeIntakeNote,
  saveInboxAttachments,
  toSafeFileName,
  toTimePrefix,
} from './discord.file-intake.js';
import type { DiscordAttachment } from './discord.voice-message.js';

function makeAttachment(overrides: Partial<DiscordAttachment> = {}): DiscordAttachment {
  return {
    id: 'a1',
    url: 'https://cdn.discordapp.com/attachments/1/2/program.pdf',
    name: 'program.pdf',
    size: 1024,
    contentType: 'application/pdf',
    ...overrides,
  };
}

/** Hamis letöltő: adott bájtokat ad vissza. */
function makeFetch(bytes: Uint8Array, status: number = 200): typeof fetch {
  return (async (): Promise<Response> => ({
    ok: status >= 200 && status < 300,
    status: status,
    arrayBuffer: async (): Promise<ArrayBuffer> => bytes.buffer.slice(0) as ArrayBuffer,
  }) as unknown as Response) as typeof fetch;
}

describe('discord.file-intake', () => {

  describe('toSafeFileName', () => {
    it('🔴 a path traversal NEM juthat át — a név az ownertől jön, nem tőlünk', () => {
      expect(toSafeFileName('../../../etc/passwd')).toBe('passwd');
      expect(toSafeFileName('C:\\Windows\\system32\\evil.dll')).toBe('evil.dll');
    });

    it('a magyar ékezetet és a szóközt kötőjelre cseréli, a kiterjesztést megtartja', () => {
      expect(toSafeFileName('AI Summit program.pdf')).toBe('AI-Summit-program.pdf');
    });

    it('üres vagy csak tiltott karakterből álló névre is ad használható nevet', () => {
      expect(toSafeFileName('   ')).toBe('csatolmany');
      expect(toSafeFileName('???')).toBe('csatolmany');
    });
  });

  describe('toTimePrefix', () => {
    it('nullával tölt, hogy az inbox magától időrendben álljon', () => {
      expect(toTimePrefix(new Date(2026, 8, 7, 6, 3))).toBe('2026-09-07-0603');
    });
  });

  describe('composeIntakeNote', () => {
    it('üres, ha nem volt csatolmány — ilyenkor semmit nem fűzünk az üzenethez', () => {
      expect(composeIntakeNote([], [])).toBe('');
    });

    it('⚠️ a BUKÁS is benne van, nem csak a siker', () => {
      const note = composeIntakeNote(
        [{ originalName: 'a.pdf', storedName: 'x-a.pdf', bytes: 2048 }],
        [{ originalName: 'b.zip', detail: 'HTTP 403' }],
      );

      expect(note).toContain('__agent/inbox/x-a.pdf');
      expect(note).toContain('🔴');
      expect(note).toContain('HTTP 403');
    });
  });

  describe('saveInboxAttachments', () => {
    it('lementi a fájlt, és a megjegyzés megmondja HOVA', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'ma-inbox-'));
      const result = await saveInboxAttachments({
        attachments: [makeAttachment()],
        inboxDir: dir,
        now: new Date(2026, 8, 7, 16, 13),
        fetchImpl: makeFetch(new Uint8Array([1, 2, 3, 4])),
      });

      expect(result.saved.length).toBe(1);
      expect(result.saved[0]!.storedName).toBe('2026-09-07-1613-program.pdf');
      expect(result.note).toContain('__agent/inbox/2026-09-07-1613-program.pdf');

      const written = await readFile(join(dir, result.saved[0]!.storedName));
      expect(written.byteLength).toBe(4);
    });

    it('🔴 a TÚL NAGY fájlt le sem tölti — de NEM hallgatja el', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'ma-inbox-'));
      let called = false;
      const result = await saveInboxAttachments({
        attachments: [makeAttachment({ size: MAX_INBOX_BYTES + 1 })],
        inboxDir: dir,
        fetchImpl: ((): never => { called = true; throw new Error('nem szabad hívni'); }) as unknown as typeof fetch,
      });

      expect(called).toBe(false);
      expect(result.saved).toEqual([]);
      expect(result.failed[0]!.detail).toContain('nagyobb');
      expect(await readdir(dir)).toEqual([]);
    });

    it('⚠️ letöltési hiba SOHA nem dob — a figyelő nem dőlhet meg egy fájltól', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'ma-inbox-'));
      const result = await saveInboxAttachments({
        attachments: [makeAttachment()],
        inboxDir: dir,
        fetchImpl: (async (): Promise<Response> => { throw new Error('halot a halo'); }) as typeof fetch,
      });

      expect(result.saved).toEqual([]);
      expect(result.failed[0]!.detail).toContain('halot a halo');
      expect(result.note).toContain('🔴');
    });

    it('a HTTP-hibát is bukásként jelenti, nem üres sikerként', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'ma-inbox-'));
      const result = await saveInboxAttachments({
        attachments: [makeAttachment()],
        inboxDir: dir,
        fetchImpl: makeFetch(new Uint8Array([1]), 403),
      });

      expect(result.failed[0]!.detail).toBe('HTTP 403');
    });

    it('csatolmány nélkül ÜRES megjegyzést ad — nem piszkítja az üzenetet', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'ma-inbox-'));
      const result = await saveInboxAttachments({ attachments: [], inboxDir: dir });

      expect(result.note).toBe('');
      expect(result.saved).toEqual([]);
    });
  });
});
