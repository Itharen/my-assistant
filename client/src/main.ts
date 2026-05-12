import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { App_Module } from './app/app.module';

platformBrowserDynamic()
  .bootstrapModule(App_Module, { ngZoneEventCoalescing: true })
  .catch((err: unknown): void => console.error(err));
