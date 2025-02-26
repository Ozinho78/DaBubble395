import { Component, Input } from '@angular/core';
import { Firestore, addDoc, collection, doc, updateDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Message } from '../../../../models/message.class';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

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

  constructor(private firestore: Firestore) { }

  /** Emoji-Picker umschalten */
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  /** Emoji zum Textfeld hinzufügen */
  addEmoji(event: any) {
    if (event && event.emoji && event.emoji.native) {
      this.messageText += event.emoji.native; // Das eigentliche Emoji einfügen 😊
    } else {
      console.error('Fehler: Emoji konnte nicht hinzugefügt werden.', event);
    }
    this.showEmojiPicker = false; // Schließt den Picker nach Auswahl
  }

  /** Nachricht senden oder bearbeiten */
  sendMessage() {
    if (!this.messageText.trim() || !this.threadId) return;

    if (this.editingMessageId) {
      // Nachricht bearbeiten
      const messageRef = doc(this.firestore, 'messages', this.editingMessageId);
      updateDoc(messageRef, { text: this.messageText })
        .then(() => {
          this.resetInput();
        })
        .catch(error => console.error('Fehler beim Bearbeiten:', error));
    } else {
      // Neue Nachricht senden
      const newMessage = new Message({
        text: this.messageText,
        userId: 'qdWWqOADh6O1FkGpHlTr', // Temporärer Benutzer
        threadId: this.threadId,
        creationDate: Date.now(),
        reactions: []
      });

      const messagesRef = collection(this.firestore, 'messages');

      addDoc(messagesRef, newMessage.toJSON())
        .then(() => {
          this.resetInput();
        })
        .catch(error => console.error('Fehler beim Senden:', error));
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
}
