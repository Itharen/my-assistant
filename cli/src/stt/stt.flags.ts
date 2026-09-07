// STT-FLAGEK — „ez gépi átirat, és EZ a gyanús benne".
//
// > **Owner-kérés (2026-09-07, hangüzenetben):** *„az STT-vel küldött üzeneteknél lehet, hogy
// > valami kis egyszerű flegekkel megjelölhetjük az üzeneteket, hogy tudják róla, hogy ez egy
// > STT volt, mert ugye az STT-kben lehetnek transkript hibák, félrehallások"*
//
// ⭐ A JELÖLÉS NEM DÍSZ: a gépi átirat és a gépelt szöveg **ránézésre azonos**, pedig az egyik
// az owner szó szerinti utasítása, a másik egy valószínűségi tipp. A flag az egyetlen jel,
// ami ezt a különbséget láthatóvá teszi — nekem is, neki is.
//
// ⛔ EGYIK FLAG SEM ÍRJA ÁT A SZÖVEGET. Csak megjelöl. Az automatikus javítás pont azt a hibát
// követné el, amit el akarunk kerülni: magabiztosan rosszat állítani.

/** Az ismert félrehallások. SSOT a magyarázatokkal: `current/stt-mishearings.md`. */
const KNOWN_MISHEARINGS: { heard: string; likely: string }[] = [
  { heard: 'CIC', likely: 'CI/CD' },
  { heard: 'FTP templates', likely: 'FDP Templates' },
  { heard: 'FTP template', likely: 'FDP Templates' },
  { heard: 'fleg', likely: 'flag' },
  { heard: 'transkript', likely: 'transcript' },
];

export interface TranscriptFlags {
  /** Mindig igaz — ez gépi átirat. */
  machineTranscribed: true;
  /**
   * A mondat közepén ér véget?
   *
   * 🔴 EZ A LEGVESZÉLYESEBB ESET, és MÉRT: 2026-09-07-én egy 32 mp-es üzenet átirata
   * mondat közben ért véget. ⚠️ A félrehallás **látszik**, a hiányzó vég **nem** — egy csonka
   * utasítás pontosan úgy néz ki, mint egy teljes.
   */
  looksTruncated: boolean;
  /** Az átiratban talált ismert félrehallások. */
  mishearings: { heard: string; likely: string }[];
}

/**
 * Mondat közben ér véget az átirat?
 *
 * A jelzés egyszerű és szándékosan ÓVATOS: ha nincs mondatzáró írásjel a végén, gyanús.
 * ⚠️ Inkább jelöljünk meg egy teljes mondatot fölöslegesen, mint hogy egy csonka utasítás
 * teljesnek látsszon.
 */
export function looksTruncated(text: string): boolean {
  const trimmed: string = text.trim();

  if (!trimmed) return false;

  return !/[.!?…]$/.test(trimmed);
}

/** Az ismert félrehallások keresése — kis/nagybetűtől függetlenül. */
export function findMishearings(text: string): { heard: string; likely: string }[] {
  const lower: string = text.toLowerCase();

  return KNOWN_MISHEARINGS.filter((entry) => lower.includes(entry.heard.toLowerCase()));
}

/** Az átirat összes flagje. */
export function collectFlags(text: string): TranscriptFlags {
  return {
    machineTranscribed: true,
    looksTruncated: looksTruncated(text),
    mishearings: findMishearings(text),
  };
}

/**
 * A flagek rövid, ember-olvasható alakja — ez kerül az átirat mellé.
 *
 * ⭐ Szándékosan TÖMÖR: a jelölésnek fel kell tűnnie, de nem nyomhatja el magát az üzenetet.
 */
export function describeFlags(flags: TranscriptFlags): string {
  const parts: string[] = ['🎙️ gépi átirat'];

  if (flags.looksTruncated) parts.push('⚠️ MONDAT KÖZBEN VÉGET ÉR — hiányozhat a vége');

  if (flags.mishearings.length > 0) {
    const hints: string = flags.mishearings
      .map((m) => `„${m.heard}" ≈ ${m.likely}`)
      .join(' · ');

    parts.push(`🔤 ismert félrehallás: ${hints}`);
  }

  return parts.join(' · ');
}
