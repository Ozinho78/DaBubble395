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
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule, MessageComponent, ThreadMessageComponent, MessageInputComponent],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit {
  @ViewChild('messageInput') messageInput!: MessageInputComponent;
  groupedMessages$!: Observable<{ date: string, messages: Message[] }[]>;
  totalMessagesCount$!: Observable<number>; // ✅ Neue Variable für Gesamtanzahl
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

    this.groupedMessages$ = this.threadService.getMessages(this.threadId).pipe(
      map(messages => {
        const grouped = messages.reduce((acc, message) => {
          const date = message.creationDate
            ? new Date(message.creationDate).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
            : 'Unbekanntes Datum';

          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(message);
          return acc;
        }, {} as { [key: string]: Message[] });

        return Object.keys(grouped).map(date => ({
          date,
          messages: grouped[date]
        }));
      })
    );

    // ✅ Berechnet die Gesamtanzahl der Nachrichten
    this.totalMessagesCount$ = this.groupedMessages$.pipe(
      map(groups => groups.reduce((acc, group) => acc + group.messages.length, 0))
    );
  }

  ngAfterViewInit() {
    this.groupedMessages$.subscribe(() => {
      this.scrollToBottom();
    });
  }

  /** Scrollt den Chat nach unten */
  scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100); // Sicherstellen, dass Nachrichten geladen wurden
  }

  handleEditRequest(event: { id: string, text: string }) {
    this.messageInput.editMessage(event.id, event.text);
  }
}
