import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';

import { I_Home_Component } from './_components/i-home/i-home.component';

const routes: Routes = [{ path: '', component: I_Home_Component }];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    I_Home_Component,
  ],
})
/** Integrations feature module — lazy-loaded route, I_Home_Component-et regisztrálja. */
export class Integrations_Module {}
