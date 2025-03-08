import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Message } from '../../../../models/message.class';
import { UserService } from '../../../../services/user.service';
import { ReactionService } from '../../../../services/reaction.service';
import { ReactionsComponent } from '../../reactions/reactions.component';

@Component({
  selector: 'app-message',
  imports: [CommonModule, ReactionsComponent],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
  @Input() message!: Message & { id: string };
  @Output() editRequest = new EventEmitter<{ id: string, text: string }>();

  currentUserId: string | null = null;
  currentUser: any;
  userName: string = '';
  userData$!: Observable<{ name: string, avatar: string }>;
  userNamesCache: { [userId: string]: string } = {};

  reactions$!: Observable<any>;
  groupedReactions: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } } = {};
  showReactionsOverlay: boolean = false;
  showReactionTooltip: boolean = false;
  tooltipEmoji: string = '';
  tooltipText: string = '';
  activeTooltip: string | null = null;

  showReactionsOverlay$!: Observable<boolean>;
  showReactionTooltip$!: Observable<boolean>;
  tooltipEmoji$!: Observable<string>;
  tooltipText$!: Observable<string>;

  menuOpen: boolean = false; // Menü-Zustand

  constructor(
    private userService: UserService,
    public reactionService: ReactionService
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.userService.getCurrentUserId();
    this.loadCurrentName();
    this.userData$ = this.userService.getUserById(this.message.userId);
    this.loadReactions();

    this.showReactionsOverlay$ = this.reactionService.showReactionsOverlay$;
    this.showReactionTooltip$ = this.reactionService.showReactionTooltip$;
    this.tooltipEmoji$ = this.reactionService.tooltipEmoji$;
    this.tooltipText$ = this.reactionService.tooltipText$;
  }

  loadReactions() {
    if (this.message?.id && this.currentUserId) {
      this.reactions$ = this.reactionService.loadReactions('messages', this.message.id, this.currentUserId);
      this.reactions$.subscribe(groups => this.groupedReactions = groups);
    }
  }

  /*
  setUser() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.matchAuthUser(user.email);
      }
    });
  }

  matchAuthUser(email: string) {
    if (!email) return;

    this.userService.getUserByEmail(email).subscribe(userData => {
      if (userData) {
        this.currentUserId = userData.uid;
        this.currentUserData = userData;
      } else {
        console.log('Kein User in der Datenbank mit dieser E-Mail gefunden.');
      }
    });
  }
  */

  /*
  getUserData(userId: string): Observable<{ name: string, avatar: string }> {
    if (!this.userCache.has(userId)) {
      const userData$ = this.userService.getUserById(userId);
      this.userCache.set(userId, userData$);
    }
    return this.userCache.get(userId)!;
  }
  */

  toggleReactionsOverlay(): void {
    this.showReactionsOverlay = !this.showReactionsOverlay;
  }

  onEmojiSelected(emojiType: string): void {
    if (this.currentUserId) {
      this.reactionService.addEmojiReaction('messages', this.message.id, this.currentUserId, emojiType);
    }
  }

  /*

  onOverlayClosed(): void {
    this.showReactionsOverlay = false;
  }

  */

  removeMyReaction(): void {
    if (this.currentUserId) {
      this.reactionService.removeUserReaction('messages', this.message.id, this.currentUserId);
    }
  }

  /*groupAccHasName(
    acc: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } },
    reactionType: string,
    name: string
  ): boolean {
    return acc[reactionType]?.userNames.includes(name);
  }*/

  /*
openReactionTooltip(emoji: string, userNames: string[]) {
  this.tooltipEmoji = emoji;
  const names = userNames.map(name => (name === this.currentUserName ? 'Du' : name));

  if (names.length === 1) {
    // Fall: Nur eine Person hat reagiert
    this.tooltipText = names[0] === 'Du' ? 'Du hast reagiert' : `${names[0]} hat reagiert`;
  } else if (names.length === 2) {
    // Fall: Zwei Personen haben reagiert
    this.tooltipText = `${names[0]} und ${names[1]} haben reagiert`;
  } else {
    // Fall: Drei oder mehr Personen haben reagiert
    const allButLast = names.slice(0, -1).join(', '); // Alle außer den letzten mit Komma trennen
    const last = names[names.length - 1]; // Letzter Name
    this.tooltipText = `${allButLast} und ${last} haben reagiert`;
  }

  this.showReactionTooltip = true;
}

closeReactionTooltip() {
  this.showReactionTooltip = false;
}
  */

  loadCurrentName() {
    if (this.currentUserId) {
      this.userService.loadCurrentUser(this.currentUserId).then(user => {
        this.currentUser = user;
      });
    }
  }

  get currentUserName(): string {
    return this.currentUser?.name || 'Unbekannter Nutzer';
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  requestEdit() {
    this.editRequest.emit({ id: this.message.id!, text: this.message.text });
  }

  closeMenu() {
    this.menuOpen = false;
  }

}
