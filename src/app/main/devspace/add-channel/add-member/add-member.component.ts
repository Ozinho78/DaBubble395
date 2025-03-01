import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../../models/user.model';


@Component({
  selector: 'app-add-member',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss',
})
export class AddMemberComponent {
  @Input() newChannelName: string = '';
  @Input() usersArrayFromAddChannel: User[] = [];
  @Output() memberModalClosed = new EventEmitter<void>();
  selectedOption: string = ''; // Hier wird die ausgewählte Option gespeichert

  // Lokale Variable zur Speicherung der Daten
  storedUsersFromAddChannel: User[] = [];


  constructor() {
    // this.storedUsersFromAddChannel = this.usersArrayFromAddChannel;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['usersArrayFromAddChannel'] && changes['usersArrayFromAddChannel'].currentValue) {
      this.storedUsersFromAddChannel = [...changes['usersArrayFromAddChannel'].currentValue];
    }
  }

  
  closeMemberModal() {
    // this.isOpen = false;
    // setTimeout(() => {
    //   this.isOpen = true;
    // }, 1000)
    this.memberModalClosed.emit();
    // console.log(this.memberModalClosed);
  }

  submitData() {
    // console.log(this.newChannelName);
    console.log(this.usersArrayFromAddChannel);
    this.closeMemberModal();
  }

  showSelectedOption() {
    let selectedOption = this.selectedOption;
    console.log(selectedOption);
  }
}
