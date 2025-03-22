import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Channel } from '../../../../../models/channel.model';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';

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

  constructor(private firestore: Firestore) {} // Firestore-Injektion

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
    } else {
      console.log('Dokument nicht gefunden!');
      this.channelToChange = null;
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
