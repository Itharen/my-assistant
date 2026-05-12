// Insight data model — agent-emitted observations ("amit észrevettem").
// `dismissedAt` is unset when the insight is open; the dashboard surfaces
// undismissed insights only.
//
// Pattern source: `LIVE-projects/master-prompter/server/src/_models/.../user-data.data-model.ts`.

import { DyFM_DataModel_Params, DyFM_Metadata, DyFM_Object } from '@futdevpro/fsm-dynamo';

/** Insight súlyossági fokozat taxonómiája — info / notice / warn / urgent. */
export enum Insight_Severity { info = 'info', notice = 'notice', warn = 'warn', urgent = 'urgent' }

/** Insight entitás — agent által emit-elt megfigyelés, dashboard csak az undismissed-eket mutatja. */
export class Insight extends DyFM_Metadata {

  severity!: Insight_Severity;
  message!: string;
  category?: string;
  source!: string;
  dismissedAt?: Date;
  userId?: string;

  /** Inicializál egy Insight instance-ot, opcionálisan a `set` mezőit cleanAssign-nal másolva. */
  constructor(set?: Partial<Insight>) {
    super(set);

    if (set) {
      DyFM_Object.cleanAssign(this, set);
    }
  }
}

export const insight_dataParams = new DyFM_DataModel_Params<Insight>({
  dataName: 'insight',
  properties: {
    severity: { type: 'string', required: true },
    message: { type: 'string', required: true },
    category: { type: 'string' },
    source: { type: 'string', required: true },
    dismissedAt: { type: 'Date' },
    userId: { type: 'string' },
  },
});
