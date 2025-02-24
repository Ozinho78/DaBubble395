import { Component, OnInit } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, updateDoc, doc, arrayUnion } from '@angular/fire/firestore';
import { ThreadService } from '../../../services/thread.service';
import { Message } from '../../../models/message.class';
import { Thread } from '../../../models/thread.class';
import { UserService } from '../../../services/user.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactionsComponent } from "../reactions/reactions.component";

@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule, ReactionsComponent],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit {
  messages$!: Observable<Message[]>;
  thread: Thread | null = null;
  userCache: Map<string, Observable<{ name: string, avatar: string }>> = new Map();
  newMessageText: string = '';

  constructor(
    private firestore: Firestore,
    private threadService: ThreadService,
    private userService: UserService
  ) { }

  ngOnInit() {
    const threadId = '6DGHEdX29kIHBFTtGrSr'; // Testweise, später dynamisch setzen
    const messagesRef = collection(this.firestore, 'messages'); // Passe evtl. den Pfad an

    // Thread laden
    this.threadService.getThreadById(threadId).subscribe(threadData => {
      this.thread = new Thread(threadData);
    });

    // Nachrichten (Replies) laden
    this.messages$ = collectionData(messagesRef, { idField: 'id' }) as Observable<Message[]>;

  }

  getUserData(userId: string): Observable<{ name: string, avatar: string }> {
    if (!this.userCache.has(userId)) {
      const userData$ = this.userService.getUserById(userId);
      this.userCache.set(userId, userData$);
    }
    return this.userCache.get(userId)!;
  }

  sendMessage() {
    if (!this.newMessageText.trim()) return; // Keine leeren Nachrichten senden

    const newMessage = new Message({
      text: this.newMessageText,
      userId: 'qdWWqOADh6O1FkGpHlTr', // Temporärer Benutzer
      threadId: '6DGHEdX29kIHBFTtGrSr', // Temporärer Thread
      creationDate: Date.now(), // Unix Timestamp in Millisekunden
      reactions: [] // Leere Reaktionen
    });

    const messagesRef = collection(this.firestore, 'messages'); // Firestore-Referenz

    addDoc(messagesRef, newMessage.toJSON()) // Firestore erwartet ein Objekt, daher `toJSON()`
      .then(() => {
        console.log('Nachricht gesendet!');
        this.newMessageText = ''; // Eingabefeld leeren
      })
      .catch(error => console.error('Fehler beim Senden:', error));
  }

  // Beispiel: Methode zum Hinzufügen einer Reaction
  addReaction(messageId: string, reaction: string) {
    debugger;
    const messageDocRef = doc(this.firestore, `messages/${messageId}`);
    updateDoc(messageDocRef, {
      reactions: arrayUnion(reaction)
    })
      .then(() => console.log('Reaction hinzugefügt!'))
      .catch(error => console.error('Fehler beim Hinzufügen der Reaction:', error));
  }
}
