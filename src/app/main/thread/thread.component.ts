import { Component, OnInit, ViewChild } from '@angular/core';
import { Firestore, addDoc, collection, collectionData } from '@angular/fire/firestore';
import { ThreadService } from '../../../services/thread.service';
import { Message } from '../../../models/message.class';
import { Thread } from '../../../models/thread.class';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageComponent } from "./message/message.component";
import { ThreadMessageComponent } from "./thread-message/thread-message.component";
import { MessageInputComponent } from "./message-input/message-input.component";

@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule, MessageComponent, ThreadMessageComponent, MessageInputComponent],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit {
  @ViewChild('messageInput') messageInput!: MessageInputComponent;
  messages$!: Observable<Message[]>;
  thread: Thread | null = null;
  newMessageText: string = '';

  constructor(
    private firestore: Firestore,
    private threadService: ThreadService
  ) { }

  ngOnInit() {
    const threadId = '6DGHEdX29kIHBFTtGrSr'; // Testweise, später dynamisch setzen
    this.threadService.getThreadById(threadId).subscribe(threadData => {
      this.thread = new Thread(threadData);
      this.thread.id = threadId;
    });

    this.messages$ = this.threadService.getMessages(threadId);
  }

  handleEditRequest(event: { id: string, text: string }) {
    this.messageInput.editMessage(event.id, event.text);
  }
}
