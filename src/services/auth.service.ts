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
    if (!this.hasUserData()) {
      console.error('Keine gespeicherten Benutzerdaten gefunden!');
      return;
    }

    try {
      const userCredential = await this.createUser();
      await this.updateUserProfile(userCredential.user, avatar);
      await this.setAuthToken(userCredential.user);
      this.router.navigate(['/main']);
      this.deleteDummyToken();
    } catch (error) {
      console.error('Fehler bei der Registrierung:', error);
    }
  }

  async createUser() {
    const { email, password } = this.userData;
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  async updateUserProfile(user: any, avatar: string) {
    await updateProfile(user, {
      displayName: this.userData.name,
      photoURL: avatar,
    });
    console.log('Benutzerprofil aktualisiert!');
  }

  async setAuthToken(user: any) {
    const idToken = await user.getIdToken();
    localStorage.setItem('token', idToken);
  }

  async loginUser(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.setAuthToken(userCredential.user);
      console.log('Erfolgreich angemeldet:', userCredential.user);
    } catch (error) {
      console.error('Fehler beim Login:', error);
      throw error;
    }
  }
}
