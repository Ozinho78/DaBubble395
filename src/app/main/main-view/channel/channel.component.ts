import { Component, OnInit, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactionsComponent } from '../../reactions/reactions.component';
import { ReactionService } from '../../../../services/reaction.service';
import { Reaction } from '../../../../models/reaction.class';
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
import { ShowChannelComponent } from "./show-channel/show-channel.component";

@Component({
    selector: 'app-channel',
    imports: [CommonModule, MessageInputComponent, ReactionsComponent, ProfileViewComponent, ShowChannelComponent],
    templateUrl: './channel.component.html',
    styleUrls: [
        './channel.component.scss',
        '../../thread/message/message.component.scss',
        '../../thread/thread.component.scss'
    ]
})
export class ChannelComponent implements OnInit {
    @ViewChild(MessageInputComponent) messageInput!: MessageInputComponent;
    @ViewChild(ShowChannelComponent) modal!: ShowChannelComponent;
    @Output() editRequest = new EventEmitter<{ id: string, text: string, type: "message" | "thread" }>();

    currentUser: any;
    currentUserId: string | null = null;
    activeReactionThreadId: string | null = null;
    reactionsMap: { [threadId: string]: Reaction[] } = {};
    groupedReactionsMap: { [threadId: string]: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } } } = {};
    showReactionsOverlay: boolean = false;
    showReactionTooltip: boolean = false;
    tooltipEmoji: string = '';
    tooltipText: string = '';
    menuOpen: boolean = false;
    channelId!: string;
    channel!: Channel | null;
    editedChannel!: Channel | null;
    threads: Thread[] = [];
    threadId: any;
    channelMembers: any[] = [];
    isLoading: boolean = true;
    creatorName: string = '';
    creatorSentence: string = '';
    profileViewOpen: boolean = false;
    selectedProfilePresence$: Observable<boolean> = of(false);
    loggedInUserId: string = '';
    selectedProfile: { id: string; name: string; avatar: string; email?: string; } | null = null;

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
        this.initializeUser();
        this.loadUsersFromUserService();
        this.subscribeThreads();
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

    initializeUser() {
        this.currentUserId = this.userService.getCurrentUserId();
        this.loadCurrentName();
    }

    loadCurrentName() {
        if (this.currentUserId) {
            this.userService.loadCurrentUser(this.currentUserId).then(user => {
                this.currentUser = user;
            });
        }
    }

    loadUsersFromUserService() {
        this.userService.loadUsers().then(() => {
            this.subscribeRouteParams();
        });
    }

    subscribeThreads() {
        this.firestoreService.subscribeToCollection<Thread>('threads', (allThreads) => {
            const filtered = allThreads
                .filter(thread => thread.channelId === this.channelId)
                .sort((a, b) => (a.creationDate ?? 0) - (b.creationDate ?? 0));

            this.threads = filtered.map(obj => {
                const thread = new Thread(obj, this.userService, this.messageService);

                if (!this.reactionsMap[thread.docId]) {
                    this.reactionService.getReactions('threads', thread.docId!).subscribe(reactions => {
                        this.reactionsMap[thread.docId!] = reactions;
                        this.groupReactions(thread.docId!, reactions);
                    });
                }

                return thread;
            });
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
            this.threads = rawThreads.map(obj => { return new Thread(obj, this.userService, this.messageService); });

            this.loadAllReactions();

            if (!this.threadId) {
                setTimeout(() => this.scrollToBottom(), 200);
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

    requestEdit(thread: Thread) {
        this.editRequest.emit({
            id: thread.docId,
            text: thread.thread,
            type: 'thread'
        });
    }

    onOverlayClosed() {
        this.showReactionsOverlay = false;
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

    toggleReactionsOverlay(threadId: string): void {
        this.showReactionsOverlay = this.activeReactionThreadId !== threadId;
        this.activeReactionThreadId = this.showReactionsOverlay ? threadId : null;
    }

    closeMenu() {
        this.menuOpen = false;
    }

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

    openModal() {
        this.modal.openModal();
    }

    loadAllReactions() {
        for (const thread of this.threads) {
            this.reactionService.getReactions('threads', thread.docId!).subscribe(reactions => {
                this.reactionsMap[thread.docId!] = reactions;
                this.groupReactions(thread.docId!, reactions);
            });
        }
    }

    groupReactions(threadId: string, reactions: Reaction[]) {
        const groups = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.type]) {
                acc[reaction.type] = { count: 0, likedByMe: false, userNames: [] };
            }
            acc[reaction.type].count++;

            const userName = this.getUserName(reaction.userId);
            if (!acc[reaction.type].userNames.includes(userName)) {
                acc[reaction.type].userNames.push(userName);
            }

            if (reaction.userId === this.currentUserId) {
                acc[reaction.type].likedByMe = true;
            }

            return acc;
        }, {} as { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } });

        this.groupedReactionsMap[threadId] = groups;
    }

    async onEmojiSelected(emojiType: string) {
        if (!this.activeReactionThreadId) return;

        const reaction = new Reaction({ userId: this.currentUserId, type: emojiType, timestamp: Date.now() });

        await this.reactionService.addReaction('threads', this.activeReactionThreadId, reaction);
        this.showReactionsOverlay = false;
        this.activeReactionThreadId = null;
    }

    async removeMyReaction(threadId: string) {
        await this.reactionService.removeReaction('threads', threadId, this.currentUserId!);
    }

    getReactionTypes(grouped: any): string[] {
        return Object.keys(grouped);
    }

    getUserName(userId: string): string {
        const user = this.userService.userArray.find(user => user.docId === userId);
        return user?.name || 'Unbekannt';
    }

    onEmojiSelectedFromList(threadId: string, emojiType: string): void {
        this.activeReactionThreadId = threadId;
        this.onEmojiSelected(emojiType);
    }

    openReactionTooltip(emoji: string, userNames: string[]) {
        this.tooltipEmoji = emoji;
        const names = userNames.map(name => (name === this.currentUser.name ? 'Du' : name));

        if (names.length === 1) {
            this.tooltipText = names[0] === 'Du' ? 'Du hast reagiert' : `${names[0]} hat reagiert`;
        } else if (names.length === 2) {
            this.tooltipText = `${names[0]} und ${names[1]} haben reagiert`;
        } else {
            const allButLast = names.slice(0, -1).join(', ');
            const last = names[names.length - 1];
            this.tooltipText = `${allButLast} und ${last} haben reagiert`;
        }

        this.showReactionTooltip = true;
    }

    closeReactionTooltip() {
        this.showReactionTooltip = false;
    }

}
