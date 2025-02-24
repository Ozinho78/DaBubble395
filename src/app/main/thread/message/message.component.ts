import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Firestore } from '@angular/fire/firestore';
import { ReactionsComponent } from '../../reactions/reactions.component';

import { Message } from '../../../../models/message.class';
import { Reaction } from '../../../../models/reaction.class';

import { UserService } from '../../../../services/user.service';
import { ReactionService } from '../../../../services/reaction.service';

@Component({
  selector: 'app-message',
  imports: [CommonModule, ReactionsComponent],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
  @Input() message!: Message;

  // Eigenschaft für den aktuellen Benutzer
  currentUserId!: string;
  userData$!: Observable<{ name: string, avatar: string }>;
  userCache: Map<string, Observable<{ name: string, avatar: string }>> = new Map();
  reactions$!: Observable<Reaction[]>;
  groupedReactions: { [type: string]: { count: number, likedByMe: boolean } } = {};
  showReactionsOverlay: boolean = false;

  constructor(
    private firestore: Firestore,
    private userService: UserService,
    private reactionService: ReactionService
  ) { }

  ngOnInit(): void {
    // Setze currentUserId – idealerweise über einen AuthService, hier als Beispiel hard-coded
    this.currentUserId = 'qdWWqOADh6O1FkGpHlTr';

    // Lade die Benutzerdaten des Autors der Nachricht
    this.userData$ = this.userService.getUserById(this.message.userId);

    // Lade die Reaktionen der Nachricht aus der Subcollection
    if (this.message.id) {
      this.reactions$ = this.reactionService.getReactions('messages', this.message.id);


      this.reactions$.subscribe(reactions => {
        this.groupedReactions = reactions.reduce((acc, reaction) => {
          if (!acc[reaction.type]) {
            acc[reaction.type] = { count: 0, likedByMe: false };
          }
          acc[reaction.type].count++;
          if (reaction.userId === this.currentUserId) {
            acc[reaction.type].likedByMe = true;
          }
          return acc;
        }, {} as { [type: string]: { count: number, likedByMe: boolean } });
      });
    }
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
}
