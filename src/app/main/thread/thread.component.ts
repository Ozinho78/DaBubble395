import { Component, OnInit } from '@angular/core';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { ThreadService } from '../../../services/thread.service';
import { Message } from '../../../models/message.class';
import { Thread } from '../../../models/thread.class';
import { UserService } from '../../../services/user.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule],
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

    // Thread laden
    this.threadService.getThreadById(threadId).subscribe(threadData => {
      this.thread = new Thread(threadData);
    });

    // Nachrichten (Replies) laden
    this.messages$ = this.threadService.getMessages(threadId);
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
}
