import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { DyFM_Log } from '@futdevpro/fsm-dynamo';

import { App_Module } from './app/app.module';

platformBrowserDynamic()
  .bootstrapModule(App_Module, { ngZoneEventCoalescing: true })
  .catch((err: unknown): void => DyFM_Log.error(`[bootstrap] MA-CLIENT-BOOTSTRAP-FAILED: ${String(err)}`));
