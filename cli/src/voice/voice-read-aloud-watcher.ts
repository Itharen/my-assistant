// 👀 A KIMENŐ NAPLÓ FIGYELÉSE — innen tudja a figyelő, hogy mit kell felolvasni.
//
// ## ⭐ MIÉRT ÍGY, ÉS NEM ÚJ CSATORNÁVAL
//
// A küldés egy **rövid életű** CLI-folyamat (`ma comm say`), a hang-kapcsolatot viszont a
// **hosszan futó figyelő** tartja. A kettő között kellett egy átjáró.
//
// ⛔ NEM építettünk új protokollt (nincs új sor, nincs socket, nincs IPC): a `recordOutbound`
// **már most** minden kimenő üzenetet beír a `outbound-log.jsonl`-be — **pontosan egyszer**,
// a teljes szöveggel. Ezt figyeljük.
//
// ⇒ Ezért a felolvasás **nem hoz létre új üzenet-eseményt**, ami a handoff kikötése volt:
// *„a duplázás nem jelenthet két külön üzenet-eseményt a naplóban/mérésben — egy üzenet, két cél."*
//
// ## ⚠️ MIÉRT `fs.watch`, ÉS MIÉRT NEM IDŐZÍTŐ
//
// A `core-no-polling` szabály tiltja a poll-t. Az `fs.watch` **esemény-vezérelt**: az operációs
// rendszer szól, amikor a fájl változik. ⛔ Nem kérdezzük ismételten, hogy „van-e új".
//
// ⚠️ A `fs.watch` ugyanarra az írásra **több eseményt is adhat** — ezért a bejegyzéseket
// `sentAt` szerint tartjuk nyilván *(`decideReadAloud` → „ezt már felolvastuk")*.

import { existsSync, watch, type FSWatcher } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import {
  decideReadAloud,
  parseOutboundLine,
  type OutboundLogEntry,
  type ReadAloudDecision,
} from './voice-read-aloud.js';

/** Amit a figyelőnek meg kell adni. */
export interface ReadAloudWatcherOptions {
  /** A kimenő napló útvonala. */
  logPath: string;
  /** Bent van-e az owner a hang-csatornában — MÉRT tény, minden döntés előtt újra kérdezzük. */
  isOwnerPresent: () => boolean;
  /**
   * A tényleges felolvasás.
   *
   * ⭐ Az `id` *(a bejegyzés `sentAt`-ja)* **azonosítja** a felolvasást a sorban és a naplóban.
   * ⚠️ Enélkül a sor-jelzések *(„2/4 darab", „tartva")* nem lennének visszakereshetők ahhoz az
   * üzenethez, amelyikről szólnak.
   */
  speak: (text: string, id: string) => Promise<void>;
  /** Naplózás — ⛔ a kihagyás OKA sem lehet néma. */
  onNote?: (detail: string) => void;
}

/**
 * A kimenő napló figyelője.
 *
 * ⛔ **Hibát SOHA nem dob a hívó felé**: ez kísérő funkció. Ha elhasal, az üzenet-kézbesítés
 * változatlanul működik — csak nem hangzik el.
 */
export class VoiceReadAloudWatcher {

  private watcher: FSWatcher | null = null;

  /**
   * A már felolvasott bejegyzések.
   *
   * ⚠️ Induláskor a MEGLÉVŐ sorokkal töltjük fel: különben a figyelő indulásakor felolvasná
   * az egész napi előzményt. ⛔ Ez a leghangosabb elképzelhető hibafajta.
   */
  private readonly spoken: Set<string> = new Set<string>();

  private isBusy: boolean = false;

  constructor(private readonly options: ReadAloudWatcherOptions) {}

  /**
   * A figyelés indítása.
   *
   * ⭐ ELŐSZÖR beolvassuk a meglévő sorokat — de **nem olvasjuk fel őket**, csak
   * megjegyezzük, hogy ismertek. Innentől csak az ÚJ bejegyzések hangzanak el.
   */
  async start(): Promise<void> {
    try {
      for (const entry of await this.readEntries()) {
        this.spoken.add(entry.sentAt);
      }

      // ⚠️ A fájl még nem biztos, hogy létezik (első üzenet előtt). A `watch` ilyenkor dobna,
      // ezért a könyvtárat figyeljük — a fájl megjelenése is esemény.
      this.watcher = existsSync(this.options.logPath)
        ? watch(this.options.logPath, (): void => void this.handleChange())
        : null;

      if (!this.watcher) {
        this.options.onNote?.(
          'A kimenő napló még nem létezik — a felolvasás az első üzenet után indul.',
        );
      }
    } catch (err: unknown) {
      SwallowedFailure_Util.report('voice.read-aloud.start', err);
    }
  }

  /** A figyelés leállítása. */
  stop(): void {
    this.watcher?.close();
    this.watcher = null;
  }

  /**
   * Egy fájl-változás feldolgozása.
   *
   * ⚠️ Az `isBusy` zár nem kényelmi: két egymásra futó feldolgozás UGYANAZT a bejegyzést
   * kétszer olvastathatná fel, mert a `spoken` halmazba még nem került be.
   */
  private async handleChange(): Promise<void> {
    if (this.isBusy) return;

    this.isBusy = true;
    try {
      for (const entry of await this.readEntries()) {
        const decision: ReadAloudDecision = decideReadAloud(entry, {
          ownerPresent: this.options.isOwnerPresent(),
          alreadySpoken: this.spoken,
        });

        // ⭐ A NYILVÁNTARTÁSBA MINDEN ESETBEN bekerül — akkor is, ha épp nem olvastuk fel.
        // ⛔ Különben amint az owner belép a csatornába, a rendszer bezúdítaná neki az
        // összes korábbi üzenetet hangban.
        this.spoken.add(entry.sentAt);

        if (!decision.speak) {
          // 🔴 A RUTIN kihagyás NEM kerül naplóba. Mérve 2026-09-11: a napi akció-napló
          // **95%-a** (64 088 sor / 15 MB) ez az egyetlen sor volt, mert az `fs.watch`
          // minden eseményére a TELJES naplót újraértékeljük.
          //
          // ⚠️ Ez ⛔ nem elhallgatás: a *magyarázó* okok (nincs bent, nyugta, nincs kimondható
          // tartalom) **változatlanul** naplózódnak — azok bejegyzésenként EGYSZER fordulnak
          // elő, és tényleg megmagyaráznak valamit. A 95%-os zaj viszont épp a valódi
          // jelzéseket temette be.
          if (!decision.routine) {
            this.options.onNote?.(`kihagyva (${entry.sentAt}): ${decision.reason}`);
          }

          continue;
        }

        // ⚠️ A hívás MÁR NEM a lejátszás végét várja meg: a sorba tétel gyors, a
        // sorosítást a `VoiceSpeechQueue` végzi. ⭐ Ez szándékos — különben a napló-figyelő
        // egy hosszú felolvasás teljes hosszáig nem látná a következő bejegyzést.
        await this.options.speak(decision.text, entry.sentAt);
      }
    } catch (err: unknown) {
      SwallowedFailure_Util.report('voice.read-aloud.handleChange', err);
    } finally {
      this.isBusy = false;
    }
  }

  /** A napló bejegyzései. Sérült/csonka sor kimarad. ⛔ Nem dob. */
  private async readEntries(): Promise<OutboundLogEntry[]> {
    if (!existsSync(this.options.logPath)) return [];

    const content: string = await readFile(this.options.logPath, 'utf-8');
    const entries: OutboundLogEntry[] = [];

    for (const line of content.split(/\r?\n/)) {
      const entry: OutboundLogEntry | null = parseOutboundLine(line);

      if (entry) entries.push(entry);
    }

    return entries;
  }
}
