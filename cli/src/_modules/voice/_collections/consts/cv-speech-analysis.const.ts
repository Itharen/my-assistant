/**
 * Speech Analysis Configuration
 */
export const CV_speechAnalysisConfig = {
  // === ALAPVETŐ DETECTION BEÁLLÍTÁSOK ===
  speechTreshold: 0.008,        // RMS küszöbérték beszéd észleléshez (0-1)
  silecndeTreshold: 0.005,       // RMS küszöbérték csend észleléshez (0-1)
  
  // === ZCR ALAPÚ BESZÉD DETEKTÁLÁS ===
  minZcrNormalized: 0.05,       // Minimum normalizált ZCR (0-1)
  maxZcrNormalized: 0.8,        // Maximum normalizált ZCR (0-1)
  zcrGoodRangeMin: 0.05,       // Jó ZCR tartomány minimum
  zcrGoodRangeMax: 0.8,        // Jó ZCR tartomány maximum
  zcrAcceptableMin: 0.03,       // Elfogadható ZCR minimum
  zcrAcceptableMax: 0.9,        // Elfogadható ZCR maximum
  
  // === FEJLETT HANG ELEMZÉS ===
  minFrequencyRange: 80,        // Minimum frekvencia (Hz) - emberi hang
  maxFrequencyRange: 300,       // Maximum frekvencia (Hz) - emberi hang
  minZeroCrossings: 5,          // Minimum zero crossing rate
  maxZeroCrossings: 300,        // Maximum zero crossing rate
  
  // === HANG MINŐSÉG ELLENŐRZÉS ===
  minVariance: 100,              // Minimum variancia (zaj szűrés)
  minPeakCount: 1,              // Minimum csúcsok száma
  maxSilenceRatio: 0.9,         // Maximum csend arány (90%)
  
  // === WHITE NOISE SZŰRÉS ===
  whiteNoiseThreshhold: 0.98,    // White noise korreláció küszöb
  minEnergyVariance: 50,        // Minimum energia variancia
  
  // === BESZÉD MINŐSÉG ===
  minSpeechQuality: 0.3,        // Minimum beszéd minőség pontszám
  minVoiceActivity: 0.2,        // Minimum hang aktivitás pontszám
}; 