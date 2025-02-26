import { Component, Input } from '@angular/core';
import { Firestore, addDoc, collection, doc, updateDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Message } from '../../../../models/message.class';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { UserService } from '../../../../services/user.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerComponent],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss'
})
export class MessageInputComponent {
  @Input() threadId!: string | null; // Die aktuelle Thread-ID
  editingMessageId: string | null = null; // Speichert die ID der bearbeiteten Nachricht
  messageText: string = ''; // Eingabetext für neue oder bearbeitete Nachrichten
  showEmojiPicker: boolean = false;
  showMentionList: boolean = false; // Zeigt die Erwähnungsliste an
  filteredUsers: any[] = []; // Gefilterte Benutzerliste für die Erwähnung
  allUsers$: Observable<any[]>; // Alle Nutzer

  constructor(private firestore: Firestore, private userService: UserService) {
    this.allUsers$ = this.userService.getAllUsers();
  }

  /** Nachricht senden oder bearbeiten */
  sendMessage() {
    if (!this.messageText.trim() || !this.threadId) return;

    this.editingMessageId ? this.updateMessage() : this.createMessage();
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
    try {
      const newMessage = new Message({
        text: this.messageText,
        userId: 'qdWWqOADh6O1FkGpHlTr', // Temporärer Benutzer
        threadId: this.threadId,
        creationDate: Date.now(),
        reactions: []
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
  editMessage(messageId: string, text: string) {
    this.editingMessageId = messageId;
    this.messageText = text;
  }

  /** Eingabe zurücksetzen */
  resetInput() {
    this.editingMessageId = null;
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
    this.allUsers$.subscribe(users => {
      this.filteredUsers = users.filter(user =>
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
}
