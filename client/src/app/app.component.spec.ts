import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import {
  DyFM_Notifications_ControlService,
  DyNX_Notification,
  DyNX_NotificationsArea_Component,
  DyNX_Notification_Type,
} from '@futdevpro/ngx-dynamo';

import { AppComponent } from './app.component';
import { A_Socket_ControlService } from './_services/control-services/a-socket.control-service';

/** Mock the socket service so AppComponent tests don't trigger a real socket connect. */
class A_Socket_ControlService_Stub {
  /* eslint-disable @typescript-eslint/no-empty-function */
  subscribe(): Promise<void> { return Promise.resolve(); }
  unsubscribe(): Promise<void> { return Promise.resolve(); }
  /* eslint-enable @typescript-eslint/no-empty-function */
}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      declarations: [AppComponent],
      providers: [
        { provide: A_Socket_ControlService, useClass: A_Socket_ControlService_Stub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it('creates the app component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes a title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toBe('my-assistant');
  });

  it('renders the header with the title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading?.textContent).toContain('my-assistant');
  });
});


/**
 * FR-059-B0 regresszio-or — a NEMA-ERTESITES bug.
 *
 * A bug: az `A_Error_ControlService` doc-blokkja kimondja a szandekot ("Display a
 * debug-level descriptive toast via `DyNX_Message_ControlService`"), es az
 * `A_Error_Interceptor` + a globalis `A_ErrorHandler_ControlService` is erre epul —
 * de a `<dynamo-notifications-area>` SEHOL nem volt kirenderelve (meg importalva sem
 * az `app.module`-ban). Igy MINDEN hibauzenet a semmibe ment: a user soha nem latott
 * hibat.
 *
 * FIGYELEM: ez a describe SZANDEKOSAN NEM hasznal `CUSTOM_ELEMENTS_SCHEMA`-t, mert az
 * elnyelne az ismeretlen elemeket — vagyis a teszt akkor is zold lenne, ha az area
 * NEM lenne valodi komponenskent bekotve. A valodi komponenst importaljuk.
 */
describe('AppComponent | notifications-area (FR-059-B0)', (): void => {
  let fixture: ComponentFixture<AppComponent>;
  let notifications_CS: DyFM_Notifications_ControlService;

  beforeEach(async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([]),
        NoopAnimationsModule,
        DyNX_NotificationsArea_Component,
      ],
      declarations: [ AppComponent ],
      providers: [
        { provide: A_Socket_ControlService, useClass: A_Socket_ControlService_Stub },
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    notifications_CS = TestBed.inject(DyFM_Notifications_ControlService);
  });


  it('| az area KI VAN RENDERELVE', (): void => {
    expect(fixture.nativeElement.querySelector('dynamo-notifications-area')).toBeTruthy();
  });


  /** A dontő teszt: VALODI ertesites -> LATHATO kartya. */
  it('| VALODI ertesites -> LATHATO toast-kartya jelenik meg', (): void => {
    expect(fixture.nativeElement.querySelector('dynamo-notification-card')).toBeNull();

    notifications_CS.newNotification(new DyNX_Notification({
      title: 'Spec notification',
      type: DyNX_Notification_Type.error,
    } as DyNX_Notification));
    fixture.detectChanges();

    const card: HTMLElement = fixture.nativeElement.querySelector('dynamo-notification-card');
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('Spec notification');
  });


  /** G3-elv: pontosan EGY area — kulonben minden ertesites ketszer jelenne meg. */
  it('| PONTOSAN EGY area van a DOM-ban', (): void => {
    expect(fixture.nativeElement.querySelectorAll('dynamo-notifications-area').length).toBe(1);
  });
});
