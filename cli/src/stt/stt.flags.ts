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

import type { SttSegmentation } from './stt.models.js';

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
  /**
   * 🧩 Hány részletből állt össze az átirat *(1 = egy hívás)*.
   *
   * 🔴 MIÉRT LÁTSZIK EZ AZ OWNERNEK: a felismerő **30 másodperces ablakkal** dolgozik
   * *(mérve 2026-09-11, `stt-audio-window.ts`)*, ezért a hosszabb hangot **darabolva** adjuk
   * be. Ez javít a helyzeten, de nem kockázat nélkül — a határon lévő szó elcsúszhat.
   * ⇒ A jelölés megmondja, hogy összefűzött szöveget lát.
   */
  parts: number;
  /** 🔴 Ennyi részlet felismerése ELBUKOTT ⇒ a szöveg HIÁNYOS. */
  failedParts: number;
  /** ⚠️ Ennyi vágás esett beszéd közben. */
  midSpeechCuts: number;
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

/**
 * Az átirat összes flagje.
 *
 * @param segmentation a darabolás képe, ha a hang nem fért a felismerő ablakába.
 *   ⚠️ **Opcionális** — a hiánya „egy hívás"-t jelent, ⛔ nem „nem tudom".
 */
export function collectFlags(text: string, segmentation?: SttSegmentation): TranscriptFlags {
  return {
    machineTranscribed: true,
    looksTruncated: looksTruncated(text),
    mishearings: findMishearings(text),
    parts: segmentation?.parts ?? 1,
    failedParts: segmentation?.failedParts ?? 0,
    midSpeechCuts: segmentation?.midSpeechCuts ?? 0,
  };
}

/**
 * A flagek rövid, ember-olvasható alakja — ez kerül az átirat mellé.
 *
 * ⭐ Szándékosan TÖMÖR: a jelölésnek fel kell tűnnie, de nem nyomhatja el magát az üzenetet.
 */
export function describeFlags(flags: TranscriptFlags): string {
  const parts: string[] = ['🎙️ gépi átirat'];

  if (flags.looksTruncated) parts.push('⚠️ GYANÚS TAGOLÁS — hiányozhat a vége, VAGY rossz helyen a pont');

  // 🧩 A DARABOLÁS KIMONDVA — ⛔ néma összefűzés nincs.
  //
  // ⚠️ A feladat kikötése (owner, 2026-09-11 15:54): ha a teljes feldolgozás technikai
  // korlátba ütközik, az LÁTSZÓDJON. A hosszú hangot a felismerő 30 mp-es ablaka miatt
  // daraboljuk — ez tehát nem hiba-jelzés, hanem a feldolgozás ŐSZINTE leírása.
  if (flags.parts > 1) parts.push(`🧩 ${flags.parts} részletben ismerve (30 mp-es ablak)`);

  // 🔴 EZ VISZONT VALÓDI HIÁNY: egy elbukott részlet után a szöveg CSONKA — és ránézésre
  // ugyanúgy néz ki, mint egy teljes. Ez az a hibaosztály, ami ezt a munkát kiváltotta.
  if (flags.failedParts > 0) {
    parts.push(`🔴 ${flags.failedParts} részlet felismerése ELBUKOTT — a szöveg HIÁNYOS`);
  }

  if (flags.midSpeechCuts > 0) {
    parts.push(`⚠️ ${flags.midSpeechCuts} vágás beszéd közben esett — ott szó csúszhatott el`);
  }

  if (flags.mishearings.length > 0) {
    const hints: string = flags.mishearings
      .map((m) => `„${m.heard}" ≈ ${m.likely}`)
      .join(' · ');

    parts.push(`🔤 ismert félrehallás: ${hints}`);
  }

  return parts.join(' · ');
}
