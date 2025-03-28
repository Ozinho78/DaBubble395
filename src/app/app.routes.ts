import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { MainComponent } from './main/main.component';
import { LoginComponent } from '../app/auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AvatarSelectionComponent } from './auth/avatar-selection/avatar-selection.component';
import { RequestPasswordResetComponent } from './auth/request-password-reset/request-password-reset.component';
import { SetNewPasswordComponent } from './auth/set-new-password/set-new-password.component';
import { AuthGuard } from '../app/guards/auth.guard';
import { RegisterGuard } from '../app/guards/register.guard';
import { ImprintComponent } from './legal/imprint/imprint.component';
import { PolicyComponent } from './legal/policy/policy.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'avatar-selection', component: AvatarSelectionComponent, canActivate: [RegisterGuard, AuthGuard] },
  { path: 'main', component: MainComponent, canActivate: [AuthGuard] },
  { path: "request-password-reset", component: RequestPasswordResetComponent },
  { path: "set-new-password", component: SetNewPasswordComponent },
  { path: 'imprint', component: ImprintComponent },
  { path: 'policy', component: PolicyComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
