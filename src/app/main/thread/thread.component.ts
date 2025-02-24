import { Component, OnInit } from '@angular/core';
import { Firestore, addDoc, collection, collectionData } from '@angular/fire/firestore';
import { ThreadService } from '../../../services/thread.service';
import { Message } from '../../../models/message.class';
import { Thread } from '../../../models/thread.class';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageComponent } from "./message/message.component";
import { ThreadMessageComponent } from "./thread-message/thread-message.component";

@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule, MessageComponent, ThreadMessageComponent],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit {
  messages$!: Observable<Message[]>;
  thread: Thread | null = null;
  newMessageText: string = '';
  private messagesRef: any;

  constructor(
    private firestore: Firestore,
    private threadService: ThreadService
  ) {
    this.messagesRef = collection(this.firestore, 'messages');
  }

  ngOnInit() {
    const threadId = '6DGHEdX29kIHBFTtGrSr'; // Testweise, später dynamisch setzen
    this.threadService.getThreadById(threadId).subscribe(threadData => {
      this.thread = new Thread(threadData);
    });

    this.messages$ = collectionData(this.messagesRef, { idField: 'id' }) as Observable<Message[]>;
  }

  sendMessage() {
    if (!this.newMessageText.trim()) return; // Keine leeren Nachrichten senden

    const newMessage = new Message({
      text: this.newMessageText,
      userId: 'qdWWqOADh6O1FkGpHlTr', // Temporärer Benutzer
      threadId: '6DGHEdX29kIHBFTtGrSr', // Temporärer Thread
      creationDate: Date.now(),
      reactions: []
    });

    addDoc(this.messagesRef, newMessage.toJSON())
      .then(() => {
        console.log('Nachricht gesendet!');
        this.newMessageText = '';
      })
      .catch(error => console.error('Fehler beim Senden:', error));
  }
}
