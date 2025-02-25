import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Firestore } from '@angular/fire/firestore';
import { Thread } from '../../../../models/thread.class';
import { UserService } from '../../../../services/user.service';
import { Reaction } from '../../../../models/reaction.class';
import { ReactionService } from '../../../../services/reaction.service';
import { ReactionsComponent } from '../../reactions/reactions.component';

@Component({
  selector: 'app-thread-message',
  imports: [CommonModule, ReactionsComponent],
  templateUrl: './thread-message.component.html',
  styleUrls: ['../message/message.component.scss'],
})
export class ThreadMessageComponent implements OnInit {
  @Input() thread!: Thread & { id: string };

  currentUserId!: string;
  userData$!: Observable<{ name: string, avatar: string }>;
  userCache: Map<string, Observable<{ name: string, avatar: string }>> = new Map();
  userNamesCache: { [userId: string]: string } = {};
  reactions$!: Observable<Reaction[]>;
  groupedReactions: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } } = {};
  showReactionsOverlay: boolean = false;
  showReactionTooltip: boolean = false;
  tooltipEmoji: string = '';
  tooltipText: string = '';

  constructor(
    private userService: UserService,
    private firestore: Firestore,
    private reactionService: ReactionService
  ) { }

  ngOnInit(): void {
    this.currentUserId = 'qdWWqOADh6O1FkGpHlTr';
    this.userData$ = this.userService.getUserById(this.thread.userId);
    // Lade die Reaktionen
    if (this.thread.id) {
      this.reactions$ = this.reactionService.getReactions('threads', this.thread.id);

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

  toggleReactionsOverlay(): void {
    this.showReactionsOverlay = !this.showReactionsOverlay;
  }

  onEmojiSelected(emojiType: string): void {
    const reaction = new Reaction({
      userId: this.currentUserId,
      type: emojiType,
      timestamp: Date.now()
    });
    this.reactionService.addReaction('threads', this.thread.id!, reaction)
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
    this.reactionService.removeReaction('threads', this.thread.id!, this.currentUserId)
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

  // Beispiel: Wenn du den aktuellen Benutzernamen brauchst:
  get currentUserName(): string {
    // Setze hier den aktuellen Benutzernamen, eventuell aus dem AuthService oder dem userData$
    return 'Frederik Beck'; // Beispiel
  }
}
