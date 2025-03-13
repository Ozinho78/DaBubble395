import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MessageInputComponent } from "../../thread/message-input/message-input.component";
import { Thread } from '../../../../models/thread.class';
import { Channel } from '../../../../models/channel.model';
import { FirestoreService } from '../../../../services/firestore.service';
import { UserService } from '../../../../services/user.service';
import { MessageService } from '../../../../services/message.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-channel',
    imports: [CommonModule, MessageInputComponent],
    templateUrl: './channel.component.html',
    styleUrl: './channel.component.scss'
})
export class ChannelComponent implements OnInit {
    channelId!: string;
    channel!: Channel | null;
    threads: Thread[] = [];
    channelMembers: any[] = [];
    isLoading: boolean = true;

    creatorName: string = '';
    creatorSentence: string = '';

    constructor(
        private route: ActivatedRoute,
        private firestoreService: FirestoreService,
        private userService: UserService,
        private messageService: MessageService,
        private router: Router
    ) { }

    ngOnInit() {
        this.subscribeRouteParams();
        this.loadUsersFromUserService();
    }

    subscribeRouteParams() {
        this.route.queryParamMap.subscribe(params => {
            this.channelId = params.get('channel') || '';

            if (this.channelId) {
                this.loadChannel();
                this.loadThreads();
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
            const rawThreads = await this.firestoreService.getDataByField<Thread>('threads', 'channelId', this.channelId);
            this.threads = rawThreads.map(obj => new Thread(obj, this.userService, this.messageService));
        } catch (error) {
            console.error('❌ Fehler beim Laden der Threads:', error);
        } finally {
            this.isLoading = false;
        }
    }

    openThread(threadId: string) {
        this.router.navigate([], {
            queryParams: { channel: this.channelId, thread: threadId },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

}
