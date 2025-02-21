import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  isPrivacyAccepted: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {}

  register() {
    if (this.isPrivacyAccepted) {
      this.router.navigate(['/avatar-selection']);
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
