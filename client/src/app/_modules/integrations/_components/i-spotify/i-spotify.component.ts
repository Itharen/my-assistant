// Spotify integration panel — status + Re-auth gomb + current playback megjelenítés.

import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';

import { I_Integrations_ApiService } from '../../_services/i-integrations.api-service';
import type { SpotifyStatusResponse } from '@server-models';

@Component({
  standalone: true,
  selector: 'i-spotify',
  templateUrl: './i-spotify.component.html',
  styleUrl: './i-spotify.component.scss',
  imports: [CommonModule],
})
/** Spotify config panel — read-only status + Re-auth indítás új ablakban. */
export class I_Spotify_Component implements OnInit {

  readonly status = signal<SpotifyStatusResponse | null>(null);
  readonly loading = signal<boolean>(false);
  readonly authError = signal<string | null>(null);

  /** Inicializál egy I_Spotify_Component-et — beköti az API service-t. */
  constructor(private readonly api: I_Integrations_ApiService) {}

  /** Lifecycle hook — inicializációkor lekéri a status-t. */
  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  /** Lekéri a Spotify status-t a server-től. */
  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      this.status.set(await this.api.getSpotifyStatus());
    } finally {
      this.loading.set(false);
    }
  }

  /** Indítja az OAuth dance-t — új ablakot nyit a Spotify URL-re. */
  async startReauth(): Promise<void> {
    this.authError.set(null);
    const r = await this.api.startSpotifyAuth();
    if ('error' in r) {
      this.authError.set(r.error);
      return;
    }
    window.open(r.url, '_blank', 'width=600,height=700');
    // 5s múlva refresh-eljük a status-t (a user közben végigviszi az auth-t).
    setTimeout(() => { void this.refresh(); }, 5000);
  }
}
