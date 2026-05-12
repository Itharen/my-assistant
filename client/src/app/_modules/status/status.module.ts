import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';

import { S_Home_Component } from './_components/s-home/s-home.component';

const routes: Routes = [{ path: '', component: S_Home_Component }];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    S_Home_Component,
  ],
})
/** Status feature module — lazy-loaded route, S_Home_Component-et regisztrálja. */
export class Status_Module {}
