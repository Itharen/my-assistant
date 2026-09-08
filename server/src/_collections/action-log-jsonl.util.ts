// EGY NAP ACTION-LOG JSONL-JÉNEK BEOLVASÁSA — a rendszer EGYETLEN olvasó útja.
//
// 🔴 MIÉRT LÉTEZIK EZ A FÁJL
//
// Ez a blokk korábban **négy helyen** szerepelt egymástól függetlenül (`reports.util`
// kétszer, `wave-markers.util`, `wave-jsonl.util`), és mind a négy helyen **ugyanaz a hiba**
// volt benne: a hiányzó napi fájl (`ENOENT` — teljesen normális, egy csendes napon nincs log)
// és egy **váratlan** hiba (jogosultság, sérült lemez, kódolási hiba) **ugyanazon a néma ágon**
// távozott. Kívülről mindkettő úgy néz ki, hogy *„aznap nem történt semmi"*.
//
// ⛔ Ez pontosan az a hiba-osztály, amit az owner a naplózásnál kifogásolt: a rendszer
// **hallgat** arról, hogy elveszített valamit. A „0 esemény" és a „nem tudtam elolvasni"
// nem ugyanaz — az elsőt látni akarjuk, a másodikat javítani.
//
// ⭐ EZÉRT: a hiányzó fájl **megkülönböztetve** kezelt (várt eset, csendes), minden más hiba
// **naplózva** megy tovább. A duplikációt nem átnevezéssel, hanem **kiemeléssel** szüntetjük meg.

import { promises as fs } from 'node:fs';

import { DyFM_Log } from '@futdevpro/fsm-dynamo';

/**
 * Egy napi action-log JSONL beolvasása és soronkénti értelmezése.
 *
 * @param input `filePath` — a napi fájl teljes útvonala; `issuer` — ki kérte (ez kerül a naplóba).
 * @returns az értelmezett sorok. Hiányzó fájl ⇒ üres lista. Hibás sor ⇒ kimarad. ⛔ **Nem dob**:
 *          egy riport-lekérdezés nem dőlhet el attól, hogy egy régi nap logja sérült.
 */
export async function readActionLogJsonlDay<T>(input: { filePath: string; issuer: string }): Promise<T[]> {
  let content: string;

  try {
    content = await fs.readFile(input.filePath, 'utf8');
  } catch (err) {
    // ⭐ A LÉNYEG: megnézzük, MELYIK hiba érkezett. A hiányzó fájl VÁRT eset — egy nap, amin
    // nem történt semmi, nem hiba. Minden más viszont az: ne tegyünk úgy, mintha üres lenne.
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return [];
    }
    DyFM_Log.error(
      `[${input.issuer}] MA-SERVER-ACTION-LOG-READ-FAILED: ${input.filePath} — ${String(err)}`,
    );

    return [];
  }

  const lines: string[] = content.split(/\r?\n/).filter((l: string): boolean => l.trim().length > 0);
  const rows: T[] = [];

  for (const line of lines) {
    try {
      rows.push(JSON.parse(line) as T);
    } catch (err) {
      // ⚠️ Egy sérült sor NEM buktathatja meg a többit — de nyomtalan sem maradhat: az
      // append-only naplóban egy értelmezhetetlen sor azt jelenti, hogy valaki hibásan ír bele.
      DyFM_Log.warn(
        `[${input.issuer}] MA-SERVER-ACTION-LOG-LINE-UNPARSABLE: ${input.filePath} — `
        + `${String(err)} · sor: ${line.slice(0, 120)}`,
      );
    }
  }

  return rows;
}
