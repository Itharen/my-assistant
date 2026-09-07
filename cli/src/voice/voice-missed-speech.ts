// 🔇 AMI NEM JUTOTT ÁT — az is LÁTSZIK a hang-csatornában.
//
// > **Owner (2026-09-07 22:08):** *„beszéltem, beszéltem… azt is belemostad ebbe a chatbe,
// > amitől aztán fingom nincs, hogy mi ment át, mi nem. De leginkább semmi nem ment át."*
//
// 🔴 A MÉRT HIÁNY, amit ez betölt. A lánc ma **csak a sikert** mutatja: ha a felismerés
// elbukik, gyanús lesz, vagy a felvevő eldobja a felvételt, akkor a hang-csatornában
// **SEMMI** nem történik *(`handleFinishedRecording` korán visszatér, a híd meg sem hívódik)*.
// ⇒ Az owner számára a „nem értettem" és a „meg sem hallottam" **megkülönböztethetetlen** —
// és pontosan ezt írta le.
//
// ⭐ A MEGOLDÁS NEM „üzenet minden hibáról". Ma az eldobás a TÖBBSÉG *(~99%)*, tehát a
// megszólalásonkénti jelzés a csatornát **használhatatlanná spammelné** — és az elárasztott
// csatorna ugyanúgy láthatatlan, mint a néma. Ezért **összevonunk**: a rövid időn belüli
// kiesések EGY összefoglalóba kerülnek, darabszámmal és **másodperccel**.
//
// ⛔ AMI NEM VÁLTOZIK: a kiesett megszólalás **nem kerül a kötegbe**. A tükör azt mondja meg,
// hogy *hallottam valamit, de nem értem* — soha nem tesz úgy, mintha értené. Egy félrehallott
// mondat a kötegben már az owner **szó szerinti utasításának** látszana.

import { sendDiscordMessage } from '../discord/discord.sender.js';

/** Miért nem jutott át egy megszólalás. */
export type MissedSpeechKind =
  /** Volt átirat, de gyanús — ⛔ nem cselekszünk rá (hallucináció-őr). */
  | 'not-understood'
  /** A felismerés nem adott használható szöveget (hiba, üres válasz, időtúllépés). */
  | 'recognition-failed'
  /** A felvevő beszéd-validációja dobta ki a kész felvételt — némán. */
  | 'discarded-by-recorder';

export interface MissedSpeech {
  kind: MissedSpeechKind;
  /** Hány másodperc hang veszett el, ha tudjuk. */
  seconds?: number;
}

export interface MissedSpeechReporterOptions {
  /** 🔴 A HANG-csatorna azonosítója — ODA megy, ahol elhangzott. */
  channelId: string;
  speakerName: string;
  /**
   * Ennyi csend után megy ki az összefoglaló.
   *
   * ⭐ MÉRT ALSÓ KORLÁT: a felvevő `AfterSilence`-szel, **1000 ms** csenddel zárja a szegmenst
   * *(`cv-recording.control-service.ts` → `handlePcmReceiver`)*, tehát 5 s bőven átfog egy
   * összefüggő beszéd-sorozatot — de nem annyi, hogy az owner már elfelejtse, mit mondott.
   */
  quietMs?: number;
  /** Ennyi kiesés után AZONNAL küldünk, nem várunk tovább. */
  maxPending?: number;
  send?: typeof sendDiscordMessage;
  /** ⚠️ A jelentés hibája sosem fatális — csak jelentjük. */
  onError?: (detail: string) => void;
}

const DEFAULT_QUIET_MS: number = 5_000;
const DEFAULT_MAX_PENDING: number = 10;

/**
 * A kiesés-okok sorrendje és címkéje.
 *
 * ⭐ A SORREND SZÁMÍT: elől a leggyakoribb és legtöbbet mondó ok áll — az owner a lista
 * **elejét** olvassa el biztosan.
 */
const KIND_LABELS: readonly { kind: MissedSpeechKind; label: string }[] = [
  { kind: 'discarded-by-recorder', label: '🎚️ a felvevő eldobta — túl halk, túl rövid, vagy nem ismerte fel beszédnek' },
  { kind: 'recognition-failed', label: '❌ a felismerés nem adott használható szöveget' },
  { kind: 'not-understood', label: '❓ hallottam, de nem értettem biztosan — ⛔ nem cselekszem rá' },
];

/**
 * Az összefoglaló szövege.
 *
 * ⭐ MIÉRT DARABSZÁM **ÉS** MÁSODPERC: a „3 megszólalás" még tűnhet apróságnak; a
 * „**7,2 másodperc beszéd**" viszont megmutatja, mekkora a tényleges veszteség. Ez az a szám,
 * amiből az owner eldöntheti, hogy érdemes-e a küszöbökhöz nyúlni.
 *
 * ⚠️ A szöveg **nem magyarázkodik** és nem ad ok-láncot — a Discord-üzenet rövid, tagolt, és
 * csak azt mondja meg, ami az ownernek teendő vagy döntés (`discord-message-style.md`).
 */
export function composeMissedSpeechSummary(params: {
  speakerName: string;
  missed: MissedSpeech[];
}): string {
  const total: number = params.missed.length;
  const seconds: number = round1(
    params.missed.reduce((sum: number, m: MissedSpeech): number => sum + (m.seconds ?? 0), 0),
  );

  const header: string = `🔇 🔊 **${params.speakerName}** — `
    + `${total} megszólalás NEM jutott át`
    + (seconds > 0 ? ` (összesen ${seconds} mp beszéd)` : '')
    + ':';

  const lines: string[] = KIND_LABELS
    .map((entry: { kind: MissedSpeechKind; label: string }): string => {
      const group: MissedSpeech[] = params.missed
        .filter((m: MissedSpeech): boolean => m.kind === entry.kind);

      if (!group.length) return '';

      const groupSeconds: number = round1(
        group.reduce((sum: number, m: MissedSpeech): number => sum + (m.seconds ?? 0), 0),
      );

      return `> • ${group.length}× ${entry.label}`
        + (groupSeconds > 0 ? ` — ${groupSeconds} mp` : '');
    })
    .filter((line: string): boolean => line.length > 0);

  return [header, ...lines].join('\n');
}

/**
 * 🔇 A kiesés-jelentő.
 *
 * Használat: minden ki nem jutott megszólalásnál `note(...)`; a küldést ő időzíti.
 * Leállításkor `stop()` — ⚠️ ez **kiküldi** a függőben lévőt, nem dobja el.
 */
export class MissedSpeechReporter {
  private readonly options: MissedSpeechReporterOptions;
  private pending: MissedSpeech[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(options: MissedSpeechReporterOptions) {
    this.options = options;
  }

  /** Hány kiesés vár összefoglalásra — a teszthez és a diagnosztikához. */
  get pendingCount(): number {
    return this.pending.length;
  }

  /** Egy kiesés bejelentése. A küldés összevontan, később történik. */
  note(missed: MissedSpeech): void {
    this.pending.push(missed);

    if (this.pending.length >= (this.options.maxPending ?? DEFAULT_MAX_PENDING)) {
      void this.flush();

      return;
    }

    this.restartTimer();
  }

  /**
   * A függőben lévő kiesések azonnali kiküldése.
   *
   * ⚠️ SOHA NEM DOB. Egy elbukott jelentés nem némíthatja el a hang-csatornát — a hiba
   * `onError`-ként jön vissza.
   */
  async flush(): Promise<void> {
    this.clearTimer();

    if (!this.pending.length) return;

    // ⭐ ELŐBB kivesszük, utána küldünk: ha a küldés lassú, a közben érkező kiesés a
    // KÖVETKEZŐ összefoglalóba kerül, nem vész el és nem megy ki kétszer.
    const batch: MissedSpeech[] = this.pending;

    this.pending = [];

    try {
      const send: typeof sendDiscordMessage = this.options.send ?? sendDiscordMessage;
      const result = await send(
        composeMissedSpeechSummary({ speakerName: this.options.speakerName, missed: batch }),
        'ack',
        this.options.channelId,
      );

      if (!result.sent) {
        this.options.onError?.(
          `[voice/missed-speech] A kiesés-jelentés NEM ment ki: ${result.detail}`,
        );
      }
    } catch (error: unknown) {
      this.options.onError?.(
        `[voice/missed-speech] A kiesés-jelentés ELBUKOTT: `
        + `${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Leállítás — ⚠️ a függőben lévőt még KIKÜLDI, hogy ne vesszen el.
   *
   * 🔴 SZÁNDÉKOSAN `Promise`-t ad vissza, és a hívónak **meg kell várnia**. Elereszthető
   * („fire-and-forget") változatban a folyamat leállhatna a küldés előtt, és az owner utolsó,
   * át nem jutott megszólalásai **némán vesznének el** — pontosan az a hibaosztály, ami miatt
   * ez az egész komponens készült.
   */
  async stop(): Promise<void> {
    this.clearTimer();
    await this.flush();
  }

  private restartTimer(): void {
    this.clearTimer();

    this.timer = setTimeout(
      (): void => void this.flush(),
      this.options.quietMs ?? DEFAULT_QUIET_MS,
    );

    // ⭐ A jelentő nem tartja életben a folyamatot: diagnosztika, nem szolgáltatás.
    this.timer.unref?.();
  }

  private clearTimer(): void {
    if (!this.timer) return;

    clearTimeout(this.timer);
    this.timer = undefined;
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
