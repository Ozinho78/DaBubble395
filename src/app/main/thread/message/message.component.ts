import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactionsComponent } from '../../reactions/reactions.component';
import { Message } from '../../../../models/message.class';
import { UserService } from '../../../../services/user.service';
import { ReactionService } from '../../../../services/reaction.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, ReactionsComponent],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
  @Input() message!: Message;
  @Output() editRequest = new EventEmitter<{ id: string, text: string }>();

  currentUserId: string | null = null;
  userData$!: Observable<{ name: string, avatar: string }>;
  userName: string = '';

  reactions$!: Observable<any>;
  groupedReactions!: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } };

  showReactionsOverlay$!: Observable<boolean>;
  showReactionTooltip$!: Observable<boolean>;
  tooltipEmoji$!: Observable<string>;
  tooltipText$!: Observable<string>;

  menuOpen: boolean = false;

  constructor(
    public reactionService: ReactionService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.userService.getCurrentUserId();
    this.userData$ = this.userService.getUserById(this.message.userId);

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
    if (this.message?.id && this.currentUserId) {
      this.reactions$ = this.reactionService.loadReactions('messages', this.message.id, this.currentUserId);
      this.reactions$.subscribe(groups => this.groupedReactions = groups);
    }
  }

  onEmojiSelected(emojiType: string): void {
    if (this.currentUserId && this.message.id) {
      this.reactionService.addEmojiReaction('messages', this.message.id, this.currentUserId, emojiType);
    } else {
      console.error('Fehler: message.id oder currentUserId ist undefined.');
    }
  }

  removeMyReaction(): void {
    if (this.currentUserId && this.message.id) {
      this.reactionService.removeUserReaction('messages', this.message.id, this.currentUserId);
    } else {
      console.error('Fehler: message.id oder currentUserId ist undefined.');
    }
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
