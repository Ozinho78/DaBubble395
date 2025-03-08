import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactionService } from '../../../../services/reaction.service';
import { UserService } from '../../../../services/user.service';
import { Thread } from '../../../../models/thread.class';
import { ReactionsComponent } from '../../reactions/reactions.component';

@Component({
  selector: 'app-thread-message',
  standalone: true,
  imports: [CommonModule, ReactionsComponent],
  templateUrl: './thread-message.component.html',
  styleUrls: ['../message/message.component.scss'],
})
export class ThreadMessageComponent implements OnInit {
  @Input() thread!: Thread & { id: string };

  currentUserId: string | null = null;
  userData$!: Observable<{ name: string, avatar: string }>;
  userName: string = '';

  reactions$!: Observable<any>;
  groupedReactions!: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } };

  showReactionsOverlay$!: Observable<boolean>;
  showReactionTooltip$!: Observable<boolean>;
  tooltipEmoji$!: Observable<string>;
  tooltipText$!: Observable<string>;

  constructor(
    public reactionService: ReactionService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.userService.getCurrentUserId();
    this.userData$ = this.userService.getUserById(this.thread.userId);

    this.userData$.subscribe(data => {
      if (data?.name) {
        this.userName = data.name;
      }
    });

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
}
