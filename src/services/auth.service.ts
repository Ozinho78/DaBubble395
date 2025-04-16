import { Injectable, inject, Injector } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  user,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from '@angular/fire/auth';
import { Firestore, collection, collectionData, doc, getDocs, query, where } from '@angular/fire/firestore';
import { UserService } from './user.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<any>;

  public userData: any = {};
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  constructor(private auth: Auth
  ) {
    this.user$ = user(auth);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  storeUserData(
    name: string,
    email: string,
    password: string,
    avatarFilename: any
  ) {
    this.userData = { name, email, password, avatarFilename };
  }

  getUserData() {
    return this.userData;
  }

  hasUserData(): boolean {
    //return !!(this.userData.email && this.userData.password);
    return !!(this.userData.email);
  }

  deleteDummyToken() {
    localStorage.removeItem('token');
  }

  async registerUser(avatarFilename: string): Promise<void> {
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
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      await this.setAuthToken(userCredential.user);
      await this.setUserId(email);
      console.log('Erfolgreich angemeldet:', userCredential.user);
    } catch (error) {
      console.error('Fehler beim Login:', error);
      throw error;
    }
  }

  async setUserId(email: string): Promise<void> {
    const userService = this.injector.get(UserService);
    userService.saveUserDocIdByEmail(email);
  }

  async checkIfEmailExists(email: string): Promise<boolean> {
    try {
      const userRef = collection(this.firestore, 'users');
      const q = query(userRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      return !querySnapshot.empty;
    } catch (error) {
      console.error('Fehler beim Überprüfen der E-Mail:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Fehler beim Senden der Passwort-Reset-E-Mail:', error);
      throw error;
    }
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();

    try {
      const userCredential = await signInWithPopup(this.auth, provider);
      const user = userCredential.user;

      await this.setAuthToken(user);
      await this.setUserId(user.email!);

      const emailExists = await this.checkIfEmailExists(user.email!);
      if (!emailExists) {
        debugger;
        this.userData = {
          name: user.displayName || 'Unbekannt',
          email: user.email || '',
          avatarFilename: user.photoURL ? user.photoURL.split('/').pop() : 'img/avatar/avatar1.png'
        };
        
        await this.updateUserProfile(user, user.photoURL || '');
        const userService = this.injector.get(UserService);
        await userService.createUser();
      }

      console.log('Google Login erfolgreich:', user);
    } catch (error) {
      console.error('Fehler beim Google Login:', error);
      throw error;
    }
  }
}
