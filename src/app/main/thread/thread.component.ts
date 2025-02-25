import { Component, OnInit, ViewChild } from '@angular/core';
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
  channelName$!: Observable<string>;
  thread: Thread | null = null;
  newMessageText: string = '';
  threadId: string = '6DGHEdX29kIHBFTtGrSr'; // Beispiel, später dynamisch setzen

  constructor(
    private threadService: ThreadService
  ) { }

  ngOnInit() {
    this.threadService.getThreadById(this.threadId).subscribe(threadData => {
      this.thread = new Thread(threadData);
      this.thread.id = this.threadId;
    });

    this.channelName$ = this.threadService.getChannelName(this.threadId);
    this.messages$ = this.threadService.getMessages(this.threadId);
  }

  handleEditRequest(event: { id: string, text: string }) {
    this.messageInput.editMessage(event.id, event.text);
  }
}
