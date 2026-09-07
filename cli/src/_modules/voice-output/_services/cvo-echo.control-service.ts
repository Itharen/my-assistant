import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log, DyFM_Poll, DyFM_Random, DyFM_Async } from '@futdevpro/fsm-dynamo';
import { 
  createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior, AudioPlayer
} from '@discordjs/voice';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import * as path from 'path';
import { settings } from '../../../_collections/consts/settings.const.js';

/**
 * CCAP Voice Echo Control Service
 * @author AI
 * @description Echo player and audio playback management
 */
export class CVO_Echo_ControlService extends DyNTS_SingletonService {
  
  static getInstance(): CVO_Echo_ControlService {
    return CVO_Echo_ControlService.getSingletonInstance();
  }

  private _echoPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });
  get echoPlayer(): AudioPlayer {
    return this._echoPlayer;
  }

  private echoQueue: Buffer[] = [];
  private isEchoPlaying = false;

  /**
   * Echo player lekérése
   */
  getEchoPlayer(): AudioPlayer {
    return this._echoPlayer;
  }

  /**
   * Echo player események beállítása
   */
  setupEchoPlayerEvents(): void {
    this._echoPlayer.on(AudioPlayerStatus.Idle, () => {
      this.isEchoPlaying = false;
      this.playNextEchoChunk();
    });
    
    this._echoPlayer.on('error', (error) => {
      DyFM_Log.error('❌ Echo player hiba:', error);
      this.isEchoPlaying = false;
      this.playNextEchoChunk();
    });
  }

  /**
   * Echo queue-ba hozzáadás
   * @param chunk - audio chunk
   */
  addToEchoQueue(chunk: Buffer): void {
    try {
      this.echoQueue.push(chunk);
      
      // Ha nem játszik semmi, indítsuk el a lejátszást
      if (!this.isEchoPlaying) {
        this.playNextEchoChunk();
      }
    } catch (error) {
      DyFM_Log.error('❌ Hiba az echo queue hozzáadásakor:', error);
    }
  }

  /**
   * Következő echo chunk lejátszása
   */
  private playNextEchoChunk(): void {
    if (this.echoQueue.length === 0) {
      DyFM_Log.info('🔊 Echo queue üres');
      this.isEchoPlaying = false;
      return;
    }
    
    const chunk = this.echoQueue.shift();
    if (!chunk) return;
    
    try {
      this.isEchoPlaying = true;
      
      // Audio stream létrehozása
      const audioStream = Readable.from(chunk);
      
      // Audio resource létrehozása
      const resource = createAudioResource(audioStream, {
        inlineVolume: true
      });
      
      // Lejátszás
      this._echoPlayer.play(resource);
      
    } catch (error) {
      DyFM_Log.error('❌ Hiba az echo chunk lejátszásakor:', error);
      this.isEchoPlaying = false;
      this.playNextEchoChunk(); // Következő chunk próbálása
    }
  }

  /**
   * Teszt hang lejátszása
   */
  async playGreetings(): Promise<void> {
    try {
      DyFM_Log.info('🔊 Teszt hang lejátszása...');

      const startMsgs = [
        'abrakadabra.mp3',
        'ahoy.mp3',
        'alright.mp3',
        'boots1.mp3',
        'boots2.mp3',
        'heythere.mp3',
        'shift.mp3',
        'yo.mp3',
        'yoyo.mp3',
      ];
      
      const testFile = path.join(
        process.cwd(), 
        'src', 
        '_assets',
        'greets',
        DyFM_Random.getRandomListElement(startMsgs)
      );
      /* DyFM_Log.log(`📁 Teszt fájl útvonal: ${testFile}`); */
      
      // Fájl létezésének ellenőrzése
      try {
        const fs = require('fs').promises;
        await fs.access(testFile);
        /* DyFM_Log.log('✅ Teszt fájl megtalálható'); */
      } catch (err) {
        DyFM_Log.error('❌ Teszt fájl nem található:', testFile);
        return;
      }
      
      // Audio stream létrehozása
      const audioStream = createReadStream(testFile);
      
      // Audio resource létrehozása
      const resource = createAudioResource(audioStream, {
        inlineVolume: true
      });
      
      // Hangerej beállítása (0.0 - 1.0 között, ahol 1.0 a maximális)
      resource.volume?.setVolume(settings.ccap.greetingsVolume);
      
      DyFM_Log.log('✅ Teszt audio resource létrehozva');
      
      // Lejátszás
      this._echoPlayer.play(resource);

      DyFM_Log.info('🎵 Teszt hang lejátszás indítva');
      await DyFM_Async.wait(resource.playbackDuration);
      await DyFM_Async.waitUntil(() => this._echoPlayer.state.status === AudioPlayerStatus.Idle);
      DyFM_Log.success('🎵 Teszt hang lejátszás befejeződött');
    } catch (error) {
      DyFM_Log.error('❌ Hiba a teszt hang lejátszásakor:', error);
    }
  }

  /**
   * Echo queue tisztítása
   */
  clearEchoQueue(): void {
    this.echoQueue = [];
    this.isEchoPlaying = false;
  }
} 