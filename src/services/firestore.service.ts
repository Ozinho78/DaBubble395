import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { Channel } from '../models/channel.model';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService implements OnDestroy {
  users: User[] = [];
  channels: Channel[] = [];

  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  private channelsSubject = new BehaviorSubject<Channel[]>([]);
  channels$ = this.channelsSubject.asObservable();

  private unsubUserNames: (() => void) | undefined;
  private unsubChannelNames: (() => void) | undefined;

  constructor(private firestore: Firestore) {
    this.fetchUsers();
    this.fetchChannels();
  }

  private fetchUsers() {
    const userDatabase = collection(this.firestore, 'users');
    this.unsubUserNames = onSnapshot(userDatabase, (snapshot) => {
      this.users = snapshot.docs.map((doc) => {
        const user = doc.data() as User;
        user.id = parseInt(user.avatar.match(/\d+/)?.[0] || '0', 10);
        user.docId = doc.id;
        return user;
      });
      // this.usersSubject.next(users);
      // Daten sowohl in das Array als auch in das Subject speichern
      this.usersSubject.next([...this.users]);
    });
  }

  private fetchChannels() {
    const channelDatabase = collection(this.firestore, 'channels');
    this.unsubChannelNames = onSnapshot(channelDatabase, (snapshot) => {
      this.channels = snapshot.docs.map((doc) => {
        const channel = doc.data() as Channel;
        channel.docId = doc.id;
        return channel;
      });
      // this.channelsSubject.next(channels);
      this.channelsSubject.next([...this.channels]);
    });
  }

  // Möglichkeit zum direkten Zugriff auf die Arrays
  getUsers(): User[] {
    return [...this.users]; // Rückgabe einer Kopie, um Mutationen zu vermeiden
  }

  getChannels(): Channel[] {
    return [...this.channels]; // Rückgabe einer Kopie
  }

  ngOnDestroy() {
    if (this.unsubUserNames) this.unsubUserNames();
    if (this.unsubChannelNames) this.unsubChannelNames();
  }
}
