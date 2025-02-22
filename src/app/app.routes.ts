import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { MainComponent } from './main/main.component';
import { LoginComponent } from '../app/auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AvatarSelectionComponent } from './auth/avatar-selection/avatar-selection.component';
import { AuthGuard } from '../app/guards/auth.guard';
import { RegisterGuard } from '../app/guards/register.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'avatar-selection', component: AvatarSelectionComponent, canActivate: [RegisterGuard, AuthGuard] },
  { path: 'main', component: MainComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
