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
  @Input() thread!: Thread & { id: string }; // Thread muss jetzt auch eine ID besitzen

  currentUserId!: string;
  userData$!: Observable<{ name: string, avatar: string }>;
  userCache: Map<string, Observable<{ name: string, avatar: string }>> = new Map();
  reactions$!: Observable<Reaction[]>;
  groupedReactions: { [type: string]: number } = {};
  showReactionsOverlay: boolean = false;

  constructor(
    private userService: UserService,
    private firestore: Firestore,
    private reactionService: ReactionService
  ) { }

  ngOnInit(): void {
    this.currentUserId = 'qdWWqOADh6O1FkGpHlTr';

    // Lade die Benutzerdaten des Autors der Nachricht
    this.userData$ = this.userService.getUserById(this.thread.userId);

    // Lade die Reaktionen der Nachricht aus der Subcollection
    if (this.thread.id) {
      this.reactions$ = this.reactionService.getReactions('threads', this.thread.id);
      this.reactions$.subscribe(reactions => {
        this.groupedReactions = reactions.reduce((acc, reaction) => {
          acc[reaction.type] = (acc[reaction.type] || 0) + 1;
          return acc;
        }, {} as { [type: string]: number });
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
}
