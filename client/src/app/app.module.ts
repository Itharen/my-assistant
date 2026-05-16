import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { DyNX_FULLDependencies_Module, DyNX_Fab_Shell_Component } from '@futdevpro/ngx-dynamo';
import { provideFdpnxFeedbackFabPlugin } from '@futdevpro/ngx-fdp-templates';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing-module';
import { A_Auth_Interceptor } from './_interceptors/a-auth.interceptor';
import { A_Error_Interceptor } from './_interceptors/a-error.interceptor';
import { A_ErrorHandler_ControlService } from './_services/control-services/a-error-handler.control-service';
// FR #3f Phase 4.A (cycle 59): standalone footer status-bar (server + client version).
import { S_StatusBar_Component } from './_components/s-status-bar/s-status-bar.component';
// FR #3f Phase 4.B (cycle 60): standalone version-reload banner (5s countdown / dev-silent).
import { S_VersionReloadBanner_Component } from './_components/s-version-reload-banner/s-version-reload-banner.component';

@NgModule({
  declarations: [ AppComponent ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    DyNX_FULLDependencies_Module,
    // Global feedback system — generic FAB shell from dynamo-ngx (M3).
    DyNX_Fab_Shell_Component,
    // FR #3f Phase 4.A (cycle 59): status-bar standalone component.
    S_StatusBar_Component,
    // FR #3f Phase 4.B (cycle 60): version-reload banner standalone component.
    S_VersionReloadBanner_Component,
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: A_Auth_Interceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: A_Error_Interceptor, multi: true },
    { provide: ErrorHandler, useClass: A_ErrorHandler_ControlService },
    // Register the feedback FAB plugin into DyNX_Fab_Overlay_ControlService at boot (M4).
    // Hits the my-assistant server's /api/feedback/* endpoints (per-system storage).
    provideFdpnxFeedbackFabPlugin({
      apiBaseUrl: '',
      defaultProjectId: 'my-assistant',
    }),
  ],
  bootstrap: [ AppComponent ],
})
/** Root NgModule — bootstrap-eli az AppComponent-et, regisztrálja az interceptorokat és error handler-t. */
export class App_Module {}
