import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Channel } from '../../../../../models/channel.model';
import { doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';
import { User } from '../../../../../models/user.model';

@Component({
  selector: 'app-show-channel',
  imports: [CommonModule],
  templateUrl: './show-channel.component.html',
  styleUrl: './show-channel.component.scss'
})
export class ShowChannelComponent {
  isOpen = false; // Steuert, ob das Modal sichtbar ist
  editNameMode = false;
  editDescriptionMode = false;

  @Input() channelIdInput!: string;
  @Output() closeModal = new EventEmitter<void>();

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
    this.closeModal.emit();
  }

  editChannelName(){
    this.editNameMode = true;
    setTimeout(() => {this.editNameMode = false}, 3000);
  }

  editChannelDescription(){
    this.editDescriptionMode = true;
    setTimeout(() => {this.editDescriptionMode = false}, 3000);
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

  // userId Michael Fiebelkorn ktUA231gfQVPbWIyhBU8

}
