// User I/O panel — FR #3g Phase 3 (cycle 100, AGB-24).
//
// 2 szekció:
//   - Inbox: USER_INPUT.md [NEW] + [DONE] blokkok (tab-elve)
//   - Outbox: current/open-questions.md entries
//
// Phase 4 (cycle 101+): quick-input form, status toggle [NEW]→[DONE].

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { A_Server_ApiService } from '../../../../_services/api-services/a-server.api-service';
import { A_Error_ControlService } from '../../../../_services/control-services/a-error.control-service';
import {
  type A_ReportOpenQuestion_Row,
  type A_ReportUserInput_Row,
} from '../../../../_models/server-envelope.interface';

type InboxTab = 'all' | 'new' | 'done';

@Component({
  standalone: true,
  selector: 'r-user-io',
  templateUrl: './r-user-io.component.html',
  styleUrl: './r-user-io.component.scss',
  imports: [ CommonModule, RouterModule ],
})
/** User I/O panel — USER_INPUT inbox + open-Q outbox. Read-only Phase 3 MVP. */
export class R_UserIO_Component implements OnInit {

  private readonly api: A_Server_ApiService = inject(A_Server_ApiService);
  private readonly error_CS: A_Error_ControlService = inject(A_Error_ControlService);

  isLoading: boolean = true;
  inbox: A_ReportUserInput_Row[] = [];
  questions: A_ReportOpenQuestion_Row[] = [];
  inboxTab: InboxTab = 'new';
  expandedInbox: Set<number> = new Set<number>();

  /** Boot fetch — 2 endpoint párhuzamosan. */
  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      const [ inbox, q ] = await Promise.all([
        this.api.getUserInput(40),
        this.api.getOpenQuestions(80),
      ]);

      this.inbox = inbox.rows;
      this.questions = q.rows;
    } catch (err) {
      this.error_CS.showError(err, 'r-user-io.ngOnInit');
    } finally {
      this.isLoading = false;
    }
  }

  /** Filtered inbox. */
  get filteredInbox(): A_ReportUserInput_Row[] {
    if (this.inboxTab === 'all') return this.inbox;
    const wantStatus: 'NEW' | 'DONE' = this.inboxTab === 'new' ? 'NEW' : 'DONE';

    return this.inbox.filter((r): boolean => r.status === wantStatus);
  }

  /** Open Q-k összes (filter-mentes). */
  get openQuestions(): A_ReportOpenQuestion_Row[] {
    return this.questions.filter((r): boolean => r.status === 'open');
  }

  setInboxTab(tab: InboxTab): void {
    this.inboxTab = tab;
  }

  toggleInboxExpand(idx: number): void {
    if (this.expandedInbox.has(idx)) {
      this.expandedInbox.delete(idx);
    } else {
      this.expandedInbox.add(idx);
    }
  }

  isExpanded(idx: number): boolean {
    return this.expandedInbox.has(idx);
  }

  async handleRefresh(): Promise<void> {
    await this.ngOnInit();
  }

  classForStatus(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  classForImportance(imp: string): string {
    return `imp-${imp || 'unset'}`;
  }
}
