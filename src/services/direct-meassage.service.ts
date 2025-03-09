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
  where,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { Message } from '../models/message.class';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private firestore: Firestore) {}

  // Ermittelt, ob bereits ein Chat zwischen zwei Usern existiert und gibt ihn zurück,
  // ansonsten wird ein neuer Chat erstellt.
  async getOrCreateChat(userId1: string, userId2: string): Promise<string> {
    const chatId = [userId1, userId2].sort().join('_');
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
  getMessages(chatId: string): Observable<Message[]> {
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    return collectionData(messagesRef, { idField: 'id' }) as Observable<
      Message[]
    >;
  }

  // Neue Nachricht in einem Chat speichern
  async sendMessage(chatId: string, message: Message): Promise<void> {
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    await addDoc(messagesRef, message);
    // Optional: Aktualisiere im Chat-Dokument z. B. das Feld lastMessage
    const chatDocRef = doc(this.firestore, 'chats', chatId);
    await setDoc(chatDocRef, { lastMessage: message.text }, { merge: true });
  }
}
