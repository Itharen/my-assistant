// 👂 HANGÜZENET-NYUGTÁZÁS — reakció a hangüzenetre + VÁLASZ-LÁNC az átirathoz.
//
// > **Owner-kérés (2026-09-07 12:26, hangüzenetben) — SZÓ SZERINT:**
// > *„nem typing kell, amikor hangüzenetfeldolgozás van, hanem tudsz-e dobni egy fül emojit a
// > hangüzenetekre, és tudsz-e riplájolni a hangüzenetekre, hogy összeköthessük, hogy riplájolsz
// > arra a hangüzenetre, amit transzkripteltél."*
//
// ⭐ MIÉRT JOBB EZ A „gépel…" JELZÉSNÉL — és miért VÁLTOTTA FEL azt:
//
//   1. A „gépel…" **csatorna-szintű**: azt mondja, hogy dolgozom valamin. Több hangüzenetnél
//      NEM mondja meg, MELYIKEN — pedig pont ez a kérdés.
//   2. A „gépel…" **elenyészik**: időzítve lejár, és utólag semmi nyoma. A reakció **ottmarad**
//      a hangüzeneten: hetekkel később is látszik, hogy azt az egyet meghallottam.
//   3. A tükör-üzenet válasz nélkül **elszakad a forrásától**. Egy csatornányi hangüzenet és
//      egy csatornányi átirat között utólag nincs mit összepárosítani. A válasz-lánc az
//      **egyetlen** dolog, ami a kettőt tartósan összeköti.
//
// 🔴 EGYIK MŰVELET SEM DOBHAT HIBÁT. A nyugtázás **kísérőjelenség**: ha a Discord épp nem
// engedi a reakciót (jogosultság, rate limit, törölt üzenet), attól a felismerés még mehet.
// A hiba **jelentendő**, de nem állíthatja meg a feldolgozást.

/** A fül-emoji: „ezt meghallottam, most dolgozom rajta". */
export const VOICE_HEARD_REACTION: string = '👂';

/**
 * Amennyi a discord.js `Message`-ből TÉNYLEGESEN kell.
 *
 * ⭐ Szándékosan ilyen szűk: így a logika **teszthető** valódi Discord-kapcsolat nélkül, és
 * a modul nem függ a discord.js verziójától.
 */
export interface VoiceAcknowledgeTarget {
  react(emoji: string): Promise<unknown>;
  reply(content: string): Promise<unknown>;
}

/** Egy nyugtázási művelet kimenetele — SOHA nem kivétel, mindig leírás. */
export interface AcknowledgeOutcome {
  ok: boolean;
  /** Mi történt — hiba esetén az OK, nem csak az, hogy „nem sikerült". */
  detail: string;
  /** Mit lehet tenni ellene. Csak hibánál van értelme. */
  remedy?: string;
}

/**
 * 👂 rátesszük a fül-emojit a hangüzenetre — „ezt meghallottam".
 *
 * A felismerés ELŐTT hívandó: a lényege, hogy az owner **a várakozás alatt** lássa, melyik
 * üzenetén dolgozom éppen.
 */
export async function markVoiceHeard(
  target: VoiceAcknowledgeTarget,
  emoji: string = VOICE_HEARD_REACTION,
): Promise<AcknowledgeOutcome> {
  try {
    await target.react(emoji);

    return { ok: true, detail: `Reakció rátéve (${emoji}).` };
  } catch (err: unknown) {
    return {
      ok: false,
      detail: `A(z) ${emoji} reakciót nem sikerült rátenni a hangüzenetre — `
        + `${err instanceof Error ? err.message : String(err)}`,
      remedy: 'Ellenőrizd, hogy a botnak van-e „Add Reactions" joga a csatornán, '
        + 'és hogy az üzenet nem lett-e időközben törölve.',
    };
  }
}

/**
 * Az átirat VÁLASZKÉNT megy ki arra a hangüzenetre, amiből készült.
 *
 * ⚠️ A `parts` már **felosztott** szöveg (Discord 2000-karakteres korlát). MINDEN darab
 * válaszként megy, nem csak az első: több darabnál pont az utolsók sodródnának el a
 * forrásuktól, pedig a lánc-összekötés az egész művelet célja.
 *
 * 🔴 RÉSZLEGES SIKER IS HIBA: ha a harmadik darab elbukik, az átirat **csonkán** látszik —
 * és a csonka átirat pontosan úgy néz ki, mint a teljes. Ezért a hányadik darabnál bukott,
 * az BENNE VAN a hibaszövegben.
 */
export async function replyToVoice(
  target: VoiceAcknowledgeTarget,
  parts: string[],
): Promise<AcknowledgeOutcome> {
  if (parts.length === 0) {
    return { ok: false, detail: 'Nincs mit válaszolni — üres a szöveg.', remedy: 'Adj meg szöveget.' };
  }

  for (const [index, part] of parts.entries()) {
    try {
      await target.reply(part);
    } catch (err: unknown) {
      return {
        ok: false,
        detail: `A válasz ${index + 1}/${parts.length}. darabja nem ment ki — `
          + `${err instanceof Error ? err.message : String(err)}`,
        remedy: index === 0
          ? 'Ellenőrizd, hogy a bot lát-e a csatornán, és hogy a hangüzenet megvan-e még.'
          : '⚠️ Az átirat CSONKÁN látszik a Discordon — a hiányzó részt külön kell kiküldeni.',
      };
    }
  }

  return {
    ok: true,
    detail: parts.length === 1
      ? 'Válasz elküldve a hangüzenetre.'
      : `Válasz elküldve a hangüzenetre, ${parts.length} részletben.`,
  };
}
