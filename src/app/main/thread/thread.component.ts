import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ThreadService } from '../../../services/thread.service';
import { Message } from '../../../models/message.class';
import { Thread } from '../../../models/thread.class';
import { Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageComponent } from "./message/message.component";
import { ThreadMessageComponent } from "./thread-message/thread-message.component";
import { MessageInputComponent } from "./message-input/message-input.component";
import { map } from 'rxjs/operators';
import { VisibleService } from '../../../services/visible.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-thread',
    imports: [CommonModule, FormsModule, MessageComponent, ThreadMessageComponent, MessageInputComponent],
    templateUrl: './thread.component.html',
    styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit {
    @Input() editingTarget: { id: string, text: string, type: 'message' | 'thread' } | null = null;
    @ViewChild('messageInput') messageInput!: MessageInputComponent;

    channelId!: string;
    threadId!: string;

    groupedMessages$!: Observable<{ date: string, messages: Message[] }[]>;
    totalMessagesCount$!: Observable<number>;
    channelName$!: Observable<string>;
    thread: Thread | null = null;
    newMessageText: string = '';
    threadVisibility!: boolean;
    private subscription!: Subscription;

    constructor(
        private threadService: ThreadService,
        private visibleService: VisibleService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        this.subscribeRouteParams();
        this.subscribeThreadVisibility();
        this.loadThreadData();
        this.loadChannelName();
        this.loadGroupedMessages();
        this.calculateTotalMessages();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    subscribeRouteParams() {
        this.route.queryParamMap.subscribe(params => {
            const newThreadId = params.get('thread') || '';

            if (newThreadId && newThreadId !== this.threadId) {
                this.threadId = newThreadId;
                this.loadThreadData();
                this.loadGroupedMessages();
                this.calculateTotalMessages();
                this.loadChannelName();
                this.focusMessageInput();

                setTimeout(() => {
                    this.scrollToBottom();
                }, 200);
            }

            this.channelId = params.get('channel') || '';
        });
    }

    private subscribeThreadVisibility() {
        this.subscription = this.visibleService.threadSubject$.subscribe(value => {
            this.threadVisibility = value;
        });
    }

    private loadThreadData() {
        this.threadService.getThreadById(this.threadId).subscribe(threadData => {
            this.thread = new Thread(threadData);
            this.thread.id = this.threadId;
        });
        this.scrollToBottom();
    }

    private loadChannelName() {
        this.channelName$ = this.threadService.getChannelName(this.threadId);
    }

    private loadGroupedMessages() {
        this.groupedMessages$ = this.threadService.getMessages(this.threadId).pipe(
            map(messages => {
                const grouped = messages.reduce((acc, message) => {
                    const date = message.creationDate
                        ? new Date(message.creationDate).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        })
                        : 'Unbekanntes Datum';

                    if (!acc[date]) acc[date] = [];
                    acc[date].push(message);
                    return acc;
                }, {} as { [key: string]: Message[] });

                return Object.keys(grouped).map(date => ({
                    date,
                    messages: grouped[date]
                }));
            })
        );

        this.groupedMessages$.subscribe(() => {
            this.scrollToBottom();
        });
    }

    private calculateTotalMessages() {
        this.totalMessagesCount$ = this.groupedMessages$.pipe(
            map(groups => groups.reduce((acc, group) => acc + group.messages.length, 0))
        );
    }

    closeThread() {
        this.router.navigate([], {
            queryParams: { channel: this.channelId },
            replaceUrl: true
        });
    }

    focusMessageInput() {
        setTimeout(() => {
            if (this.messageInput && this.messageInput.focusInput) {
                this.messageInput.focusInput();
            }
        }, 300); // Kurze Verzögerung, um sicherzustellen, dass das Element gerendert wurde
    }

    scrollToBottom() {
        setTimeout(() => {
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                chatContainer.scrollTo({
                    top: chatContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }

    handleEditRequest(event: { id: string, text: string, type: 'message' | 'thread' }) {
        this.editingTarget = event;
    }

    clearEditState() {
        this.editingTarget = null;
    }

}


