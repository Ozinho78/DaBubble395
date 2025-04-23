import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-request-password-reset',
  imports: [FormsModule, CommonModule],
  templateUrl: './request-password-reset.component.html',
  styleUrl: './request-password-reset.component.scss',
})
export class RequestPasswordResetComponent {
  email: string = '';
  emailErrorMessage: string = '';
  successMessage: string = '';  
  isEmail: boolean = false;

  constructor(private router: Router, private authService: AuthService) { }

  async requestPasswordReset() {
    this.resetMessages();

    if (!this.email) {
      this.emailErrorMessage = 'Bitte E-Mail-Adresse eingeben.';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.emailErrorMessage = 'Bitte eine gültige E-Mail-Adresse eingeben.';
      return;
    }
    await this.checkEmail();
  }

  async checkEmail() {
    try {
      const emailExists = await this.authService.checkIfEmailExists(this.email);

      if (emailExists) {
        await this.authService.sendPasswordResetEmail(this.email);
        this.successMessage = 'E-Mail gesendet';
        setTimeout(() => this.navigateToLogin(), 2000);
      } else {
        this.emailErrorMessage = 'Diese E-Mail-Adresse ist nicht registriert.';
      }
    } catch (error: any) {
      this.emailErrorMessage =
        error.message || 'Fehler beim Zurücksetzen des Passworts.';
    }
  }

  resetMessages() {
    this.emailErrorMessage = '';
    this.successMessage = '';
  }

  isValidEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  validateEmail() {
    this.isEmail = this.isValidEmail(this.email);
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
