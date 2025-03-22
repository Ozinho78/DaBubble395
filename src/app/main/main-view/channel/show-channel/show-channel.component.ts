import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Channel } from '../../../../../models/channel.model';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { User } from '../../../../../models/user.model';

@Component({
  selector: 'app-show-channel',
  imports: [CommonModule],
  templateUrl: './show-channel.component.html',
  styleUrl: './show-channel.component.scss'
})
export class ShowChannelComponent {
  isOpen = false; // Steuert, ob das Modal sichtbar ist

  @Input() channelIdInput!: string;
  @Output() closeModal = new EventEmitter<void>();

  channelToChange!: Channel | null;
  userToChange!: User | null; // Neuer User, der anhand der userId geladen wird

  constructor(private firestore: Firestore) {
  } // Firestore-Injektion

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

  editChannelName(){}

  editChannelDescription(){}

  leaveChannel(){}

}
