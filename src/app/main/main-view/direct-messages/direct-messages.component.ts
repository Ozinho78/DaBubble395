import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageInputComponent } from '../../thread/message-input/message-input.component';
import { UserService } from '../../../../services/user.service';
import { PresenceService } from '../../../../services/presence.service';
import { Observable, of, firstValueFrom, map } from 'rxjs';
import { ChatService } from '../../../../services/direct-meassage.service';
import { Message } from '../../../../models/message.class';
import { ProfileViewComponent } from '../../shared/profile-view/profile-view.component';

@Component({
  selector: 'app-direct-messages',
  imports: [CommonModule, MessageInputComponent, ProfileViewComponent],
  templateUrl: './direct-messages.component.html',
  styleUrl: './direct-messages.component.scss',
})
export class DirectMessagesComponent implements OnInit, AfterViewChecked {
  onlineStatus$: Observable<boolean> = of(false);
  user$: Observable<{ name: string; avatar: string }> = of({
    name: '',
    avatar: '',
  });
  messages$: Observable<Message[]> = of([]);
  selectedProfile: {
    id: string;
    name: string;
    avatar: string;
    email?: string;
  } | null = null;
  chatId: string = '';
  profileViewOpen: boolean = false;
  selectedProfilePresence$: Observable<boolean> = of(false);
  loggedInUserId: string = '';

  constructor(
    private userService: UserService,
    public presenceService: PresenceService,
    private chatService: ChatService
  ) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnInit(): void {
    this.loggedInUserId = localStorage.getItem('user-id') || '';
    this.subscribeToSelectedUser();
    this.initializeChat();
  }

  private subscribeToSelectedUser(): void {
    this.userService.currentDocIdFromDevSpace.subscribe((selectedUserId) => {
      if (selectedUserId) {
        this.user$ = this.userService.getUserById(selectedUserId).pipe(
          map((user) => ({
            ...user,
            id: selectedUserId, // 👈 Explizit ID setzen
          }))
        );
        this.onlineStatus$ =
          this.presenceService.getUserPresence(selectedUserId);
      } else {
        this.user$ = of({ id: '', name: 'Unbekannt', avatar: 'default.png' });
      }
    });
  }

  private async initializeChat(): Promise<void> {
    const loggedInUserId = localStorage.getItem('user-id');
    if (!loggedInUserId) return;

    this.userService.currentDocIdFromDevSpace.subscribe(
      async (selectedUserId) => {
        if (selectedUserId) {
          this.chatId = await this.chatService.getOrCreateChat(
            loggedInUserId,
            selectedUserId
          );
          this.messages$ = this.chatService.getMessages(this.chatId);
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

  showProfile(userId: string | undefined): void {
    if (!userId) return;

    this.userService.getUserById(userId).subscribe((userData) => {
      if (userData) {
        this.selectedProfile = {
          ...userData,
          id: this.selectedProfile?.id ?? userId, // 👈 Falls `id` fehlt, dann userId setzen
        };
        this.selectedProfilePresence$ =
          this.presenceService.getUserPresence(userId);
        this.profileViewOpen = true;
      } else {
        console.error('Fehler: User-Daten nicht gefunden.');
      }
    });
  }

  closeProfile(): void {
    this.profileViewOpen = false;
    this.selectedProfile = null;
  }

  formatMessageDate(timestamp: any): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const formattedDate = date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (date.toDateString() === today.toDateString()) {
      return `Heute ${formattedTime} Uhr`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Gestern ${formattedTime} Uhr`;
    } else {
      return `${formattedDate} ${formattedTime} Uhr`;
    }
  }
}
