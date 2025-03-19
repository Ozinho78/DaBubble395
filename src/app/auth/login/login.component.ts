import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  @ViewChild('logo', { static: true }) logoElement!: ElementRef;
  @ViewChild('logoHeader', { static: true }) logoHeaderElement!: ElementRef;
  email: string = '';
  password: string = '';
  emailErrorMessage: string = '';
  passwordErrorMessage: string = '';
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    const introPlayed = sessionStorage.getItem('introPlayed') === 'true';

    if (introPlayed) {
      this.renderer.setStyle(this.logoElement.nativeElement, 'display', 'none');
      this.renderer.setStyle(this.logoHeaderElement.nativeElement, 'opacity', '1'); 
    } else {
      setTimeout(() => {
        this.shrinkLogo();
        this.fadeInHeaderLogo();
        sessionStorage.setItem("introPlayed", "true");
      }, 2500);
    }
  }
  
  shrinkLogo(): void {
    this.renderer.addClass(this.logoElement.nativeElement, 'fade-out');
  }

  fadeInHeaderLogo(): void {
    this.renderer.addClass(this.logoHeaderElement.nativeElement, 'fade-in');
  }

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
      this.passwordErrorMessage = 'Bitte geben Sie ein Passwort ein.';
    }

    if (this.emailErrorMessage || this.passwordErrorMessage) {
      return;
    }

    try {
      await this.authService.loginUser(this.email, this.password);
      this.router.navigate(['/main']);
    } catch (error: any) {
      this.handleLoginError(error);
    }
  }

  handleLoginError(error: any) {
    if (error.code === 'auth/invalid-email') {
      this.errorMessage = 'Diese E-Mail-Adresse ist leider ungültig.';
    } else if (error.code === 'auth/invalid-credential') {
      this.errorMessage =
        'Falsches Passwort oder E-Mail. Bitte noch einmal versuchen.';
    } else {
      this.errorMessage =
        error.message || 'Fehler bei der Anmeldung: Unbekannter Fehler';
    }
  }
}
