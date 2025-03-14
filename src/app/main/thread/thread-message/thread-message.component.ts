import { Component, Input, OnInit, EventEmitter, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactionsComponent } from '../../reactions/reactions.component';
import { ReactionService } from '../../../../services/reaction.service';
import { Reaction } from '../../../../models/reaction.class';
import { Thread } from '../../../../models/thread.class';
import { UserService } from '../../../../services/user.service';


@Component({
  selector: 'app-thread-message',
  imports: [CommonModule, ReactionsComponent],
  templateUrl: './thread-message.component.html',
  styleUrls: ['../message/message.component.scss'],
})
export class ThreadMessageComponent implements OnInit, OnChanges {
  @Input() thread!: Thread & { id: string };
  @Output() editRequest = new EventEmitter<{ id: string, text: string }>();

  currentUserId: string | null = null;
  currentUser: any;
  userData$!: Observable<{ name: string, avatar: string }>;
  userNamesCache: { [userId: string]: string } = {};
  reactions$!: Observable<Reaction[]>;
  groupedReactions: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } } = {};
  showReactionsOverlay: boolean = false;
  showReactionTooltip: boolean = false;
  tooltipEmoji: string = '';
  tooltipText: string = '';
  menuOpen: boolean = false;

  constructor(
    private userService: UserService,
    private reactionService: ReactionService
  ) { }

  ngOnInit() {
    this.initializeUser();
    this.subscribeToThreadChanges();
    this.loadReactions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['thread'] && changes['thread'].currentValue) {
      this.loadUserData();
      this.loadReactions();
    }
  }

  loadUserData() {
    if (this.thread?.userId) {
      this.userData$ = this.userService.getUserById(this.thread.userId);
    }
  }

  initializeUser() {
    this.currentUserId = this.userService.getCurrentUserId();
    this.loadCurrentName();
  }

  subscribeToThreadChanges() {
    if (!this.thread) return;
    this.userData$ = this.userService.getUserById(this.thread.userId);
  }

  loadCurrentName() {
    if (this.currentUserId) {
      this.userService.loadCurrentUser(this.currentUserId).then(user => {
        this.currentUser = user;
      });
    }
  }

  loadReactions() {
    if (!this.thread?.id) return;

    this.reactions$ = this.reactionService.getReactions('threads', this.thread.id);
    this.reactions$.subscribe(reactions => this.groupReactions(reactions));
  }

  groupReactions(reactions: Reaction[]) {
    const groups = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.type]) {
        acc[reaction.type] = { count: 0, likedByMe: false, userNames: [] };
      }
      acc[reaction.type].count++;

      this.processReactionUser(acc, reaction);
      if (reaction.userId === this.currentUserId) {
        acc[reaction.type].likedByMe = true;
      }
      return acc;
    }, {} as { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } });

    this.groupedReactions = groups;
  }

  processReactionUser(
    acc: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } },
    reaction: Reaction
  ) {
    if (!this.userNamesCache[reaction.userId]) {
      this.userService.getUserById(reaction.userId).subscribe(userData => {
        this.userNamesCache[reaction.userId] = userData.name;
        if (!acc[reaction.type].userNames.includes(userData.name)) {
          acc[reaction.type].userNames.push(userData.name);
        }
      });
    } else {
      const name = this.userNamesCache[reaction.userId];
      if (!acc[reaction.type].userNames.includes(name)) {
        acc[reaction.type].userNames.push(name);
      }
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

  onOverlayClosed() {
    this.showReactionsOverlay = false;
  }

  removeMyReaction() {
    this.reactionService.removeReaction('threads', this.thread.id!, this.currentUserId!)
      .then(() => {
        console.log('Reaction entfernt!');
        this.showReactionsOverlay = false;
      })
      .catch(error => console.error('Fehler beim Entfernen der Reaction:', error));
  }

  openReactionTooltip(emoji: string, userNames: string[]) {
    this.tooltipEmoji = emoji;
    const names = userNames.map(name => (name === this.currentUserName ? 'Du' : name));

    if (names.length === 1) {
      this.tooltipText = names[0] === 'Du' ? 'Du hast reagiert' : `${names[0]} hat reagiert`;
    } else if (names.length === 2) {
      this.tooltipText = `${names[0]} und ${names[1]} haben reagiert`;
    } else {
      const allButLast = names.slice(0, -1).join(', ');
      const last = names[names.length - 1];
      this.tooltipText = `${allButLast} und ${last} haben reagiert`;
    }

    this.showReactionTooltip = true;
  }

  closeReactionTooltip() {
    this.showReactionTooltip = false;
  }

  get currentUserName(): string {
    return this.currentUser?.name || 'Unbekannter Nutzer';
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  requestEdit() {
    this.editRequest.emit({ id: this.thread.id!, text: this.thread.thread });
  }

  closeMenu() {
    this.menuOpen = false;
  }

}
