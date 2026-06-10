// Google Assistant integration panel — status + Re-auth + Test query.

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, signal } from '@angular/core';

import { I_Integrations_ApiService } from '../../_services/i-integrations.api-service';
import type { GoogleStatusResponse, GoogleQueryResult } from '@server-models';

@Component({
  standalone: true,
  selector: 'i-google',
  templateUrl: './i-google.component.html',
  styleUrl: './i-google.component.scss',
  imports: [CommonModule, FormsModule],
})
/** Google Assistant config panel — status + Re-auth + test text query. */
export class I_Google_Component implements OnInit {

  readonly status = signal<GoogleStatusResponse | null>(null);
  readonly loading = signal<boolean>(false);
  readonly authError = signal<string | null>(null);

  queryText: string = 'resume music';
  readonly querying = signal<boolean>(false);
  readonly queryResult = signal<GoogleQueryResult | null>(null);
  readonly queryError = signal<string | null>(null);

  /** Inicializál egy I_Google_Component-et — beköti az API service-t. */
  constructor(private readonly api: I_Integrations_ApiService) {}

  /** Lifecycle hook — inicializációkor lekéri a status-t. */
  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  /** Lekéri a Google Assistant status-t a server-től. */
  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      this.status.set(await this.api.getGoogleStatus());
    } finally {
      this.loading.set(false);
    }
  }

  /** Indítja az OAuth dance-t — új ablak. */
  async startReauth(): Promise<void> {
    this.authError.set(null);
    const r = await this.api.startGoogleAuth();
    if ('error' in r) {
      this.authError.set(r.error);
      return;
    }
    window.open(r.url, '_blank', 'width=600,height=700');
    setTimeout(() => { void this.refresh(); }, 5000);
  }

  /** Test query — elküldi az Assistant SDK-n, megjeleníti a választ. */
  async sendQuery(): Promise<void> {
    this.queryError.set(null);
    this.queryResult.set(null);
    if (!this.queryText.trim()) {
      this.queryError.set('üres query');
      return;
    }
    this.querying.set(true);
    try {
      const r = await this.api.sendGoogleQuery(this.queryText.trim());
      if (r.ok && r.result) {
        this.queryResult.set(r.result);
      } else {
        this.queryError.set(r.error ?? 'unknown error');
      }
    } catch (e) {
      this.queryError.set((e as Error).message);
    } finally {
      this.querying.set(false);
    }
  }
}
