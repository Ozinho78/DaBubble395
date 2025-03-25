import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageInputComponent } from '../../thread/message-input/message-input.component';
import { UserService } from '../../../../services/user.service';
import { PresenceService } from '../../../../services/presence.service';
import { Observable, of, firstValueFrom, map } from 'rxjs';
import { ChatService } from '../../../../services/direct-meassage.service';
import { Message } from '../../../../models/message.class';
import { ProfileViewComponent } from '../../shared/profile-view/profile-view.component';
import { User } from '../../../../models/user.model';

import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-direct-messages',
  imports: [CommonModule, MessageInputComponent, ProfileViewComponent],
  templateUrl: './direct-messages.component.html',
  styleUrl: './direct-messages.component.scss',
})
export class DirectMessagesComponent implements OnInit, AfterViewChecked {
  onlineStatus$: Observable<boolean> = of(false);
  user$: Observable<User> = of(new User());
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
    private chatService: ChatService,
    private route: ActivatedRoute
  ) { }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnInit(): void {
    //console.log('Direct Messages Log');
    this.loggedInUserId = localStorage.getItem('user-id') || '';
    this.subscribeToSelectedUser();
    this.subscribeRouteParams();
    //this.initializeChat();
  }

  private subscribeToSelectedUser(): void {
    this.userService.currentDocIdFromDevSpace.subscribe((selectedUserId) => {
      if (selectedUserId) {
        this.user$ = this.userService.getUserById(selectedUserId).pipe(
          map((userData: any) => {
            const user = new User();
            user.name = userData.name || '';
            user.avatar = userData.avatar || '';
            user.email = userData.email || '';
            // Falls userData.id als String vorliegt, kannst du ihn in eine Zahl umwandeln:
            user.id = userData.id ? parseInt(userData.id, 10) : 0;
            user.password = userData.password || '';
            user.active =
              userData.active !== undefined ? userData.active : false;
            // Setze die docId, die du als Identifikator nutzen möchtest:
            user.docId = selectedUserId;
            return user;
          })
        );
        this.onlineStatus$ =
          this.presenceService.getUserPresence(selectedUserId);
      } else {
        this.user$ = of(new User());
      }
    });
  }

  subscribeRouteParams() {
    this.route.queryParamMap.subscribe(params => {
      this.chatId = params.get('chat') || '';

      //debugger;

      if (this.chatId) {
        this.initializeChat();
      }
    });
  }

  private async initializeChat(): Promise<void> {
    this.messages$ = this.chatService.getMessages(this.chatId);
    /*
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
        );*/
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

  getUserPresence(userId: string | undefined): Observable<boolean> {
    if (!userId) return of(false); // Falls keine userId vorhanden ist, false zurückgeben
    return this.presenceService.getUserPresence(userId);
  }
}
