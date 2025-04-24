import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss', '../auth-resp.scss', '../auth.component.scss'],
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  nameErrorMessage: string = '';
  emailErrorMessage: string = '';
  passwordErrorMessage: string = '';
  isPrivacyAccepted: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {}

  async register() {
    this.resetErrors();
    this.validateForm();

    if (!this.isFormValid()) return;

    await this.createUser();
    this.router.navigate(['/auth/avatar-selection']);
  }

  resetErrors() {
    this.nameErrorMessage = '';
    this.emailErrorMessage = '';
    this.passwordErrorMessage = '';
  }

  validateForm() {
    if (!this.name) this.nameErrorMessage = 'Bitte schreiben Sie einen Namen.';
    if (!this.email) {
      this.emailErrorMessage = 'Bitte E-Mail-Adresse eingeben.';
    } else if (!this.isValidEmail(this.email)) {
      this.emailErrorMessage = 'Bitte eine gültige E-Mail-Adresse eingeben.';
    }
    if (!this.password) this.passwordErrorMessage = 'Bitte Passwort eingeben.';
  }

  isValidEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  isFormValid(): boolean {
    return (
      this.isPrivacyAccepted &&
      !this.nameErrorMessage &&
      !this.emailErrorMessage &&
      !this.passwordErrorMessage
    );
  }

  async createUser() {
    this.setToken();
    const avatarFilename = 'default-avatar.png';
    await this.authService.storeUserData(this.name, this.email, this.password, avatarFilename);
  }

  setToken() {
    localStorage.setItem('token', 'dummy-token');
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
