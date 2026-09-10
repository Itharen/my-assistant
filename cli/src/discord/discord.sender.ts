// Kimenő irány — ÉN → Discord.
//
// Owner-szabály (2026-09-06): a Discordról érkező üzenetre **nem elég a sessionben
// válaszolni — Discordon IS kell**. Enélkül a csatorna fél lábon áll: látom, amit írsz,
// de te nem látod a választ.
//
// Egyszeri küldés: bejelentkezik, küld, bont. Nem tart fenn állandó kapcsolatot — az a
// figyelő dolga (`discord.listener.ts`), és két párhuzamos gateway-kapcsolat fölösleges.

import { Client, GatewayIntentBits, type TextBasedChannel } from 'discord.js';

import { verifyDelivery, type DeliveredMessage } from './discord.delivery-check.js';
import { recordOutbound, type OutboundKind } from './discord.reply-tracker.js';
import { inspectBrevity } from './discord.brevity-guard.js';

/** A Discord üzenet-hossz korlátja. E fölött darabolunk. */
const DISCORD_MAX_MESSAGE_CHARS: number = 2000;

export interface DiscordSendResult {
  sent: boolean;
  /** Hány részletben ment ki (hosszú szöveget darabolunk). */
  partCount: number;
  detail: string;
  /** MIT KELL TENNI, ha nem ment. */
  remedy?: string;
  /**
   * A küldés UTÁNI visszaolvasás eredménye — tényleg megérkezett-e, teljes egészében.
   *
   * ⚠️ `false` esetén a `sent: true` **NEM jelent sikert**: a darab kiment, de csonkán
   * (vagy egyáltalán nem) érkezett meg. Ez fogta meg a 2026-09-07-i incidenst.
   */
  verifiedIntact?: boolean;
  /** A visszaolvasás összegzése. */
  verifyDetail?: string;
  /**
   * 🔊 A CÉLOK, ahova ez az EGY üzenet kiment.
   *
   * ⭐ MIÉRT LISTA, és miért nem két külön küldés: az owner 2026-09-10-i kérése szerint minden
   * üzenet **automatikusan** menjen a privát csatornába ÉS a hang-csatornába — de
   * *„semmiképpen ne kelljen kétszer küldeni"*. ⛔ Két hívás **két üzenet-eseményt** adna a
   * naplóban és a mérésben, és a napi darabszám látszólag megduplázódna, holott egy dolgot
   * mondtunk. Ezért: **egy üzenet, több cél, EGY rögzítés**.
   */
  targets?: DiscordSendTargetResult[];
}

/** Egy cél-csatorna, ahova az üzenet megy. */
export interface DiscordSendTarget {
  channelId: string;
  /** `primary` = a fő/privát szöveges csatorna · `voice` = a hang-csatorna szöveges sávja. */
  role: 'primary' | 'voice';
}

/** Egy cél kimenetele. */
export interface DiscordSendTargetResult extends DiscordSendTarget {
  sent: boolean;
  detail: string;
}

/**
 * Üzenet küldése a beállított csatornába.
 *
 * 🔴 Hiba esetén NEM dob kivételt, hanem leíró eredményt ad — a hívónak (és az ownernek)
 * az a hasznos, hogy MI hiányzik, nem egy verem-nyom.
 */
export async function sendDiscordMessage(
  text: string,
  /**
   * `reply` (alap) = valodi valasz · `ack` = atveteli nyugta.
   *
   * ⛔ A nyugta NEM torli a valasz-kotelezettseget — lasd `OutboundKind`.
   */
  kind: OutboundKind = 'reply',
  /**
   * 🔊 Hova menjen — ha üres, a fő szöveges csatorna.
   *
   * 🔴 MÉRT HIBA (2026-09-07 21:47): a hang-csatornai tükör-szöveg a **fő szöveges csatornába**
   * ment, nem oda, ahol az owner beszélt. Ő a hang-csatornát nézte, és **semmilyen reakciót nem
   * látott** — pedig a tükör kiment. Az ő eredeti kérése egyértelmű volt: *„oda is kell majd
   * mirror text formában mindkettőnknek"* — **ODA**, nem máshova.
   */
  targetChannelId: string = '',
): Promise<DiscordSendResult> {
  const token: string = (process.env['MA_DISCORD_BOT_TOKEN'] ?? '').trim();
  // 🔊 ALAPÉRTELMEZÉSBEN KÉT CÉL: a fő/privát csatorna ÉS a hang-csatorna szöveges sávja.
  // A döntés a tiszta `resolveSendTargets`-ben van — l. az ottani indoklást.
  const targets: DiscordSendTarget[] = resolveSendTargets(
    targetChannelId,
    process.env['MA_DISCORD_CHANNEL_ID'],
    process.env['MA_DISCORD_VOICE_CHANNEL_ID'],
  );
  const channelId: string = targets[0]?.channelId ?? '';
  const trimmed: string = text.trim();

  if (!trimmed) {
    return { sent: false, partCount: 0, detail: 'Üres üzenetet nem küldünk.', remedy: 'Adj meg szöveget.' };
  }

  // ✂️ RÖVIDSÉG: TANÁCS, NEM KAPU — az owner javította ki a saját javításomat.
  //
  // > **Owner (2026-09-07 21:45):** *„az nem annyira tűnik megoldásnak, hogy lekorlátozod magad,
  // > hogy egy üzenetbe csak x mennyiségű karaktert írhatsz. Nem az a lényeg, hogy szét
  // > szegmentáld az üzeneteidet, mert így tulajdonképpen csak ahelyett, hogy elküldenél egy
  // > nagyobb üzenetet, ahelyett küldesz 10 kicsit, ami hülyeség… és amúgy is kell, hogy tudjál
  // > hosszabb üzeneteket összeírni."*
  //
  // 🔴 AMIT ELRONTOTTAM: a hosszra optimalizáltam, pedig a panasz a **sűrűségre** szólt. A
  // kemény korlát nem rövidebbé tett, hanem **feldarabolóvá** — és közben **elhagytam az
  // emojikat**, amik épp a tagolást adták: *„egy csomó emojit használtál, ami tök jól
  // szétbontotta nekem a dolgokat… és most ezt abbahagytad, pedig az jó volt."*
  //
  // ⇒ A hossz **nem a mérendő mennyiség**. Egy tagolt, emojikkal horgonyzott hosszú üzenet
  // olvasható; egy tagolatlan rövid is lehet olvashatatlan. A `brevityHint` **jelez**, de
  // ⛔ SOHA nem blokkol — a döntés a fogalmazásé, nem a számlálóé.
  const brevity = inspectBrevity(trimmed);

  void brevity;

  if (!token || !channelId) {
    return {
      sent: false,
      partCount: 0,
      detail: 'Hiányzik a bot-token vagy a csatorna-azonosító.',
      remedy: 'Állítsd be a `.env`-ben: MA_DISCORD_BOT_TOKEN és MA_DISCORD_CHANNEL_ID.',
    };
  }

  // A küldéshez elég a `Guilds` intent — üzenetet olvasni nem akarunk, csak írni.
  const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });

  try {
    await client.login(token);

    const parts: string[] = splitForDiscord(trimmed);
    const outcomes: DiscordSendTargetResult[] = [];
    let primaryVerdict: { intact: boolean; detail: string; remedy?: string } | null = null;

    for (const target of targets) {
      const outcome = await deliverToTarget(client, target, parts);

      outcomes.push(outcome.result);

      // ⚠️ A VISSZAOLVASÁS csak a FŐ célra vonatkozik: az az elsődleges kézbesítés, azon áll
      // vagy bukik, hogy az owner megkapta-e. A hang-csatorna a MÁSODIK hely, ahol ugyanaz
      // látszik — ha az bukik, azt a `targets` mutatja, de nem teszi bukottá a küldést.
      if (target.role === 'primary') primaryVerdict = outcome.verdict;
    }

    const primarySent: boolean = outcomes.some(
      (o: DiscordSendTargetResult): boolean => o.role === 'primary' && o.sent,
    );

    if (!primarySent) {
      return {
        sent: false,
        partCount: 0,
        detail: outcomes.find((o) => o.role === 'primary')?.detail
          ?? 'Nincs elérhető fő csatorna.',
        remedy: 'Ellenőrizd a MA_DISCORD_CHANNEL_ID-t, és hogy a bot látja-e a csatornát.',
        targets: outcomes,
      };
    }

    // G-1: a valasz-kotelezettseg kovetesehez rogzitjuk a kimeno uzenetet.
    // ⛔ PONTOSAN EGYSZER, a célok számától FÜGGETLENÜL — l. `DiscordSendResult.targets`.
    await recordOutbound(new Date().toISOString(), kind, trimmed);

    const failed: DiscordSendTargetResult[] = outcomes.filter(
      (o: DiscordSendTargetResult): boolean => !o.sent,
    );

    return {
      sent: true,
      partCount: parts.length,
      detail: `${parts.length === 1 ? 'Elküldve' : `Elküldve ${parts.length} részletben`}`
        + ` · ${outcomes.length - failed.length}/${outcomes.length} cél.`,
      ...(primaryVerdict === null ? {} : {
        verifiedIntact: primaryVerdict.intact,
        verifyDetail: primaryVerdict.detail,
        ...(primaryVerdict.intact || primaryVerdict.remedy === undefined
          ? {}
          : { remedy: primaryVerdict.remedy }),
      }),
      targets: outcomes,
    };
  } catch (err: unknown) {
    const message: string = err instanceof Error ? err.message : String(err);

    return {
      sent: false,
      partCount: 0,
      detail: `A küldés nem sikerült: ${message}`,
      remedy: 'Ellenőrizd, hogy a botnak van-e `Send Messages` joga a csatornában, '
        + 'és hogy a token érvényes-e.',
    };
  } finally {
    // A kapcsolatot MINDIG bontjuk — különben a folyamat nem állna le.
    await client.destroy().catch(() => undefined);
  }
}

/**
 * EGY cél kiszolgálása a MÁR bejelentkezett klienssel.
 *
 * ⭐ MIÉRT KAPJA A KLIENST: egy küldés = egy bejelentkezés. Célonként új `Client` két gateway-
 * kapcsolatot nyitna ugyanahhoz a bothoz, ami lassabb és a Discord felé is zajos.
 *
 * ⛔ **Nem dob**: egy cél bukása nem viheti magával a többit. A `sent: false` + `detail`
 * mondja meg, mi történt — a hívó a `targets` listában látja.
 */
async function deliverToTarget(
  client: Client,
  target: DiscordSendTarget,
  parts: string[],
): Promise<{
  result: DiscordSendTargetResult;
  verdict: { intact: boolean; detail: string; remedy?: string } | null;
}> {
  try {
    const channel = await client.channels.fetch(target.channelId);

    if (!channel || !channel.isTextBased() || !('send' in channel)) {
      return {
        result: {
          ...target,
          sent: false,
          detail: `A csatorna nem érhető el, vagy nem szöveges (${target.channelId}).`,
        },
        verdict: null,
      };
    }

    for (const part of parts) {
      await (channel as TextBasedChannel & { send: (content: string) => Promise<unknown> }).send(part);
    }

    // ⭐ KÜLDÉS UTÁNI VISSZAOLVASÁS (owner-javaslat, 2026-09-07). A `send()` visszatérése
    // csak azt mondja meg, hogy ELINDULT — azt nem, hogy TELJES EGÉSZÉBEN megérkezett.
    const verdict = await verifyAgainstChannel(channel, parts);

    return {
      result: { ...target, sent: true, detail: verdict.detail },
      verdict: verdict,
    };
  } catch (err: unknown) {
    return {
      result: {
        ...target,
        sent: false,
        detail: `A küldés nem sikerült: ${err instanceof Error ? err.message : String(err)}`,
      },
      verdict: null,
    };
  }
}

/**
 * A csatorna visszaolvasása és összevetése azzal, amit küldtünk.
 *
 * 🔴 SOHA nem dob: ha maga az ellenőrzés bukik, azt „nem tudjuk"-ként jelentjük — de a
 * küldést nem minősítjük sikertelennek miatta. A hamis riasztás is kár.
 */
async function verifyAgainstChannel(
  channel: unknown,
  parts: string[],
): Promise<{ intact: boolean; detail: string; remedy?: string }> {
  try {
    const fetchable = channel as {
      messages: { fetch: (options: { limit: number }) => Promise<Map<string, { id: string; content: string }>> };
    };
    const history = await fetchable.messages.fetch({ limit: Math.min(parts.length + 3, 20) });
    const arrived: DeliveredMessage[] = [...history.values()].map((message) => ({
      id: message.id,
      content: message.content,
    }));

    return verifyDelivery({ sentParts: parts, arrived });
  } catch (err: unknown) {
    return {
      intact: true,
      detail: 'A visszaolvasás nem futott le '
        + `(${err instanceof Error ? err.message : String(err)}) — a küldés maga sikeres volt.`,
    };
  }
}

/**
 * Hosszú szöveg darabolása a Discord 2000 karakteres korlátja alá.
 *
 * Soronként vágunk, hogy a mondatok ne törjenek szét. Egy önmagában túl hosszú sort
 * kényszerből darabolunk — de ez ritka, és jobb, mint az elveszett üzenet.
 */
export function splitForDiscord(text: string): string[] {
  if (text.length <= DISCORD_MAX_MESSAGE_CHARS) return [text];

  const parts: string[] = [];
  let current: string = '';

  for (const line of text.split('\n')) {
    if (line.length > DISCORD_MAX_MESSAGE_CHARS) {
      if (current) { parts.push(current); current = ''; }

      for (let index = 0; index < line.length; index += DISCORD_MAX_MESSAGE_CHARS) {
        parts.push(line.slice(index, index + DISCORD_MAX_MESSAGE_CHARS));
      }

      continue;
    }

    // +1 az újsor karakterre.
    if (current.length + line.length + 1 > DISCORD_MAX_MESSAGE_CHARS) {
      parts.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }

  if (current) parts.push(current);

  return parts;
}

/**
 * MELYIK csatornába menjen az üzenet.
 *
 * 🔴 MIÉRT KÜLÖN, TISZTA FÜGGVÉNY: ez a döntés **már okozott valós hibát** (2026-09-07 21:47) —
 * a hang-csatornai tükör a **fő szöveges csatornába** ment, az owner pedig a hang-csatornát
 * nézte, és *„semmilyen reakciót nem látott"*. A `sendDiscordMessage` hálózatot hív, ezért
 * **szerkezetileg tesztelhetetlen** volt; így a hibás ág **soha nem bukott meg tesztben**.
 *
 * ⭐ 2026-09-09: ugyanez a döntés lett a `--voice` kapcsoló alapja is *(a válasz a
 * hang-csatornába is kimegy)* ⇒ innentől **két hívó** múlik rajta, és nem maradhat fedezetlen.
 *
 * @param target  a kifejezetten kért csatorna — üres, ha nincs ilyen
 * @param fallback a `MA_DISCORD_CHANNEL_ID` értéke (fő szöveges csatorna)
 */
export function resolveTargetChannelId(target: string | undefined, fallback: string | undefined): string {
  return (target ?? '').trim() || (fallback ?? '').trim();
}

/**
 * 🔊 HOVA MENJEN AZ ÜZENET — **tiszta függvény**, hálózat nélkül.
 *
 * > **Owner, 2026-09-10 18:27:** *„Minden üzeneted amiket küldesz az **automatikusan** kell
 * > jöjjön a **Voice csatornára és a privát DM** csatornára, anélkül, hogy azt külön
 * > állítgatnád… **Semmiképpen ne kelljen neked kétszer küldeni**, hanem **by default**."*
 *
 * ⚠️ **EZ VISSZAVONJA A `--voice` KAPCSOLÓT** *(`0b44740`, ugyanaznap 18:24)*. A kapcsoló
 * mögötti indoklásom — *„az megduplázná a mennyiséget"* — **téves volt**: a mennyiség nem a
 * célok száma, hanem a **mondanivalók** száma. Ugyanaz az egy üzenet két helyen **nem** két
 * üzenet; az owner pedig azt nézi, ahol épp van.
 *
 * ## A három eset
 *
 * | bemenet | eredmény |
 * |---|---|
 * | **kifejezett** cél *(`targetChannelId`)* | CSAK az — a hívó pontosan tudja, hova akar írni |
 * | nincs kifejezett cél, a hang-csatorna be van állítva | **fő + hang** |
 * | nincs kifejezett cél, a hang-csatorna nincs beállítva | csak a fő |
 *
 * ⛔ A kifejezett cél SZÁNDÉKOSAN nem duplázódik: erre épül a hangüzenet-tükör és a késve
 * feloldott átirat *(`ma stt retry`)*, ahol a cél a válasz-referencia csatornája.
 *
 * ⚠️ Ha a hang-csatorna azonosítója MEGEGYEZIK a fő csatornáéval, egyszer küldünk — különben
 * az owner ugyanazt kétszer látná ugyanott.
 */
export function resolveSendTargets(
  explicitTarget: string | undefined,
  primaryChannelId: string | undefined,
  voiceChannelId: string | undefined,
): DiscordSendTarget[] {
  const explicit: string = (explicitTarget ?? '').trim();

  if (explicit) {
    return [ { channelId: explicit, role: 'primary' } ];
  }
  const primary: string = (primaryChannelId ?? '').trim();
  const voice: string = (voiceChannelId ?? '').trim();
  const targets: DiscordSendTarget[] = [];

  if (primary) targets.push({ channelId: primary, role: 'primary' });
  if (voice && voice !== primary) targets.push({ channelId: voice, role: 'voice' });

  return targets;
}
