import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Channel } from '../../../../../models/channel.model';
import { doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';
import { User } from '../../../../../models/user.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-show-channel',
  imports: [CommonModule, FormsModule],
  templateUrl: './show-channel.component.html',
  styleUrl: './show-channel.component.scss'
})
export class ShowChannelComponent {
  isOpen = false; // Steuert, ob das Modal sichtbar ist
  editNameMode = false; // Bearbeitungsmodus für den Namen
  editedChannelName = ''; // Temporärer neuer Name
  editDescriptionMode = false;
  editedChannelDescription = ''; // Temporäre neue Beschreibung

  @Input() channelIdInput!: string;
  @Output() closeModal = new EventEmitter<void>(); // Signalisiert das Schließen

  channelToChange!: Channel | null;
  userToChange!: User | null;
  userLoggedIn: string = '';

  constructor(private firestore: Firestore) {
    setTimeout(() => {
      this.userLoggedIn = localStorage.getItem('user-id') || '';
      // this.filterUserChannels();
    }, 500);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['channelIdInput'] && this.channelIdInput) {
      this.loadChannel(this.channelIdInput);
    }
  }

  async loadChannel(docId: string) {
    const docRef = doc(this.firestore, 'channels', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      this.channelToChange = new Channel();
      
      this.channelToChange.docId = docSnap.id;
      this.channelToChange.creationDate = data['creationDate'];
      this.channelToChange.name = data['name'];
      this.channelToChange.description = data['description'];
      this.channelToChange.member = data['member'] || [];
      this.channelToChange.userId = data['userId'];

      this.editedChannelName = this.channelToChange.name; // Standardwert setzen
      this.editedChannelDescription = this.channelToChange.description; // Standardwert setzen

      // Lade den User basierend auf userId
      if (this.channelToChange.userId) {
        this.loadUser(this.channelToChange.userId);
      }
    } else {
      console.log('Kanal nicht gefunden!');
      this.channelToChange = null;
      this.userToChange = null;
    }
  }

  async loadUser(userId: string) {
    const userRef = doc(this.firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      this.userToChange = new User();

      this.userToChange.docId = userSnap.id;
      this.userToChange.id = data['id'];
      this.userToChange.avatar = data['avatar'];
      this.userToChange.name = data['name'];
      this.userToChange.email = data['email'];
      this.userToChange.password = data['password'];
      this.userToChange.active = data['active'];
    } else {
      console.log('Benutzer nicht gefunden!');
      this.userToChange = null;
    }
  }

  openModal() {
    this.isOpen = true;
  }

  
  close() {
    this.isOpen = false;
    this.closeModal.emit(); // Sendet Event an Parent
  }

  toggleEditMode(field: number) {
    if(field === 1) {
      this.editNameMode = !this.editNameMode;
      if(this.editNameMode && this.editDescriptionMode) {this.editDescriptionMode = !this.editDescriptionMode;}
      if (!this.editNameMode && this.channelToChange) {
        this.updateChannelName();
      }
    }
    if(field === 2) {
      this.editDescriptionMode = !this.editDescriptionMode;
      if(this.editDescriptionMode && this.editNameMode) {this.editNameMode = !this.editNameMode;}
      if (!this.editDescriptionMode && this.channelToChange) {
        this.updateChannelDescription();
      }
    }
  }

  async updateChannelName() {
    if (!this.channelToChange || !this.channelToChange.docId) {
      console.log('Channel nicht vorhanden oder hat keine docId!');
      return;
    }

    if(this.editedChannelName.length < 3){
      this.editedChannelName = this.channelToChange.name;
    }

    const channelRef = doc(this.firestore, 'channels', this.channelToChange.docId);
    try {
      await updateDoc(channelRef, {
        name: this.editedChannelName
      });
      console.log('Channel-Name erfolgreich aktualisiert!');

      this.channelToChange.name = this.editedChannelName; // UI aktualisieren
    } catch (error) {
      console.error('Fehler beim Speichern des Channel-Namens:', error);
    }
  }

  async updateChannelDescription(){
    if (!this.channelToChange || !this.channelToChange.docId) {
      console.log('Channel nicht vorhanden oder hat keine docId!');
      return;
    }

    const channelRef = doc(this.firestore, 'channels', this.channelToChange.docId);
    try {
      await updateDoc(channelRef, {
        description: this.editedChannelDescription
      });
      console.log('Channel-Name erfolgreich aktualisiert!');

      this.channelToChange.description = this.editedChannelDescription; // UI aktualisieren
    } catch (error) {
      console.error('Fehler beim Speichern der Channel-Description:', error);
    }
  }


  async leaveChannel(){
    if (!this.channelToChange || !this.userToChange) {
      console.log('Channel oder User nicht vorhanden!');
      return;
    }

    const userIdToRemove = this.userLoggedIn; // Die zu entfernende UserId
    if (!userIdToRemove) {
      console.log('UserId nicht gefunden!');
      return;
    }

    // Entferne die UserId aus dem Member-Array
    this.channelToChange.member = this.channelToChange.member.filter(id => id !== userIdToRemove);

    // Speichere die aktualisierten Daten in Firestore
    const channelRef = doc(this.firestore, 'channels', this.channelToChange.docId!);
    try {
      await updateDoc(channelRef, {
        member: this.channelToChange.member
      });
      console.log('User erfolgreich aus dem Channel entfernt!');
    } catch (error) {
      console.error('Fehler beim Speichern des Channels:', error);
    }
    
    this.isOpen = false;
    this.closeModal.emit();
  }

  isInvalidChannelName = false; // Flag für die Klasse

validateChannelName() {
  this.isInvalidChannelName = this.editedChannelName.length < 3;
}

}


// userId Michael Fiebelkorn ktUA231gfQVPbWIyhBU8