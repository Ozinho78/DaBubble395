import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

// 14.03.2025
import { ReactionsComponent } from '../../reactions/reactions.component';
import { ReactionService } from '../../../../services/reaction.service';
import { Reaction } from '../../../../models/reaction.class';
//

import { MessageInputComponent } from "../../thread/message-input/message-input.component";
import { Thread } from '../../../../models/thread.class';
import { Channel } from '../../../../models/channel.model';
import { FirestoreService } from '../../../../services/firestore.service';
import { UserService } from '../../../../services/user.service';
import { MessageService } from '../../../../services/message.service';
import { Router } from '@angular/router';

import { Observable, of } from 'rxjs';
import { ProfileViewComponent } from '../../shared/profile-view/profile-view.component';
import { PresenceService } from '../../../../services/presence.service';

@Component({
    selector: 'app-channel',
    imports: [CommonModule, MessageInputComponent, ReactionsComponent, ProfileViewComponent],
    templateUrl: './channel.component.html',
    styleUrls: [
        './channel.component.scss',
        '../../thread/message/message.component.scss',
        '../../thread/thread.component.scss'
    ]
})
export class ChannelComponent implements OnInit {
    @ViewChild(MessageInputComponent) messageInput!: MessageInputComponent;

    // 14.03.2025
    //@Input() thread!: Thread & { id: string };
    @Output() editRequest = new EventEmitter<{ id: string, text: string }>();

    currentUserId: string | null = null;

    showReactionsOverlay: boolean = false;
    menuOpen: boolean = false;
    //

    channelId!: string;
    channel!: Channel | null;
    threads: Thread[] = [];
    threadId: any;
    channelMembers: any[] = [];
    isLoading: boolean = true;

    creatorName: string = '';
    creatorSentence: string = '';

    profileViewOpen: boolean = false;
    selectedProfilePresence$: Observable<boolean> = of(false);
    loggedInUserId: string = '';
    selectedProfile: {
        id: string;
        name: string;
        avatar: string;
        email?: string;
    } | null = null;

    constructor(
        private route: ActivatedRoute,
        private firestoreService: FirestoreService,
        private userService: UserService,
        private messageService: MessageService,
        private router: Router,
        private reactionService: ReactionService,
        public presenceService: PresenceService
    ) { }

    ngOnInit() {
        //this.subscribeRouteParams();
        this.loadUsersFromUserService();
    }

    subscribeRouteParams() {
        this.route.queryParamMap.subscribe(params => {
            this.channelId = params.get('channel') || '';
            this.threadId = params.get('thread') || null;

            if (this.channelId) {
                this.loadChannel();
                this.loadThreads();

                if (!this.threadId) {
                    this.focusMessageInput();
                    setTimeout(() => { this.scrollToBottom(); }, 200);
                }
            }
        });
    }

    loadUsersFromUserService() {
        this.userService.loadUsers().then(() => {
            this.subscribeRouteParams();
        });
    }

    async loadChannel() {
        try {
            const channels = await this.firestoreService.getDataByDocId<Channel>('channels', this.channelId);
            this.channel = channels.length > 0 ? channels[0] : null;

            if (this.channel) {
                await this.loadMemberDetails();
                this.setCreatorName();
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden des Channels:', error);
        }
    }

    /**
     * Lädt die vollständigen Benutzerdaten für alle Mitglieder des Channels
     */
    async loadMemberDetails() {
        if (!this.channel) return;

        try {
            if (this.userService.userArray.length === 0) {
                await this.userService.loadUsers();
            }

            this.channelMembers = this.userService.userArray
                .filter(user => this.channel!.member.includes(user.docId!))
                .map(user => ({
                    id: user.docId,
                    name: user.name,
                    avatar: user.avatar,
                    email: user.email
                }));

        } catch (error) {
            console.error('❌ Fehler beim Laden der Mitglieder:', error);
        }
    }

    async setCreatorName() {
        if (!this.channel) return;

        const currentUserId = this.userService.getCurrentUserId();
        const creatorId = this.channel.userId;

        if (currentUserId === creatorId) {
            this.creatorName = 'Du';
            this.creatorSentence = 'Du hast';
        } else {
            const creator = this.userService.userArray.find(user => user.docId === creatorId);
            this.creatorName = creator ? creator.name : 'Unbekannter Nutzer';
            this.creatorSentence = `${this.creatorName} hat`;
        }
    }

    async loadThreads() {
        this.isLoading = true;

        try {
            const rawThreads = await this.firestoreService.getThreadsSorted(this.channelId);
            this.threads = rawThreads.map(obj => {
                return new Thread(obj, this.userService, this.messageService);
            });

            if (!this.threadId) {
                setTimeout(() => this.scrollToBottom(), 200); // ✅ Nur scrollen, wenn kein Thread offen ist
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Threads:', error);
        } finally {
            this.isLoading = false;
        }
    }

    getFormattedDate(timestamp: number | null | undefined): string {
        if (timestamp === undefined || timestamp === null) return '';
        return new Date(timestamp).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    openThread(threadId: string) {
        if (!threadId) {
            console.error('❌ Fehler: threadId ist undefined oder leer!');
            return;
        }

        this.router.navigate([], {
            queryParams: { channel: this.channelId, thread: threadId },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

    // 14.03.2025

    /*
    onEmojiSelected(emojiType: string): void {
        const reaction = new Reaction({
            userId: this.currentUserId,
            type: emojiType,
            timestamp: Date.now()
        });
        this.reactionService.addReaction('threads', this.thread.id!, reaction)
            .then(() => {
                console.log('Reaction hinzugefügt!');
                this.showReactionsOverlay = false;
            })
            .catch(error => console.error('Fehler beim Hinzufügen der Reaction:', error));
    }*/

    onOverlayClosed() {
        this.showReactionsOverlay = false;
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

    toggleReactionsOverlay(): void {
        this.showReactionsOverlay = !this.showReactionsOverlay;
    }

    /*
    requestEdit() {
        this.editRequest.emit({ id: this.thread.id!, text: this.thread.thread });
    }*/

    closeMenu() {
        this.menuOpen = false;
    }

    //

    focusMessageInput() {
        setTimeout(() => {
            if (this.messageInput && this.messageInput.focusInput) {
                this.messageInput.focusInput();
            }
        }, 100);
    }

    scrollToBottom() {
        setTimeout(() => {
            const channelChatContainer = document.querySelector('.channel-chat-container');
            const chatContainer = document.getElementById('chat-container');

            if (channelChatContainer && !this.threadId) {
                channelChatContainer.scrollTo({
                    top: channelChatContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }

            if (chatContainer && this.threadId) {
                chatContainer.scrollTo({
                    top: chatContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
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
