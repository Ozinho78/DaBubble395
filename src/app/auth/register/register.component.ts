import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
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

  setToken() {
    localStorage.setItem('token', 'dummy-token');
  }

  async register() {
    this.resetErrors();
    this.handleRegisterError(Error);
    if (this.isPrivacyAccepted) {
      await this.setToken();
      const avatarFilename = 'default-avatar.png';
      this.authService.storeUserData(
        this.name,
        this.email,
        this.password,
        avatarFilename
      );
      this.router.navigate(['/avatar-selection']);
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  resetErrors() {
    this.nameErrorMessage = '';
    this.emailErrorMessage = '';
    this.passwordErrorMessage = '';
  }

  handleRegisterError(error: any) {
    if (!this.name) {
      this.nameErrorMessage = 'Bitte schreiben Sie einen Namen.';
    }
    if (!this.email) {
      this.emailErrorMessage = 'Bitte E-Mail-Adresse eingeben.';
    }
    if (!this.password) {
      this.passwordErrorMessage = 'Bitte Passwort eingeben.';
    }

    if (
      this.nameErrorMessage ||
      this.emailErrorMessage ||
      this.passwordErrorMessage
    ) {
      return;
    }
  }
}
