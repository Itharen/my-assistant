import { promises as fs } from 'fs';
import * as path from 'path';
import { EL_apiConfig } from './consts/el-api.const.js';

/**
 * ElevenLabs Utilities
 * @author AI
 * @description Common utility functions for ElevenLabs API integration
 */
export class EL_Utils {
  /**
   * Validates audio file format
   * @param filename - Audio file path
   * @returns true if format is supported
   */
  static isValidAudioFormat(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase().slice(1);
    return EL_apiConfig.supportedFormats.includes(ext);
  }

  /**
   * Validates file size
   * @param filePath - File path to check
   * @returns true if file size is within limits
   */
  static async isValidFileSize(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size >= EL_apiConfig.minFileSize && 
             stats.size <= EL_apiConfig.maxFileSize;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reads audio file as buffer
   * @param filePath - Path to audio file
   * @returns Audio buffer
   */
  static async readAudioFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
  }

  /**
   * Validates API key format
   * @param apiKey - API key to validate
   * @returns true if API key format is valid
   */
  static isValidApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && 
           apiKey.length > 0/*  && 
           apiKey.startsWith('xi-api-') */;
  }

  /**
   * Formats error message
   * @param error - Error object
   * @returns Formatted error message
   */
  static formatErrorMessage(error: any): string {
    // Handle ElevenLabs API error responses
    if (error.response?.data) {
      const data = error.response.data;
      if (data.detail) {
        // Handle structured error response from ElevenLabs
        if (typeof data.detail === 'object') {
          if (data.detail.message) {
            return `Status code: ${error.response.status}\nBody: ${JSON.stringify(data, null, 2)}`;
          }
          return `Status code: ${error.response.status}\nBody: ${JSON.stringify(data, null, 2)}`;
        }
        return `Status code: ${error.response.status}\nBody: ${JSON.stringify(data, null, 2)}`;
      }
      if (data.message) {
        return `Status code: ${error.response.status}\nBody: ${JSON.stringify(data, null, 2)}`;
      }
    }
    if (error.status && error.body) {
      // Handle error with status and body
      return `Status code: ${error.status}\nBody: ${JSON.stringify(error.body, null, 2)}`;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  /**
   * Calculates processing time
   * @param startTime - Start timestamp
   * @returns Processing time in milliseconds
   */
  static calculateProcessingTime(startTime: number): number {
    return Date.now() - startTime;
  }

  /**
   * Validates temperature value
   * @param temperature - Temperature value to validate
   * @returns true if temperature is valid
   */
  static isValidTemperature(temperature: number): boolean {
    return typeof temperature === 'number' && 
           temperature >= 0.0 && 
           temperature <= 1.0;
  }

  /**
   * Sanitizes text for API requests
   * @param text - Text to sanitize
   * @returns Sanitized text
   */
  static sanitizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }
} 