/**
 * ElevenLabs API Configuration Interface
 * @author AI
 * @description Configuration options for ElevenLabs API client
 */
export interface EL_ApiConfig {
  /**
   * ElevenLabs API key
   */
  apiKey: string;
  
  /**
   * Base URL for ElevenLabs API
   * @default 'https://api.elevenlabs.io'
   */
  baseUrl?: string;
  
  /**
   * Default timeout for API requests in milliseconds
   * @default 30000
   */
  timeout?: number;
  
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Retry delay between attempts in milliseconds
   * @default 1000
   */
  retryDelay?: number;
  
  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
  
  /**
   * User agent string for API requests
   * @default 'ElevenLabs-NodeJS-Client'
   */
  userAgent?: string;
} 