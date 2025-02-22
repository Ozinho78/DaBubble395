import { Component, OnInit } from '@angular/core';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { ThreadService } from '../../../services/thread.service';
import { Observable, map } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Message } from '../../../models/message.class';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-threads',
  imports: [CommonModule, FormsModule],
  templateUrl: './threads.component.html',
  styleUrl: './threads.component.scss'
})
export class ThreadsComponent implements OnInit {
  messages$!: Observable<Message[]>;
  userCache: Map<string, Observable<{ name: string, avatar: string }>> = new Map();
  newMessageText: string = '';

  constructor(
    private firestore: Firestore,
    private threadService: ThreadService,
    private userService: UserService
  ) { }

  ngOnInit() {
    const threadId = '6DGHEdX29kIHBFTtGrSr'; // Testweise, später dynamisch setzen
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
