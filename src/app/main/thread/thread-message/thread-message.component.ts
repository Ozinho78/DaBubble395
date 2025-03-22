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

@Component({
    selector: 'app-thread-message',
    imports: [
        CommonModule,
        ReactionsComponent,
        ProfileViewComponent,
        ReactionDisplayComponent
    ],
    templateUrl: './thread-message.component.html',
    styleUrls: ['../message/message.component.scss'],
})
export class ThreadMessageComponent implements OnInit, OnChanges {
    @ViewChild(MessageInputComponent) messageInput!: MessageInputComponent;
    @Input() thread!: Thread & { id: string };
    @Output() editRequest = new EventEmitter<{ id: string, text: string, type: 'thread' | 'message' }>();

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
                //console.log('Reaction hinzugefügt!');
                this.showReactionsOverlay = false;
            })
            .catch(error => console.error('Fehler beim Hinzufügen der Reaction:', error));
    }

    onOverlayClosed() {
        this.showReactionsOverlay = false;
    }

    get currentUserName(): string {
        return this.currentUser?.name || 'Unbekannter Nutzer';
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

    requestEdit(thread: Thread) {
        this.editRequest.emit({ id: thread.id, text: thread.thread, type: 'thread' });
    }

    editMessage(id: string, text: string) {
        if (this.messageInput) {
            this.messageInput.editMessage(id, text, 'thread');
        } else {
            console.warn('messageInput ist noch nicht geladen.');
        }
    }

    closeMenu() {
        this.menuOpen = false;
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
}
