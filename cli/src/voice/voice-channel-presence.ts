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

      return {
        joined: true,
        guildName: guild.name,
        channelName: channel.name,
        detail: `Bent ülök a(z) „${channel.name}" csatornában (${guild.name}).`,
      };
    } catch (error: unknown) {
      const detail: string = error instanceof Error ? error.message : String(error);

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
    this.wanted = false;
    this.connection?.destroy();
    this.connection = null;
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

      void Promise.race([
        entersState(this.connection, VoiceConnectionStatus.Signalling, RECONNECT_GRACE_MS),
        entersState(this.connection, VoiceConnectionStatus.Connecting, RECONNECT_GRACE_MS),
      ]).catch((): void => {
        // Nem jött vissza magától — bontunk, hogy a következő indítás tiszta lappal kezdjen.
        this.connection?.destroy();
        this.connection = null;
      });
    });
  }
}
