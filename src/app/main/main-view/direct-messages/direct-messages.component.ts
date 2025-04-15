import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
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
import { doc, getDoc } from 'firebase/firestore';
import { ReactionDisplayComponent } from '../../reactions/reaction-display.component';
import { ReactionMenuComponent } from '../../reactions/reaction-menu.component';

@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [
    CommonModule,
    MessageInputComponent,
    ProfileViewComponent,
    ReactionDisplayComponent,
    ReactionMenuComponent,
  ],
  templateUrl: './direct-messages.component.html',
  styleUrls: [
    './direct-messages.component.scss',
    '../../thread/thread.component.scss',
    '../../thread/message/message.component.scss',
  ],
})
export class DirectMessagesComponent implements OnInit {
  @Output() editRequest = new EventEmitter<{
    id: string;
    text: string;
    type: 'message' | 'thread' | 'chat';
  }>();

  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild(MessageInputComponent) messageInputComponent!: MessageInputComponent;

  onlineStatus$: Observable<boolean> = of(false);
  user$: Observable<User> = of(new User());
  userObservables: Map<
    string,
    Observable<{ id: string; name: string; avatar: string; email: string }>
  > = new Map();

  messages: Message[] = [];
  selectedProfile: {
    id: string;
    name: string;
    avatar: string;
    email?: string;
  } | null = null;
  selectedProfilePresence$: Observable<boolean> = of(false);
  chatId: string = '';
  loggedInUserId: string = '';
  profileViewOpen: boolean = false;

  hoveredMessageId: string | null = null;
  editingTarget: {
    id: string;
    text: string;
    type: 'message' | 'thread' | 'chat';
  } | null = null;

  constructor(
    private userService: UserService,
    public presenceService: PresenceService,
    private chatService: ChatService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initLoggedInUser();
    this.handleChatParams();
    this.route.queryParams.subscribe((params) => {
      if (params['chat']) {
        setTimeout(() => {
          this.messageInputComponent?.focusInputTextArea();
        }, 0);
      }
    });
  }


  private initLoggedInUser() {
    this.loggedInUserId = localStorage.getItem('user-id') || '';
  }

  private handleChatParams() {
    this.route.queryParamMap.subscribe((params) => {
      this.chatId = params.get('chat') || '';

      if (this.chatId) {
        this.prepareChat();
        setTimeout(() => this.scrollToBottom(), 200);
      }
    });
  }

  private async prepareChat() {
    this.messages = [];
    await this.setUserFromChat();
    this.loadChatData();
  }

  private async setUserFromChat() {
    const participants = await this.getParticipantsFromChat();
    if (!participants.length) return;

    const targetUserId = this.resolveChatPartner(participants);
    if (!targetUserId) return;

    this.loadUserData(targetUserId);
  }

  private async getParticipantsFromChat(): Promise<string[]> {
    const docRef = doc(this.chatService.Firestore, 'chats', this.chatId);
    const chatSnap = await getDoc(docRef);
    if (!chatSnap.exists()) return [];
    return chatSnap.data()?.['participants'] || [];
  }

  private resolveChatPartner(participants: string[]): string | null {
    const isSelfChat =
      participants.length === 1 ||
      participants.every((id: string) => id === this.loggedInUserId);
    return isSelfChat
      ? this.loggedInUserId
      : participants.find((id: string) => id !== this.loggedInUserId) || null;
  }

  private loadUserData(userId: string) {
    this.user$ = this.userService
      .getUserById(userId)
      .pipe(map((userData) => this.mapUser(userData, userId)));
    this.onlineStatus$ = this.presenceService.getUserPresence(userId);
  }

  private loadChatData() {
    this.chatService.getMessages(this.chatId).subscribe((msgs) => {
      const wasScrolledToBottom = this.isScrolledToBottom();

      this.messages = msgs;

      if (wasScrolledToBottom) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  async onNewMessage(newText: string) {
    if (!this.loggedInUserId)
      return console.error('Kein eingeloggter User gefunden.');

    const currentUser = await firstValueFrom(
      this.userService.getUserById(this.loggedInUserId)
    );

    const newMessage = new Message({
      creationDate: Date.now(),
      reactions: [],
      text: newText,
      threadId: this.chatId,
      userId: this.loggedInUserId,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
    });

    await this.chatService.sendMessage(this.chatId, newMessage);
  }

  scrollToBottom() {
    setTimeout(() => {
      const el = this.chatContainer?.nativeElement;
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 100);
  }

  isScrolledToBottom(): boolean {
    const el = this.chatContainer?.nativeElement;
    if (!el) return false;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }

  showProfile(userId?: string): void {
    if (!userId) return;
    this.userService
      .getUserById(userId)
      .subscribe((user) => this.openProfile(user, userId));
  }

  private openProfile(userData: any, userId: string) {
    if (!userData) return console.error('Fehler: User-Daten nicht gefunden.');
    this.selectedProfile = { ...userData, id: userId };
    this.selectedProfilePresence$ =
      this.presenceService.getUserPresence(userId);
    this.profileViewOpen = true;
  }

  closeProfile(): void {
    this.profileViewOpen = false;
    this.selectedProfile = null;
  }

  private mapUser(userData: any, docId: string): User {
    const user = new User();
    user.name = userData.name || '';
    user.avatar = userData.avatar || '';
    user.email = userData.email || '';
    user.id = userData.id ? parseInt(userData.id, 10) : 0;
    user.password = userData.password || '';
    user.active = userData.active ?? false;
    user.docId = docId;
    return user;
  }

  getUserObservable(
    userId: string
  ): Observable<{ id: string; name: string; avatar: string; email: string }> {
    if (!this.userObservables.has(userId)) {
      const user$ = this.userService.getUserById(userId);
      this.userObservables.set(userId, user$);
    }
    return this.userObservables.get(userId)!;
  }

  formatMessageDate(timestamp: any): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today.setDate(today.getDate() - 1));
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

    if (date.toDateString() === new Date().toDateString())
      return `Heute ${formattedTime} Uhr`;
    if (date.toDateString() === yesterday.toDateString())
      return `Gestern ${formattedTime} Uhr`;
    return `${formattedDate} ${formattedTime} Uhr`;
  }

  getUserPresence(userId: string | undefined): Observable<boolean> {
    return userId ? this.presenceService.getUserPresence(userId) : of(false);
  }

  handleEditRequest(event: {
    id: string;
    text: string;
    type: 'message' | 'thread' | 'chat';
  }) {
    this.editingTarget = event;
  }

  clearEditState() {
    this.editingTarget = null;
  }
}
