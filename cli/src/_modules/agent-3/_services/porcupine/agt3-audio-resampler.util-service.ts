import { agt3Config } from '../../_collections/consts/agt3-config.const.js';

/**
 * Agent 3 audio resampler utility service.
 * Converts audio from Discord format (48kHz stereo) to Porcupine format (16kHz mono).
 * Static utility service - no state.
 */
export class CCAP_Agt3_AudioResampler_UtilService {

  /**
   * Resample audio buffer from Discord format to Porcupine format.
   * Input: 48kHz, Stereo, 16-bit PCM
   * Output: 16kHz, Mono, 16-bit PCM
   */
  static resampleToPorcupineFormat(audioBuffer: Buffer): Buffer {
    try {
      // Extract samples from buffer (16-bit = 2 bytes per sample)
      const inputSamples: Int16Array = new Int16Array(audioBuffer.length / 2);
      for (let i: number = 0; i < inputSamples.length; i++) {
        inputSamples[i] = audioBuffer.readInt16LE(i * 2);
      }

      // Convert stereo to mono (average left and right channels)
      const monoLength: number = Math.floor(inputSamples.length / 2);
      const mono: Int16Array = new Int16Array(monoLength);

      for (let i: number = 0; i < monoLength; i++) {
        const left: number = inputSamples[i * 2];
        const right: number = inputSamples[i * 2 + 1];
        mono[i] = Math.round((left + right) / 2);
      }

      // Downsample from 48kHz to 16kHz (3:1 ratio)
      const outputLength: number = Math.floor(monoLength / 3);
      const output: Int16Array = new Int16Array(outputLength);

      // Simple decimation (take every 3rd sample)
      for (let i: number = 0; i < outputLength; i++) {
        output[i] = mono[i * 3];
      }

      // Convert back to Buffer
      const outputBuffer: Buffer = Buffer.alloc(outputLength * 2);
      for (let i: number = 0; i < outputLength; i++) {
        outputBuffer.writeInt16LE(output[i], i * 2);
      }

      return outputBuffer;
    } catch (error) {
      throw new Error(`Audio resampling failed: ${error}`);
    }
  }

  /**
   * Calculate frame size in bytes for given sample rate and frame length.
   */
  static calculateFrameSizeBytes(sampleRate: number, frameLengthMs: number): number {
    const samplesPerFrame: number = Math.floor((sampleRate * frameLengthMs) / 1000);
    return samplesPerFrame * 2; // 16-bit = 2 bytes per sample
  }

  /**
   * Calculate frame size in samples for given sample rate and frame length.
   */
  static calculateFrameSizeSamples(sampleRate: number, frameLengthMs: number): number {
    return Math.floor((sampleRate * frameLengthMs) / 1000);
  }

  /**
   * Get Porcupine frame size in bytes.
   */
  static getPorcupineFrameSizeBytes(): number {
    return this.calculateFrameSizeBytes(
      agt3Config.porcupine.sampleRate,
      agt3Config.porcupine.frameLengthMs
    );
  }

  /**
   * Get Porcupine frame size in samples.
   */
  static getPorcupineFrameSizeSamples(): number {
    return this.calculateFrameSizeSamples(
      agt3Config.porcupine.sampleRate,
      agt3Config.porcupine.frameLengthMs
    );
  }

  /**
   * Check if buffer has enough data for a complete frame.
   */
  static hasCompleteFrame(buffer: Buffer): boolean {
    const frameSizeBytes: number = this.getPorcupineFrameSizeBytes();
    return buffer.length >= frameSizeBytes;
  }
}
