import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageInputComponent } from '../../thread/message-input/message-input.component';
import { UserService } from '../../../../services/user.service';
import { PresenceService } from '../../../../services/presence.service';
import { Observable, of, firstValueFrom } from 'rxjs';
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

  constructor(
    private userService: UserService,
    public presenceService: PresenceService,
    private chatService: ChatService
  ) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnInit(): void {
    this.subscribeToSelectedUser();
    this.initializeChat();
  }

  private subscribeToSelectedUser(): void {
    this.userService.currentDocIdFromDevSpace.subscribe((selectedUserId) => {
      if (selectedUserId) {
        this.user$ = this.userService.getUserById(selectedUserId);
        this.onlineStatus$ =
          this.presenceService.getUserPresence(selectedUserId);
      } else {
        this.user$ = of({ name: 'Unbekannt', avatar: 'default.png' });
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
        this.selectedProfile = { id: userId, ...userData };
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
}
