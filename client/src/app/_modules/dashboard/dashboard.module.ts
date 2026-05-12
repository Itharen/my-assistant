import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';

import { D_Home_Component } from './_components/d-home/d-home.component';

const routes: Routes = [{ path: '', component: D_Home_Component }];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    D_Home_Component,
  ],
})
/** Dashboard feature module — lazy-loaded route-tal, D_Home_Component-et regisztrálja. */
export class Dashboard_Module {}
