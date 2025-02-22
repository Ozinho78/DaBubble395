import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
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

  deleteDummyToken() {
    localStorage.removeItem('token');

  }

  async registerUser(avatar: string) {
    if (!this.userData.email || !this.userData.password) {
      console.error('Keine gespeicherten Benutzerdaten gefunden!');
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
        photoURL: avatar,
      });

      console.log('Benutzer erfolgreich registriert!');
      this.router.navigate(['/main']);
      this.deleteDummyToken();
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('token', idToken);
    } catch (error) {
      console.error('Fehler bei der Registrierung:', error);
    }
  }

  async loginUser(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('token', idToken);
  
      console.log('Erfolgreich angemeldet:', userCredential.user);
    } catch (error) {
      console.error('Fehler beim Login:', error);
      throw error;
    }
  }
}
