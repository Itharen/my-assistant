// `ma comm <subcommand>` — kommunikációs csatornák kezelése.
//
//   doctor  — tételes diagnosztika: mi él, mi hiányzik, MIT KELL TENNI
//   flush   — a Discord-köteg kiküldése (a döntés szerint, vagy `--force`-szal)
//   listen  — a Discord-figyelő (hosszan futó)
//   say     — kimenő üzenet; `--text` VAGY `--file`
//
// 🔴 A `--file` NEM kényelmi opció (2026-09-07 incidens): Windowson az `npx`/`cmd` burkoló
// a többsoros `--text` argumentumot AZ ELSŐ ÚJSORNÁL LEVÁGTA, és a rendszer minden szintje
// sikert jelentett rá. Fájlból olvasva a szöveg SOHA nem megy át a shellen.
//
// A `doctor` alapból EMBER-OLVASHATÓ táblát ír; `--json`-nal gépi envelope-ot.

import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { runCommDoctor } from '../comm/comm.doctor.js';
import { localTimeHeader } from '../utils/local-time.js';
import type { CommCheck, CommCheckStatus, CommDoctorReport } from '../comm/comm.models.js';
import { DiscordBridge } from '../discord/discord.bridge.js';
import { DiscordListener } from '../discord/discord.listener.js';
import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { sendDiscordMessage, type DiscordSendResult } from '../discord/discord.sender.js';
import { formatCommHistory, readCommHistory } from '../comm/comm.history.js';
import { AUDIT_LIMIT, auditDiscordChannel, formatChannelAudit } from '../comm/comm.channel-audit.js';
import {
  buildVoiceFunnelReport,
  renderVoiceFunnel,
  MAX_WINDOW_HOURS,
  type VoiceFunnelReport,
} from '../voice/voice-funnel-report.js';
import { resolveProjectRoot } from '../utils/project-root.js';
import { CcapError } from '../ccap/ccap.error.js';
import {
  decideVoiceLifecycleAction,
  VOICE_LEAVE_GRACE_MS,
  type VoiceLifecycleEvent,
} from '../voice/voice-lifecycle.js';
import { fail, makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

const STATUS_ICON: Record<CommCheckStatus, string> = {
  ok: '✅',
  missing: '⚪',
  degraded: '🟡',
  broken: '🔴',
  unknown: '❓',
};

const AREA_LABEL: Record<CommCheck['area'], string> = {
  ldp: 'LDP',
  ccap: 'CCAP',
  discord: 'Discord',
  speaker: 'Hangszóró',
  presence: 'Jelenlét',
};

/**
 * A kimenő üzenet szövegének feloldása — `--file` VAGY `--text`.
 *
 * 🔴 A `--file` az AJÁNLOTT út. A 2026-09-07-i incidensben a Windows `npx`/`cmd` burkoló a
 * többsoros `--text` argumentumot az ELSŐ ÚJSORNÁL levágta — a CLI és a `discord.js`
 * hibátlanul működött, csak sosem kapta meg a teljes szöveget. Fájlból olvasva a szöveg
 * **soha nem megy át a shellen**, tehát ez a hiba szerkezetileg lehetetlenné válik.
 *
 * ⛔ A hiányzó/olvashatatlan fájl NEM csendes: `CcapError`-t dob, orvoslással.
 */
async function resolveOutgoingText(
  source: { text?: string; file?: string },
): Promise<{ ok: true; text: string } | { ok: false; detail: string; remedy: string }> {
  if (!source.file) return { ok: true, text: source.text ?? '' };

  try {
    return { ok: true, text: await readFile(source.file, 'utf-8') };
  } catch (err: unknown) {
    return {
      ok: false,
      detail: `A megadott fájl nem olvasható: ${source.file} — `
        + `${err instanceof Error ? err.message : String(err)}`,
      remedy: 'Ellenőrizd az útvonalat (abszolút út a legbiztosabb), és hogy UTF-8 a kódolás.',
    };
  }
}

export async function runCommCommand(subcommand: string, args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args,
    options: {
      json: { type: 'boolean' },
      pretty: { type: 'boolean' },
      force: { type: 'boolean' },
      text: { type: 'string' },
      file: { type: 'string' },
      long: { type: 'boolean' },
      // ⚠️ A `--voice` MEGMARAD ELFOGADOTTNAK, de NINCS HATASA: 2026-09-10 ota a
      // hang-csatorna az ALAPERTELMEZES. Aki (vagy ami) meg igy hivja, ne kapjon
      // hibat — de ne is hihesse, hogy a kapcsolo dontott valamirol.
      voice: { type: 'boolean' },
      day: { type: 'string' },
      hours: { type: 'string' },
    },
    strict: false,
  });
  const asJson: boolean = Boolean(parsed.values.json);
  const pretty: boolean = Boolean(parsed.values.pretty);
  const action: string = `comm.${subcommand}`;

  try {
    if (subcommand === 'doctor') {
      const report: CommDoctorReport = await runCommDoctor();

      if (asJson) {
        writeEnvelope(ok(action, requestId, startedAt, report), pretty);
      } else {
        process.stdout.write(renderReport(report));
      }

      // A hibás/részleges állapot nem-nulla kilépési kód — így scriptből is észrevehető.
      if (report.overall === 'broken' || report.overall === 'degraded') process.exitCode = 1;
      return;
    }

    if (subcommand === 'flush') {
      const result = await new DiscordBridge().flush({ force: Boolean(parsed.values.force) });

      writeEnvelope(
        ok(action, requestId, startedAt, result ?? { deliveredCount: 0, skipped: true }),
        pretty || !asJson,
      );
      return;
    }

    if (subcommand === 'say') {
      const source = await resolveOutgoingText({
        text: typeof parsed.values.text === 'string' ? parsed.values.text : undefined,
        file: typeof parsed.values.file === 'string' ? parsed.values.file : undefined,
      });

      if (!source.ok) {
        // ⛔ A hiba SOSEM csendes: a hívó lássa, MI a baj és MIT tegyen.
        writeEnvelope(
          ok(action, requestId, startedAt, { sent: false, partCount: 0, detail: source.detail, remedy: source.remedy }),
          true,
        );
        process.exitCode = 1;

        return;
      }

      // ✂️ A `--long` TUDATOS felülbírálás. Alapból a rövidség-őr dönt: az owner 2026-09-07-én
      // EL SEM OLVASTA a hosszú üzeneteimet, tehát a hosszú üzenet nem „több infó", hanem
      // gyakorlatilag NULLA infó.
      const result = await sendDiscordMessage(source.text);

      // 🔊 A HANG-CSATORNA MÁR NEM OPCIÓ — ALAPÉRTELMEZÉS.
      //
      // > **Owner, 2026-09-10 18:27:** *„Minden üzeneted amiket küldesz az **automatikusan**
      // > kell jöjjön a Voice csatornára és a privát DM csatornára… **Semmiképpen ne kelljen
      // > neked kétszer küldeni**, hanem **by default**."*
      //
      // ⛔ EZÉRT TŰNT EL INNEN A `--voice` KAPCSOLÓ *(`0b44740`, ugyanaznap 18:24)*. A mögötte
      // álló indoklásom — *„az megduplázná a mennyiséget"* — **téves volt**: a mennyiséget a
      // **mondanivalók** száma adja, nem a célok száma. Ugyanaz az egy üzenet két helyen NEM
      // két üzenet, az owner pedig azt a felületet nézi, ahol épp van.
      //
      // ⭐ A szétosztás a `sendDiscordMessage`-ben van (`resolveSendTargets`), egyetlen
      // rögzítéssel — a `result.targets` mutatja, hova ment.

      writeEnvelope(ok(action, requestId, startedAt, result), pretty || !asJson);

      // ⚠️ A hang-csatorna bukása NEM teszi bukottá a küldést: a fő csatornába kiment.
      // ⛔ De el sem hallgatjuk — a burokban ott a `targets` lista minden céllal.
      if (!result.sent) process.exitCode = 1;
      return;
    }

    if (subcommand === 'history') {
      const limitRaw: unknown = parsed.values['limit'];
      const limit: number = typeof limitRaw === 'string' && Number.isFinite(Number(limitRaw))
        ? Number(limitRaw)
        : 30;
      const report = await readCommHistory(limit);

      if (asJson) {
        writeEnvelope(ok(action, requestId, startedAt, report), pretty);
      } else {
        process.stdout.write(`${formatCommHistory(report)}
`);
      }

      return;
    }

    if (subcommand === 'audit') {
      const limitRaw: unknown = parsed.values['limit'];
      const limit: number = typeof limitRaw === 'string' && Number.isFinite(Number(limitRaw))
        ? Number(limitRaw)
        : AUDIT_LIMIT;
      const report = await auditDiscordChannel(limit);

      if (asJson) {
        writeEnvelope(ok(action, requestId, startedAt, report), pretty);
      } else {
        process.stdout.write(`${formatChannelAudit(report)}
`);
      }

      // ⛔ Nem-nulla kilepesi kod, ha HIANY van VAGY ha nem tudtuk megnezni — mindketto
      // figyelmet erdemel, es a script csak igy veszi eszre.
      if (!report.ok || report.missing.length > 0) process.exitCode = 1;

      return;
    }

    if (subcommand === 'voice-funnel') {
      // 📊 AZ ÁTVITELI ARÁNY — a szám, amit az owner ténylegesen kérdezett (22:08).
      // ⛔ A napi akció-naplóból dolgozik, NEM az élő szondából: az a szerver-folyamatban él,
      // ezt a CLI nem látná. A napló viszont a tartós rekord, és túléli az újraindítást.
      //
      // 🔴 AZ ALAPÉRTELMEZÉS GÖRDÜLŐ ABLAK, NEM NAPTÁRI NAP (mérve 2026-09-08 00:51):
      // az owner ébrenléte csúszik, tehát egy éjfélen átnyúló beszélgetés naptári napokra
      // bontva KETTÉVÁGÓDNA, és egyik nap sem mutatná az igazi arányt. A `--day` továbbra is
      // kérhető, ha valaki tényleg egy konkrét naptári napot akar látni.
      const day: string = String(parsed.values.day ?? '').trim();
      const hoursRaw: string = String(parsed.values.hours ?? '').trim();
      const hours: number = Number(hoursRaw);

      if (hoursRaw && (!Number.isFinite(hours) || hours <= 0 || hours > MAX_WINDOW_HOURS)) {
        writeEnvelope(
          fail(
            action,
            requestId,
            startedAt,
            'MA-COMM-BAD-HOURS',
            `A --hours értéke nem értelmezhető 1 és ${MAX_WINDOW_HOURS} közötti számként: „${hoursRaw}".`,
            {
              given: hoursRaw,
              maxHours: MAX_WINDOW_HOURS,
              remedy: 'Adj meg órát számként, pl. `--hours 24`. A felső határ 90 nap, mert az '
                + 'ablak napi fájlokra bomlik — ennél nagyobb érték csak lassaná tenné a parancsot.',
            },
          ),
          pretty || !asJson,
        );
        process.exitCode = 1;

        return;
      }

      const funnel: VoiceFunnelReport = await buildVoiceFunnelReport({
        projectRoot: resolveProjectRoot(),
        ...(day ? { day: day } : {}),
        ...(hoursRaw ? { hours: hours } : {}),
      });

      if (asJson) writeEnvelope(ok(action, requestId, startedAt, funnel), pretty);
      else process.stdout.write(renderVoiceFunnel(funnel));

      return;
    }

    if (subcommand === 'listen') {
      // ⚠️ HOSSZAN FUTÓ parancs: a Discord-kapcsolat addig él, amíg ez a folyamat fut.
      const listener: DiscordListener = new DiscordListener();
      const result = await listener.start();

      writeEnvelope(ok(action, requestId, startedAt, result), pretty || !asJson);

      if (!result.started) {
        process.exitCode = 1;
        return;
      }

      // Siker esetén NEM térünk vissza — a figyelő a folyamat élettartamáig dolgozik.
      process.stdout.write('A figyelő fut. Leállítás: Ctrl+C.\n');
      await waitForShutdown(listener);

      return;
    }

    process.stderr.write(
      `Ismeretlen comm subcommand: "${subcommand}". Használat: doctor | flush | listen | say\n`,
    );
    process.exitCode = 1;
  } catch (err: unknown) {
    if (err instanceof CcapError) {
      writeEnvelope(
        fail(action, requestId, startedAt, err.code, err.message, { remedy: err.remedy }),
        true,
      );
      process.exitCode = 1;
      return;
    }

    throw err;
  }
}

/** Ember-olvasható riport — ezt olvassa az agent és az owner is. */
function renderReport(report: CommDoctorReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  KOMMUNIKÁCIÓS CSATORNÁK — DIAGNOSZTIKA');
  // ⏰ Helyi idő — a `report.checkedAt` marad ISO a gépi fogyasztóknak.
  lines.push(`  ${localTimeHeader(new Date(report.checkedAt))}`);
  lines.push('');

  let currentArea: string = '';

  for (const check of report.checks) {
    if (check.area !== currentArea) {
      currentArea = check.area;
      lines.push(`  ── ${AREA_LABEL[check.area]} ──`);
    }

    lines.push(`  ${STATUS_ICON[check.status]} ${check.label}`);
    lines.push(`       ${check.detail}`);

    if (check.remedy) lines.push(`       → TEENDŐ: ${check.remedy}`);

    lines.push('');
  }

  lines.push(`  ÖSSZEGZÉS: ${report.headline}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * 🚪 A FIGYELŐ RENDES LEÁLLÍTÁSA — hogy a hang-csatornából TÉNYLEG kilépjünk.
 *
 * > **Owner, 2026-09-10 18:28:** *„amikor leáll a szerver, illetve újraindul, olyankor ki
 * > kéne lépjél a csatornáról, hogy ne higgyem azt, hogy itt vagy."*
 *
 * ## 🔴 A MÉRT GYÖKÉR-OK, amit ez javít
 *
 * Itt korábban **CSAK `SIGINT`** volt kezelve. A szerver felügyelője viszont `child.kill()`-t
 * hív, aminek az alapértelmezett jele a **`SIGTERM`** ⇒ a `listener.stop()` **soha nem futott
 * le**, a hang-kapcsolat nem bomlott le tisztán, és a bot bent lévőnek látszott.
 *
 * ⚠️ **WINDOWSON A JEL SEM ELÉG:** a Node a `child.kill()`-t `TerminateProcess`-re képezi, ami
 * ⛔ nem elkapható. Ezért a második horgony a **`stdin` bezárulása**: amikor a szülő elmegy
 * *(rendesen VAGY összeomlással)*, a csővezeték záródik, és azt **azonnal** megkapjuk.
 *
 * ⭐ Ez az egyetlen horgony, ami egy **összeomlott** szervert is elfog — egy jel-kezelő nem.
 */
async function waitForShutdown(listener: DiscordListener): Promise<void> {
  await new Promise<void>((resolve) => {
    let closing: boolean = false;

    const shutdown = (event: VoiceLifecycleEvent): void => {
      // ⚠️ Több horgony is elsülhet egyszerre (jel + stdin-zárás). A második nem indíthat
      // MÁSODIK leállítást: az a hang-kapcsolatot félúton bontaná meg.
      if (closing) return;

      closing = true;

      const action = decideVoiceLifecycleAction(event);

      process.stdout.write(`\n🚪 Leállítás: ${action.reason}\n`);

      void listener.stop()
        .catch((err: unknown): void => {
          // ⛔ A leállítás hibája sem lehet néma: ha a kilépés bukott, a bot BENT MARADHAT,
          // és az ownert pont ez vezeti félre.
          SwallowedFailure_Util.report('comm.listen.shutdown', err);
        })
        .finally((): void => {
          // A kilépés HÁLÓZATI üzenet — adunk neki időt, hogy kiérjen a gateway-ig.
          setTimeout(resolve, VOICE_LEAVE_GRACE_MS);
        });
    };

    for (const signal of [ 'SIGINT', 'SIGTERM' ] as const) {
      process.once(signal, (): void => shutdown('signal'));
    }

    // ⭐ A SZÜLŐ ELTŰNÉSE. A felügyelő `stdio: ['pipe', …]`-pal indít, ezért amikor elmegy,
    // ez a folyam véget ér. ⛔ SZÁNDÉKOSAN nem a szülő PID-jét figyeljük időzítővel: ez
    // esemény-vezérelt és azonnali.
    //
    // ⚠️ Ha a figyelőt KÉZZEL indították (terminálból), a `stdin` egy tty, ami nem záródik be
    // magától — ilyenkor ez a horgony egyszerűen nem sül el, és a jel-kezelő dolgozik.
    process.stdin.on('end', (): void => shutdown('parent-gone'));
    process.stdin.on('close', (): void => shutdown('parent-gone'));
    process.stdin.resume();
  });
}
