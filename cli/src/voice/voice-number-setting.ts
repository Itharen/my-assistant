// ⚙️ EGY SZÁMOS BEÁLLÍTÁS A LEMEZEN — a közös rész, egy helyen.
//
// ## ⭐ MIÉRT LÉTEZIK: a review MÉRTE meg
//
// A türelmi idő *(`voice-speech-grace.ts`)* ugyanazt a hármas mintát követte, mint a hangerő
// *(`voice-volume.ts`)*: **környezeti változó → fájl → alapérték**, átmeneti fájllal és
// átnevezéssel. A `dc rev` `code-duplication` szabálya ezt **17 sor / 102 token** duplikációként
// jelezte — helyesen.
//
// ⚠️ **AMIHEZ NEM NYÚLTAM: a hangerő.** Az három rétegen *(CLI · szerver-útvonal · kliens-panel)*
// **működik**, és egy közös alapra húzása mindhármat érintené. ⛔ *„Ha tévedek, ez elront
// valamit, ami most működik?"* — igen. Ezért a közös rész **ide** került, és **az új**
// beállítás használja; a hangerő érintetlen marad, és ⭐ egy későbbi, külön körben — saját
// tesztekkel — átköltöztethető.
//
// ## A HÁRMAS SORREND, és miért pont ez
//
// ```
// környezeti változó  →  a legfelső: egy próba/teszt a FÁJL ELPISZKÍTÁSA NÉLKÜL állít mást
// fájl                →  amit az owner tartósan beállított
// alapérték           →  csak ha semmi más nincs
// ```
//
// ⛔ **Az olvasás SOHA nem dob**: egy beállítás olvasása nem buktathatja meg azt a funkciót,
// amit paraméterez. ⚠️ De ⛔ nem is néma: a sérült fájl **naplózódik**, mert különben az owner
// beállítása **csendben** tűnne el, és ő azt hinné, hogy beállította.

import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';

/** Egy értelmezés eredménye. ⚠️ Szándékosan nem exportált. */
interface NumberParse {
  ok: boolean;
  value: number;
  /** MI történt — ⛔ hibánál soha nem üres. */
  detail: string;
}

/** Egy számos beállítás olvasása és írása. */
export class NumberSetting_Util {

  /**
   * Egy szám értelmezése sávval. **Tiszta függvény.**
   *
   * @param raw amit kaptunk *(env-sztring, JSON-szám, felhasználói bemenet)*.
   * @param bounds a megengedett sáv és a visszaesési érték.
   * @returns az eredmény. ⛔ Hibás bemenetnél a `current` marad — **nem** az alapérték.
   *
   * ⚠️ MIÉRT NEM AZ ALAPÉRTÉKRE ESIK: azt az owner a beállítása **néma eldobásaként** élné
   * meg — beállította, és mégsem az történik.
   */
  static parse(
    raw: unknown,
    bounds: { min: number; max: number; current: number; unit?: string },
  ): NumberParse {
    if (raw === undefined || raw === null || raw === '') {
      return { ok: false, value: bounds.current, detail: 'nincs megadva érték' };
    }

    const value: number = typeof raw === 'number' ? raw : Number(String(raw).trim());
    const unit: string = bounds.unit ?? '';

    if (!Number.isFinite(value)) {
      return { ok: false, value: bounds.current, detail: `nem szám: „${String(raw)}"` };
    }

    if (value < bounds.min || value > bounds.max) {
      return {
        ok: false,
        value: bounds.current,
        detail: `${value}${unit} a sávon kívül (${bounds.min}-${bounds.max}${unit})`,
      };
    }

    return { ok: true, value: value, detail: `${value}${unit}` };
  }

  /**
   * A jelenlegi érték: **környezeti változó → fájl → alapérték.**
   *
   * @param input a fájl útvonala, a mező neve, az env-változó neve, és az értelmező.
   * @returns a hatályos érték. ⛔ Sosem dob.
   */
  static async read(input: {
    path: string;
    /** A JSON-mező neve a fájlban. */
    field: string;
    /** A környezeti változó neve — ⚠️ ez üti a fájlt. */
    envName: string;
    /** Az értelmező — a sávot a hívó ismeri. */
    parse: (raw: unknown) => NumberParse;
    fallback: number;
    /** A naplózás hatóköre — a `SwallowedFailure_Util` ezzel deduplikál. */
    scope: string;
  }): Promise<number> {
    const fromEnv: NumberParse = input.parse(process.env[input.envName]);

    if (fromEnv.ok) return fromEnv.value;

    if (!existsSync(input.path)) return input.fallback;

    try {
      const raw: string = await readFile(input.path, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      const fromFile: NumberParse = input.parse(NumberSetting_Util.fieldOf(parsed, input.field));

      return fromFile.ok ? fromFile.value : input.fallback;
    } catch (err: unknown) {
      SwallowedFailure_Util.report(`${input.scope}.read`, err);

      return input.fallback;
    }
  }

  /**
   * Egy mező kiolvasása **ismeretlen alakú** adatból.
   *
   * ⚠️ A fájl tartalma **idegen adat**: egy `as` átcímkézés azt állítaná, hogy ismerjük az
   * alakját — nem ismerjük. ⭐ Az `Object.entries` szerkezetileg olvas, **átcímkézés nélkül**.
   */
  private static fieldOf(parsed: unknown, field: string): unknown {
    if (!parsed || typeof parsed !== 'object') return undefined;

    for (const [key, value] of Object.entries(parsed)) {
      if (key === field) return value;
    }

    return undefined;
  }

  /**
   * Az érték eltárolása.
   *
   * ⚠️ **Átmeneti fájl + átnevezés**: egy megszakadt írás nem hagyhat félkész beállítást, mert
   * onnantól minden indulás az alapértékre esne — **csendben**.
   *
   * @returns az értelmezés eredménye. Hibás bemenetnél ⛔ **nem írunk**.
   */
  static async write(input: {
    path: string;
    field: string;
    raw: unknown;
    parse: (raw: unknown) => NumberParse;
    setBy: string;
    now: Date;
  }): Promise<NumberParse> {
    const parsed: NumberParse = input.parse(input.raw);

    if (!parsed.ok) return parsed;

    const body: Record<string, unknown> = {
      [input.field]: parsed.value,
      setBy: input.setBy,
      updatedAt: input.now.toISOString(),
    };
    const temporary: string = `${input.path}.tmp`;

    await mkdir(join(input.path, '..'), { recursive: true });
    await writeFile(temporary, `${JSON.stringify(body, null, 2)}\n`, 'utf-8');
    await rename(temporary, input.path);

    return parsed;
  }
}
