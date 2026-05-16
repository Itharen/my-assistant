import { ComponentFixture, TestBed } from '@angular/core/testing';

import { D_Dashboard_ControlService } from '../../_services/d-dashboard.control-service';
import { A_Error_ControlService } from '../../../../_services/control-services/a-error.control-service';
import { D_WavesForm_Component } from './d-waves-form.component';

class D_Dashboard_ControlService_Stub {
  submitWaveSnapshot = jasmine.createSpy('submitWaveSnapshot')
    .and.returnValue(Promise.resolve({ ok: true, ts: '2026-05-16T12:00:00+02:00' }));
}

class A_Error_ControlService_Stub {
  showError = jasmine.createSpy('showError');
}

describe('D_WavesForm_Component', () => {
  let fixture: ComponentFixture<D_WavesForm_Component>;
  let component: D_WavesForm_Component;
  let control: D_Dashboard_ControlService_Stub;
  let errorCS: A_Error_ControlService_Stub;

  beforeEach(async () => {
    control = new D_Dashboard_ControlService_Stub();
    errorCS = new A_Error_ControlService_Stub();

    await TestBed.configureTestingModule({
      imports: [D_WavesForm_Component],
      providers: [
        { provide: D_Dashboard_ControlService, useValue: control },
        { provide: A_Error_ControlService, useValue: errorCS },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(D_WavesForm_Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component with initial closed/empty state', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen).toBeFalse();
    expect(component.isBusy).toBeFalse();
    expect(component.ack).toBeNull();
    expect(component.astral).toBe('');
    expect(component.mental).toBe('');
    expect(component.material).toBe('');
  });

  it('handleToggle flips isOpen and clears ack', () => {
    component.ack = 'pre-existing';
    component.handleToggle();
    expect(component.isOpen).toBeTrue();
    expect(component.ack).toBeNull();
    component.handleToggle();
    expect(component.isOpen).toBeFalse();
  });

  it('handleReset clears all form fields + ack', () => {
    component.astral = 'mid';
    component.mental = 'low';
    component.material = 'high';
    component.vector = 'up';
    component.mood = 'happy';
    component.note = 'a note';
    component.ack = 'something';
    component.handleReset();
    expect(component.astral).toBe('');
    expect(component.mental).toBe('');
    expect(component.material).toBe('');
    expect(component.vector).toBe('');
    expect(component.mood).toBe('');
    expect(component.note).toBe('');
    expect(component.ack).toBeNull();
  });

  it('hasAnyLevel: false when all 3 levels empty', () => {
    expect(component.hasAnyLevel).toBeFalse();
  });

  it('hasAnyLevel: true when any single level is set', () => {
    component.astral = 'low';
    expect(component.hasAnyLevel).toBeTrue();
    component.astral = '';
    component.mental = 'mid';
    expect(component.hasAnyLevel).toBeTrue();
    component.mental = '';
    component.material = 'high';
    expect(component.hasAnyLevel).toBeTrue();
  });

  it('handleSubmit blocked when hasAnyLevel=false; routes through showError', async () => {
    await component.handleSubmit();
    expect(control.submitWaveSnapshot).not.toHaveBeenCalled();
    expect(errorCS.showError).toHaveBeenCalledTimes(1);
  });

  it('handleSubmit blocked when isBusy=true (early return)', async () => {
    component.isBusy = true;
    component.astral = 'mid';
    await component.handleSubmit();
    expect(control.submitWaveSnapshot).not.toHaveBeenCalled();
    expect(errorCS.showError).not.toHaveBeenCalled();
  });

  it('handleSubmit builds payload with only set fields + trims mood/note', async () => {
    component.astral = 'mid';
    component.material = 'high';
    component.vector = 'up';
    component.mood = '   happy   ';
    component.note = '  some note  ';
    await component.handleSubmit();
    expect(control.submitWaveSnapshot).toHaveBeenCalledTimes(1);
    const payload = control.submitWaveSnapshot.calls.mostRecent().args[0];
    expect(payload.astral).toBe('mid');
    expect(payload.mental).toBeUndefined();
    expect(payload.material).toBe('high');
    expect(payload.wave_vector).toBe('up');
    expect(payload.mood).toBe('happy');
    expect(payload.note).toBe('some note');
  });

  it('handleSubmit omits empty mood/note from payload', async () => {
    component.astral = 'mid';
    component.mood = '   ';
    component.note = '';
    await component.handleSubmit();
    const payload = control.submitWaveSnapshot.calls.mostRecent().args[0];
    expect(payload.mood).toBeUndefined();
    expect(payload.note).toBeUndefined();
  });

  it('handleSubmit success: sets ack, resets form, closes panel, busy off', async () => {
    component.astral = 'mid';
    component.isOpen = true;
    await component.handleSubmit();
    expect(component.ack).toContain('rögzítve');
    expect(component.astral).toBe('');
    expect(component.isOpen).toBeFalse();
    expect(component.isBusy).toBeFalse();
  });

  it('handleSubmit failure: no ack, busy off, form retained', async () => {
    control.submitWaveSnapshot.and.returnValue(Promise.reject(new Error('boom')));
    component.astral = 'mid';
    await component.handleSubmit();
    expect(component.ack).toBeNull();
    expect(component.isBusy).toBeFalse();
    expect(component.astral).toBe('mid'); // form retained for retry
  });
});
