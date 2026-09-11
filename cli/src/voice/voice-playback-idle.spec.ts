// Az elhallgatás-kivárás tesztjei.
//
// 🔴 MIÉRT LÉTEZIK EZ A MODUL: enélkül a sor csak „sorban" futtatná egymásra a hangokat — a
// `speakInVoiceChannel` a `player.play()` után azonnal visszatér, tehát az `await` csak az
// indítást várta meg.
//
// ⭐ A KÉT ÁLLÍTÁS, AMI MIATT KÜLÖN FÁJL:
//   (a) az időtúllépés **`false`-t ad, ⛔ nem dob** — egy beragadt lejátszó nem szüntetheti
//       meg az ÖSSZES későbbi felolvasást;
//   (b) a már `Idle` lejátszóra **nem vár** semmit.

import { AudioPlayerStatus, createAudioPlayer, type AudioPlayer } from '@discordjs/voice';

import { VoicePlaybackIdle_Util } from './voice-playback-idle.js';

/**
 * Lejátszó a teszthez.
 *
 * ⭐ **VALÓDI `AudioPlayer`**, ⛔ nem `as unknown as` átcímkézés. Mérve: a `createAudioPlayer()`
 * nem nyúl se hálózathoz, se hang-kapcsolathoz *(alapból `idle`)*, a `state` pedig **írható**
 * — így az állapot beállítható **típushelyesen**.
 *
 * ⚠️ Miért fontos: átcímkézve a fordító **nem szólna**, ha a lejátszó felülete elmozdulna, és
 * a teszt zöld maradna egy nem létező szerződésre.
 */
function fakePlayer(status: AudioPlayerStatus): AudioPlayer {
  const player: AudioPlayer = createAudioPlayer();

  player.state = { status: status } as AudioPlayer['state'];

  return player;
}

describe('VoicePlaybackIdle_Util.wait', () => {

  it('⭐ a MÁR elhallgatott lejátszóra nem vár — azonnal igaz', async (): Promise<void> => {
    let called: boolean = false;
    const result: boolean = await VoicePlaybackIdle_Util.wait(
      fakePlayer(AudioPlayerStatus.Idle),
      async (): Promise<never> => {
        called = true;

        throw new Error('nem szabad hívni');
      },
    );

    expect(result).toBeTrue();
    expect(called).toBeFalse();
  });

  it('🔴 SZÓLÓ lejátszónál MEGVÁRJA az elhallgatást', async (): Promise<void> => {
    // Ez a hiányzó darab: enélkül a következő üzenet nem-`Idle` lejátszóba futna, és
    // „Épp szól valami"-val elesne.
    const waited: string[] = [];
    const result: boolean = await VoicePlaybackIdle_Util.wait(
      fakePlayer(AudioPlayerStatus.Playing),
      async (_player, status): Promise<void> => {
        waited.push(String(status));
      },
    );

    expect(result).toBeTrue();
    expect(waited).toEqual([AudioPlayerStatus.Idle]);
  });

  it('🔴 IDŐTÚLLÉPÉSNÉL `false`-t ad — ⛔ NEM dob', async (): Promise<void> => {
    // Egy kivétel innen a sor kiszolgálóját buktatná meg, vagyis EGYETLEN beragadt hang
    // minden későbbi felolvasást megszüntetne. A `false` viszont azt mondja: lépj tovább.
    const result: boolean = await VoicePlaybackIdle_Util.wait(
      fakePlayer(AudioPlayerStatus.Playing),
      async (): Promise<never> => {
        throw new Error('Did not enter state "idle" within 180000ms');
      },
    );

    expect(result).toBeFalse();
  });

  it('⚠️ van FELSŐ KORLÁT — korlát nélkül egy elakadás a teljes sort megfogná', () => {
    expect(VoicePlaybackIdle_Util.TIMEOUT_MS).toBeGreaterThan(0);
    // A darab felső hossza 700 karakter (~70-90 mp beszéd) ⇒ ennél bőven többnek kell lennie,
    // de nem órás nagyságrendnek.
    expect(VoicePlaybackIdle_Util.TIMEOUT_MS).toBeGreaterThanOrEqual(120_000);
    expect(VoicePlaybackIdle_Util.TIMEOUT_MS).toBeLessThanOrEqual(600_000);
  });
});
