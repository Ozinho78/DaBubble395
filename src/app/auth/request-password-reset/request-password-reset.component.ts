import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-request-password-reset',
  imports: [],
  templateUrl: './request-password-reset.component.html',
  styleUrl: './request-password-reset.component.scss'
})
export class RequestPasswordResetComponent {

  email: string = '';

  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
