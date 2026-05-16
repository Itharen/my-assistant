// Wave JSONL controller — UNAUTH endpoint trió a `__agent/state/3x3-log.jsonl`
// hullám-snapshot forrásból. A dashboard waves-panel-jét táplálja (read), az
// új-snapshot form-jából fogad payload-okat (write), és bulk-szinkronizál a
// Wave DB collection-be (sync).
//
// FR #3b-WAVE-UI Phase 2.A (cycle 52): `GET /get-from-jsonl` unauth read.
// FR #3b-WAVE-UI Phase 3.A (cycle 54): `POST /log-public` unauth write.
// FR #3b-WAVE-UI Phase 4.A (cycle 56): `POST /sync-jsonl` one-shot DB sync.
// FR #3b-WAVE-UI Phase 4.B (cycle 56): `POST /log-public` auto-sync hook DB-insert.
//
// Pattern source: `server/src/_routes/errors/errors.controller.ts` (FDPNTS-extend),
// de itt a DB-érintő rész best-effort (try/catch, JSONL marad a kanonikus SoT).
//
// AUTH BLOCKER kontextus: a `/api/dashboard/snapshot` és `/api/wave/add`
// auth-gated; ezek az endpointok **szándékosan unauth**, hogy a wave UI a chat
// AGB-03 task B döntés nélkül is működjön (AGB-2026-05-16-02 explicit alternatíva).

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { Wave, Wave_Kind, Wave_Vector } from '../../_models/data-models/wave.data-model';
import { Wave_DataService } from './wave.data-service';
import { VersionBroadcast_SocketServerService } from '../../_services/socket-services/version-broadcast.socket-server-service';

import { emitServerActionLog } from '../../_collections/action-log.util';
import {
  appendWaveSnapshotToJsonl,
  buildWaveRowsFromSnapshot,
  loadAllSnapshotRowsForSync,
  readWavesFromJsonl,
  type WaveJsonlAppend_Result,
  type WaveJsonlSnapshot_Payload,
  type WaveJsonl_Row,
} from '../../_collections/wave-jsonl.util';

interface SyncStats_Interface {
  inserted: number;
  skipped: number;
  failed: number;
  totalRows: number;
}

/** Egy explode-olt wave row insert-elése a DB-be — idempotens (snapshotTs + kind unique). */
async function upsertWaveRowIdempotent(
  row: { kind: 'astral' | 'mental' | 'matter'; value: number; level: string; vector: 'up' | 'down' | 'flat' | null; mood: string | null; note: string | null; snapshotTs: string },
  issuer: string,
): Promise<'inserted' | 'skipped' | 'failed'> {
  try {
    const probe = new Wave_DataService({ issuer });
    const existing: Wave[] = await probe.findDataList({ snapshotTs: row.snapshotTs, kind: row.kind as Wave_Kind }, true);

    if (existing.length > 0) {
      return 'skipped';
    }

    const data = new Wave({
      kind: row.kind as Wave_Kind,
      value: row.value,
      level: row.level,
      source: issuer,
      wave_vector: row.vector ? (row.vector as Wave_Vector) : undefined,
      mood: row.mood ?? undefined,
      note: row.note ?? undefined,
      snapshotTs: row.snapshotTs,
    });

    const ds = new Wave_DataService({ data, issuer });

    await ds.validateForSave();
    await ds.saveData();

    return 'inserted';
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[MA-WAVE-DB-INSERT-FAIL] ${row.kind}@${row.snapshotTs}: ${e.message.slice(0, 150)}`,
      extra: { errorCode: 'MA-WAVE-DB-INSERT-FAIL', issuer: 'wave-jsonl.controller.upsertWaveRowIdempotent', kind: row.kind, snapshotTs: row.snapshotTs, stack: e.stack },
    });

    return 'failed';
  }
}

/** Wave JSONL HTTP controller. Unauth read + write a 3x3-log.jsonl forrás-of-truth-on. */
export class WaveJsonl_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): WaveJsonl_Controller {
    return WaveJsonl_Controller.getSingletonInstance();
  }

  /** Regisztrálja a `/get-from-jsonl` (GET) és `/log-public` (POST) unauth endpoint-okat. */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'getFromJsonl',
        type: DyFM_HttpCallType.get,
        endpoint: '/get-from-jsonl',
        // NO preProcesses → unauth (FDPNTS-pattern, mint /api/logs/*, /api/errors/error/log).
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const limit: number = Math.min(Math.max(Number(req.query.limit) || 14, 1), 100);
            const rows: WaveJsonl_Row[] = await readWavesFromJsonl(limit);

            res.send({ rows });
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'logPublic',
        type: DyFM_HttpCallType.post,
        endpoint: '/log-public',
        // NO preProcesses → unauth. A util validál + emit-eli az MA-WAVE-JSONL-* error-okat.
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const payload: WaveJsonlSnapshot_Payload = (req.body ?? {}) as WaveJsonlSnapshot_Payload;
            const result: WaveJsonlAppend_Result = await appendWaveSnapshotToJsonl(payload);

            if (!result.ok) {
              res.status(400).send({ ok: false, errorCode: result.errorCode, message: result.message });

              return;
            }

            // FR #3b-WAVE-UI Phase 4.B: auto-sync hook — JSONL append után DB-insert
            // is, best-effort. Hiba esetén csak action-log, a kliens-felé NEM
            // route-oljuk vissza (a JSONL a kanonikus SoT).
            const rows = buildWaveRowsFromSnapshot(payload, result.ts);
            let synced: number = 0;

            for (const row of rows) {
              const outcome = await upsertWaveRowIdempotent(row, 'wave-log-public');

              if (outcome === 'inserted') synced++;
            }

            // FR #3f Phase 5.B: socket-push event a kliensnek (real-time refresh-trigger)
            await VersionBroadcast_SocketServerService.getInstance().broadcastDomainEvent('wave', 'create', {
              ts: result.ts,
              snapshot: payload,
              dbSynced: synced,
            });

            res.send({ ok: true, ts: result.ts, dbSynced: synced });
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'syncFromJsonl',
        type: DyFM_HttpCallType.post,
        endpoint: '/sync-jsonl',
        // NO preProcesses → unauth (admin one-shot, dev/local only — production
        // előtt env-flag-elendő, de jelenleg dev-only az egész WaveJsonl_Controller).
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const rows = await loadAllSnapshotRowsForSync();
            const stats: SyncStats_Interface = { inserted: 0, skipped: 0, failed: 0, totalRows: rows.length };

            for (const row of rows) {
              const outcome = await upsertWaveRowIdempotent(row, 'jsonl-sync-script');

              stats[outcome]++;
            }

            await emitServerActionLog({
              actor: 'server',
              kind: 'state-change',
              summary: `wave bulk-sync done: inserted=${stats.inserted} skipped=${stats.skipped} failed=${stats.failed} total=${stats.totalRows}`,
              extra: { issuer: 'wave-jsonl.controller.syncFromJsonl', stats },
            });

            res.send({ ok: true, stats });
          },
        ],
      }),
    ];
  }
}
