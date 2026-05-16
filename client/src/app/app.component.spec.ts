import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
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
