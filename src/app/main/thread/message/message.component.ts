import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Firestore } from '@angular/fire/firestore';
import { ReactionsComponent } from '../../reactions/reactions.component';
import { Message } from '../../../../models/message.class';
import { Reaction } from '../../../../models/reaction.class';
import { UserService } from '../../../../services/user.service';
import { ReactionService } from '../../../../services/reaction.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-message',
  imports: [CommonModule, ReactionsComponent],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
  @Input() message!: Message;
  @Output() editRequest = new EventEmitter<{ id: string, text: string }>();

  currentUserId!: string;
  currentUserData: any | null = null;
  currentUser: any;
  userData$!: Observable<{ name: string, avatar: string }>;
  userCache: Map<string, Observable<{ name: string, avatar: string }>> = new Map();
  userNamesCache: { [userId: string]: string } = {};
  reactions$!: Observable<Reaction[]>;
  groupedReactions: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } } = {};
  showReactionsOverlay: boolean = false;
  showReactionTooltip: boolean = false;
  tooltipEmoji: string = '';
  tooltipText: string = '';
  menuOpen: boolean = false; // Menü-Zustand

  constructor(
    private firestore: Firestore,
    private userService: UserService,
    private reactionService: ReactionService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {

    this.setUser();


    this.userData$ = this.userService.getUserById(this.message.userId);
    // Lade die Reaktionen
    if (this.message.id) {
      this.reactions$ = this.reactionService.getReactions('messages', this.message.id);

      this.reactions$.subscribe(reactions => {
        const groups = reactions.reduce((acc, reaction) => {
          if (!acc[reaction.type]) {
            acc[reaction.type] = { count: 0, likedByMe: false, userNames: [] };
          }
          acc[reaction.type].count++;

          // Aktualisiere nur die Gruppe für den aktuellen Reaction-Typ
          if (!this.userNamesCache[reaction.userId]) {
            this.userService.getUserById(reaction.userId).subscribe(userData => {
              this.userNamesCache[reaction.userId] = userData.name;
              if (acc[reaction.type].userNames.indexOf(userData.name) === -1) {
                acc[reaction.type].userNames.push(userData.name);
              }
            });
          } else {
            const name = this.userNamesCache[reaction.userId];
            if (acc[reaction.type].userNames.indexOf(name) === -1) {
              acc[reaction.type].userNames.push(name);
            }
          }
          if (reaction.userId === this.currentUserId) {
            acc[reaction.type].likedByMe = true;
          }
          return acc;
        }, {} as { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } });
        this.groupedReactions = groups;
      });
    }
  }

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

  getUserData(userId: string): Observable<{ name: string, avatar: string }> {
    if (!this.userCache.has(userId)) {
      const userData$ = this.userService.getUserById(userId);
      this.userCache.set(userId, userData$);
    }
    return this.userCache.get(userId)!;
  }

  toggleReactionsOverlay(): void {
    this.showReactionsOverlay = !this.showReactionsOverlay;
  }

  onEmojiSelected(emojiType: string): void {
    const reaction = new Reaction({
      userId: this.currentUserId,
      type: emojiType,
      timestamp: Date.now()
    });
    this.reactionService.addReaction('messages', this.message.id!, reaction)
      .then(() => {
        console.log('Reaction hinzugefügt!');
        this.showReactionsOverlay = false;
      })
      .catch(error => console.error('Fehler beim Hinzufügen der Reaction:', error));
  }

  onOverlayClosed(): void {
    this.showReactionsOverlay = false;
  }

  removeMyReaction(emojiType: string): void {
    // Hier entfernen wir die Reaction des aktuellen Benutzers.
    this.reactionService.removeReaction('messages', this.message.id!, this.currentUserId)
      .then(() => {
        console.log('Reaction entfernt!');
        // Optionale UI-Aktualisierung, z. B. Overlay schließen
        this.showReactionsOverlay = false;
      })
      .catch(error => console.error('Fehler beim Entfernen der Reaction:', error));
  }

  groupAccHasName(
    acc: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } },
    reactionType: string,
    name: string
  ): boolean {
    return acc[reactionType]?.userNames.includes(name);
  }

  openReactionTooltip(emoji: string, userNames: string[]): void {
    this.tooltipEmoji = emoji;
    const names = userNames.map(name => (name === this.currentUserName ? 'Du' : name));

    if (names.length === 1) {
      if (names[0] === 'Du') {
        this.tooltipText = 'Du hast reagiert';
      } else {
        this.tooltipText = `${names[0]} hat reagiert`;
      }
    } else {
      this.tooltipText = `${names.join(' und ')} haben reagiert`;
    }

    this.showReactionTooltip = true;
  }

  closeReactionTooltip(): void {
    this.showReactionTooltip = false;
  }

  get currentUserName(): string {
    return this.currentUser?.displayName || 'Unbekannter Nutzer';
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
