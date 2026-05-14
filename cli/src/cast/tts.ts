// TTS audio generálás Microsoft Edge Read-Aloud endpointján keresztül.
//
// msedge-tts ingyenes Node lib, Microsoft Edge böngésző "Read Aloud" feature
// publikus WebSocket endpoint-ját használja — nincs API kulcs, no auth, neural
// voice quality. Magyar férfi default: hu-HU-TamasNeural.
//
// FOSS / no-paid-solutions / build-it-ourselves elveknek megfelel: publikus
// endpoint, saját wrapper kód. A risk: Microsoft elméletileg le tudná tiltani
// — ekkor a fallback Translate gTTS robotikus magyar női hangra.

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { Readable } from 'node:stream';
import { safeCall } from './internal/safe-call.js';

export interface TtsOptions {
  text: string;
  voice?: string;
  lang?: string;
}

const DEFAULT_VOICE_BY_LANG: Record<string, string> = {
  hu: 'hu-HU-TamasNeural',
  en: 'en-US-GuyNeural',
  de: 'de-DE-ConradNeural',
  fr: 'fr-FR-HenriNeural',
};

const FALLBACK_VOICE = 'hu-HU-TamasNeural';

export function resolveVoice(opts: TtsOptions): string {
  if (opts.voice && opts.voice.length > 0) return opts.voice;
  const lang = opts.lang ?? 'hu';
  return DEFAULT_VOICE_BY_LANG[lang] ?? FALLBACK_VOICE;
}

export async function fetchTtsMp3(opts: TtsOptions): Promise<Buffer> {
  if (opts.text.length === 0) {
    throw new Error('TTS text is empty');
  }

  const voice = resolveVoice(opts);
  const tts = new MsEdgeTTS();

  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(opts.text);
    const buffer = await collectStream(audioStream);
    if (buffer.length === 0) {
      throw new Error(`TTS returned empty buffer (voice=${voice})`);
    }
    return buffer;
  } finally {
    safeCall(() => tts.close(), 'msedge-tts.close');
  }
}

async function collectStream(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}
