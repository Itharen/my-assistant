import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';

import { A_Server_ApiService } from '../../../../_services/api-services/a-server.api-service';
import { A_Error_ControlService } from '../../../../_services/control-services/a-error.control-service';
import { type A_StatusSnapshot } from '../../../../_models/server-envelope.interface';

interface S_View_Interface {
  loading: boolean;
  status?: A_StatusSnapshot;
  errorMessage?: string;
}

@Component({
  standalone: true,
  selector: 's-home',
  templateUrl: './s-home.component.html',
  styleUrl: './s-home.component.scss',
  imports: [ CommonModule ],
})
/** Status modul home component — `/status` endpoint snapshot megjelenítése. */
export class S_Home_Component implements OnInit {

  private readonly api: A_Server_ApiService = inject(A_Server_ApiService);
  private readonly error_CS: A_Error_ControlService = inject(A_Error_ControlService);

  view: S_View_Interface = { loading: true };

  /** Mount-on egyszer lekéri a status snapshot-ot, hiba esetén toaszt és error state. */
  async ngOnInit(): Promise<void> {
    try {
      const status: A_StatusSnapshot = await this.api.getStatus();

      this.view = { loading: false, status };
    } catch (err) {
      const details = this.error_CS.showError(err, 's-home.ngOnInit');

      this.view = { loading: false, errorMessage: details.message };
    }
  }
}
