// `ma doctor now` — MI TÖRTÉNIK ÉPPEN MOST. Egy képernyő, minden sor MÉRT adat.
//
// > **Owner, 2026-09-12 05:33:** *„Majd mindenféle diagnosztikálási eszköz fog kelleni neked a
// > My Assistant rendszereihez. **Tudjad magadat diagnosztizálni**, hogy ilyenkor **mi a fene
// > történik például most**?"*
//
// ⚠️ **EGY funkció** *(`one-function-is-enough` + `uncertain-requests`)*: ⛔ ez ⛔ nem
// „diagnosztikai keretrendszer", és ⛔ nem a `comm doctor` kiváltása. A `comm doctor` a
// **KÉSZENLÉTET** méri *(„be van-e kötve")*, ez a **PILLANATOT** *(„mi megy most")*.
//
// `--json`-nal gépi envelope *(ugyanaz a burok, mint a többi parancsnál)*.

import { parseArgs } from 'node:util';

import { DoctorNow_Util } from '../doctor/doctor-now.js';
import type { DoctorNowSnapshot } from '../doctor/doctor-now.models.js';
import { DoctorNowRender_Util } from '../doctor/doctor-now.render.js';
import { DoctorNowSources_Util } from '../doctor/doctor-now.sources.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';
import type { HeartbeatStatus } from '../discord/discord.heartbeat.js';

/**
 * A `ma doctor <subcommand>` belépési pontja.
 *
 * ⚠️ CSAPDA, AMIN MÁR ELBUKTAM: a parancsnak a `main.ts` `COMMAND_TREE`-jében **is** ott kell
 * lennie, különben zöld tesztek és zöld `tsc` mellett **futásidőben nem létezik**.
 */
export async function runDoctorCommand(subcommand: string, args: string[]): Promise<void> {
  if (subcommand !== 'now') {
    process.stderr.write(`Unknown doctor subcommand: "${subcommand}". Használd: ma doctor now\n`);
    process.exit(2);
  }

  const startedAt: number = Date.now();
  const parsed = parseArgs({ args: args, options: { json: { type: 'boolean' } }, allowPositionals: false });
  // ⭐ Az életjelet ELŐBB olvassuk: a kiküldési döntéshez KELL a benne lévő kapu-állapot
  // (különben egy külön folyamat „nyitott kapu"-t hinne — l. `doctor-now.sources.ts`).
  const listener: HeartbeatStatus = await DoctorNowSources_Util.readListener()
    .catch((): HeartbeatStatus => ({ state: 'absent' }));
  const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect({
    readBatch: (): ReturnType<typeof DoctorNowSources_Util.readBatch> => DoctorNowSources_Util.readBatch(),
    readDecision: (): ReturnType<typeof DoctorNowSources_Util.readDecision> =>
      DoctorNowSources_Util.readDecision(listener),
    readListener: async (): Promise<HeartbeatStatus> => listener,
    readRetry: (): ReturnType<typeof DoctorNowSources_Util.readRetry> => DoctorNowSources_Util.readRetry(),
    readMachine: (): ReturnType<typeof DoctorNowSources_Util.readMachine> => DoctorNowSources_Util.readMachine(),
    readErrors: (): ReturnType<typeof DoctorNowSources_Util.readErrors> =>
      DoctorNowSources_Util.readErrors(),
  });

  if (parsed.values.json) {
    writeEnvelope(ok('doctor.now', makeRequestId(), startedAt, snapshot), true);

    return;
  }

  process.stdout.write(`${DoctorNowRender_Util.render(snapshot)}\n`);
}
