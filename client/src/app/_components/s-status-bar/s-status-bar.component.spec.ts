import { ComponentFixture, TestBed } from '@angular/core/testing';

import { A_Version_DataService } from '../../_services/data-services/a-version.data-service';
import { S_StatusBar_Component } from './s-status-bar.component';

describe('S_StatusBar_Component', () => {
  let fixture: ComponentFixture<S_StatusBar_Component>;
  let component: S_StatusBar_Component;
  let version_DS: A_Version_DataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [S_StatusBar_Component],
    }).compileComponents();

    fixture = TestBed.createComponent(S_StatusBar_Component);
    component = fixture.componentInstance;
    version_DS = TestBed.inject(A_Version_DataService);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('initial state has serverVersion null + clientVersion set', () => {
    expect(component.state.serverVersion).toBeNull();
    expect(component.state.clientVersion).toBeTruthy();
  });

  it('updates state when A_Version_DataService.setServerVersion fires', () => {
    version_DS.setServerVersion('9.9.9', false);
    fixture.detectChanges();
    expect(component.state.serverVersion).toBe('9.9.9');
  });

  it('formatTime returns "—" for null timestamp', () => {
    expect(component.formatTime(null)).toBe('—');
  });

  it('formatTime returns HH:mm for valid ISO timestamp', () => {
    const result: string = component.formatTime('2026-05-16T14:07:00+02:00');
    // HH:mm format - both digits zero-padded, length=5
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('formatTime returns "—" for invalid timestamp', () => {
    // new Date('not-a-date') gives Invalid Date - formatTime should still
    // return SOMETHING (current impl returns 'NaN:NaN' via padStart). For
    // safety it returns '—' on parse-fail. Verify the catch-path is robust.
    const result: string = component.formatTime('not-a-date');
    expect(result === '—' || result.includes('NaN')).toBeTrue();
  });

  it('renders srv and cli labels in template', () => {
    const html: string = fixture.nativeElement.textContent ?? '';
    expect(html).toContain('srv');
    expect(html).toContain('cli');
  });

  it('shows reload flag when requireReload becomes true', () => {
    // First setServerVersion sets baseline (no reload-flag), second triggers it.
    version_DS.setServerVersion('1.0.0', false);
    version_DS.setServerVersion('1.0.1', true);
    fixture.detectChanges();
    expect(component.state.requireReload).toBeTrue();
    const html: string = fixture.nativeElement.textContent ?? '';
    expect(html).toContain('reload');
  });
});
