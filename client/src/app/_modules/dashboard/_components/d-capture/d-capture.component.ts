// Capture panel (bottom-right, small). Two modes:
//   • text  — free-form quick capture (note that gets routed later by the agent)
//   • energy — 3 sliders for astral/mental/matter; the server fans this out
//              into 3 wave rows so the top-right chart picks them up instantly.
//
// Errors go through `A_Error_ControlService.showError()` for a unified
// debug-level toast + server-side persistence (NEVER `[object Object]`).

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { A_CaptureKind } from '../../../../_models/server-envelope.interface';
import { A_Error_ControlService } from '../../../../_services/control-services/a-error.control-service';

import { D_Dashboard_ControlService } from '../../_services/d-dashboard.control-service';

type D_CaptureMode_Type = 'text' | 'energy';

@Component({
  standalone: true,
  selector: 'd-capture',
  templateUrl: './d-capture.component.html',
  styleUrl: './d-capture.component.scss',
  imports: [ CommonModule, FormsModule ],
})
/** Capture panel — text / energy mód, 3 csúszka az energy-hez, kontroll-service-en át submit. */
export class D_Capture_Component {

  private readonly control: D_Dashboard_ControlService = inject(D_Dashboard_ControlService);
  private readonly error_CS: A_Error_ControlService = inject(A_Error_ControlService);

  mode: D_CaptureMode_Type = 'text';
  text: string = '';
  astral: number = 50;
  mental: number = 50;
  matter: number = 50;
  isBusy: boolean = false;
  ack: string | null = null;

  /** Mód-váltás (text vagy energy). Reset-eli az ack-üzenetet. */
  handleSetMode(m: D_CaptureMode_Type): void {
    this.mode = m;
    this.ack = null;
  }

  /** Submit-eli a capture-t a kontroll-service-en át, kezeli a busy state-et és az ack-et. */
  async handleSubmit(): Promise<void> {
    if (this.isBusy) {
      return;
    }
    this.isBusy = true;
    this.ack = null;
    try {
      if (this.mode === 'text') {
        const text: string = this.text.trim();

        if (!text) {
          this.error_CS.showError(new Error('Üres input — text capture-höz szöveg kell.'), 'd-capture.handleSubmit');

          return;
        }
        await this.control.submitCapture({ kind: A_CaptureKind.text, text });
        this.ack = '📝 Mentve.';
        this.text = '';
      } else {
        await this.control.submitCapture({
          kind: A_CaptureKind.energy,
          astral: this.astral,
          mental: this.mental,
          matter: this.matter,
        });
        this.ack = `🌊 Snapshot: A${this.astral} · M${this.mental} · ☷${this.matter}`;
      }
    } catch {
      // control-service already routed through A_Error_ControlService —
      // we only catch here to skip the ack-on-success branch.
    } finally {
      this.isBusy = false;
    }
  }
}
