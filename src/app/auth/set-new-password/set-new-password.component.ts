import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-set-new-password',
  imports: [],
  templateUrl: './set-new-password.component.html',
  styleUrl: './set-new-password.component.scss'
})
export class SetNewPasswordComponent {

  password: string = '';

  constructor(private router: Router) {}

  navigateToRequest() {
    this.router.navigate(['/request-password-reset']);
  }
}
