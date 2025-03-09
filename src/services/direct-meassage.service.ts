import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  collectionData,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { DirectMessage } from '../models/direct-message.class';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private firestore: Firestore) { }

  // Ermittelt, ob bereits ein Chat zwischen zwei Usern existiert und gibt ihn zurück,
  // ansonsten wird ein neuer Chat erstellt.
  async getOrCreateChat(userId1: string, userId2: string): Promise<string> {
    const normalizedUserId1 = userId1.trim().toLowerCase();
    const normalizedUserId2 = userId2.trim().toLowerCase();
    const chatId = [normalizedUserId1, normalizedUserId2].sort().join('_');
    const chatDocRef = doc(this.firestore, 'chats', chatId);
    const chatSnap = await getDoc(chatDocRef);
    if (!chatSnap.exists()) {
      // Chat existiert nicht – neuen Chat erstellen
      await setDoc(chatDocRef, {
        participants: [userId1, userId2],
        createdAt: new Date(),
        lastMessage: '',
      });
    }
    return chatId;
  }

  // Nachrichten aus einem Chat laden (als Beispiel – du kannst die Gruppierung auch analog zu Threads implementieren)
  getMessages(chatId: string): Observable<DirectMessage[]> {
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('creationDate', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<DirectMessage[]>;
  }

  // Neue Nachricht in einem Chat speichern
  async sendMessage(chatId: string, message: DirectMessage): Promise<void> {
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    await addDoc(messagesRef, message.toJSON()); 
    // Optional: Aktualisiere im Chat-Dokument z. B. das Feld lastMessage
    const chatDocRef = doc(this.firestore, 'chats', chatId);
    await setDoc(chatDocRef, { lastMessage: message.text }, { merge: true });
  }
}