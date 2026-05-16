// Wave sample data model — astral / mental / matter wave time-series row.
// Extends `DyFM_Metadata` (`@futdevpro/fsm-dynamo`) for `__created`/`__updated`
// metadata, MongoDB `_id`, and DyFM lifecycle hooks. The DataParams object
// registers the Mongoose schema with `DyNTS_GlobalService.dbModels`.
//
// Pattern source: `LIVE-projects/master-prompter/server/src/_models/.../user-data.data-model.ts`.

import { DyFM_DataModel_Params, DyFM_Metadata, DyFM_Object } from '@futdevpro/fsm-dynamo';

/** Wave kategória taxonómiája — astral / mental / matter energy-channel. */
export enum Wave_Kind { astral = 'astral', mental = 'mental', matter = 'matter' }

/** Hullám-vektor — opcionális, snapshot-szintű metaadat (mind a 3 exploded row hordozza). */
export enum Wave_Vector { up = 'up', down = 'down', flat = 'flat' }

/** Wave time-series sample. Egy kind/value/source mintapont DyFM_Metadata-val + Mongoose schema-val. */
export class Wave extends DyFM_Metadata {

  kind!: Wave_Kind;
  value!: number;
  source?: string;
  note?: string;
  userId?: string;
  /** Eredeti szint-string a JSONL forrásból (very-low|low|low-mid|mid|mid+|normal|high|very-high). FR #3b-WAVE-UI Phase 4. */
  level?: string;
  /** Snapshot-szintű hullám-vektor (denormalized — mind a 3 exploded row-on). FR #3b-WAVE-UI Phase 4. */
  wave_vector?: Wave_Vector;
  /** Snapshot-szintű mood-string (denormalized). Max 120 char (wave-jsonl.util MOOD_MAX_LEN). FR #3b-WAVE-UI Phase 4. */
  mood?: string;
  /** Snapshot anchor timestamp (a JSONL row eredeti ts-e — mind a 3 exploded row-on azonos). Idempotency: ts + kind unique. */
  snapshotTs?: string;

  /** Inicializál egy Wave instance-ot, opcionálisan a `set` mezőit cleanAssign-nal másolva. */
  constructor(set?: Partial<Wave>) {
    super(set);

    if (set) {
      DyFM_Object.cleanAssign(this, set);
    }
  }
}

export const wave_dataParams = new DyFM_DataModel_Params<Wave>({
  dataName: 'wave',
  properties: {
    kind: { type: 'string', required: true },
    value: { type: 'number', required: true },
    source: { type: 'string' },
    note: { type: 'string' },
    userId: { type: 'string' },
    level: { type: 'string' },
    wave_vector: { type: 'string' },
    mood: { type: 'string' },
    snapshotTs: { type: 'string' },
  },
});
