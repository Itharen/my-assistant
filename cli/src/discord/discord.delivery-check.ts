// KÜLDÉS UTÁNI VISSZAOLVASÁS — tényleg megérkezett, és teljes egészében?
//
// > **Owner-javaslat (2026-09-07):** *„Lehet, hogy vissza is se kéne ellenőrizni időnként,
// > hogy sikerülhet-e infókat átadni a Discordon, miután megtörtént."*
// > ⭐ **Ez a javaslat fogta meg a 2026-09-07-i csonkolási incidenst.**
//
// 🔴 MIÉRT KELL: aznap MINDEN kimenő üzenetem az ELSŐ SORNÁL csonkolódott — a Windows
// `npx`/`cmd` burkoló vágta le a többsoros argumentumot. És a rendszer minden szintje
// ŐSZINTÉN sikert jelentett: `sent: true` igaz volt, `partCount: 1` igaz volt, a daraboló
// hibátlan volt. A hiba a MÉRÉSÜNK HATÁRÁN KÍVÜL történt.
//
// ⇒ Ahol a kimenet elhagyja a rendszerünket, ott VISSZA KELL OLVASNI. Nem elég tudni, hogy
//   elküldtük — azt kell tudni, hogy MEGÉRKEZETT, és TELJES EGÉSZÉBEN.
//
// A visszaolvasás szándékosan a REST API-t használja, nem a `discord.js` gyorsítótárát:
// a gyorsítótár azt tudja, amit MI küldtünk — a REST azt, ami a szerveren VAN.

/** Egy visszaolvasott üzenet, amit mi küldtünk. */
export interface DeliveredMessage {
  id: string;
  content: string;
}

export interface DeliveryVerdict {
  /** Megérkezett-e minden darab, hiánytalanul. */
  intact: boolean;
  /** Ember-olvasható összegzés. */
  detail: string;
  /** MIT KELL TENNI, ha nem ép. */
  remedy?: string;
  /** Darabonként: mennyit küldtünk, mennyi érkezett. */
  parts: { sent: number; arrived: number }[];
}

/**
 * A küldött darabok összevetése azzal, ami ténylegesen megérkezett.
 *
 * Tiszta függvény — hálózat nélkül tesztelhető. A hívó adja a visszaolvasott üzeneteket.
 *
 * ⚠️ A **hosszt** hasonlítjuk, nem a tartalmat: a Discord bizonyos formázást
 * normalizálhat, de a **hossz-vesztés** mindig valódi hiba.
 */
export function verifyDelivery(params: {
  sentParts: string[];
  arrived: DeliveredMessage[];
}): DeliveryVerdict {
  const { sentParts } = params;
  // A visszaolvasás újtól régi felé jön; nekünk küldési sorrend kell, és csak az utolsó N.
  const arrivedContents: string[] = params.arrived
    .slice(0, sentParts.length)
    .map((message) => message.content)
    .reverse();

  const parts: { sent: number; arrived: number }[] = sentParts.map((part, index) => ({
    sent: part.length,
    arrived: arrivedContents[index]?.length ?? 0,
  }));

  const missing: number = sentParts.length - arrivedContents.length;
  const truncated: number = parts.filter((part) => part.arrived < part.sent).length;

  if (missing > 0) {
    return {
      intact: false,
      detail: `${missing} darab NEM található a csatornán (${sentParts.length} ment ki, `
        + `${arrivedContents.length} olvasható vissza).`,
      remedy: 'Küldd újra a hiányzó részt. Ha ismétlődik, nézd meg a bot jogosultságait '
        + 'és a csatorna-azonosítót: `ma comm doctor`.',
      parts,
    };
  }

  if (truncated > 0) {
    const worst = parts.find((part) => part.arrived < part.sent);

    return {
      intact: false,
      detail: `${truncated} darab CSONKOLVA érkezett meg `
        + `(pl. küldött ${worst?.sent} → megérkezett ${worst?.arrived} karakter).`,
      remedy: 'A szöveg valahol elveszett a küldés útján. Használd a `--file` opciót '
        + '(`ma comm say --file <út>`) — így a shell/burkoló nem tudja elvágni.',
      parts,
    };
  }

  return {
    intact: true,
    detail: sentParts.length === 1
      ? `Megérkezett hiánytalanul (${parts[0]?.arrived} karakter).`
      : `Mind a ${sentParts.length} darab megérkezett hiánytalanul.`,
    parts,
  };
}
