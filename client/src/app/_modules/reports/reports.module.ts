import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';

import { R_Home_Component } from './_components/r-home/r-home.component';

const routes: Routes = [{ path: '', component: R_Home_Component }];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    R_Home_Component,
  ],
})
/** Reports feature module — lazy-loaded /reports route, R_Home_Component-et regisztrálja. FR #3g Phase 1 (cycle 96, AGB-24). */
export class Reports_Module {}
