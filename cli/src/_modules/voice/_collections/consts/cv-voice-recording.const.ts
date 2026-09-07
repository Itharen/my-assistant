import { second } from '@futdevpro/fsm-dynamo';

/**
 * Voice Recording Configuration
 */
export const CV_voiceRecordingConfig = {
  // === ALAPVETŐ BEÁLLÍTÁSOK ===
  chunkLength: 10 * second,         // 10 másodperc
  minLengthByte: 2500,          // kb. 0.1 mp
  samplingFrequency: 48000,      // Discord
  channels: 2,                    // stereo
  bitDepth: 16,
  silenceDuration: 300,
  
  // === ALAPVETŐ DETECTION BEÁLLÍTÁSOK ===
  speechThreshold: 0.008,        // RMS küszöbérték beszéd észleléshez (0-1) - ALACSONYABB
  
  // === ÁLLAPOT KEZELÉS ===
  speechConfirmationFrames: 2,  // Hány frame kell beszéd megerősítéshez
  silenceConfirmationFrames: 3, // Hány frame kell csend megerősítéshez
  volumeBufferSize: 50,         // Volume buffer méret
  
  // === IDŐZÍTÉS ===
  minSpeechDuration: 100,    // Minimum beszéd idő (ms)
  maxRecordingDuration: 30 * second, // Maximum felvétel idő (ms)
  maxSpeechDuration: 30 * second, // Maximum beszéd idő (ms)
  
  // === INPUT MERGING ===
  enableInputMerging: true,     // Input merging engedélyezése
  mergeWaitTime: second,       // Merge várakozási idő (ms)
  minMergeDuration: 100,     // Minimum merge idő (ms)
  maxMergeDuration: 30 * second,   // Maximum merge idő (ms)
  
  // === ZCR VALIDÁCIÓ ===
  /* zcrValidationThreshold: 0.3, */  // Minimum átlagos ZCR érték Whisper küldéshez (0-1)
  
  // === ZCR SZŰRÉS ===
  zcrFilteringCount: 10,        // Hány egymást követő nem-zöld frame után távolítjuk el mindent
  
  // === ADAPTIVE ZCR ===
  zcrAdaptiveHighRatio: 0.8,   // Magas ZCR arány küszöb (80%)
  zcrAdaptiveMediumRatio: 0.6, // Közepes ZCR arány küszöb (60%)
  zcrAdaptiveHighMultiplier: 0.8, // Magas arány szorzó (80% of base threshold)
  zcrAdaptiveMediumMultiplier: 0.9, // Közepes arány szorzó (90% of base threshold)
  
  // === WHISPER SPLITTING ===
  whisperSplitSearchStart: 20 * second, // 20s után kezdjük keresni a szünetet
  
  // === DEBUG ===
  debug_volumeLogging: false,    // Volume debug logging
  debug_stateChanges: true,     // Állapot változás logging
  debug_merging: false,           // Merge debug logging
  analysisBarLog: true,        // Vizuális sáv logolása
  
  // === ZCR BLOKK ÖSSZEVONÁSI KÜSZÖB ===
  /* zcrMaxRedGapLength: 2, // Két zöld blokk közötti maximális piros szünet hossza (frame), ami még összevonható
  zcrMinGreenBlockLength: 10, // Minimum zöld blokk hossz (frame), amit külön szegmensként elfogadunk */
}; 