// 🔊 BENT ÜLNI A HANG-CSATORNÁBAN — és ott is MARADNI.
//
// > **Owner (2026-09-07):** *„A voice-hoz: server: 1467012131378434151 channel:
// > 1489036734632034496 **mindig ülj bent** amikor megy a my assistant."*
//
// ⭐ A HATÓKÖR SZÁNDÉKOSAN EGY DOLOG (`one-function-is-enough`): **jelen lenni**.
// ⛔ NEM tartozik ide: felvétel, felismerés, beszéd-kimenet, visszhang-lejátszó. Azok az
// átemelt CCAP-szolgáltatások dolga (`CV_Recording_ControlService`, `CVO_*`), és ugyanerre a
// kapcsolatra fognak ráülni — a `@discordjs/voice` `joinVoiceChannel`-je guildenként **ugyanazt
// a kapcsolatot** adja vissza, tehát nem lesz belőle két párhuzamos belépés.
//
// 🔴 MIÉRT NEM AZ ÁTEMELT `CV_Connection_ControlService`-t hívjuk ide:
// az **név szerint** keresi a csatornát (`Operations.findChannelByName`), méghozzá a
// **cache-ből** és `isTextBased()` szűrővel — az owner viszont **azonosítót** adott, ami stabil
// (a név bármikor átírható). ⛔ Az átemelt kódhoz **nem nyúlunk** (`transplant-not-rewrite`),
// ezért nem azt igazítjuk, hanem mellé teszünk egy vékony, azonosító-alapú belépőt. A felvételi
// lánc változatlanul az eredeti kódon fog futni.

import {
  VoiceConnectionStatus,
  entersState,
  joinVoiceChannel,
  type VoiceConnection,
} from '@discordjs/voice';
import type { Client, Guild, VoiceBasedChannel } from 'discord.js';

import type { VoiceConnectionEvent } from './voice-connection-log.js';

/** Ennyit várunk a kapcsolat készre állására. Az átemelt kód is ennyivel dolgozott. */
export const VOICE_READY_TIMEOUT_MS: number = 30_000;

/**
 * Rövid kimaradásnál a Discord magától újracsatlakozik — ennyit adunk neki, mielőtt
 * elfogadjuk, hogy tényleg kiestünk.
 *
 * ⚠️ A `@discordjs/voice` dokumentált viselkedése: a `Disconnected` állapot **nem feltétlenül
 * végleges** (hálózati zökkenő, régió-váltás). Aki azonnal bontja a kapcsolatot, az egy
 * magától gyógyuló hibát véglegesít.
 */
export const RECONNECT_GRACE_MS: number = 5_000;

export interface VoicePresenceConfig {
  guildId: string;
  channelId: string;
}

export interface VoicePresenceResult {
  joined: boolean;
  /** A csatorna neve — ⭐ MÉRT érték, nem feltételezett. */
  channelName?: string;
  guildName?: string;
  detail: string;
  /** MIT KELL TENNI, ha nem sikerült. */
  remedy?: string;
}

/**
 * A konfiguráció beolvasása környezeti változókból.
 *
 * Hiányzó értéknél `null` — a hívó ilyenkor **leíró** hibát tud adni, nem üres sztringgel
 * próbálkozik tovább.
 */
export function readVoicePresenceConfig(): VoicePresenceConfig | null {
  const guildId: string = (process.env['MA_DISCORD_GUILD_ID'] ?? '').trim();
  const channelId: string = (process.env['MA_DISCORD_VOICE_CHANNEL_ID'] ?? '').trim();

  if (!guildId || !channelId) return null;

  return { guildId: guildId, channelId: channelId };
}

/**
 * Megmondja, alkalmas-e a csatorna a belépésre — és ha nem, **miért**.
 *
 * 🔴 MIÉRT KÜLÖN LÉPÉS: a `joinVoiceChannel` jogosultság-hiánynál nem hibázik azonnal, hanem
 * **időtúllépésig vár** a `Ready` állapotra. Az így kapott „30 mp alatt nem lett kész" üzenet
 * semmit nem mond arról, hogy **jog** hiányzik. Ezt előre meg lehet mérni, tehát meg is mérjük.
 */
export function describeChannelReadiness(channel: VoiceBasedChannel | null): {
  ready: boolean;
  detail: string;
  remedy?: string;
} {
  if (!channel) {
    return {
      ready: false,
      detail: 'A hang-csatorna nem található a megadott azonosítóval.',
      remedy: 'Ellenőrizd az MA_DISCORD_VOICE_CHANNEL_ID értékét, és hogy a bot látja-e a csatornát.',
    };
  }

  if (!channel.joinable) {
    return {
      ready: false,
      detail: `A(z) „${channel.name}" csatornába a bot NEM tud belépni (nincs Connect jog vagy tele van).`,
      remedy: 'Adj a botnak Connect jogot a csatornán, vagy ellenőrizd a férőhely-korlátot.',
    };
  }

  return { ready: true, detail: `A(z) „${channel.name}" csatorna nyitva áll.` };
}

/**
 * Belépés a hang-csatornába, és bent maradás.
 *
 * ⚠️ `selfDeaf: false` — **hallanunk kell**, különben a felvételi lánc üres adatfolyamot
 * kapna. *(Az átemelt kód is így csatlakozott.)*
 *
 * Hibát SOHA nem dob: a hang-jelenlét **nem döntheti meg** a szervert. A bukás leíró
 * eredményben jön vissza, teendővel együtt.
 */
export class VoiceChannelPresence {

  private connection: VoiceConnection | null = null;

  /** Igaz, amíg szándékosan bent akarunk lenni — a `leave()` állítja hamisra. */
  private wanted: boolean = false;

  /** Az utolsó sikeres belépés csatornája — a diagnosztikának. */
  private lastChannelName: string | null = null;

  /**
   * 🔴 A KAPCSOLAT-ESEMÉNYEK KIVEZETÉSE — ennélkül a kiesés MÉRHETETLEN.
   *
   * Mérve 2026-09-08: **24 belépés, 0 kilépés** a naplóban — mert a leválást egy néma
   * `catch` nyelte el. A hívó ezt a callbacket adja meg, és **minden** állapot-váltást megkap.
   *
   * ⚠️ Szándékosan `void`-ot ad vissza és soha nem dob: a **diagnosztika nem buktathatja
   * meg azt, amit megfigyel**.
   */
  private onEvent: ((event: VoiceConnectionEvent) => void) | null = null;

  /** Mikor szakadt el a kapcsolat — ebből jön a kiesés hossza. */
  private disconnectedAt: number | null = null;

  /** A kapcsolat-események figyelőjének beállítása. */
  setEventSink(sink: (event: VoiceConnectionEvent) => void): void {
    this.onEvent = sink;
  }

  /** Esemény kiküldése — ⛔ a figyelő hibája SOHA nem terjedhet tovább. */
  private emit(event: VoiceConnectionEvent): void {
    try {
      this.onEvent?.(event);
    } catch (error: unknown) {
      process.stderr.write(
        `[voice] a kapcsolat-esemény naplózása nem sikerült: `
        + `${error instanceof Error ? error.message : String(error)}
`,
      );
    }
  }

  /**
   * Az élő kapcsolat — a felvevő ezen ül rá.
   *
   * ⚠️ SZÁNDÉKOSAN csak olvasható, és `null`, ha nincs kapcsolat: a hívónak **látnia kell**,
   * hogy nincs mire rákötni, nem egy fél-működő objektumot kapnia.
   */
  get activeConnection(): VoiceConnection | null {
    return this.connection;
  }

  get isConnected(): boolean {
    return this.connection?.state.status === VoiceConnectionStatus.Ready;
  }

  get channelName(): string | null {
    return this.lastChannelName;
  }

  async join(client: Client, config: VoicePresenceConfig): Promise<VoicePresenceResult> {
    try {
      const guild: Guild = await client.guilds.fetch(config.guildId);
      const raw = await guild.channels.fetch(config.channelId);
      const channel: VoiceBasedChannel | null = raw?.isVoiceBased() ? raw : null;
      const readiness = describeChannelReadiness(channel);

      if (!readiness.ready || !channel) {
        return {
          joined: false,
          guildName: guild.name,
          detail: readiness.detail,
          ...(readiness.remedy ? { remedy: readiness.remedy } : {}),
        };
      }

      this.wanted = true;
      this.connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      this.watchForDrop();

      await entersState(this.connection, VoiceConnectionStatus.Ready, VOICE_READY_TIMEOUT_MS);
      this.lastChannelName = channel.name;
      this.disconnectedAt = null;
      this.emit({ kind: 'joined', channelName: channel.name });

      return {
        joined: true,
        guildName: guild.name,
        channelName: channel.name,
        detail: `Bent ülök a(z) „${channel.name}" csatornában (${guild.name}).`,
      };
    } catch (error: unknown) {
      const detail: string = error instanceof Error ? error.message : String(error);

      this.emit({ kind: 'join-failed', reason: detail });

      return {
        joined: false,
        detail: `A hang-csatornába belépés ELBUKOTT: ${detail}`,
        remedy: 'Ellenőrizd a bot-tokent, a szerver- és csatorna-azonosítót, és a Connect jogot.',
      };
    }
  }

  /**
   * Kilépés — ⚠️ CSAK szándékos leállásnál.
   *
   * A `wanted` hamisra állítása előbb történik, mint a bontás: különben a leválás-figyelő
   * **újra beléptetne** minket abba a csatornába, amiből épp kifelé tartunk.
   */
  leave(): void {
    const wasConnected: boolean = this.connection !== null;

    this.wanted = false;
    this.connection?.destroy();
    this.connection = null;

    // ⚠️ Csak akkor jelentünk kilépést, ha tényleg bent voltunk — különben a leállási
    // útvonalon minden indulás egy hamis „kiléptem" sort termelne.
    if (wasConnected) {
      this.emit({
        kind: 'left',
        ...(this.lastChannelName ? { channelName: this.lastChannelName } : {}),
        reason: 'szándékos leállás (leave)',
      });
    }
  }

  /**
   * A leválás kezelése.
   *
   * 🔴 A DÖNTÉS, AMI SZÁMÍT: a `Disconnected` állapot **nem azonnal végleges**. Előbb adunk a
   * Discordnak esélyt a magától-újracsatlakozásra (`RECONNECT_GRACE_MS`), és csak ha az sem
   * hozza vissza, akkor bontunk. Aki azonnal bont, az egy magától gyógyuló zökkenőt tesz
   * végleges kieséssé — és a csatorna némán üres marad.
   */
  private watchForDrop(): void {
    this.connection?.on(VoiceConnectionStatus.Disconnected, (): void => {
      if (!this.wanted || !this.connection) return;

      // 🔴 ITT VOLT A NÉMA PONT: eddig a leválásról SEMMILYEN nyom nem keletkezett.
      this.disconnectedAt = Date.now();
      this.emit({
        kind: 'disconnected',
        ...(this.lastChannelName ? { channelName: this.lastChannelName } : {}),
        reason: `a Discord bontotta a kapcsolatot — ${RECONNECT_GRACE_MS / 1000} mp türelmi idő indul`,
      });

      void Promise.race([
        entersState(this.connection, VoiceConnectionStatus.Signalling, RECONNECT_GRACE_MS),
        entersState(this.connection, VoiceConnectionStatus.Connecting, RECONNECT_GRACE_MS),
      ]).then((): void => {
        // ⭐ Magától visszajött — ez a „nem is volt baj" eset, de LÁTSZANIA kell: ebből derül
        // ki, hogy a csatorna zajos, még ha nem is esett ki végleg.
        this.emit({
          kind: 'reconnected',
          ...(this.lastChannelName ? { channelName: this.lastChannelName } : {}),
          offlineMs: this.sinceDisconnect(),
        });
        this.disconnectedAt = null;
      }).catch((error: unknown): void => {
        // 🔴 A VALÓDI KIESÉS. ⛔ Ezt eddig egy üres `catch` nyelte el.
        this.emit({
          kind: 'dropped',
          ...(this.lastChannelName ? { channelName: this.lastChannelName } : {}),
          offlineMs: this.sinceDisconnect(),
          reason: `a türelmi időn belül nem jött vissza (${error instanceof Error ? error.message : String(error)})`,
        });
        this.disconnectedAt = null;
        this.connection?.destroy();
        this.connection = null;
      });
    });
  }

  /** Mennyi ideje tart a leválás (ms). `0`, ha nem tudjuk — ⛔ soha nem `NaN`. */
  private sinceDisconnect(): number {
    return this.disconnectedAt === null ? 0 : Date.now() - this.disconnectedAt;
  }
}
