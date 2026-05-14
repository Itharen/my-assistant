// Cast protocol play wrapper a castv2-client köré.
// Connect → launch DefaultMediaReceiver → load MP3 URL → várjuk a FINISHED state-et.
//
// A castv2-client NPM csomagnak nincs publikált típusa (sem a saját package.json-ban,
// sem @types/castv2-client-en). A workspace szabálya szerint NEM hozunk létre .d.ts
// fájlt — helyette itt, a használat helyén deklaráljuk lokálisan amit hívunk.

// Lokális type-leírás a használt felülethez (nem teljes API).
interface CastMediaInfo {
  contentId: string;
  contentType: string;
  streamType: 'BUFFERED' | 'LIVE' | 'NONE';
}
interface CastMediaStatus {
  playerState: 'IDLE' | 'PLAYING' | 'BUFFERING' | 'PAUSED';
  idleReason?: 'CANCELLED' | 'INTERRUPTED' | 'FINISHED' | 'ERROR';
}
interface CastMediaPlayer {
  load(
    media: CastMediaInfo,
    options: { autoplay?: boolean; currentTime?: number },
    cb: (err: Error | null, status: CastMediaStatus) => void,
  ): void;
  on(event: 'status', cb: (status: CastMediaStatus) => void): void;
}
interface CastClient {
  connect(opts: { host: string; port?: number }, cb: () => void): void;
  launch(receiver: unknown, cb: (err: Error | null, player: CastMediaPlayer) => void): void;
  close(): void;
  on(event: 'error', cb: (err: Error) => void): void;
}

// @ts-expect-error - castv2-client lacks published types; kept untyped on purpose (no .d.ts).
import { Client as ClientCtor, DefaultMediaReceiver as DefaultMediaReceiverRef } from 'castv2-client';
import { safeCall } from './internal/safe-call.js';
const Client = ClientCtor as unknown as new () => CastClient;
const DefaultMediaReceiver = DefaultMediaReceiverRef as unknown;

// Cast app launcher generikus appId-vel (pl. Spotify Receiver = 705D30C6).
// Cél: a takeover után újraindítani egy Spotify Receiver app-ot a Cast Group-on,
// hogy a Spotify Connect visszategye a /me/player/devices listába.
export async function launchAppOnCast(args: {
  host: string;
  port: number;
  appId: string;
  timeoutMs?: number;
}): Promise<void> {
  const { host, port, appId, timeoutMs = 10000 } = args;
  return new Promise<void>((resolve, reject) => {
    const client = new Client();
    let settled = false;

    const safety = setTimeout(() => {
      if (settled) return;
      settled = true;
      safeCall(() => client.close(), 'cast-client.close');
      reject(new Error(`launchApp timeout (${timeoutMs}ms) for ${host}:${port} appId=${appId}`));
    }, timeoutMs);

    const finish = (err?: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(safety);
      safeCall(() => client.close(), 'cast-client.close');
      err ? reject(err) : resolve();
    };

    client.on('error', (err) => finish(err));
    client.connect({ host, port }, () => {
      // Egy minimal Receiver osztály, csak az APP_ID számít a Cast launch protokollnak.
      const ReceiverRef = (function () {} as unknown);
      (ReceiverRef as { APP_ID: string }).APP_ID = appId;
      try {
        client.launch(ReceiverRef as unknown, (launchErr: Error | null) => {
          if (launchErr) finish(new Error(`launch app ${appId} failed: ${launchErr.message}`));
          else finish();
        });
      } catch (err) {
        finish(err as Error);
      }
    });
  });
}

export interface PlayResult {
  startedAt: number;
  finishedAt: number;
  durationMs: number;
}

export interface PlayOptions {
  host: string;
  port: number;
  mediaUrl: string;
  timeoutMs?: number;
}

export async function playOnCast(opts: PlayOptions): Promise<PlayResult> {
  const { host, port, mediaUrl, timeoutMs = 30000 } = opts;

  return new Promise<PlayResult>((resolve, reject) => {
    const client = new Client();
    const startedAt = Date.now();
    let settled = false;

    const safetyTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      safeCall(() => client.close(), 'cast-client.close');
      reject(new Error(`Cast timeout (${timeoutMs}ms) — speaker did not finish playback`));
    }, timeoutMs);

    const settleOk = (result: PlayResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      safeCall(() => client.close(), 'cast-client.close');
      resolve(result);
    };

    const settleErr = (err: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      safeCall(() => client.close(), 'cast-client.close');
      reject(err);
    };

    client.on('error', (err) => settleErr(err));

    client.connect({ host, port }, () => {
      client.launch(DefaultMediaReceiver, (launchErr: Error | null, player: CastMediaPlayer) => {
        if (launchErr) {
          settleErr(new Error(`Launch failed: ${launchErr.message}`));
          return;
        }

        const media: CastMediaInfo = {
          contentId: mediaUrl,
          contentType: 'audio/mpeg',
          streamType: 'BUFFERED',
        };

        player.load(media, { autoplay: true }, (loadErr) => {
          if (loadErr) {
            settleErr(new Error(`Load failed: ${loadErr.message}`));
          }
        });

        player.on('status', (status: CastMediaStatus) => {
          if (status.playerState === 'IDLE' && status.idleReason === 'FINISHED') {
            const finishedAt = Date.now();
            settleOk({
              startedAt,
              finishedAt,
              durationMs: finishedAt - startedAt,
            });
          }
        });
      });
    });
  });
}
