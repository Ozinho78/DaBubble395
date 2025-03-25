import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';
import { User } from '../../../../../models/user.model';
import { Channel } from '../../../../../models/channel.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss'
})
export class AddUserComponent {
  isOpen = false; // Steuert, ob das Modal sichtbar ist

  @Input() channelIdInput!: string;
  @Output() closeModal = new EventEmitter<void>();

  channelToChange!: Channel | null;
    
  
  openModal() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
    this.closeModal.emit(); // Sendet Event an Parent
  }
}
  
  
  // userId Michael Fiebelkorn ktUA231gfQVPbWIyhBU8
