import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { Operations } from '../../../_collections/utils/operations.js';
import { settings } from '../../../_collections/consts/settings.const.js';
import { joinVoiceChannel, VoiceConnection, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import { Guild, VoiceChannel } from 'discord.js';
import { DyFM_Error, DyFM_Log, second } from '@futdevpro/fsm-dynamo';
import { CCAP_MasterService } from '../../../_services/ccap.master-service.js';
/* import { CCAP_ControlService } from '../../../_services/ccap/ccap.control-service.js'; */

/**
 * CCAP Voice Connection Control Service
 * @author AI
 * @description Voice connection management and permissions handling
 */
export class CV_Connection_ControlService extends DyNTS_SingletonService {

  static getInstance(): CV_Connection_ControlService {
    return CV_Connection_ControlService.getSingletonInstance();
  }

  /* private readonly dias_MS: CCAP_DiAs_MasterService = CCAP_DiAs_MasterService.getInstance(); */
  /* private readonly ccap_CS: CCAP_ControlService = CCAP_ControlService.getInstance(); */
  private ccap_MS: CCAP_MasterService;

  get discordServer(): Guild {
    return this.ccap_MS?.discordServer;
  }
  
  private _voiceChannel: VoiceChannel;
  get voiceChannel(): VoiceChannel {
    return this._voiceChannel;
  }

  private connection: VoiceConnection;

  /**
   * Voice connection létrehozása
   * @returns VoiceConnection objektum
   */
  async createVoiceConnection(
    voiceChannelName: string,
  ): Promise<VoiceConnection> {
    try {
      this.ccap_MS ??= CCAP_MasterService.getInstance();

      this._voiceChannel ??= Operations.findChannelByName(
        this.discordServer.channels,
        voiceChannelName,
      ) as VoiceChannel;

      if (!this.voiceChannel) {
        DyFM_Log.error(
          '❌ Nem található a voice csatorna! Ellenőrizd a settings.ccapVoiceChannelName értékét.'
        );
        throw new Error('Voice csatorna nem található!');
      }

      if (!this._voiceChannel.isVoiceBased()) {
        DyFM_Log.error('❌ A voice csatorna nem voice-based!');
        throw new Error('A voice csatorna nem voice-based!');
      }

      if (!this.discordServer) {
        DyFM_Log.error('❌ A Discord szerver nem elérhető!');
        throw new Error('Discord szerver nem elérhető!');
      }

      if (!this.discordServer.voiceAdapterCreator) {
        DyFM_Log.error('❌ A voiceAdapterCreator nem elérhető!');
        throw new Error('voiceAdapterCreator nem elérhető!');
      }

      this.connection = joinVoiceChannel({
        channelId: this.voiceChannel.id,
        guildId: this.discordServer.id,
        adapterCreator: this.discordServer.voiceAdapterCreator,
        selfDeaf: false,
      });

      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
      //await entersState(this.connection, VoiceConnectionStatus.Ready, 30 * second);
      DyFM_Log.info('✅ Voice connection kész');

      return this.connection;
    } catch (error) {
      DyFM_Error.logSimple('❌ Hiba a voice connection létrehozásakor:', error);

      throw error;
    }
  }

  /**
   * Bot jogosultságok ellenőrzése és javítása
   */
  async validateAndFixBotPermissions(
    voiceChannelName: string,
  ): Promise<void> {
    try {
      this.ccap_MS ??= CCAP_MasterService.getInstance();

      this._voiceChannel ??= Operations.findChannelByName(
        this.discordServer.channels,
        voiceChannelName,
      ) as VoiceChannel;

      if (!this.voiceChannel) {
        DyFM_Log.error('❌ Nem található a voice csatorna! Ellenőrizd a settings.ccapVoiceChannelName értékét.');
        throw new Error('Voice csatorna nem található!');
      }

      if (!this.voiceChannel.isVoiceBased()) {
        DyFM_Log.error('❌ A voice csatorna nem voice-based!');
        throw new Error('A voice csatorna nem voice-based!');
      }

      const me = this.voiceChannel.guild.members.me;
      if (!me) {
        DyFM_Log.error('❌ A bot nem található a szerveren!');
        throw new Error('A bot nem található a szerveren!');
      }

      const permissions = me.permissions;
      if (!permissions.has('Connect')) {
        DyFM_Log.error('❌ A botnak nincs Connect jogosultsága a voice csatornához!');
        throw new Error('Nincs Connect jogosultság!');
      }

      if (!permissions.has('Speak')) {
        DyFM_Log.error('❌ A botnak nincs Speak jogosultsága a voice csatornához!');
        throw new Error('Nincs Speak jogosultság!');
      }
      
      if (!permissions.has('ViewChannel')) {
        DyFM_Log.error('❌ A botnak nincs ViewChannel jogosultsága a voice csatornához!');
        throw new Error('Nincs ViewChannel jogosultság!');
      }

      // Self-deaf állapot javítása
      if (me.voice.selfDeaf) {
        DyFM_Log.warn('⚠️  A bot self-deafened állapotban van, próbáljuk visszaállítani.');
        try {
          await me.voice.setDeaf(false, 'A botnak hallania kell a hangot.');
          DyFM_Log.info('✅ A bot self-deafened állapota visszaállítva.');
        } catch (err) {
          DyFM_Error.logSimple('❌ Nem sikerült visszaállítani a self-deafened állapotot:', err);

          throw new Error('Nem sikerült visszaállítani a self-deafened állapotot!');
        }
      }

      // Server-deaf állapot javítása
      if (me.voice.serverDeaf) {
        DyFM_Log.warn('⚠️  A bot szerver által lett némítva, próbáljuk visszaállítani.');
        try {
          await me.voice.setDeaf(false, 'A botnak hallania kell a hangot.');
          DyFM_Log.info('✅ A bot szerver-deaf állapota visszaállítva.');
        } catch (err) {
          DyFM_Error.logSimple('❌ Nem sikerült visszaállítani a szerver-deaf állapotot:', err);
          
          throw new Error('Nem sikerült visszaállítani a szerver-deaf állapotot!');
        }
      }

      DyFM_Log.info('✅ Bot jogosultságok ellenőrizve és javítva');
    } catch (error) {
      DyFM_Error.logSimple('❌ Hiba a bot jogosultságok ellenőrzésekor:', error);

      throw error;
    }
  }

  /**
   * Későbbi bot állapot ellenőrzése és javítása
   */
  async checkAndFixBotStateLater(
    voiceChannelName: string,
  ): Promise<void> {
    setTimeout(async () => {
      try {
        this.ccap_MS ??= CCAP_MasterService.getInstance();
        
        const channel = Operations.findChannelByName(
          this.discordServer.channels,
          voiceChannelName,
        );
        if (!channel) {
          DyFM_Log.error('❌ A bot nem található.');
          return;
        }

        const me = channel.guild.members.me;
        if (!me) {
          DyFM_Log.error('❌ A bot nem található.');
          return;
        }

        if (me.voice.selfDeaf) {
          DyFM_Log.warn('⚠️  A bot self-deafened, próbáljuk visszaállítani.');
          throw new Error('Bot is self-deafened');
        }

        if (me.voice.serverDeaf) {
          DyFM_Log.warn('⚠️  A bot szerver által lett némítva, visszaállítás...');
          await me.voice.setDeaf(false, 'A botnak hallania kell a hangot.');
          DyFM_Log.info('✅ A bot szerver-deaf állapota visszaállítva.');
        }
      } catch (err) {
        DyFM_Error.logSimple('❌ Nem sikerült visszaállítani a bot hangját:', err);
      }
    }, 2000);
  }

  /**
   * Voice connection lekérése
   */
  getConnection(): VoiceConnection {
    return this.connection;
  }

  /**
   * Voice connection megsemmisítése
   */
  destroyConnection(): void {
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
  }
} 