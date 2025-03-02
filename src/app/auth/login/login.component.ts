import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  emailErrorMessage: string = '';
  passwordErrorMessage: string = '';
  errorMessage: string = '';

  constructor(private router: Router,
    private authService: AuthService
  ) {}

  guestLogin() {
    localStorage.setItem('token', 'dummy-token');
    localStorage.setItem('user-id', '3Ar6MCcSeBN0wMmNaJ4s');
    this.router.navigate(['/main']);
  }

  async login() {
    this.errorMessage = '';
    this.emailErrorMessage = '';
    this.passwordErrorMessage = '';

    if (!this.email) {
      this.emailErrorMessage = 'Bitte E-Mail-Adresse eingeben.';
    }

    if (!this.password) {
      this.passwordErrorMessage = 'Bitte Passwort eingeben.';
    }

    if (this.emailErrorMessage || this.passwordErrorMessage) {
      return;
    }

    try {
      await this.authService.loginUser(this.email, this.password);
      this.router.navigate(['/main']);
    } catch (error: any) {
      this.errorMessage = 'Fehler bei der Anmeldung: ' + (error.message || 'Unbekannter Fehler');
    }
  }
}
