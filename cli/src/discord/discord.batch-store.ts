// Tartós köteg-tár — a Discord-üzenetek lemezen várakoznak, amíg be nem juttatjuk őket.
//
// 🔴 TERVEZÉSI ELV: ÜZENET SOHA NEM VESZHET EL.
//   - append-only JSONL → egy félbeszakadt írás legfeljebb az UTOLSÓ sort rontja el,
//     a korábbiakat nem
//   - a tár CSAK igazolt átadás után ürül (`commitDelivered`)
//   - ha a kiküldés hibára fut, a köteg ÉRINTETLEN marad → a következő kör újrapróbálja
//
// ⚠️ Egyidejűség: a kiküldés alatt is érkezhet új üzenet. Ezért a `commitDelivered`
// PONTOSAN az első N sort törli (amiket ténylegesen elküldtünk), a maradékot megtartja —
// nem a teljes fájlt üríti. Enélkül a küldés közben érkező üzenet némán elveszne.

import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import type { DiscordInboundMessage } from './discord.models.js';

export interface DiscordBatchStorePaths {
  /** A várakozó üzenetek JSONL fájlja. */
  pendingFile: string;
  /** A már bejuttatott üzenetek archívuma (visszakereshetőség). */
  archiveFile: string;
}

export function resolveDiscordBatchPaths(userHome: string = homedir()): DiscordBatchStorePaths {
  const root: string = join(userHome, '.config', 'my-assistant', 'discord');

  return {
    pendingFile: join(root, 'pending-inbound.jsonl'),
    archiveFile: join(root, 'delivered-inbound.jsonl'),
  };
}

export class DiscordBatchStore {

  constructor(private readonly paths: DiscordBatchStorePaths = resolveDiscordBatchPaths()) {}

  /**
   * Új üzenet a kötegbe. Idempotens: ugyanazt a `messageId`-t nem vesszük fel kétszer
   * (a Discord újraküldheti ugyanazt az eseményt újracsatlakozáskor).
   *
   * @returns true, ha ténylegesen bekerült; false, ha duplikátum volt.
   */
  async append(message: DiscordInboundMessage): Promise<boolean> {
    const pending: DiscordInboundMessage[] = await this.readPending();

    if (pending.some((entry) => entry.messageId === message.messageId)) return false;

    await mkdir(dirname(this.paths.pendingFile), { recursive: true });
    await appendFile(this.paths.pendingFile, `${JSON.stringify(message)}\n`, 'utf-8');

    return true;
  }

  /**
   * A várakozó üzenetek, érkezési sorrendben.
   *
   * A sérült sorokat KIHAGYJUK, de nem dobunk hibát: egy félbeszakadt írás miatt nem
   * veszíthetjük el a többi, ép üzenetet. (A sérült sor a `commitDelivered`-nél kiesik.)
   */
  async readPending(): Promise<DiscordInboundMessage[]> {
    if (!existsSync(this.paths.pendingFile)) return [];

    const raw: string = await readFile(this.paths.pendingFile, 'utf-8');

    return raw
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => parseLine(line))
      .filter((entry): entry is DiscordInboundMessage => entry !== null);
  }

  /**
   * Az első `count` üzenet véglegesítése — CSAK sikeres, igazolt átadás után hívandó.
   *
   * A maradékot (a küldés közben érkezett üzeneteket) megtartja. Az írás átmeneti
   * fájlba + átnevezéssel történik, hogy egy megszakadás ne hagyjon félkész fájlt.
   */
  async commitDelivered(count: number): Promise<void> {
    if (count <= 0) return;

    const pending: DiscordInboundMessage[] = await this.readPending();
    const delivered: DiscordInboundMessage[] = pending.slice(0, count);
    const remaining: DiscordInboundMessage[] = pending.slice(count);

    // Előbb az archívum: ha itt hiba van, a pending még érintetlen → újrapróbálható.
    if (delivered.length > 0) {
      await mkdir(dirname(this.paths.archiveFile), { recursive: true });
      await appendFile(
        this.paths.archiveFile,
        delivered.map((entry) => JSON.stringify({ ...entry, deliveredAt: nowIso() })).join('\n') + '\n',
        'utf-8',
      );
    }

    const temporaryFile: string = `${this.paths.pendingFile}.tmp`;
    const body: string = remaining.map((entry) => JSON.stringify(entry)).join('\n');

    await writeFile(temporaryFile, body.length > 0 ? `${body}\n` : '', 'utf-8');
    await rename(temporaryFile, this.paths.pendingFile);
  }

  /**
   * A várakozó köteg frissítése — a KÖZBEN ÉRKEZETT üzenetek megtartásával.
   *
   * > **Owner-kérés (2026-09-07):** *„Jó lenne ha a discord msg kezelés frissítené küldés
   * > előtt a msg-eket. (Ha időközben még gyűjtés/küldés előtt javítom/módosítom, akkor a
   * > friss menjen neked."*
   *
   * 🔴 **MIÉRT NEM EGYSZERŰ FELÜLÍRÁS:** a frissítés hálózati körökből áll (a Discordtól
   * kérdezzük le az üzeneteket), tehát **eltart egy ideig**. Ha ezalatt új üzenet érkezik, egy
   * sima „írd felül a fájlt a régi listával" hívás azt **NÉMÁN ELDOBNÁ** — pontosan az a
   * hibaosztály, ami ellen az egész csatorna épült.
   *
   * Ezért itt **összefésülünk**: a `refreshed` lista a `knownIds`-ben szereplő tételeket
   * váltja le *(a hiányzók = törölve, azok kiesnek)*, és **minden más pending tétel a
   * helyén marad**, az eredeti sorrend végén.
   *
   * ⚠️ Ugyanaz az átmeneti-fájl + átnevezés minta, mint a `commitDelivered`-nél: egy
   * megszakadás nem hagyhat félkész köteg-fájlt.
   */
  async applyPendingRefresh(params: {
    /** A frissített tételek, a kiküldés sorrendjében. */
    refreshed: DiscordInboundMessage[];
    /** Amiket a frissítés EGYÁLTALÁN vizsgált — csak ezekhez nyúlunk. */
    knownIds: string[];
  }): Promise<void> {
    const known: Set<string> = new Set(params.knownIds);
    const current: DiscordInboundMessage[] = await this.readPending();
    // Ami a frissítés óta érkezett: nem vizsgáltuk, tehát nem is dönthetünk róla.
    const arrivedMeanwhile: DiscordInboundMessage[] = current.filter(
      (entry) => !known.has(entry.messageId),
    );

    const merged: DiscordInboundMessage[] = [...params.refreshed, ...arrivedMeanwhile];
    const temporaryFile: string = `${this.paths.pendingFile}.tmp`;
    const body: string = merged.map((entry) => JSON.stringify(entry)).join('\n');

    await mkdir(dirname(this.paths.pendingFile), { recursive: true });
    await writeFile(temporaryFile, body.length > 0 ? `${body}\n` : '', 'utf-8');
    await rename(temporaryFile, this.paths.pendingFile);
  }

  /**
   * Kézbesítettük-e már ezt az üzenetet? — az archívum alapján.
   *
   * 🔴 A visszamenőleges beolvasáshoz (backfill) KELL: indításkor a csatorna korábbi
   * üzeneteit is megnézzük, és enélkül a MÁR feldolgozottakat újra bevinnénk — vagyis
   * minden újraindítás megismételné a régi üzeneteidet.
   */
  async hasBeenDelivered(messageId: string): Promise<boolean> {
    if (!existsSync(this.paths.archiveFile)) return false;

    try {
      const raw: string = await readFile(this.paths.archiveFile, 'utf-8');

      return raw.split('\n').some((line) => {
        if (line.trim().length === 0) return false;

        try {
          const parsed = JSON.parse(line) as { messageId?: unknown };

          return parsed.messageId === messageId;
        } catch {
          return false;
        }
      });
    } catch {
      // Ha az archívum olvashatatlan, inkább ÚJNAK tekintjük: a duplikátum kellemetlen,
      // az elveszett üzenet viszont sokkal rosszabb.
      return false;
    }
  }

  /** Diagnosztikához: hol tartja a tár az adatot. */
  getPaths(): DiscordBatchStorePaths {
    return this.paths;
  }
}

function parseLine(line: string): DiscordInboundMessage | null {
  try {
    const parsed: unknown = JSON.parse(line);

    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Record<string, unknown>;

    if (typeof record['messageId'] !== 'string' || typeof record['content'] !== 'string') return null;

    return {
      messageId: record['messageId'],
      authorId: typeof record['authorId'] === 'string' ? record['authorId'] : '',
      authorName: typeof record['authorName'] === 'string' ? record['authorName'] : '',
      channelId: typeof record['channelId'] === 'string' ? record['channelId'] : '',
      content: record['content'],
      receivedAt: typeof record['receivedAt'] === 'string' ? record['receivedAt'] : nowIso(),
    };
  } catch {
    return null;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}
