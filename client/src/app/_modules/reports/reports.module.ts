import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';

import { R_Home_Component } from './_components/r-home/r-home.component';
import { R_DevIO_Component } from './_components/r-dev-io/r-dev-io.component';

const routes: Routes = [
  { path: '', component: R_Home_Component },
  // FR #3g Phase 2 (cycle 98): Dev I/O sub-route under /reports.
  { path: 'dev-io', component: R_DevIO_Component },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    R_Home_Component,
    R_DevIO_Component,
  ],
})
/** Reports feature module — lazy-loaded /reports route, R_Home_Component-et regisztrálja. FR #3g Phase 1-2 (cycle 96-98, AGB-24). */
export class Reports_Module {}
