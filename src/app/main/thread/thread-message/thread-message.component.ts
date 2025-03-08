import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Thread } from '../../../../models/thread.class';
import { UserService } from '../../../../services/user.service';
//import { Reaction } from '../../../../models/reaction.class';
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

  showReactionsOverlay$!: Observable<boolean>;
  showReactionTooltip$!: Observable<boolean>;
  tooltipEmoji$!: Observable<string>;
  tooltipText$!: Observable<string>;

  constructor(
    private userService: UserService,
    public reactionService: ReactionService
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.userService.getCurrentUserId();
    this.loadCurrentName();
    this.userData$ = this.userService.getUserById(this.thread.userId);
    this.loadReactions();

    this.showReactionsOverlay$ = this.reactionService.showReactionsOverlay$;
    this.showReactionTooltip$ = this.reactionService.showReactionTooltip$;
    this.tooltipEmoji$ = this.reactionService.tooltipEmoji$;
    this.tooltipText$ = this.reactionService.tooltipText$;
  }

  loadReactions() {
    if (this.thread?.id && this.currentUserId) {
      this.reactions$ = this.reactionService.loadReactions('threads', this.thread.id, this.currentUserId);
      this.reactions$.subscribe(groups => this.groupedReactions = groups);
    }
  }

  toggleReactionsOverlay(): void {
    this.showReactionsOverlay = !this.showReactionsOverlay;
  }

  onEmojiSelected(emojiType: string): void {
    if (this.currentUserId) {
      this.reactionService.addEmojiReaction('threads', this.thread.id, this.currentUserId, emojiType);
    }
  }

  removeMyReaction(): void {
    if (this.currentUserId) {
      this.reactionService.removeUserReaction('threads', this.thread.id, this.currentUserId);
    }
  }

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
}