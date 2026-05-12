// Capture data model — quick-input bin: text notes, energy snapshots, mood
// snapshots, voice transcripts. Energy fields (astral/mental/matter) are
// optional and only populated when `kind === 'energy'`; the controller fans
// them out to `Wave` rows on insert.

import { DyFM_DataModel_Params, DyFM_Metadata, DyFM_Object } from '@futdevpro/fsm-dynamo';

/** Capture bejegyzés-fajta taxonómiája: text / energy snapshot / mood snapshot / voice transcript. */
export enum Capture_Kind { text = 'text', energy = 'energy', mood = 'mood', voice = 'voice' }

/** Capture entitás — quick-input bin. Energy mezők csak `kind === 'energy'` esetén populáltak. */
export class Capture extends DyFM_Metadata {

  kind!: Capture_Kind;
  text?: string;
  astral?: number;
  mental?: number;
  matter?: number;
  moodScore?: number;
  userId?: string;

  /** Inicializál egy Capture instance-ot, opcionálisan a `set` mezőit cleanAssign-nal másolva. */
  constructor(set?: Partial<Capture>) {
    super(set);

    if (set) {
      DyFM_Object.cleanAssign(this, set);
    }
  }
}

export const capture_dataParams = new DyFM_DataModel_Params<Capture>({
  dataName: 'capture',
  properties: {
    kind: { type: 'string', required: true },
    text: { type: 'string' },
    astral: { type: 'number' },
    mental: { type: 'number' },
    matter: { type: 'number' },
    moodScore: { type: 'number' },
    userId: { type: 'string' },
  },
});
