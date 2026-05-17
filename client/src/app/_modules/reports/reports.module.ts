import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';

import { R_Home_Component } from './_components/r-home/r-home.component';
import { R_DevIO_Component } from './_components/r-dev-io/r-dev-io.component';
import { R_UserIO_Component } from './_components/r-user-io/r-user-io.component';

const routes: Routes = [
  { path: '', component: R_Home_Component },
  // FR #3g Phase 2 (cycle 98): Dev I/O sub-route under /reports.
  { path: 'dev-io', component: R_DevIO_Component },
  // FR #3g Phase 3 (cycle 100): User I/O sub-route under /reports.
  { path: 'user-io', component: R_UserIO_Component },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    R_Home_Component,
    R_DevIO_Component,
    R_UserIO_Component,
  ],
})
/** Reports feature module — lazy-loaded /reports route. FR #3g Phase 1-3 (cycle 96-100, AGB-24). */
export class Reports_Module {}
