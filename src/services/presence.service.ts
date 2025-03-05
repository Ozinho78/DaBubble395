import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  getDatabase,
  ref,
  onDisconnect,
  set,
  onValue,
} from 'firebase/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PresenceService {
  private db = getDatabase();

  constructor(private auth: Auth) {}

  // Setzt den Online-Status für den User
  setUserPresence(userId: string): void {
    const userStatusRef = ref(this.db, `status/${userId}`);
    set(userStatusRef, true);
    onDisconnect(userStatusRef).set(false);
  }

  // Liefert ein Observable, das den Online-Status überwacht
  getUserPresence(userId: string): Observable<boolean> {
    const userStatusRef = ref(this.db, `status/${userId}`);
    return new Observable<boolean>((observer) => {
      onValue(userStatusRef, (snapshot) => {
        observer.next(!!snapshot.val());
      });
    });
  }

  setUserOffline(userId: string): Promise<void> {
    const userStatusRef = ref(this.db, `status/${userId}`);
    return set(userStatusRef, false);
  }
}
