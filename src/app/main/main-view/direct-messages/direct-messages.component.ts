import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageInputComponent } from '../../thread/message-input/message-input.component';
import { UserService } from '../../../../services/user.service';
import { PresenceService } from '../../../../services/presence.service';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, firstValueFrom } from 'rxjs';
import { ChatService } from '../../../../services/direct-meassage.service';
import { Message } from '../../../../models/message.class';

@Component({
  selector: 'app-direct-messages',
  imports: [CommonModule, MessageInputComponent],
  templateUrl: './direct-messages.component.html',
  styleUrl: './direct-messages.component.scss',
})
export class DirectMessagesComponent implements OnInit, AfterViewChecked {
  onlineStatus$: Observable<boolean> = of(false);
  user$: Observable<{ name: string; avatar: string }> = of({
    name: '',
    avatar: '',
  });
  chatId: string = '';
  messages$: Observable<Message[]> = of([]);

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private presenceService: PresenceService,
    private chatService: ChatService
  ) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnInit(): void {
    this.userService.currentDocIdFromDevSpace.subscribe(
      async (selectedUserId) => {
        if (selectedUserId) {
          this.user$ = this.userService.getUserById(selectedUserId);
          this.onlineStatus$ =
            this.presenceService.getUserPresence(selectedUserId);

          const loggedInUserId = localStorage.getItem('user-id');
          if (loggedInUserId) {
            this.chatId = await this.chatService.getOrCreateChat(
              loggedInUserId,
              selectedUserId
            );
            this.messages$ = this.chatService.getMessages(this.chatId);
          }
        } else {
          this.user$ = of({ name: 'Unbekannt', avatar: 'default.png' });
        }
      }
    );
  }

  async onNewMessage(newText: string) {
    const loggedInUserId = localStorage.getItem('user-id');
    if (!loggedInUserId) {
      console.error('Kein eingeloggter User gefunden.');
      return;
    }
    const currentUser = await firstValueFrom(
      this.userService.getUserById(loggedInUserId)
    );

    const newMessage = new Message({
      creationDate: Date.now(),
      reactions: [],
      text: newText,
      threadId: this.chatId,
      userId: loggedInUserId,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
    });

    await this.chatService.sendMessage(this.chatId, newMessage);
  }

  scrollToBottom() {
    const replies = document.getElementById('replies');
    if (replies) {
      replies.scrollTop = replies.scrollHeight;
    }
  }
}
