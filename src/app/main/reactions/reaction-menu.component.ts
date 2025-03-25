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
    @Input() type: 'message' | 'thread' | 'chat' = 'thread';
    @Input() isHovered: boolean = false;
    @Input() isOwnMessage: boolean = false;
    @Input() isEditing: boolean = false;

    @Output() editRequest = new EventEmitter<{ id: string, text: string, type: 'message' | 'thread' | 'chat' }>();

    showReactionsOverlay: boolean = false;
    menuOpen: boolean = false;
    hoverTimeout: any;
    isAnimatingOut: boolean = false;
    isFadingIn: boolean = false;

    constructor(
        private reactionService: ReactionService,
        //private renderer: Renderer2,
        //private elRef: ElementRef
    ) { }

    /*ngAfterViewInit(): void {
        const replyContainer = this.elRef.nativeElement.closest('.reply-container');

        if (replyContainer) {
            this.renderer.listen(replyContainer, 'mouseleave', () => {
                this.hoverTimeout = setTimeout(() => {
                    this.closeMenu();
                }, 200);
            });

            this.renderer.listen(replyContainer, 'mouseenter', () => {
                if (this.hoverTimeout) {
                    clearTimeout(this.hoverTimeout);
                    this.hoverTimeout = null;
                }
            });
        }
    }*/

    /*
    ngOnDestroy(): void {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }
    }*/

    toggleReactionsOverlay(): void {
        this.showReactionsOverlay = !this.showReactionsOverlay;
    }

    onOverlayClosed(): void {
        this.showReactionsOverlay = false;
    }

    toggleMenu(): void {
        if (this.menuOpen) {
            this.closeMenu();
        } else {
            this.menuOpen = true;
            this.isAnimatingOut = false;

            setTimeout(() => {
                this.isFadingIn = true;
            }, 10);
        }
    }

    closeMenu(): void {
        if (!this.menuOpen) return;

        this.isAnimatingOut = true;
        this.isFadingIn = false;

        setTimeout(() => {
            this.menuOpen = false;
            this.isAnimatingOut = false;
        }, 200);
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

        this.reactionService
            .addReaction(
                this.type === 'thread' ? 'threads' :
                    this.type === 'message' ? 'messages' :
                        'chats',
                this.docId,
                reaction
            )
            .then(() => {
                this.showReactionsOverlay = false;
            })
            .catch(err => console.error('Fehler beim Hinzufügen der Reaktion:', err));
    }

}