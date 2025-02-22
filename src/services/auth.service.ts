import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userData: any = {};
  private auth = inject(Auth);

  constructor(private router: Router) {}

  storeUserData(name: string, email: string, password: string) {
    this.userData = { name, email, password };
  }

  getUserData() {
    return this.userData;
  }

  hasUserData(): boolean {
    return !!(this.userData.email && this.userData.password);
  }

  async registerUser(avatar: string) {
    if (!this.userData.email || !this.userData.password) {
      console.error("Keine gespeicherten Benutzerdaten gefunden!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.userData.email,
        this.userData.password
      );

      await updateProfile(userCredential.user, {
        displayName: this.userData.name,
        photoURL: avatar
      });

      console.log("Benutzer erfolgreich registriert!");
      localStorage.setItem('token', userCredential.user.uid);
      this.router.navigate(['/main']);
    } catch (error) {
      console.error("Fehler bei der Registrierung:", error);
    }
  }
}
