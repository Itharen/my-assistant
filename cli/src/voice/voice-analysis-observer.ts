// 👁️ AZ ELEMZŐ MEGFIGYELÉSE — kívülről, az átemelt kód érintése nélkül.
//
// ⛔ A KORLÁT, AMI EZT A MEGOLDÁST KIKÉNYSZERÍTETTE: az átemelt CCAP-kódhoz nem nyúlunk
// (`transplant-not-rewrite` — owner: *„nagyon törékeny az a kód"*). A keretenkénti adat viszont
// **odabent** keletkezik, a `CV_Analysis_ControlService.analyzeAudio`-ban.
//
// 🩹 A MEGOLDÁS: az elemző **singleton**, és az `analyzeAudio` **publikus**. Ezért a példányra
// kívülről ráültetünk egy burkolót, ami:
// 1. **változatlanul** meghívja az eredetit,
// 2. az eredményt **továbbadja** a sávnak,
// 3. és **változatlanul** visszaadja a hívónak.
//
// ⇒ Az átemelt fájl **bájtra érintetlen**; a viselkedése nem változik.
//
// 🔴 A LEGFONTOSABB SZABÁLY ITT: *„a diagnosztika sosem buktathatja meg azt, amit megfigyel"*.
// Mért precedens ugyanebben a láncban: egy megszólalás-számláló `?.` nélkül megölte volna a
// felvételt. Ezért a burkoló **minden** hibát elkap, és a hiba **soha** nem terjed a hívó felé.

import { logAction } from '../action-log/action-log.client.js';
import { localClock } from '../utils/local-time.js';

import { VoiceAnalysisBar, type AnalysisFrame } from './voice-analysis-bar.js';

/** Amit egy elemző-példánytól elvárunk. Szándékosan minimális — ennyit használunk. */
export interface AnalyzerLike {
  analyzeAudio(buffer: Buffer): AnalysisFrame;
}

/** ⚠️ Egy példányt csak EGYSZER burkolunk — különben minden újracsatlakozás duplázná a sávot. */
const WRAPPED: WeakSet<object> = new WeakSet();

/**
 * A burkoló ráültetése egy elemző-példányra.
 *
 * Visszatérés: `true`, ha most történt meg; `false`, ha már burkolva volt.
 *
 * ⚠️ **Nem tiszta függvény** — szándékosan: pont az a dolga, hogy egy idegen példányt
 * módosítson. A **döntési** rész (`classifyFrame`, `renderBar`) külön, tiszta modulban van,
 * és ott is van tesztelve.
 */
export function attachAnalysisBar(analyzer: AnalyzerLike, bar: VoiceAnalysisBar): boolean {
  if (WRAPPED.has(analyzer)) return false;

  const original: (buffer: Buffer) => AnalysisFrame = analyzer.analyzeAudio.bind(analyzer);

  analyzer.analyzeAudio = (buffer: Buffer): AnalysisFrame => {
    const result: AnalysisFrame = original(buffer);

    // ⛔ A MEGFIGYELÉS SOHA NEM BUKTATHATJA MEG A FELVÉTELT.
    try {
      bar.push(result);
    } catch (error: unknown) {
      // ⚠️ Néma elnyelés TILOS (`core-rich-error-handling`) — de a naplózás sem dobhat.
      try {
        void logAction({
          kind: 'error',
          summary: '[voice] a keretenkénti sáv elhasalt — a felvétel ettől ÉRINTETLEN',
          extra: {
            code: 'MA-VOICE-BAR-FAILED',
            reason: error instanceof Error ? error.message : String(error),
          },
        });
      } catch {
        // Ha még a naplózás sem megy, a konzol az utolsó esély — de tovább nem dobunk.
        process.stderr.write('[voice] a sáv naplózása sem sikerült\n');
      }
    }

    return result;
  };

  WRAPPED.add(analyzer);

  return true;
}

/**
 * Az élő sáv felépítése, a konzolra kötve.
 *
 * ⚠️ `stdout`, mert az LDP ezt teszi a szerver rendes kimenetébe — ott nézi az owner.
 * ⛔ **NEM a Discordra**: keretenkénti sáv ott elárasztaná a csatornát.
 */
export function createConsoleBar(): VoiceAnalysisBar {
  let firstLine: boolean = true;

  return new VoiceAnalysisBar((line: string): void => {
    // ⭐ Az ELSŐ sor visel időbélyeget: ebből tudja az owner, mikor kezdett hallgatni a
    // rendszer. A további sorok tiszták maradnak, hogy a sáv **összefüggő** képet adjon.
    if (firstLine) {
      process.stdout.write(`[voice] ${localClock()} — hallgatlak:\n`);
      firstLine = false;
    }

    process.stdout.write(`${line}\n`);

    // A záró ítélet után a következő megszólalás megint kap fejlécet.
    if (line.includes('MEGSZÓLALÁS') || line.includes('nem elég')) firstLine = true;
  });
}

/**
 * A sáv rákötése — **biztonságos** alakban, a hívónak.
 *
 * ⛔ SOHA NEM DOB. Ha az átemelt elemző nem tölthető be, vagy a burkolás elhasal, a sáv
 * egyszerűen **elmarad** — a felvétel megy tovább. *(„A diagnosztika sosem buktathatja meg
 * azt, amit megfigyel.")*
 *
 * ⚠️ A hiba viszont **nem néma**: a hívó `onError`-t kap, és a naplóba is bekerül.
 */
export async function attachAnalysisBarSafely(params: {
  load: () => Promise<AnalyzerLike | null>;
  bar: VoiceAnalysisBar;
  onError?: (detail: string) => void;
}): Promise<boolean> {
  try {
    const analyzer: AnalyzerLike | null = await params.load();

    if (!analyzer) {
      params.onError?.('Az elemző nem elérhető — a keretenkénti sáv NEM fog megjelenni.');

      return false;
    }

    return attachAnalysisBar(analyzer, params.bar);
  } catch (error: unknown) {
    params.onError?.(
      'A keretenkénti sáv rákötése elbukott (a felvétel ettől ÉRINTETLEN): '
      + `${error instanceof Error ? error.message : String(error)}`,
    );

    return false;
  }
}
