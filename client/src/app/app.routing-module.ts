import { NgModule, Type } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';

import { A_Route } from './_enums/a-route.enum';

const routes: Routes = [
  { path: '', redirectTo: A_Route.dashboard, pathMatch: 'full' },
  {
    path: A_Route.dashboard,
    loadChildren: (): Promise<Type<unknown>> =>
      import('./_modules/dashboard/dashboard.module').then(
        (m: typeof import('./_modules/dashboard/dashboard.module')): Type<unknown> => m.Dashboard_Module,
      ),
  },
  {
    path: A_Route.status,
    loadChildren: (): Promise<Type<unknown>> =>
      import('./_modules/status/status.module').then(
        (m: typeof import('./_modules/status/status.module')): Type<unknown> => m.Status_Module,
      ),
  },
  {
    path: A_Route.integrations,
    loadChildren: (): Promise<Type<unknown>> =>
      import('./_modules/integrations/integrations.module').then(
        (m: typeof import('./_modules/integrations/integrations.module')): Type<unknown> => m.Integrations_Module,
      ),
  },
  {
    path: A_Route.reports,
    loadChildren: (): Promise<Type<unknown>> =>
      import('./_modules/reports/reports.module').then(
        (m: typeof import('./_modules/reports/reports.module')): Type<unknown> => m.Reports_Module,
      ),
  },
  { path: '**', redirectTo: A_Route.dashboard },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ],
})
/** Root routing module — lazy-loaded dashboard + status route-ok, fallback dashboard-ra. */
export class AppRoutingModule {}
