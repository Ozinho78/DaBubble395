import { Component, Input, ViewChild, ElementRef, Renderer2, OnDestroy, AfterViewInit, OnInit } from '@angular/core';
import { Firestore, addDoc, collection, doc, updateDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Message } from '../../../../models/message.class';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { UserService } from '../../../../services/user.service';
import { Observable } from 'rxjs';
import { EventEmitter, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-message-input',
    standalone: true,
    imports: [CommonModule, FormsModule, PickerComponent],
    templateUrl: './message-input.component.html',
    styleUrl: './message-input.component.scss',
})
export class MessageInputComponent implements OnInit, AfterViewInit, OnDestroy, OnDestroy {
    @Input() threadId!: string | null;
    //@Input() channelId!: string;
    @Input() channelName: string | null | undefined = null;
    @Input() isDirectMessage: boolean = false;

    @Input() editingText: string = '';
    @Input() editingMessageId: string | null = null;
    @Input() editingType: 'message' | 'thread' | 'chat' | null = null;
    @Output() editSaved = new EventEmitter<void>();
    @Output() editCancelled = new EventEmitter<void>();

    @Output() newDirectMessage: EventEmitter<string> = new EventEmitter<string>();
    @ViewChild('inputElement') inputElement!: ElementRef<HTMLTextAreaElement>;

    channelId!: string;

    messageText: string = ''; // Eingabetext für neue oder bearbeitete Nachrichten
    showEmojiPicker: boolean = false;
    showMentionList: boolean = false; // Zeigt die Erwähnungsliste an
    filteredUsers: any[] = []; // Gefilterte Benutzerliste für die Erwähnung
    allUsers$: Observable<any[]>; // Alle Nutzer
    currentUserId: string | null = null;

    private globalClickListener?: () => void;

    constructor(
        private firestore: Firestore,
        private userService: UserService,
        private route: ActivatedRoute,
        private renderer: Renderer2,
        private hostElement: ElementRef
    ) {
        this.allUsers$ = this.userService.getAllUsers();
        this.currentUserId = this.userService.getCurrentUserId();
    }

    ngOnInit() {
        this.route.queryParamMap.subscribe(params => {
            this.channelId = params.get('channel') || '';
            //console.log('Aktuelle Channel ID:', this.channelId);
        });
    }

    ngAfterViewInit() {
        this.globalClickListener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
            const clickedInside = this.hostElement.nativeElement.contains(event.target);

            // Wenn Klick außerhalb der Komponente → schließe Picker & Mention
            if (!clickedInside) {
                this.showEmojiPicker = false;
                this.showMentionList = false;
            }
        });
    }

    ngOnChanges() {
        if (this.editingMessageId && this.editingText) {
            this.messageText = this.editingText;
        }
    }

    ngOnDestroy() {
        if (this.globalClickListener) this.globalClickListener();
    }

    /** Nachricht oder Thread senden oder bearbeiten */
    sendMessage() {
        if (!this.messageText.trim()) return;

        if (this.editingMessageId && this.editingType) {
            if (this.editingType === 'thread') {
                this.updateThread();
            } else if (this.editingType === 'chat') {
                this.updateChatMessage(); // 👈 NEU
            } else {
                this.updateMessage();
            }

            this.focusInput();
            return;
        }

        if (this.isDirectMessage) {
            this.sendDirectMessage();
        } else {
            if (!this.channelId) return;

            if (this.threadId) {
                this.createMessage();
            } else {
                this.createThread();
            }
        }

        this.focusInput();
    }

    sendDirectMessage() {
        if (!this.messageText.trim()) return;
        // Hier kannst du entscheiden: entweder
        //  a) den Text an den Parent senden:
        this.newDirectMessage.emit(this.messageText);
        //  b) oder direkt über einen ChatService senden, falls du das hier machen möchtest.
        // Beispiel für Option (a):
        this.messageText = '';
    }

    private async updateChatMessage() {
        if (!this.editingMessageId) return;

        try {
            const chatRef = doc(this.firestore, 'chats', this.editingMessageId);
            await updateDoc(chatRef, { text: this.messageText });

            this.resetInput();
            this.scrollToBottom();
        } catch (error) {
            console.error('Fehler beim Bearbeiten der Direktnachricht:', error);
        }
    }

    private async createThread() {
        if (!this.messageText.trim() || !this.currentUserId) return;

        try {
            const newThread = {
                thread: this.messageText,
                userId: this.currentUserId,
                channelId: this.channelId, // Thread gehört zu einem Channel
                creationDate: Date.now(),
                answerCount: 0, // Standardwert für neue Threads
                lastAnswer: 0,
            };

            const threadsRef = collection(this.firestore, 'threads'); // Firestore Collection für Threads
            await addDoc(threadsRef, newThread);

            this.resetInput();
            this.scrollToBottom();
        } catch (error) {
            console.error('Fehler beim Erstellen eines Threads:', error);
        }
    }

    /** Nachricht in Firestore aktualisieren */
    private async updateMessage() {
        if (!this.editingMessageId) return;

        try {
            const messageRef = doc(this.firestore, 'messages', this.editingMessageId);
            await updateDoc(messageRef, { text: this.messageText });

            this.resetInput();
            this.scrollToBottom(); // Nach dem Bearbeiten scrollen
        } catch (error) {
            console.error('Fehler beim Aktualisieren:', error);
        }
    }

    /** Neue Nachricht in Firestore speichern */
    private async createMessage() {
        if (!this.messageText.trim() || !this.currentUserId) return; // Verhindere leere Nachrichten und prüfe ob User existiert

        try {
            const newMessage = new Message({
                text: this.messageText,
                userId: this.currentUserId, // Firestore User-ID nutzen
                threadId: this.threadId,
                creationDate: Date.now(),
                reactions: [],
            });

            const messagesRef = collection(this.firestore, 'messages');
            await addDoc(messagesRef, newMessage.toJSON());

            this.resetInput();
            this.scrollToBottom();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
        }
    }

    /** Nachricht für die Bearbeitung setzen */
    editMessage(messageId: string, text: string, type: 'message' | 'thread' | 'chat') {
        this.editingMessageId = messageId;
        this.messageText = text;
        this.editingType = type;
    }

    private async updateThread() {
        if (!this.editingMessageId) return;

        try {
            const threadRef = doc(this.firestore, 'threads', this.editingMessageId);
            await updateDoc(threadRef, { thread: this.messageText });

            this.resetInput();
            this.scrollToBottom(); // Nach dem Bearbeiten scrollen
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Threads:', error);
        }
    }


    /** Eingabe zurücksetzen */
    resetInput() {
        this.editingMessageId = null;
        this.editingType = null;
        this.messageText = '';
    }

    /** Emoji-Picker umschalten */
    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
        if (this.showEmojiPicker) {
            this.showMentionList = false; // Erwähnungsliste schließen, wenn Emojis geöffnet werden
        }
    }

    /** Emoji zum Textfeld hinzufügen */
    addEmoji(event: any) {
        if (event?.emoji?.native) {
            this.messageText += event.emoji.native; // Das eigentliche Emoji einfügen 😊
        } else {
            console.error('Fehler: Emoji konnte nicht hinzugefügt werden.', event);
        }
        this.showEmojiPicker = false; // Schließt den Picker nach Auswahl
    }

    /** Überprüft, ob @ eingegeben wurde und filtert Nutzer */
    onTextChange(event: any) {
        const inputText = event.target.value;
        const lastWord = inputText.split(' ').pop(); // Letztes Wort im Textfeld prüfen

        if (lastWord?.startsWith('@')) {
            this.showMentionList = true;
            this.showEmojiPicker = false; // Emojis schließen
            this.filterUsers(lastWord.substring(1).toLowerCase());
        } else {
            this.showMentionList = false;
        }
    }

    /** Nutzer für Erwähnung filtern */
    filterUsers(searchName: string) {
        this.allUsers$.subscribe((users) => {
            this.filteredUsers = users.filter((user) =>
                user.name.toLowerCase().includes(searchName)
            );
        });
    }

    /** Erwähnungsliste umschalten */
    toggleMentionList() {
        this.showMentionList = !this.showMentionList;
        if (this.showMentionList) {
            this.showEmojiPicker = false; // Emojis schließen, wenn Erwähnung geöffnet wird
            this.filterUsers('');
        }
    }

    /** Erwähnung in den Text einfügen */
    mentionUser(user: any) {
        const words = this.messageText.split(' ');
        words[words.length - 1] = `@${user.name} `; // Fügt den Namen mit @ hinzu
        this.messageText = words.join(' ');

        this.showMentionList = false; // Erwähnungsliste schließen
    }

    /** Scrollt den Chat nach unten */
    scrollToBottom() {
        setTimeout(() => {
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100); // Timeout für sicheres Scrollen nach Rendering
    }

    focusInput() {
        setTimeout(() => {
            if (this.inputElement) {
                this.inputElement.nativeElement.focus();
            }
        }, 100);
    }

    submitEdit() {
        if (!this.editingMessageId || !this.messageText.trim()) return;

        const updateTarget = this.editingType === 'thread' ? 'threads' : 'messages';
        const updateField = this.editingType === 'thread' ? 'thread' : 'text';

        updateDoc(doc(this.firestore, updateTarget, this.editingMessageId), {
            [updateField]: this.messageText
        }).then(() => {
            this.resetInput();
            this.editSaved.emit();
        }).catch(err => console.error('Fehler beim Bearbeiten:', err));
    }

    cancelEdit() {
        this.resetInput();
        this.editCancelled.emit();
    }

    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();

            if (this.editingMessageId) {
                this.submitEdit();
            } else {
                this.sendMessage();
            }
        }
    }
}
