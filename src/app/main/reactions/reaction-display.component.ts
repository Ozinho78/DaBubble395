import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { ReactionService } from '../../../services/reaction.service';
import { UserService } from '../../../services/user.service';

import { Reaction } from '../../../models/reaction.class';
import { User } from '../../../models/user.model';

@Component({
    selector: 'app-reaction-display',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './reaction-display.component.html',
    styleUrls: ['./reaction-display.component.scss']
})
export class ReactionDisplayComponent implements OnInit, OnChanges, OnDestroy {
    @Input() threadId!: string;
    @Input() currentUserId!: string;

    currentUserName: string = '';
    userArray: User[] = [];

    reactions: Reaction[] = [];
    groupedReactions: {
        [type: string]: { count: number; likedByMe: boolean; userNames: string[] };
    } = {};
    isReady = false;

    tooltipVisibleEmoji: string | null = null;
    tooltipTextMap: { [emoji: string]: string } = {};

    private reactionsSub?: Subscription;

    constructor(
        private reactionService: ReactionService,
        private userService: UserService
    ) { }

    async ngOnInit() {
        await this.loadUsers();
        await this.loadCurrentUser();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['threadId'] && changes['threadId'].currentValue !== changes['threadId'].previousValue) {
            this.loadReactions();
        }
    }

    ngOnDestroy() {
        this.reactionsSub?.unsubscribe();
    }

    async loadUsers() {
        if (this.userService.userArray.length === 0) {
            await this.userService.loadUsers();
        }
        this.userArray = this.userService.userArray;
    }

    async loadCurrentUser() {
        if (!this.currentUserId) return;
        const user = await this.userService.loadCurrentUser(this.currentUserId);
        this.currentUserName = user?.name || '';
    }

    async loadReactions() {
        this.reactionsSub?.unsubscribe(); // altes Abo schließen

        if (!this.threadId) {
            return;
        }

        this.reactionsSub = this.reactionService.getReactions('threads', this.threadId).subscribe(reactions => {
            this.reactions = reactions;
            this.groupReactions();
            this.isReady = true;
        }, error => {
            console.error('[ReactionDisplay] Fehler beim Laden der Reaktionen:', error);
        });
    }

    async groupReactions() {
        const groups: any = {};

        for (const reaction of this.reactions) {
            if (!groups[reaction.type]) {
                groups[reaction.type] = {
                    count: 0,
                    likedByMe: false,
                    userNames: [],
                };
            }

            const userName = this.getUserName(reaction.userId);
            if (!groups[reaction.type].userNames.includes(userName)) {
                groups[reaction.type].userNames.push(userName);
            }

            groups[reaction.type].count++;

            if (reaction.userId === this.currentUserId) {
                groups[reaction.type].likedByMe = true;
            }
        }

        this.groupedReactions = groups;
    }

    getUserName(userId: string): string {
        const user = this.userArray.find(u => u.docId === userId);
        return user?.name || 'Unbekannt';
    }

    openTooltip(emoji: string, userNames: string[]) {
        this.tooltipVisibleEmoji = emoji;

        const names = userNames.map(name => {
            const mapped = name === this.currentUserName ? 'Du' : name;
            return mapped;
        });

        let tooltip = '';
        if (names.length === 1) {
            tooltip = names[0] === 'Du' ? 'Du hast reagiert' : `${names[0]} hat reagiert`;
        } else if (names.length === 2) {
            tooltip = `${names[0]} und ${names[1]} haben reagiert`;
        } else {
            const allButLast = names.slice(0, -1).join(', ');
            const last = names[names.length - 1];
            tooltip = `${allButLast} und ${last} haben reagiert`;
        }

        this.tooltipTextMap[emoji] = tooltip;
    }

    closeTooltip() {
        this.tooltipVisibleEmoji = null;
    }

    handleReactionClick(type: string, likedByMe: boolean) {
        this.closeTooltip();
        if (likedByMe) {
            this.reactionService.removeReaction('threads', this.threadId, this.currentUserId).then(() => {
                this.loadReactions();
            });
        } else {
            const reaction = new Reaction({
                userId: this.currentUserId,
                type,
                timestamp: Date.now()
            });
            this.reactionService.addReaction('threads', this.threadId, reaction).then(() => {
                this.loadReactions();
            });
        }
    }
}
