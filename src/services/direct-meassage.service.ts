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
import { Message } from '../models/message.class';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(public Firestore: Firestore) {}

  // Ermittelt, ob bereits ein Chat zwischen zwei Usern existiert und gibt ihn zurück,
  // ansonsten wird ein neuer Chat erstellt.
  async getOrCreateChat(userId1: string, userId2: string): Promise<string> {
    const normalizedUserId1 = userId1.trim(); //.toLowerCase();
    const normalizedUserId2 = userId2.trim(); //.toLowerCase();
    const chatId = [normalizedUserId1, normalizedUserId2].sort().join('_');
    const chatDocRef = doc(this.Firestore, 'chats', chatId);
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
  getMessages(chatId: string): Observable<Message[]> {
    const messagesRef = collection(this.Firestore, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('creationDate', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
  }

  // Neue Nachricht in einem Chat speichern
  async sendMessage(chatId: string, message: Message): Promise<void> {
    const messagesRef = collection(this.Firestore, `chats/${chatId}/messages`);
    await addDoc(messagesRef, message.toJSON());
    // Optional: Aktualisiere im Chat-Dokument z. B. das Feld lastMessage
    const chatDocRef = doc(this.Firestore, 'chats', chatId);
    await setDoc(chatDocRef, { lastMessage: message.text }, { merge: true });
  }
}
