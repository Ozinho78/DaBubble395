import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(private router: Router) {}

  login() {
    localStorage.setItem('token', 'dummy-token'); // Simuliertes Login
    this.router.navigate(['/main']); // Weiterleitung nach Login
  }
}
