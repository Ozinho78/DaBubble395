// message.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Firestore, addDoc, collection, collectionData, updateDoc, doc, arrayUnion } from '@angular/fire/firestore';

import { Thread } from '../../../../models/thread.class';
import { Message } from '../../../../models/message.class';

import { ThreadService } from '../../../../services/thread.service';
import { UserService } from '../../../../services/user.service';

@Component({
  selector: 'app-message',
  imports: [CommonModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
  @Input() message!: Message;
  @Output() reactionAdded = new EventEmitter<{ messageId: string, reaction: string }>();

  // Eigenschaft für den aktuellen Benutzer
  currentUserId!: string;
  userData$!: Observable<{ name: string, avatar: string }>;
  userCache: Map<string, Observable<{ name: string, avatar: string }>> = new Map();

  constructor(
    private firestore: Firestore,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    // Setze currentUserId – idealerweise über einen AuthService, hier als Beispiel hard-coded
    this.currentUserId = 'qdWWqOADh6O1FkGpHlTr';

    // Lade die Benutzerdaten des Autors der Nachricht
    this.userData$ = this.userService.getUserById(this.message.userId);
  }

  getUserData(userId: string): Observable<{ name: string, avatar: string }> {
    if (!this.userCache.has(userId)) {
      const userData$ = this.userService.getUserById(userId);
      this.userCache.set(userId, userData$);
    }
    return this.userCache.get(userId)!;
  }

  onAddReaction(reaction: string): void {
    this.reactionAdded.emit({ messageId: this.message.id!, reaction });
  }

  // Methode zum Hinzufügen einer Reaction
  addReaction(messageId: string, reaction: string) {
    debugger;
    const messageDocRef = doc(this.firestore, `messages/${messageId}`);
    updateDoc(messageDocRef, {
      reactions: arrayUnion(reaction)
    })
      .then(() => console.log('Reaction hinzugefügt!'))
      .catch(error => console.error('Fehler beim Hinzufügen der Reaction:', error));
  }

  // Neue Methode zum Behandeln der Reaktionen aus der Message-Komponente
  handleReactionAdded(event: { messageId: string, reaction: string }): void {
    const messageDocRef = doc(this.firestore, `messages/${event.messageId}`);
    updateDoc(messageDocRef, {
      reactions: arrayUnion(event.reaction)
    })
      .then(() => console.log('Reaction hinzugefügt!'))
      .catch(error => console.error('Fehler beim Hinzufügen der Reaction:', error));
  }
}
