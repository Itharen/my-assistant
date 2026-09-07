import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { CV_fileManagementConfig } from '../_collections/consts/cv-file-management.const.js';

/**
 * CCAP Voice File Management Service
 * @author AI
 * @description Handles WAV file operations, cleanup, and management
 */
export class CV_File_ControlService extends DyNTS_SingletonService {
  static getInstance(): CV_File_ControlService {
    return CV_File_ControlService.getSingletonInstance();
  }

  private readonly recordingsDir: string = path.join(
    process.cwd(), 
    CV_fileManagementConfig.recordingDir
  );

  /**
   * Recordings könyvtár inicializálása
   */
  async initializeRecordingsDirectory(): Promise<void> {
    try {
      // Könyvtár tisztítása indításkor
      await this.clearRecordingsFolder();
      
      // Könyvtár létrehozása ha nem létezik
      if (!existsSync(this.recordingsDir)) {
        mkdirSync(this.recordingsDir, { recursive: true });
        DyFM_Log.info(`📁 Recordings könyvtár létrehozva: ${this.recordingsDir}`);
      }
    } catch (error) {
      DyFM_Log.error('❌ Hiba a recordings könyvtár inicializálása során:', error);
      throw error;
    }
  }

  /**
   * Recordings könyvtár tisztítása indításkor
   */
  private async clearRecordingsFolder(): Promise<void> {
    try {
      if (existsSync(this.recordingsDir)) {
        const files = await fs.readdir(this.recordingsDir);
        for (const file of files) {
          const filePath = path.join(this.recordingsDir, file);
          await fs.unlink(filePath);
        }
        DyFM_Log.info(`🧹 Recordings könyvtár tisztítva: ${files.length} fájl törölve`);
      }
    } catch (error) {
      DyFM_Log.error('❌ Hiba a recordings könyvtár tisztítása során:', error);
    }
  }

  /**
   * WAV fájl útvonal generálása
   * @param userId - Felhasználó ID
   * @returns WAV fájl útvonala
   */
  generateWavFilePath(userId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(this.recordingsDir, `recording-${userId}-${timestamp}.wav`);
  }

  /**
   * WAV fájl törlése és cleanup
   * @param filename - Törlendő fájl útvonala
   * @param userId - Felhasználó ID (logging céljából)
   */
  async cleanupWavFile(filename: string, userId: string): Promise<void> {
    try {
      // Ellenőrizzük, hogy a fájl létezik-e
      await fs.access(filename);
      
      // Fájl törlése
      await fs.unlink(filename);
      DyFM_Log.info(`🗑️ WAV fájl sikeresen törölve (${userId}): ${filename}`);
      
    } catch (err) {
      if ((err as any).code === 'ENOENT') {
        // Fájl nem létezik - ez rendben van
        DyFM_Log.info(`📁 WAV fájl már nem létezik (${userId}): ${filename}`);
      } else {
        // Egyéb hiba - próbáljuk meg újra
        DyFM_Log.warn(`⚠️  Nem sikerült törölni a WAV fájlt (${userId}): ${filename}`, err);
        
        // Retry mechanism
        await this.retryFileDeletion(filename, userId, CV_fileManagementConfig.fileRetryAttempts);
      }
    }
  }

  /**
   * Fájl törlés újrapróbálkozás mechanizmusa
   * @param filename - Törlendő fájl útvonala
   * @param userId - Felhasználó ID
   * @param maxRetries - Maximális újrapróbálkozások száma
   */
  private async retryFileDeletion(filename: string, userId: string, maxRetries: number): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await new Promise(
          resolve => setTimeout(resolve, CV_fileManagementConfig.fileRetryDelay * attempt)
        ); // Progresszív várakozás
        await fs.unlink(filename);
        DyFM_Log.info(
          `🗑️ WAV fájl törölve újrapróbálkozás után (${userId}, attempt ${attempt}): ${filename}`
        );
        return;
      } catch (err) {
        if ((err as any).code === 'ENOENT') {
          DyFM_Log.info(
            `📁 WAV fájl már törölve lett (${userId}, attempt ${attempt}): ${filename}`
          );
          return;
        }
        
        if (attempt === maxRetries) {
          DyFM_Log.error(
            `❌ WAV fájl törlése sikertelen ${maxRetries} próbálkozás után ` +
              `(${userId}): ${filename}`, 
            err
          );
        } else {
          DyFM_Log.warn(
            `⚠️  WAV fájl törlési hiba (${userId}, attempt ${attempt}/${maxRetries}): ${filename}`, 
            err
          );
        }
      }
    }
  }

  /**
   * Összes WAV fájl törlése a recordings könyvtárból
   * @param userId - Opcionális felhasználó ID szűréshez
   */
  async cleanupAllWavFiles(userId?: string): Promise<void> {
    try {
      if (!existsSync(this.recordingsDir)) {
        return; // Könyvtár nem létezik
      }

      const files = await fs.readdir(this.recordingsDir);
      const wavFiles = files.filter(file => file.endsWith('.wav'));
      
      if (userId) {
        // Csak a megadott felhasználó fájljait töröljük
        const userWavFiles = wavFiles.filter(file => file.includes(`-${userId}-`));
        for (const file of userWavFiles) {
          const filepath = path.join(this.recordingsDir, file);
          await this.cleanupWavFile(filepath, userId);
        }
      } else {
        // Összes WAV fájl törlése
        for (const file of wavFiles) {
          const filepath = path.join(this.recordingsDir, file);
          await this.cleanupWavFile(filepath, 'cleanup');
        }
      }
      
      DyFM_Log.info(`🧹 WAV fájlok cleanup befejezve${userId ? ` (${userId})` : ''}`);
      
    } catch (err) {
      DyFM_Log.error('❌ Hiba a WAV fájlok cleanup során:', err);
    }
  }

  /**
   * WAV fájl validálása
   * @param filename - WAV fájl útvonala
   * @param userId - Felhasználó ID
   * @returns true ha a fájl érvényes
   */
  async validateWavFile(filename: string, userId: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filename);
      
      if (stats.size === 0) {
        DyFM_Log.warn(`⚠️  A WAV fájl üres (${userId}): ${filename}`);
        return false;
      }
      
      if (stats.size < 1000) {
        DyFM_Log.warn(`⚠️  A WAV fájl nagyon kicsi (${stats.size} byte) (${userId}): ${filename}`);
        return false;
      }
      
      DyFM_Log.info(`✅ WAV fájl validálva (${userId}): ${filename} (${stats.size} byte)`);
      return true;
      
    } catch (err) {
      DyFM_Log.error(`❌ Hiba a WAV fájl validálásakor (${userId}):`, err);
      return false;
    }
  }

  /**
   * WAV fájl beolvasása
   * @param filename - WAV fájl útvonala
   * @param userId - Felhasználó ID
   * @returns WAV buffer vagy null ha hiba
   */
  async readWavFile(filename: string, userId: string): Promise<Buffer | null> {
    try {
      // Fájl validálása
      const isValid = await this.validateWavFile(filename, userId);
      if (!isValid) {
        return null;
      }
      
      // WAV fájl beolvasása
      const wavBuffer = await fs.readFile(filename);
      DyFM_Log.info(`📖 WAV fájl beolvasva (${userId}): ${filename} (${wavBuffer.length} byte)`);
      
      return wavBuffer;
      
    } catch (err) {
      DyFM_Log.error(`❌ Hiba a WAV fájl beolvasásakor (${userId}):`, err);
      return null;
    }
  }

  /**
   * WAV fájl méret ellenőrzése
   * @param filename - WAV fájl útvonala
   * @returns Fájl méret byte-ban
   */
  async getWavFileSize(filename: string): Promise<number> {
    try {
      const stats = await fs.stat(filename);
      return stats.size;
    } catch (err) {
      DyFM_Log.error(`❌ Hiba a WAV fájl méret lekérdezésekor:`, err);
      return 0;
    }
  }

  /**
   * Recordings könyvtár statisztikák
   * @returns Könyvtár statisztikák
   */
  async getRecordingsStats(): Promise<{ totalFiles: number; totalSize: number; wavFiles: number }> {
    try {
      if (!existsSync(this.recordingsDir)) {
        return { totalFiles: 0, totalSize: 0, wavFiles: 0 };
      }

      const files = await fs.readdir(this.recordingsDir);
      const wavFiles = files.filter(file => file.endsWith('.wav'));
      
      let totalSize = 0;
      for (const file of wavFiles) {
        const filepath = path.join(this.recordingsDir, file);
        const stats = await fs.stat(filepath);
        totalSize += stats.size;
      }
      
      return {
        totalFiles: files.length,
        totalSize,
        wavFiles: wavFiles.length
      };
      
    } catch (err) {
      DyFM_Log.error('Hiba a recordings statisztikák lekérdezésekor:', err);
      return { totalFiles: 0, totalSize: 0, wavFiles: 0 };
    }
  }
} 