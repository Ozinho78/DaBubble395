import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { ReactionService } from '../../../services/reaction.service';
import { UserService } from '../../../services/user.service';

import { Reaction } from '../../../models/reaction.class';
import { User } from '../../../models/user.model';
import { ReactionsComponent } from "./reactions.component";

@Component({
    selector: 'app-reaction-display',
    standalone: true,
    imports: [CommonModule, ReactionsComponent],
    templateUrl: './reaction-display.component.html',
    styleUrls: ['./reaction-display.component.scss']
})
export class ReactionDisplayComponent implements OnInit, OnChanges, OnDestroy {
    @Input() threadId!: string;
    @Input() currentUserId!: string;
    @Input() collectionName: 'threads' | 'messages' | 'chats' = 'threads';
    @Input() type: 'message' | 'thread' | 'chat' = 'thread';
    @Input() parentId?: string;

    currentUserName: string = '';
    userArray: User[] = [];

    reactions: Reaction[] = [];
    groupedReactions: { [type: string]: { count: number; likedByMe: boolean; userNames: string[] }; } = {};
    isReady = false;
    showReactionsOverlay = false;

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

        if (!this.threadId) return;

        this.reactionsSub = this.reactionService
            .getReactions(this.collectionName, this.threadId, this.parentId) // 👈 parentId wird mitgegeben
            .subscribe(
                reactions => {
                    this.reactions = reactions;
                    this.groupReactions();
                    this.isReady = true;
                },
                error => {
                    console.error('[ReactionDisplay] Fehler beim Laden der Reaktionen:', error);
                }
            );
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

    getUserName(userId: string) {
        const user = this.userArray.find(u => u.docId === userId);
        return user?.name || 'Unbekannt';
    }

    openTooltip(emoji: string, userNames: string[]) {
        this.tooltipVisibleEmoji = emoji;

        const names = userNames.map(name =>
            name === this.currentUserName ? 'Du' : name
        );

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

        setTimeout(() => this.adjustTooltipPosition(emoji), 0);
    }

    closeTooltip() {
        this.tooltipVisibleEmoji = null;
    }

    handleReactionClick(type: string, likedByMe: boolean) {
        this.closeTooltip();

        const collection = this.collectionName;
        const docId = this.threadId;
        const userId = this.currentUserId;
        const parent = this.parentId;

        if (likedByMe) {
            this.reactionService
                .removeReaction(collection, docId, userId, type, parent)
                .then(() => this.loadReactions());
        } else {
            const reaction = new Reaction({
                userId: userId,
                type: type,
                timestamp: Date.now()
            });

            this.reactionService
                .addReaction(collection, docId, reaction, parent)
                .then(() => this.loadReactions());
        }
    }

    hasReactions() {
        return Object.keys(this.groupedReactions).length > 0;
    }

    toggleReactionsOverlay() {
        this.showReactionsOverlay = !this.showReactionsOverlay;
    }

    onOverlayClosed() {
        this.showReactionsOverlay = false;
    }

    async onEmojiSelected(emojiType: string) {
        const reaction = new Reaction({
            userId: this.currentUserId,
            type: emojiType,
            timestamp: Date.now()
        });

        await this.reactionService.addReaction(this.collectionName, this.threadId, reaction);

        this.showReactionsOverlay = false;

        this.loadReactions();
    }

    adjustTooltipPosition(emoji: string) {
        setTimeout(() => {
            const tooltip = document.querySelector(`.reaction-tooltip[data-emoji="${emoji}"]`) as HTMLElement;
            const container = tooltip?.closest('.reply-container') as HTMLElement;

            if (!tooltip || !container) return;

            // Reset Klassen
            tooltip.classList.remove('tooltip-left', 'tooltip-right');

            const tooltipRect = tooltip.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const spaceRight = containerRect.right - tooltipRect.right;
            const spaceLeft = tooltipRect.left - containerRect.left;

            if (spaceRight < 0 && spaceLeft > spaceRight) {
                tooltip.classList.add('tooltip-left');
            } else {
                tooltip.classList.add('tooltip-right');
            }
        }, 0); // warten bis DOM gerendert
    }


}
