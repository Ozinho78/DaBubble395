import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { addDoc, collection, deleteDoc, doc, Firestore, getDoc, getDocs, onSnapshot, query, where } from '@angular/fire/firestore';
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

  private subscriptions: { [key: string]: (() => void) | undefined } = {};

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

  /**
      * Daten in Firestore-Sammlung speichern
      * @param collectionName Name der Firestore-Sammlung
      * @param data Objekt, das gespeichert werden soll
      * @returns Die generierte Dokument-ID
      */
  async saveData(collectionName: string, data: any): Promise<string> {
    const ref = collection(this.firestore, collectionName);
    const docRef = await addDoc(ref, data);
    return docRef.id;
  }

  /**
  * Daten aus Firestore-Sammlung abrufen (alle)
  * @param collectionName Name der Firestore-Sammlung
  * @returns Ein Array mit allen Dokumenten
  */
  async getData<T>(collectionName: string): Promise<T[]> {
    const ref = collection(this.firestore, collectionName);
    const snapshot = await getDocs(ref);
    return snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }) as T);
  }

  async getDataByField<T>(collectionName: string, fieldName: string, value: any): Promise<T[]> {
    const ref = collection(this.firestore, collectionName);
    const q = query(ref, where(fieldName, '==', value));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }) as T);
  }

  /**
  * Holt ein einzelnes Dokument aus einer Firestore-Sammlung basierend auf der Dokument-ID.
  * 
  * Diese Methode sucht nicht nach einem bestimmten Feld-Wert, sondern ruft ein Dokument 
  * direkt über seine `docId` ab.
  * 
  * @template T Der erwartete Rückgabetyp des Dokuments.
  * @param {string} collectionName - Der Name der Firestore-Sammlung, aus der das Dokument abgerufen werden soll.
  * @param {string} value - Die Dokument-ID des gewünschten Eintrags.
  * @returns {Promise<T[]>} Ein Array mit einem einzigen Dokument als Objekt, falls es existiert, 
  *                         oder ein leeres Array, falls kein Dokument gefunden wurde.
  */
  async getDataByDocId<T>(collectionName: string, value: string): Promise<T[]> {
    const docRef = doc(this.firestore, collectionName, value);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return [{ ...docSnap.data(), docId: docSnap.id } as T];
    } else {
      console.warn(`⚠️ Kein Dokument mit ID ${value} gefunden.`);
      return [];
    }
  }

  /**
  * Daten aus Firestore-Sammlung löschen
  * @param collectionName Name der Firestore-Sammlung
  * @param docId ID des Dokuments, das gelöscht werden soll
  */
  async deleteData(collectionName: string, docId: string): Promise<void> {
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    await deleteDoc(docRef);
  }

  /**
  * Live-Änderungen einer Firestore-Sammlung abonnieren
  * @param collectionName Name der Firestore-Sammlung
  * @param callback Funktion, die aufgerufen wird, wenn sich die Daten ändern
  * @returns Eine Funktion zum Beenden des Abonnements
  */
  subscribeToCollection<T>(collectionName: string, callback: (data: T[]) => void) {
    const ref = collection(this.firestore, collectionName);
    this.subscriptions[collectionName] = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }) as T);
      callback(data);
    });
  }

  /**
  * Alle Abonnements beenden (wenn Service zerstört wird)
  */
  ngOnDestroy() {
    if (this.unsubUserNames) this.unsubUserNames();
    if (this.unsubChannelNames) this.unsubChannelNames();

    Object.values(this.subscriptions).forEach(unsub => unsub && unsub());
  }
}
