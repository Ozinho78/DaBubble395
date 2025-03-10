import { Component } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Auth, confirmPasswordReset } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-set-new-password',
  templateUrl: './set-new-password.component.html',
  imports: [FormsModule, CommonModule, RouterLink],
  styleUrl: './set-new-password.component.scss'
})
export class SetNewPasswordComponent {
  password: string = '';
  confirmPassword: string = '';
  actionCode: string = '';
  errorMessage: string = '';
  isFormValid: boolean = false;

  constructor(private router: Router, private route: ActivatedRoute, private auth: Auth) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.actionCode = params['oobCode'];
    });
  }

  navigateToRequest() {
    this.router.navigate(['/request-password-reset']);
  }

  validatePasswords() {
    this.isFormValid = this.password === this.confirmPassword && this.password.length > 0;
    if (!this.isFormValid) {
      this.errorMessage = 'Die Passwörter stimmen nicht überein.';
    } else {
      this.errorMessage = '';
    }
  }

  async resetPassword() {
    this.validatePasswords();

    if (!this.isFormValid) {
      return;
    }

    try {
      await confirmPasswordReset(this.auth, this.actionCode, this.password);
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.errorMessage = 'Fehler beim Zurücksetzen des Passworts: ' + (error.message || 'Unbekannter Fehler');
    }
  }
}