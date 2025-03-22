import { Component, Input, OnInit, EventEmitter, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactionsComponent } from '../../reactions/reactions.component';
import { ReactionService } from '../../../../services/reaction.service';
import { Reaction } from '../../../../models/reaction.class';
import { Message } from '../../../../models/message.class';
import { UserService } from '../../../../services/user.service';
import { ProfileViewComponent } from '../../shared/profile-view/profile-view.component';
import { PresenceService } from '../../../../services/presence.service';
import { ReactionDisplayComponent } from "../../reactions/reaction-display.component";
import { ReactionMenuComponent } from "../../reactions/reaction-menu.component";

@Component({
    selector: 'app-message',
    imports: [
        CommonModule,
        ReactionsComponent,
        ProfileViewComponent,
        ReactionDisplayComponent,
        ReactionMenuComponent
    ],
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit, OnChanges {
    @Input() message!: Message;
    @Output() editRequest = new EventEmitter<{ id: string, text: string, type: 'thread' | 'message' }>();

    currentUserId: string | null = null;
    currentUser: any;
    userData$!: Observable<{ name: string, avatar: string }>;
    userNamesCache: { [userId: string]: string } = {};
    showReactionsOverlay: boolean = false;

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
        private userService: UserService,
        private reactionService: ReactionService,
        public presenceService: PresenceService
    ) { }

    ngOnInit() {
        this.initializeUser();
        this.subscribeToThreadChanges();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['message'] && changes['message'].currentValue) {
            this.loadUserData();
        }
    }

    loadUserData() {
        if (this.message?.userId) {
            this.userData$ = this.userService.getUserById(this.message.userId);
        }
    }

    initializeUser() {
        this.currentUserId = this.userService.getCurrentUserId();
        this.loadCurrentName();
    }

    subscribeToThreadChanges() {
        if (!this.message) return;
        this.userData$ = this.userService.getUserById(this.message.userId);
    }

    loadCurrentName() {
        if (this.currentUserId) {
            this.userService.loadCurrentUser(this.currentUserId).then(user => {
                this.currentUser = user;
            });
        }
    }

    toggleReactionsOverlay() {
        this.showReactionsOverlay = !this.showReactionsOverlay;
    }

    onEmojiSelected(emojiType: string) {
        const reaction = new Reaction({
            userId: this.currentUserId,
            type: emojiType,
            timestamp: Date.now()
        });
        this.reactionService.addReaction('messages', this.message.id!, reaction)
            .then(() => {
                console.log('Reaction hinzugefügt!');
                this.showReactionsOverlay = false;
            })
            .catch(error => console.error('Fehler beim Hinzufügen der Reaction:', error));
    }

    onOverlayClosed() {
        this.showReactionsOverlay = false;
    }

    showProfile(userId: string | undefined) {
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

    closeProfile() {
        this.profileViewOpen = false;
        this.selectedProfile = null;
    }

    handleEditRequest(event: { id: string, text: string, type: 'message' | 'thread' }) {
        this.editRequest.emit(event);
    }
}