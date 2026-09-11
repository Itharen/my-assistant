import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, type Routes } from '@angular/router';

import { L_Workspace_Component } from './_components/l-workspace/l-workspace.component';
import { L_ProfileUpdate_Component } from './_components/l-profile-update/l-profile-update.component';

const routes: Routes = [
  { path: '', component: L_Workspace_Component },
  // 🔗 A profil-frissítés felülete (owner, 2026-09-11 01:52).
  { path: 'profile', component: L_ProfileUpdate_Component },
];

@NgModule({
  declarations: [ L_Workspace_Component ],
  imports: [ CommonModule, FormsModule, RouterModule.forChild(routes), L_ProfileUpdate_Component ],
})
/** LinkedIn guided manual-send workspace feature module. */
export class LinkedIn_Module {}
