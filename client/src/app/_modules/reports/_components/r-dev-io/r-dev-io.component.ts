// Dev Agent I/O panel — FR #3g Phase 2 (cycle 98, AGB-24).
//
// 3 szekció:
//   1. Live cycle status (STATUS_DEV.md aktuális cycle, phase, phase_notes)
//   2. Action-log stream (today's actor='development-agent' entries)
//   3. AGENT_BUS view (tab-elve: TO chat / FROM chat / all; OPEN/ANSWERED/ACTED status-szín)
//
// Cycle 99+ bővítés (Phase 4): inline-AGB-válasz, USER_INPUT új-blokk.

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { A_Server_ApiService } from '../../../../_services/api-services/a-server.api-service';
import { A_Error_ControlService } from '../../../../_services/control-services/a-error.control-service';
import {
  type A_ReportAgentBus_Row,
  type A_ReportAgentLog_Row,
  type A_ReportStatusDev_Snapshot,
} from '../../../../_models/server-envelope.interface';

type BusTab = 'all' | 'to-chat' | 'from-chat';
type AgbNewStatus = 'OPEN' | 'ANSWERED' | 'ACTED' | 'DROPPED';

@Component({
  standalone: true,
  selector: 'r-dev-io',
  templateUrl: './r-dev-io.component.html',
  styleUrl: './r-dev-io.component.scss',
  imports: [ CommonModule, FormsModule, RouterModule ],
})
/** Dev Agent I/O panel — 3 szekció read-only, párhuzamos fetch. */
export class R_DevIO_Component implements OnInit {

  private readonly api: A_Server_ApiService = inject(A_Server_ApiService);
  private readonly error_CS: A_Error_ControlService = inject(A_Error_ControlService);

  isLoading: boolean = true;
  status: A_ReportStatusDev_Snapshot | null = null;
  log: A_ReportAgentLog_Row[] = [];
  bus: A_ReportAgentBus_Row[] = [];
  busTab: BusTab = 'all';

  /** FR #3g Phase 4b (cycle 103): inline-reply state per AGB row. */
  replyOpenId: string | null = null;
  replyBusyIds: Set<string> = new Set<string>();
  replyAckId: string | null = null;
  replyText: string = '';
  replyNewStatus: AgbNewStatus = 'ANSWERED';
  readonly replyStatusOptions: AgbNewStatus[] = [ 'OPEN', 'ANSWERED', 'ACTED', 'DROPPED' ];

  /** Boot fetch — 3 endpoint párhuzamosan. */
  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      const [ status, log, bus ] = await Promise.all([
        this.api.getStatusDev(),
        this.api.getAgentLog(undefined, 'development-agent', 50),
        this.api.getAgentBus(40),
      ]);

      this.status = status;
      this.log = log.rows;
      this.bus = bus.rows;
    } catch (err) {
      this.error_CS.showError(err, 'r-dev-io.ngOnInit');
    } finally {
      this.isLoading = false;
    }
  }

  /** Bus-tab szűrt nézet. */
  get filteredBus(): A_ReportAgentBus_Row[] {
    if (this.busTab === 'all') return this.bus;
    if (this.busTab === 'to-chat') return this.bus.filter((r): boolean => r.to.toLowerCase() === 'chat');

    return this.bus.filter((r): boolean => r.from.toLowerCase() === 'chat');
  }

  /** Refresh button. */
  async handleRefresh(): Promise<void> {
    await this.ngOnInit();
  }

  /** Tab váltó. */
  setBusTab(tab: BusTab): void {
    this.busTab = tab;
  }

  /** Színkód a kind-hoz: ship/zöld, decision/kék, error/piros, flow-start-end/lila, note/szürke. */
  classForKind(kind: string): string {
    switch (kind) {
      case 'ship': return 'log-ship';
      case 'decision': return 'log-decision';
      case 'error': return 'log-error';
      case 'flow-start':
      case 'flow-end': return 'log-flow';
      case 'state-change': return 'log-state';
      default: return 'log-note';
    }
  }

  /** Színkód a status-hoz: OPEN/sárga, ANSWERED/kék, ACTED/zöld, DROPPED/szürke. */
  classForStatus(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  // ── FR #3g Phase 4b (cycle 103): AGB inline-reply ──

  toggleReplyForm(agbId: string): void {
    if (this.replyOpenId === agbId) {
      this.replyOpenId = null;
      this.replyText = '';

      return;
    }
    this.replyOpenId = agbId;
    this.replyText = '';
    this.replyNewStatus = 'ANSWERED';
    this.replyAckId = null;
  }

  isReplyOpen(agbId: string): boolean {
    return this.replyOpenId === agbId;
  }

  isReplyBusy(agbId: string): boolean {
    return this.replyBusyIds.has(agbId);
  }

  async handleReplySubmit(row: A_ReportAgentBus_Row): Promise<void> {
    const text: string = this.replyText.trim();

    if (!text || this.replyBusyIds.has(row.id)) return;

    this.replyBusyIds.add(row.id);
    this.replyAckId = null;
    try {
      const result = await this.api.postAgentBusReply({
        agbId: row.id,
        reply: text,
        newStatus: this.replyNewStatus,
      });

      if (!result.ok) {
        this.error_CS.showError(new Error(`[${result.errorCode}] ${result.message}`), 'r-dev-io.reply');

        return;
      }
      this.replyAckId = row.id;
      this.replyText = '';
      this.replyOpenId = null;
      await this.ngOnInit();
    } catch (err) {
      this.error_CS.showError(err, 'r-dev-io.reply');
    } finally {
      this.replyBusyIds.delete(row.id);
    }
  }
}
