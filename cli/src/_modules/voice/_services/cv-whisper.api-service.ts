import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { FormData, File } from 'formdata-node';
import { envKeys } from '../../../_collections/consts/env-keys.const.js';
import { promises as fsPromises } from 'fs';
import { CV_WhisperResponse } from '../_models/cv-whisper-response.interface.js';
import { CV_whisperConfig } from '../_collections/consts/cv-whisper.const.js';

/**
 * CCAP Whisper szolgáltatás
 * @author AI
 * @description OpenAI Whisper API kezelése
 */
export class CV_Whisper_ApiService extends DyNTS_SingletonService {
  
  static getInstance(): CV_Whisper_ApiService {
    return CV_Whisper_ApiService.getSingletonInstance();
  }

  /**
   * WAV fájl feldolgozása Whisper API-val
   * @param filename - WAV fájl útvonala
   * @param userId - Discord felhasználó ID
   * @returns Whisper válasz vagy null ha nincs átirat
   */
  async processWavFileWithWhisper(
    filename: string, 
    userId: string,
  ): Promise<CV_WhisperResponse | null> {
    try {
      // Fájl létezésének ellenőrzése
      const stats = await fsPromises.stat(filename);
      if (stats.size === 0) {
        DyFM_Log.warn(`⚠️  A WAV fájl üres (${userId}): ${filename}`);
        return null;
      }
      
      if (stats.size < 1000) {
        DyFM_Log.warn(`⚠️  A WAV fájl nagyon kicsi (${stats.size} byte) (${userId}): ${filename}`);
        return null;
      }
      
      DyFM_Log.testInfo(
        `🎤 WAV fájl feldolgozása Whisper-rel (${userId}): ${filename} (${stats.size} byte)`
      );
      
      // WAV fájl beolvasása
      const wavBuffer = await fsPromises.readFile(filename);
      
      // OpenAI Whisper API hívás
      const transcription = await this.transcribeAudio(wavBuffer);
      
      if (transcription.text && transcription.text.trim()) {
        DyFM_Log.testSuccess('result:\n', transcription);
        DyFM_Log.success(`📝 Átirat (${userId}): ${transcription.text}`);
        return transcription;
      } else {
        DyFM_Log.warn(`🔇 Nincs átirat (${userId})`);
        throw new Error(`❌ Nincs átirat (${userId})`);
        return null;
      }      
    } catch (err) {
      DyFM_Log.error(`❌ Hiba a WAV fájl feldolgozásakor (${userId}):`, err);
      throw err;
    }
  }

  /**
   * OpenAI Whisper API hívás
   * @param wavBuffer - WAV audio buffer
   * @returns Whisper válasz
   */
  async transcribeAudio(wavBuffer: Buffer): Promise<CV_WhisperResponse> {
    if (!wavBuffer || wavBuffer.length === 0) {
      throw new Error('❌ Üres WAV buffer az OpenAI híváshoz!');
    }

    // Ellenőrizzük a minimális méretet
    if (wavBuffer.length < 1000) {
      throw new Error('❌ Túl kicsi WAV buffer!');
    }

    // Ellenőrizzük a maximális méretet (Whisper API limit: 25MB)
    if (wavBuffer.length > 25 * 1024 * 1024) {
      throw new Error('❌ Túl nagy WAV buffer! (max 25MB)');
    }

    // Ellenőrizzük a WAV fejlécet
    if (wavBuffer.length < 44) {
      throw new Error('❌ Érvénytelen WAV fájl! (túl rövid)');
    }

    const riffHeader = wavBuffer.toString('ascii', 0, 4);
    const waveHeader = wavBuffer.toString('ascii', 8, 12);
    
    if (riffHeader !== 'RIFF' || waveHeader !== 'WAVE') {
      throw new Error('❌ Érvénytelen WAV fájl formátum!');
    }

    const form = new FormData();
    form.append('file', new File([wavBuffer], 'audio.wav', { type: 'audio/wav' }));
    form.append('model', CV_whisperConfig.model);
    form.append('language', CV_whisperConfig.language);
    form.append('temperature', String(CV_whisperConfig.temperature));
    form.append('response_format', CV_whisperConfig.responseFormat);
    
    try {
      DyFM_Log.info('🚀 OpenAI Whisper API hívás indítása...');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${envKeys.openAi.apiKey}`,
          'OpenAI-Organization': envKeys.openAi.organization,
        },
        body: form as any,
      });
      
      if (!response.ok) {
        const errText = await response.text();
        DyFM_Log.error('❌ OpenAI API hiba:', response.status, errText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errText}`);
      }
      
      const result = await response.json();
      DyFM_Log.info('✅ OpenAI Whisper API válasz:', result);
      
      if (!result || !result.text) {
        DyFM_Log.warn('⚠️  Az OpenAI válasz nem tartalmazott szöveget!');
      }
      
      return result as CV_WhisperResponse;
    } catch (err) {
      DyFM_Log.error('❌ Hiba az OpenAI híváskor:', err);
      throw err;
    }
  }
} 