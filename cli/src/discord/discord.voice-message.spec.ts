import {
  composeTranscriptForBatch,
  downloadVoiceAttachment,
  isAudioAttachment,
  MAX_VOICE_BYTES,
  selectVoiceAttachment,
  type DiscordAttachment,
} from './discord.voice-message.js';

function attachment(overrides: Partial<DiscordAttachment> = {}): DiscordAttachment {
  return {
    id: '1',
    url: 'https://cdn.discordapp.com/attachments/1/2/voice-message.ogg',
    name: 'voice-message.ogg',
    contentType: 'audio/ogg',
    size: 12_345,
    ...overrides,
  };
}

describe('isAudioAttachment', () => {

  it('felismeri a Discord hangüzenetét', () => {
    expect(isAudioAttachment(attachment())).toBe(true);
  });

  it('a contentType hiányában a KITERJESZTÉS alapján is felismeri', () => {
    // Merve: a Discord nem mindig kuldi a contentType-ot.
    const noType: DiscordAttachment = attachment({ name: 'hang.mp3' });

    delete (noType as { contentType?: string }).contentType;

    expect(isAudioAttachment(noType)).toBe(true);
  });

  it('nagybetűs kiterjesztést is elfogad', () => {
    const noType: DiscordAttachment = attachment({ name: 'HANG.WAV' });

    delete (noType as { contentType?: string }).contentType;

    expect(isAudioAttachment(noType)).toBe(true);
  });

  it('a képet NEM tekinti hangnak', () => {
    expect(isAudioAttachment(attachment({
      name: 'kep.png', contentType: 'image/png',
    }))).toBe(false);
  });
});

describe('selectVoiceAttachment', () => {

  it('kiválasztja az egyetlen hangot', () => {
    expect(selectVoiceAttachment([attachment()]).attachment?.name).toBe('voice-message.ogg');
  });

  it('képek közül is kiszedi a hangot', () => {
    const chosen = selectVoiceAttachment([
      attachment({ id: 'a', name: 'kep.png', contentType: 'image/png' }),
      attachment({ id: 'b', name: 'hang.ogg' }),
    ]);

    expect(chosen.attachment?.id).toBe('b');
  });

  it('csatolmány nélkül elutasít, és MEGMONDJA miért', () => {
    const verdict = selectVoiceAttachment([]);

    expect(verdict.attachment).toBeUndefined();
    expect(verdict.rejection).toContain('Nincs csatolmány');
  });

  it('csak nem-hang csatolmánynál megnevezi a fájlokat', () => {
    const verdict = selectVoiceAttachment([attachment({ name: 'doksi.pdf', contentType: 'application/pdf' })]);

    expect(verdict.attachment).toBeUndefined();
    expect(verdict.rejection).toContain('doksi.pdf');
  });

  it('a túl nagy fájlt elutasítja — VÉDŐKORLÁT', () => {
    const verdict = selectVoiceAttachment([attachment({ size: MAX_VOICE_BYTES + 1 })]);

    expect(verdict.attachment).toBeUndefined();
    expect(verdict.rejection).toContain('túl nagy');
  });

  it('a korlát HATÁRÁN még elfogad', () => {
    expect(selectVoiceAttachment([attachment({ size: MAX_VOICE_BYTES })]).attachment).toBeDefined();
  });
});

describe('downloadVoiceAttachment', () => {

  it('sikeres letöltésnél visszaadja a bájtokat', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const fakeFetch = (async (): Promise<Response> => ({
      ok: true,
      status: 200,
      arrayBuffer: async (): Promise<ArrayBuffer> => bytes.buffer as ArrayBuffer,
    } as Response)) as unknown as typeof fetch;

    const result = await downloadVoiceAttachment(attachment(), fakeFetch);

    expect(result.ok).toBe(true);
    expect(result.bytes?.byteLength).toBe(4);
  });

  it('HTTP-hibánál NEM dob, hanem megmondja a teendőt', async () => {
    const fakeFetch = (async (): Promise<Response> => ({
      ok: false, status: 403,
      arrayBuffer: async (): Promise<ArrayBuffer> => new ArrayBuffer(0),
    } as Response)) as unknown as typeof fetch;

    const result = await downloadVoiceAttachment(attachment(), fakeFetch);

    expect(result.ok).toBe(false);
    expect(result.detail).toContain('403');
    // A Discord-linkek alairtak es lejarnak - ezt kell tudnia az olvasonak.
    expect(result.remedy).toContain('lejár');
  });

  it('az ÜRES fájlt hibaként kezeli — nem küldi tovább csendben', async () => {
    const fakeFetch = (async (): Promise<Response> => ({
      ok: true, status: 200,
      arrayBuffer: async (): Promise<ArrayBuffer> => new ArrayBuffer(0),
    } as Response)) as unknown as typeof fetch;

    const result = await downloadVoiceAttachment(attachment(), fakeFetch);

    expect(result.ok).toBe(false);
    expect(result.detail).toContain('ÜRES');
  });

  it('a MÉRT méretet is ellenőrzi, nem csak a Discord állítását', async () => {
    // A csatolmany "size"-a kicsit mond, a valodi tartalom viszont nagy.
    const fakeFetch = (async (): Promise<Response> => ({
      ok: true, status: 200,
      arrayBuffer: async (): Promise<ArrayBuffer> => new ArrayBuffer(MAX_VOICE_BYTES + 1),
    } as Response)) as unknown as typeof fetch;

    const result = await downloadVoiceAttachment(attachment({ size: 100 }), fakeFetch);

    expect(result.ok).toBe(false);
    expect(result.detail).toContain('nagyobb');
  });

  it('hálózati kivételt sem enged ki', async () => {
    const fakeFetch = (async (): Promise<Response> => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;

    const result = await downloadVoiceAttachment(attachment(), fakeFetch);

    expect(result.ok).toBe(false);
    expect(result.detail).toContain('ECONNREFUSED');
  });
});

describe('composeTranscriptForBatch', () => {

  it('MEGJELÖLI, hogy gépi átirat — ez a lényeg', () => {
    const text = composeTranscriptForBatch({ transcript: 'Nezd meg a vonatot' });

    expect(text).toContain('HANGÜZENET');
    expect(text).toContain('gépi átirat');
    expect(text).toContain('Nezd meg a vonatot');
  });

  it('kiírja a hosszt, ha tudjuk', () => {
    expect(composeTranscriptForBatch({ transcript: 'x', durationSecs: 12.4 })).toContain('12 mp');
  });

  it('hossz nélkül is értelmes marad', () => {
    expect(composeTranscriptForBatch({ transcript: 'x' })).toContain('gépi átirat');
  });
});
