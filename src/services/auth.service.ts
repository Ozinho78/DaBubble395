import { Injectable, inject, Injector } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  user
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { map, Observable } from 'rxjs';
import { collection, collectionData, query, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<any>;

  public userData: any = {};
  private injector = inject(Injector);

  constructor(private router: Router, private auth: Auth) {
    this.user$ = user(auth);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  storeUserData(name: string, email: string, password: string, avatarFilename: any) {
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

  async registerUser(avatarFilename: string): Promise<void> {
    if (!this.hasUserData()) {
      console.error('Keine gespeicherten Benutzerdaten gefunden!');
      return;
    }

    this.userData.avatar = avatarFilename;

    try {
      const userCredential = await this.createUser();
      await this.updateUserProfile(userCredential.user, avatarFilename);
      await this.setAuthToken(userCredential.user);
      const userService = this.injector.get(UserService);
      await userService.createUser();
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
