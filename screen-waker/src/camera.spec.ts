import { describe, expect, it } from 'vitest';

import { parseDirectShowVideoDevices } from './camera.js';

describe('parseDirectShowVideoDevices', (): void => {
  it('returns unique DirectShow video device names without audio or aliases', (): void => {
    const output: string = [
      '[dshow @ 000001] "Integrated Camera" (video)',
      '[dshow @ 000001]   Alternative name "@device_pnp_123"',
      '[dshow @ 000001] "Microphone Array" (audio)',
      '[dshow @ 000001] "USB Camera" (video)',
      '[dshow @ 000001] "Integrated Camera" (video)',
    ].join('\n');

    expect(parseDirectShowVideoDevices(output)).toEqual(['Integrated Camera', 'USB Camera']);
  });

  it('returns an empty list when FFmpeg reports no video devices', (): void => {
    expect(parseDirectShowVideoDevices('dummy: Immediate exit requested')).toEqual([]);
  });
});
