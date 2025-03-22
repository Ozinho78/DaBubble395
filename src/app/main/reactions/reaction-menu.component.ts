import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactionsComponent } from './reactions.component';
import { ReactionService } from '../../../services/reaction.service';
import { Reaction } from '../../../models/reaction.class';

@Component({
    selector: 'app-reaction-menu',
    standalone: true,
    imports: [CommonModule, ReactionsComponent],
    templateUrl: './reaction-menu.component.html',
    styleUrls: ['./reaction-menu.component.scss']
})
export class ReactionMenuComponent {
    @Input() docId!: string;
    @Input() userId!: string;
    @Input() currentUserId!: string;
    @Input() text!: string;
    @Input() type: 'message' | 'thread' = 'thread';
    @Input() isHovered: boolean = false;
    @Input() isOwnMessage: boolean = false;

    @Output() editRequest = new EventEmitter<{ id: string, text: string, type: 'message' | 'thread' }>();

    showReactionsOverlay: boolean = false;
    menuOpen: boolean = false;

    constructor(private reactionService: ReactionService) { }

    toggleReactionsOverlay(): void {
        this.showReactionsOverlay = !this.showReactionsOverlay;
    }

    onOverlayClosed(): void {
        this.showReactionsOverlay = false;
    }

    toggleMenu(): void {
        this.menuOpen = !this.menuOpen;
    }

    closeMenu(): void {
        this.menuOpen = false;
    }

    requestEdit(): void {
        console.log('[ReactionMenu] Bearbeiten angefordert:', this.docId, this.text, this.type);

        this.editRequest.emit({
            id: this.docId,
            text: this.text,
            type: this.type
        });
        this.menuOpen = false;
    }

    onEmojiSelected(emojiType: string): void {
        const reaction = new Reaction({
            userId: this.currentUserId,
            type: emojiType,
            timestamp: Date.now()
        });

        this.reactionService.addReaction(this.type === 'message' ? 'messages' : 'threads', this.docId, reaction)
            .then(() => {
                this.showReactionsOverlay = false;
            })
            .catch(err => console.error('Fehler beim Hinzufügen der Reaktion:', err));
    }

}