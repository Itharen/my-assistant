import { L_LinkedInWorkspace_DataService } from '../../_services/l-linkedin-workspace.data-service';
import { L_LinkedInWorkspaceBridge_Service } from '../../_services/l-linkedin-workspace-bridge.service';
import { L_Workspace_Component } from './l-workspace.component';

describe('LinkedIn workspace component safety state', (): void => {
  it('blocks manual-send reporting when the visible draft differs from its saved version', async (): Promise<void> => {
    let statusUpdates: number = 0;
    const dataService = {
      updateDraftStatus: async (): Promise<never> => {
        statusUpdates += 1;
        throw new Error('must not be called');
      },
    } as unknown as L_LinkedInWorkspace_DataService;
    const bridge = { isConnected: (): boolean => false } as L_LinkedInWorkspaceBridge_Service;
    const component = new L_Workspace_Component(dataService, bridge);
    component.selectedDraftId = 'draft-1';
    component.savedDraftBody = 'Saved';
    component.cvCheck = 'not-required';

    component.handleDraftChange('Edited but not saved');
    await component.handleConfirmManualSend();

    expect(component.isDraftDirty).toBeTrue();
    expect(component.error).toContain('Mentsd a jelenlegi draftot');
    expect(statusUpdates).toBe(0);
  });

  it('clears manual-send arming as soon as the owner edits the draft', (): void => {
    const component = new L_Workspace_Component(
      {} as L_LinkedInWorkspace_DataService,
      { isConnected: (): boolean => false } as L_LinkedInWorkspaceBridge_Service,
    );
    component.savedDraftBody = 'Saved';
    component.isManualSendArmed = true;

    component.handleDraftChange('Changed');

    expect(component.isManualSendArmed).toBeFalse();
    expect(component.isDraftDirty).toBeTrue();
  });
});
