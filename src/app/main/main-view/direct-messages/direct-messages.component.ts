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
import { doc, getDoc } from 'firebase/firestore';

@Component({
  selector: 'app-direct-messages',
  standalone: true,
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
  selectedProfilePresence$: Observable<boolean> = of(false);
  chatId: string = '';
  loggedInUserId: string = '';
  profileViewOpen: boolean = false;

  constructor(
    private userService: UserService,
    public presenceService: PresenceService,
    private chatService: ChatService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initLoggedInUser();
    this.handleChatParams();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private initLoggedInUser() {
    this.loggedInUserId = localStorage.getItem('user-id') || '';
  }

  private handleChatParams() {
    this.route.queryParamMap.subscribe((params) => {
      this.chatId = params.get('chat') || '';
      if (this.chatId) {
        this.prepareChat();
      }
    });
  }

  private async prepareChat() {
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
    this.messages$ = this.chatService.getMessages(this.chatId);
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
    const replies = document.getElementById('replies');
    if (replies) replies.scrollTop = replies.scrollHeight;
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
}
