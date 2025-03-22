import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-show-channel',
  imports: [CommonModule],
  templateUrl: './show-channel.component.html',
  styleUrl: './show-channel.component.scss'
})
export class ShowChannelComponent {
  isOpen = false; // Steuert, ob das Modal sichtbar ist

  @Output() closeModal = new EventEmitter<void>();

  
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
