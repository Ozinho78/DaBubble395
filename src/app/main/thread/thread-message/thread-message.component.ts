import { Component, Input, OnInit, EventEmitter, Output, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactionsComponent } from '../../reactions/reactions.component';
import { ReactionService } from '../../../../services/reaction.service';
import { Reaction } from '../../../../models/reaction.class';
import { Thread } from '../../../../models/thread.class';
import { UserService } from '../../../../services/user.service';
import { ProfileViewComponent } from '../../shared/profile-view/profile-view.component';
import { PresenceService } from '../../../../services/presence.service';
import { MessageInputComponent } from '../message-input/message-input.component';
import { ReactionDisplayComponent } from '../../reactions/reaction-display.component';
import { ReactionMenuComponent } from "../../reactions/reaction-menu.component";

@Component({
    selector: 'app-thread-message',
    imports: [
        CommonModule,
        ReactionsComponent,
        ProfileViewComponent,
        ReactionDisplayComponent,
        ReactionMenuComponent
    ],
    templateUrl: './thread-message.component.html',
    styleUrls: ['../message/message.component.scss'],
})
export class ThreadMessageComponent implements OnInit, OnChanges {
    @ViewChild(MessageInputComponent) messageInput!: MessageInputComponent;
    @Input() thread!: Thread & { id: string };
    @Input() editingTarget: { id: string, text: string, type: 'message' | 'thread' | 'chat' } | null = null;
    @Output() editRequest = new EventEmitter<{ id: string, text: string, type: 'thread' | 'message' | 'chat' }>();

    currentUserId: string | null = null;
    currentUser: any;
    userData$!: Observable<{ name: string, avatar: string }>;
    userNamesCache: { [userId: string]: string } = {};
    showReactionsOverlay: boolean = false;
    menuOpen: boolean = false;

    selectedProfile: {
        id: string;
        name: string;
        avatar: string;
        email?: string;
    } | null = null;
    chatId: string = '';
    profileViewOpen: boolean = false;
    selectedProfilePresence$: Observable<boolean> = of(false);

    hoveredThreadId: string | null = null;

    constructor(
        public userService: UserService,
        private reactionService: ReactionService,
        public presenceService: PresenceService
    ) { }

    ngOnInit() {
        this.initializeUser();
        this.subscribeToThreadChanges();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['thread'] && changes['thread'].currentValue) {
            this.loadUserData();
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
                //console.log('Reaction hinzugefügt!');
                this.showReactionsOverlay = false;
            })
            .catch(error => console.error('Fehler beim Hinzufügen der Reaction:', error));
    }

    onOverlayClosed() {
        this.showReactionsOverlay = false;
    }

    showProfile(userId: string | undefined): void {
        if (!userId) return;

        this.userService.getUserById(userId).subscribe((userData) => {
            if (userData) {
                this.selectedProfile = {
                    ...userData,
                    id: this.selectedProfile?.id ?? userId,
                };
                this.selectedProfilePresence$ =
                    this.presenceService.getUserPresence(userId);
                this.profileViewOpen = true;
            } else {
                console.error('Fehler: User-Daten nicht gefunden.');
            }
        });
    }

    closeProfile(): void {
        this.profileViewOpen = false;
        this.selectedProfile = null;
    }

    handleEditRequest(event: { id: string, text: string, type: 'message' | 'thread' | 'chat' }) {
        this.editRequest.emit(event);
    }

    clearEditState() {
        this.editingTarget = null;
    }
}
