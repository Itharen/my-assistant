// Capture data-service — extends `DyNTS_DataService<Capture>`. Persists the
// capture row, then (for `kind === 'energy'`) fans out astral/mental/matter
// values into 3 `Wave` rows via `Wave_DataService` so the dashboard chart is
// fed from the same gesture.

import { DyFM_Error } from '@futdevpro/fsm-dynamo';
import { DyNTS_DataService } from '@futdevpro/nts-dynamo';

import { Capture, capture_dataParams } from '../../_models/data-models/capture.data-model';
import { Wave, Wave_Kind } from '../../_models/data-models/wave.data-model';
import { Wave_DataService } from '../wave/wave.data-service';

/** Capture DAO. Perzisztál + energy capture esetén fanout-ol astral/mental/matter Wave row-okra. */
export class Capture_DataService extends DyNTS_DataService<Capture> {

  /** Inicializál egy Capture_DataService-t — opcionális data + kötelező issuer-rel. */
  constructor(set: { data?: Capture; issuer: string }) {
    super(new Capture(set?.data), capture_dataParams, set.issuer);
  }

  /** Visszaadja a legutóbbi `limit` Capture row-t (default 20). */
  async listRecent(limit: number = 20): Promise<Capture[]> {
    const items: Capture[] = await this.getAll(true);

    return items.slice(0, limit);
  }

  /** Menti a Capture-t, és energy kind esetén fanout-ol a Wave_DataService-be. */
  async saveWithFanout(): Promise<Capture> {
    if (this.data.kind === 'text' || this.data.kind === 'voice') {
      const text: string | undefined = this.data.text?.trim();

      if (!text) {
        throw new DyFM_Error({
          ...this.getDefaultErrorSettings('saveWithFanout', new Error('text/voice capture needs non-empty text')),
          errorCode: 'MA-CAP-VAL1',
        });
      }
      this.data.text = text;
    }

    if (this.data.kind === 'energy') {
      const hasAny: boolean =
        typeof this.data.astral === 'number' ||
        typeof this.data.mental === 'number' ||
        typeof this.data.matter === 'number';

      if (!hasAny) {
        const reason: Error = new Error('energy capture needs at least one of astral/mental/matter');

        throw new DyFM_Error({
          ...this.getDefaultErrorSettings('saveWithFanout', reason),
          errorCode: 'MA-CAP-VAL2',
        });
      }
    }

    await this.validateForSave();
    await this.saveData();

    if (this.data.kind === 'energy') {
      await this.fanoutEnergy();
    }

    return this.data;
  }

  private async fanoutEnergy(): Promise<void> {
    const captureRef: string = `capture:${this.data._id ?? ''}`;
    const userId: string | undefined = this.data.userId;

    await this.persistWave(Wave_Kind.astral, this.data.astral, captureRef, userId);
    await this.persistWave(Wave_Kind.mental, this.data.mental, captureRef, userId);
    await this.persistWave(Wave_Kind.matter, this.data.matter, captureRef, userId);
  }

  private async persistWave(
    kind: Wave_Kind,
    value: number | undefined,
    source: string,
    userId: string | undefined,
  ): Promise<void> {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return;
    }
    const wave_DS = new Wave_DataService({
      data: new Wave({ kind, value, source, userId }),
      issuer: this.issuer,
    });

    await wave_DS.saveData();
  }
}
