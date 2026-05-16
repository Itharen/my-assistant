// Wave-snapshot form (FR #3b-WAVE-UI Phase 3.B, cycle 55). Egy egyszerű 3-szintű
// snapshot rögzítő a hullám-panel alá ágyazva: 3 select (astral/mental/material
// level) + vector select + mood input + note textarea. Submit → unauth
// `POST /api/wave/log-public`, sikeres append után dashboard refresh + ack.
//
// A komponens nem tárol perzisztens state-et a control-service-en kívül; busy
// + ack a saját UI-kontextusa.

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  type A_WaveJsonlSnapshotPayload,
  type A_WaveLevel,
  type A_WaveVector
} from '../../../../_models/server-envelope.interface';
import { A_Error_ControlService } from '../../../../_services/control-services/a-error.control-service';

import { D_Dashboard_ControlService } from '../../_services/d-dashboard.control-service';

interface D_WaveLevelOption_Interface {
  value: A_WaveLevel | '';
  label: string;
}

interface D_WaveVectorOption_Interface {
  value: A_WaveVector | '';
  label: string;
}

const LEVEL_OPTIONS: D_WaveLevelOption_Interface[] = [
  { value: '', label: '— hagyd ki —' },
  { value: 'very-low', label: 'very-low (10)' },
  { value: 'low', label: 'low (20)' },
  { value: 'low-mid', label: 'low-mid (35)' },
  { value: 'mid', label: 'mid (50)' },
  { value: 'mid+', label: 'mid+ (60)' },
  { value: 'normal', label: 'normal (70)' },
  { value: 'high', label: 'high (85)' },
  { value: 'very-high', label: 'very-high (95)' },
];

const VECTOR_OPTIONS: D_WaveVectorOption_Interface[] = [
  { value: '', label: '— nem adsz meg —' },
  { value: 'up', label: '↗ up' },
  { value: 'flat', label: '→ flat' },
  { value: 'down', label: '↘ down' },
];

const MOOD_MAX: number = 120;
const NOTE_MAX: number = 2000;

@Component({
  standalone: true,
  selector: 'd-waves-form',
  templateUrl: './d-waves-form.component.html',
  styleUrl: './d-waves-form.component.scss',
  imports: [ CommonModule, FormsModule ],
})
/** Új hullám-snapshot form a d-waves panel-ben — 3 level + vector + mood + note + submit. */
export class D_WavesForm_Component {

  private readonly control: D_Dashboard_ControlService = inject(D_Dashboard_ControlService);
  private readonly error_CS: A_Error_ControlService = inject(A_Error_ControlService);

  readonly levelOptions: D_WaveLevelOption_Interface[] = LEVEL_OPTIONS;
  readonly vectorOptions: D_WaveVectorOption_Interface[] = VECTOR_OPTIONS;
  readonly moodMax: number = MOOD_MAX;
  readonly noteMax: number = NOTE_MAX;

  astral: A_WaveLevel | '' = '';
  mental: A_WaveLevel | '' = '';
  material: A_WaveLevel | '' = '';
  vector: A_WaveVector | '' = '';
  mood: string = '';
  note: string = '';

  isOpen: boolean = false;
  isBusy: boolean = false;
  ack: string | null = null;

  /** Toggle a form-szakasz láthatóságát. Reset-eli az ack-üzenetet. */
  handleToggle(): void {
    this.isOpen = !this.isOpen;
    this.ack = null;
  }

  /** Reset minden mezőt (form-zárás vagy explicit clear utáni állapot). */
  handleReset(): void {
    this.astral = '';
    this.mental = '';
    this.material = '';
    this.vector = '';
    this.mood = '';
    this.note = '';
    this.ack = null;
  }

  /** Legalább egy szint megadva-e — ezt csekkoljuk submit-tilthatóságra is. */
  get hasAnyLevel(): boolean {
    return !!(this.astral || this.mental || this.material);
  }

  /** Submit-eli a payload-ot a control-service-en át. Busy + ack UI állapotot kezel. */
  async handleSubmit(): Promise<void> {
    if (this.isBusy) {
      return;
    }
    if (!this.hasAnyLevel) {
      this.error_CS.showError(
        new Error('Adj meg legalább egy szintet (astral / mental / material).'),
        'd-waves-form.handleSubmit',
      );

      return;
    }

    this.isBusy = true;
    this.ack = null;

    const payload: A_WaveJsonlSnapshotPayload = {};

    if (this.astral) payload.astral = this.astral;
    if (this.mental) payload.mental = this.mental;
    if (this.material) payload.material = this.material;
    if (this.vector) payload.wave_vector = this.vector;

    const moodTrim: string = this.mood.trim();
    const noteTrim: string = this.note.trim();

    if (moodTrim) payload.mood = moodTrim;
    if (noteTrim) payload.note = noteTrim;

    try {
      await this.control.submitWaveSnapshot(payload);
      // handleReset() ELŐSZÖR (nullázza az ack-et is a form-mezőkkel együtt),
      // utána settelünk friss ack-üzenetet — különben a reset wipe-olná.
      this.handleReset();
      this.ack = '🌊 Snapshot rögzítve.';
      this.isOpen = false;
    } catch {
      // control-service már showError-on át routolt; itt csak skip-eljük az ack-ot.
    } finally {
      this.isBusy = false;
    }
  }
}
