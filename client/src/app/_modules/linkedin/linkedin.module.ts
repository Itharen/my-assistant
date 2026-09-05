import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, type Routes } from '@angular/router';

import { L_Workspace_Component } from './_components/l-workspace/l-workspace.component';

const routes: Routes = [{ path: '', component: L_Workspace_Component }];

@NgModule({
  declarations: [ L_Workspace_Component ],
  imports: [ CommonModule, FormsModule, RouterModule.forChild(routes) ],
})
/** LinkedIn guided manual-send workspace feature module. */
export class LinkedIn_Module {}
